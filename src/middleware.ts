import { getSession, parseGroups, type SessionRow } from "./db";
import { getConfig } from "./config";
import { getGroupsForUser } from "./ldap";
import { deleteSession, refreshSessionGroups } from "./db";

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

function isSameOrigin(request: Request): boolean {
  const host = request.headers.get("Host");
  if (!host) return false;

  // Use Origin when present; fall back to Referer (full URL) for clients that
  // omit Origin on state-changing requests.
  const origin = request.headers.get("Origin") || request.headers.get("Referer");
  if (!origin) {
    // Neither Origin nor Referer present — cannot verify the request is
    // same-origin, so deny it.
    return false;
  }
  try {
    const originUrl = new URL(origin);
    return originUrl.host === host && (originUrl.protocol === "https:" || originUrl.protocol === "http:");
  } catch {
    return false;
  }
}

/**
 * CSRF guard for state-changing requests:
 * - Must be application/json content type
 * - Origin (if present) must match our host
 */
function csrfGuard(handler: Handler): Handler {
  return (ctx: RequestContext) => {
    const method = ctx.request.method;
    if (method === "POST" || method === "DELETE" || method === "PUT" || method === "PATCH") {
      const contentType = ctx.request.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        return new Response(JSON.stringify({ error: "Content-Type must be application/json" }), {
          status: 415,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (!isSameOrigin(ctx.request)) {
        return new Response(JSON.stringify({ error: "Cross-origin request rejected" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
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

/**
 * Require a valid session. If missing, redirect to /login.
 */
export function requireSession(handler: Handler): Handler {
  return (ctx: RequestContext) => {
    const resolved = resolveSession(ctx);
    if (!resolved) {
      return new Response(null, { status: 302, headers: { Location: "/login" } });
    }
    const session = getSession(resolved.token);
    if (!session) {
      return new Response(null, { status: 302, headers: { Location: "/login" } });
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    const session = getSession(resolved.token);
    if (!session) {
      return new Response(JSON.stringify({ error: "Session expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
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