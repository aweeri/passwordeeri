import { randomBytes } from "node:crypto";
import { authenticate, AuthError, getGroupsForUser } from "../ldap";
import { createSession, deleteSession, refreshSessionGroups, logAudit } from "../db";
import { getConfig } from "../config";
import type { RequestContext } from "../middleware";

const APP_NAME = () => getConfig().APP_NAME;

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "\x26amp;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;")
    .replace(/"/g, "\x26quot;")
    .replace(/'/g, "\x26#39;");
}

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || record.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (record.count >= 5) {
    return false;
  }
  record.count++;
  return true;
}

function getClientIP(request: Request): string {
  // Prefer the first proxy-trusted header, then X-Forwarded-For
  const realIp = request.headers.get("X-Real-IP");
  if (realIp) return realIp;
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp;
  const xff = request.headers.get("X-Forwarded-For");
  if (xff) return xff.split(",")[0].trim();
  return "unknown";
}

function injectSecurityHeaders(headers: Record<string, string>): Record<string, string> {
  return {
    ...headers,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
  };
}

export function getLoginPage(_ctx: RequestContext): Response {
  const name = escapeAttr(APP_NAME());
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title>
<link rel="stylesheet" href="/styles.css">
</head>
<body class="login-page">
  <div class="login-box">
    <h1>${name}</h1>
    <form id="login-form">
      <div class="field">
        <label for="username">Username</label>
        <input type="text" id="username" name="username" autocomplete="username" required>
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" autocomplete="current-password" required>
      </div>
      <div id="error-msg" class="error-msg" style="display:none"></div>
      <button type="submit">Log in</button>
    </form>
  </div>
  <script src="/login.js"></script>
</body>
</html>`;
  return new Response(html, {
    headers: injectSecurityHeaders({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self'; object-src 'none'",
    }),
  });
}

export async function handleLogin(ctx: RequestContext): Promise<Response> {
  const ip = getClientIP(ctx.request);
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Too many login attempts. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Lightweight delay to slow brute-force even within rate limit window
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 300));

  let body: { username?: string; password?: string };
  try {
    body = await ctx.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { username, password } = body;
  if (!username || !password) {
    return new Response(JSON.stringify({ error: "Username and password are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await authenticate(username, password);
    const token = randomBytes(32).toString("hex");
    createSession(token, result.username, result.groups);
    const cfg = getConfig();
    const maxAge = cfg.SESSION_TTL_HOURS * 3600;
    const secure = cfg.COOKIE_SECURE ? "; Secure" : "";

    logAudit(result.username, "login", null, "Login successful");

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `session=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`,
      },
    });
  } catch (err) {
    // AuthError always has the same generic message — no username enumeration
    const message = err instanceof AuthError ? err.message : "Invalid username or password";
    return new Response(JSON.stringify({ error: message }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export function handleLogout(ctx: RequestContext): Response {
  const cookie = ctx.request.headers.get("Cookie");
  if (cookie) {
    const match = cookie.match(/\bsession=([^;]+)/);
    if (match) {
      deleteSession(match[1]);
    }
  }
  const secure = getConfig().COOKIE_SECURE ? "; Secure" : "";
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/login",
      "Set-Cookie": `session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${secure}`,
    },
  });
}

/**
 * Re-verify LDAP group membership on a timer using the service account.
 * Call this after requireSessionJson() has populated ctx.session.
 * If the user no longer exists in LDAP, the session is destroyed.
 */
export async function maybeRefreshSession(ctx: RequestContext): Promise<void> {
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
  } catch {
    // User no longer exists in LDAP or service account bind failed.
    // Destroy the session as a safety measure.
    const token = ctx.session?.token;
    if (token) {
      deleteSession(token);
    }
  }
}