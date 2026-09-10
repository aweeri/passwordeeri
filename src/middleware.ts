import { getSession, parseGroups, type SessionRow } from "./db";
import { getConfig } from "./config";
import { getGroupsForUser } from "./ldap";
import { deleteSession, refreshSessionGroups } from "./db";
import { jsonResponse } from "./response";

export interface RequestContext {
  request: Request;
  params: Record<string, string>;
  server?: import("bun").Server;
  session?: SessionRow;
  userGroups: string[];
  username: string;
  isSuper: boolean;
}

type Handler = (ctx: RequestContext) => Response | Promise<Response>;

function getCookie(name: string, cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const trimmed = part.trim();
    if (trimmed.startsWith(name + "=")) {
      return trimmed.slice(name.length + 1);
    }
  }
  return null;
}

/**
 * HTTP authority ("host[:port]", possibly "[v6]:port") into a
 * { hostname, port } pair so origins can be compared.
 */
function parseAuthority(authority: string): { hostname: string; port: string } {
  try {
    const u = new URL("http://" + authority);
    return { hostname: u.hostname.toLowerCase(), port: u.port || "" };
  } catch {
    // Malformed authority — split host:port manually (handles bare [v6]).
    const s = authority.trim();
    if (s.startsWith("[")) {
      const end = s.indexOf("]");
      if (end !== -1) {
        const hostname = s.slice(0, end + 1).toLowerCase();
        const port = s[end + 1] === ":" ? s.slice(end + 2) : "";
        return { hostname, port };
      }
    }
    const idx = s.lastIndexOf(":");
    if (idx !== -1 && s.indexOf(":") === idx) {
      return { hostname: s.slice(0, idx).toLowerCase(), port: s.slice(idx + 1) };
    }
    return { hostname: s.toLowerCase(), port: "" };
  }
}

/** Normalize a port against the protocol's default so ":80"/":443" match "". */
function portsEqual(a: string, b: string, protocol: string): boolean {
  const norm = (p: string) => (!p ? (protocol === "https:" ? "443" : "80") : p);
  return norm(a) === norm(b);
}

/**
 * Reconstruct the authority the client actually used.
 */
function requestAuthority(request: Request): { authority: string; protocol: string } {
  const xfh = request.headers.get("X-Forwarded-Host");
  if (xfh) {
    const host = (xfh.split(",")[0] || "").trim();
    if (host) {
      const proto = (request.headers.get("X-Forwarded-Proto") || "http").split(",")[0].trim().toLowerCase();
      return { authority: host, protocol: proto === "https" ? "https:" : "http:" };
    }
  }
  const fwd = request.headers.get("Forwarded");
  if (fwd) {
    const hostMatch = fwd.match(/(?:^|;)\s*host\s*=\s*"?([^";,]+)"?/i);
    if (hostMatch?.[1]?.trim()) {
      const protoMatch = fwd.match(/(?:^|;)\s*proto\s*=\s*"?([^";,]+)"?/i);
      const proto = (protoMatch?.[1] || "http").trim().toLowerCase();
      return { authority: hostMatch[1].trim(), protocol: proto === "https" ? "https:" : "http:" };
    }
  }
  return { authority: request.headers.get("Host") || "", protocol: "http:" };
}

function isSameOrigin(request: Request): boolean {
  // Use Origin when present; fall back to Referer (full URL) for clients that
  // omit Origin on state-changing requests.
  const origin = request.headers.get("Origin") || request.headers.get("Referer");
  if (!origin) return false;

  let originUrl: URL;
  try {
    originUrl = new URL(origin);
  } catch {
    return false;
  }
  if (originUrl.protocol !== "https:" && originUrl.protocol !== "http:") return false;

  const { authority, protocol } = requestAuthority(request);
  if (!authority) return false;

  const expected = parseAuthority(authority);
  const actual = parseAuthority(originUrl.host);
  return actual.hostname === expected.hostname && portsEqual(actual.port, expected.port, protocol);
}

/**
 * CSRF guard for state-changing requests:
 * - Must be application/json content type
 */
function csrfGuard(handler: Handler): Handler {
  return (ctx: RequestContext) => {
    const method = ctx.request.method;
    if (method === "POST" || method === "DELETE" || method === "PUT" || method === "PATCH") {
      const pathname = new URL(ctx.request.url).pathname;
      const contentType = ctx.request.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        console.warn(`[REJECT] ${method} ${pathname} — Content-Type "${contentType}" is not application/json`);
        return jsonResponse({ error: "Content-Type must be application/json" }, 415);
      }

      const origin = ctx.request.headers.get("Origin") || ctx.request.headers.get("Referer");
      console.log(
        `[CSRF] ${method} ${pathname} origin="${origin || "(none)"}" host="${ctx.request.headers.get("Host") || ""}"` +
          ` xfh="${ctx.request.headers.get("X-Forwarded-Host") || ""}"`
      );
      if (origin && !isSameOrigin(ctx.request)) {
        console.warn(
          `[REJECT] ${method} ${pathname} cross-origin origin="${origin}" host="${ctx.request.headers.get("Host") || ""}"` +
            ` xfh="${ctx.request.headers.get("X-Forwarded-Host") || ""}"`
        );
        return jsonResponse({ error: "Cross-origin request rejected" }, 403);
      }
    }
    return handler(ctx);
  };
}

// ---- Session freshness check ----

async function maybeRefresh(ctx: RequestContext): Promise<void> {
  if (!ctx.session) return;
  const cfg = getConfig();
  const lastRefreshed = ctx.session.last_refreshed;
  if (!lastRefreshed) return;

  const elapsed = (Date.now() - new Date(lastRefreshed).getTime()) / 60000;
  if (elapsed < cfg.SESSION_REFRESH_MINUTES) return;

  try {
    const freshGroups = await getGroupsForUser(ctx.session.username);
    const token = ctx.session.token;
    if (token) {
      refreshSessionGroups(token, freshGroups);
      ctx.userGroups = freshGroups;
    }
  } catch (err) {
    // Non-critical background refresh: this must never break the request.
    // The typical failure is the user no longer existing in LDAP — in that
    // case we expire their session. Log any error so it isn't silently swallowed.
    console.error("Session refresh failed for user:", ctx.session?.username, err);
    const token = ctx.session?.token;
    if (token) {
      deleteSession(token);
    }
  }
}

// ---- Session resolvers ----

function resolveSession(ctx: RequestContext): { token: string } | null {
  const token = getCookie("session", ctx.request.headers.get("Cookie"));
  if (!token) return null;
  return { token };
}

// Raw Set-Cookie value that clears the session cookie, honoring the configured
// path and Secure flag. Used on redirects/401s after a dead/expired session so
// stale tokens don't linger in the browser.
function clearSessionCookieValue(): string {
  const cfg = getConfig();
  const secure = cfg.COOKIE_SECURE ? "; Secure" : "";
  const cookiePath = cfg.BASE_PATH || "/";
  return `session=; HttpOnly; SameSite=Strict; Path=${cookiePath}; Max-Age=0${secure}`;
}

function clearSessionCookieHeaders(): Record<string, string> {
  return { "Set-Cookie": clearSessionCookieValue() };
}

/**
 * Require a valid session. If missing, redirect to /login (and clear a dead
 * session cookie if one was presented).
 */
export function requireSession(handler: Handler): Handler {
  return (ctx: RequestContext) => {
    const loginPath = getConfig().BASE_PATH + "/login";
    const resolved = resolveSession(ctx);
    if (!resolved) {
      return new Response(null, { status: 302, headers: { Location: loginPath } });
    }
    const session = getSession(resolved.token);
    if (!session) {
      // Present but invalid/expired — clear it so the client stops sending a dead token.
      return new Response(null, { status: 302, headers: { Location: loginPath, ...clearSessionCookieHeaders() } });
    }
    ctx.session = session;
    ctx.userGroups = parseGroups(session);
    ctx.username = session.username;
    ctx.isSuper = getConfig().SUPER_GROUPS.some((g) => ctx.userGroups.includes(g));

    // Non-critical background refresh (fire-and-forget) — must never block or
    // break the request; failures are logged inside maybeRefresh.
    maybeRefresh(ctx);

    return handler(ctx);
  };
}

/**
 * Require a valid session and return JSON on failure (for API routes).
 * Includes CSRF protection and periodic group-membership re-verification.
 */
export function requireSessionJson(handler: Handler): Handler {
  return csrfGuard((ctx: RequestContext) => {
    const resolved = resolveSession(ctx);
    if (!resolved) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const session = getSession(resolved.token);
    if (!session) {
      // Invalid/expired — clear the dead cookie so the client stops sending it.
      const headers = {
        "Set-Cookie": clearSessionCookieValue(),
      };
      return jsonResponse({ error: "Session expired" }, 401, headers);
    }
    ctx.session = session;
    ctx.userGroups = parseGroups(session);
    ctx.username = session.username;
    ctx.isSuper = getConfig().SUPER_GROUPS.some((g) => ctx.userGroups.includes(g));

    // Non-critical background refresh (fire-and-forget) — must never block or
    // break the request; failures are logged inside maybeRefresh.
    maybeRefresh(ctx);

    return handler(ctx);
  });
}