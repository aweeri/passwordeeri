import { randomBytes } from "node:crypto";
import { authenticate, AuthError, getGroupsForUser } from "../ldap";
import { createSession, deleteSession, refreshSessionGroups, logAudit } from "../db";
import { getConfig } from "../config";
import { jsonResponse } from "../response";
import type { RequestContext } from "../middleware";

// Login payloads are tiny (username + password) — 16KB is generous.
const MAX_LOGIN_BODY_BYTES = 16 * 1024;

const APP_NAME = () => getConfig().APP_NAME;

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "\x26amp;")
    .replace(/</g, "\x26lt;")
    .replace(/>/g, "\x26gt;")
    .replace(/"/g, "\x26quot;")
    .replace(/'/g, "\x26#39;");
}

const RATE_LIMIT_MAX = 5; // max attempts per window
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_CLEANUP_MS = 60_000; // prune expired entries every 60 seconds

// Simple in-memory rate limiter for login attempts
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || record.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }
  record.count++;
  return true;
}

// Periodic cleanup of expired entries to prevent unbounded memory growth.
// Prunes any entry whose window has fully elapsed.
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of loginAttempts) {
    if (record.resetAt < now) {
      loginAttempts.delete(ip);
    }
  }
}, RATE_LIMIT_CLEANUP_MS);

// Rate-limit keyed on the socket-level client IP from Bun's native server.
// Never trust client-supplied headers like X-Forwarded-For / X-Real-IP /
// CF-Connecting-IP, as they can be spoofed to bypass the limiter.
function getClientIP(ctx: RequestContext): string {
  const server = ctx.server;
  if (server) {
    const addr = server.requestIP(ctx.request);
    if (addr) return addr.address;
  }
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
  const base = getConfig().BASE_PATH;
  const nonce = randomBytes(16).toString("base64");
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name}</title>
<link rel="stylesheet" href="${base}/fonts/material-icons.css">
<link rel="stylesheet" href="${base}/styles.css">
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
      <button type="submit"><span class="material-icons md-18">login</span> Log in</button>
    </form>
  </div>
  <script nonce="${nonce}">window.__BASE__ = ${JSON.stringify(base)};</script>
  <script nonce="${nonce}" src="${base}/login.js"></script>
</body>
</html>`;
  return new Response(html, {
    headers: injectSecurityHeaders({
      "Content-Type": "text/html; charset=utf-8",
      "Content-Security-Policy": `default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'nonce-${nonce}'; font-src 'self'; object-src 'none'`,
    }),
  });
}

export async function handleLogin(ctx: RequestContext): Promise<Response> {
  const ip = getClientIP(ctx);
  if (!checkRateLimit(ip)) {
    return jsonResponse({ error: "Too many login attempts. Try again later." }, 429);
  }

  // Delay to slow brute-force even within rate limit window
  await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));

  let body: { username?: string; password?: string };
  try {
    const text = await ctx.request.text();
    if (text.length > MAX_LOGIN_BODY_BYTES) {
      return jsonResponse({ error: "Request body too large" }, 413);
    }
    body = JSON.parse(text);
  } catch {
    return jsonResponse({ error: "Invalid request" }, 400);
  }

  const { username, password } = body;
  if (!username || !password) {
    return jsonResponse({ error: "Username and password are required" }, 400);
  }

  try {
    const result = await authenticate(username, password);
    const token = randomBytes(32).toString("hex");
    createSession(token, result.username, result.groups);
    const cfg = getConfig();
    const maxAge = cfg.SESSION_TTL_HOURS * 3600;
    const secure = cfg.COOKIE_SECURE ? "; Secure" : "";
    // Scope the cookie to the base path so it is sent only to the app, not the
    // whole origin when the app is served under a subpath.
    const cookiePath = cfg.BASE_PATH || "/";

    logAudit(result.username, "login", null, "Login successful");

    return jsonResponse({ ok: true }, 200, {
      "Set-Cookie": `session=${token}; HttpOnly; SameSite=Strict; Path=${cookiePath}; Max-Age=${maxAge}${secure}`,
    });
  } catch (err) {
    // AuthError always has the same generic message — no username enumeration
    const message = err instanceof AuthError ? err.message : "Invalid username or password";
    return jsonResponse({ error: message }, 401);
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
  const cfg = getConfig();
  const secure = cfg.COOKIE_SECURE ? "; Secure" : "";
  const cookiePath = cfg.BASE_PATH || "/";
  return new Response(null, {
    status: 302,
    headers: {
      Location: cfg.BASE_PATH + "/login",
      "Set-Cookie": `session=; HttpOnly; SameSite=Strict; Path=${cookiePath}; Max-Age=0${secure}`,
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