import { listPasswordsForGroups, listAllPasswords, getPasswordById, createPassword, updatePassword, deletePassword, logAudit, getDb } from "../db";
import { encrypt, decrypt } from "../crypto";
import type { RequestContext } from "../middleware";

const MAX_TITLE = 200;
const MAX_USERNAME = 200;
const MAX_URL = 2000;
const MAX_PASSWORD = 10000;

// ── Rate limiting for CRUD operations ──

const CRUD_RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const CRUD_RATE_LIMIT_CLEANUP_MS = 60_000; // prune expired entries every 60 seconds

const crudAttempts = new Map<string, { count: number; resetAt: number }>();

function getCrudClientIP(ctx: RequestContext): string {
  const server = ctx.server;
  if (server) {
    const addr = server.requestIP(ctx.request);
    if (addr) return addr.address;
  }
  return "unknown";
}

function checkCrudRateLimit(ctx: RequestContext, limit: number): { allowed: boolean; retryAfter?: number } {
  const ip = getCrudClientIP(ctx);
  const now = Date.now();
  const record = crudAttempts.get(ip);

  if (!record || record.resetAt < now) {
    crudAttempts.set(ip, { count: 1, resetAt: now + CRUD_RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= limit) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  record.count++;
  return { allowed: true };
}

// Periodic cleanup of expired entries to prevent unbounded memory growth.
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of crudAttempts) {
    if (record.resetAt < now) {
      crudAttempts.delete(ip);
    }
  }
}, CRUD_RATE_LIMIT_CLEANUP_MS);

// ── URL sanitization ──

function sanitizeUrl(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.length > MAX_URL) return "";
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return trimmed;
    }
    return "";
  } catch {
    return "";
  }
}

// ── Audit logging (console + DB) ──

function auditLog(username: string, action: string, resourceId: number | null, detail: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[AUDIT] ${timestamp} ${username} ${action} ${resourceId ?? "-"} ${detail}`);
  logAudit(username, action, resourceId, detail);
}

// ── Handlers ──

function stripCtrl(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

export function listPasswordsJson(ctx: RequestContext): Response {
  const rateCheck = checkCrudRateLimit(ctx, 60);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter) },
    });
  }

  const entries = ctx.isSuper ? listAllPasswords() : listPasswordsForGroups(ctx.userGroups);
  const result = entries.map((e) => ({
    id: e.id,
    title: e.title,
    username: e.username,
    url: e.url,
    group_cn: e.group_cn,
    encrypted: e.enc_password,
    iv: e.enc_iv,
    tag: e.enc_tag,
    created_at: e.created_at,
    updated_at: e.updated_at,
  }));

  auditLog(ctx.username, "PASSWORD_LIST", null, `Listed ${result.length} passwords`);

  return new Response(JSON.stringify(result), {
    headers: { "Content-Type": "application/json" },
  });
}

export function decryptPasswordJson(ctx: RequestContext): Response {
  const rateCheck = checkCrudRateLimit(ctx, 60);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter) },
    });
  }

  const id = Number(ctx.params.id);
  if (Number.isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const entry = getPasswordById(id);
  if (!entry) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Group authorization: super users can access any entry
  if (!ctx.isSuper && !ctx.userGroups.includes(entry.group_cn)) {
    return new Response(JSON.stringify({ error: "You do not have access to this entry" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const password = decrypt({ data: entry.enc_password, iv: entry.enc_iv, tag: entry.enc_tag }, String(entry.id));

  auditLog(ctx.username, "PASSWORD_READ", id, `Decrypted password "${entry.title}" from group "${entry.group_cn}"`);

  return new Response(JSON.stringify({ id: entry.id, password }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function createPasswordJson(ctx: RequestContext): Promise<Response> {
  const rateCheck = checkCrudRateLimit(ctx, 20);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter) },
    });
  }

  let body: any;
  try {
    body = await ctx.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { title, username, url, password, group_cn } = body;
  if (!title || !username || !password || !group_cn) {
    return new Response(JSON.stringify({ error: "title, username, password, and group_cn are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Server-side length validation
  if (title.length > MAX_TITLE) {
    return new Response(JSON.stringify({ error: `title must be at most ${MAX_TITLE} characters` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (username.length > MAX_USERNAME) {
    return new Response(JSON.stringify({ error: `username must be at most ${MAX_USERNAME} characters` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if ((url || "").length > MAX_URL) {
    return new Response(JSON.stringify({ error: `url must be at most ${MAX_URL} characters` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (password.length > MAX_PASSWORD) {
    return new Response(JSON.stringify({ error: `password must be at most ${MAX_PASSWORD} characters` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Group authorization: user must belong to the group they're creating for
  if (!ctx.isSuper && !ctx.userGroups.includes(group_cn)) {
    return new Response(JSON.stringify({ error: "You do not have access to this group" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanedTitle = stripCtrl(title.trim());
  const cleanedUsername = stripCtrl(username.trim());
  const cleanedUrl = sanitizeUrl(stripCtrl((url || "").trim()));

  // Insert the entry first to obtain its autoincrement id, then encrypt with
  // that id as AAD. AAD cryptographically binds the ciphertext to this record,
  // preventing ciphertext reordering/swapping across entries.
  const entry = createPassword({
    title: cleanedTitle,
    username: cleanedUsername,
    url: cleanedUrl,
    enc_password: "",
    enc_iv: "",
    enc_tag: "",
    group_cn,
  });

  const encrypted = encrypt(password, String(entry.id));
  getDb()
    .query("UPDATE passwords SET enc_password = ?, enc_iv = ?, enc_tag = ? WHERE id = ?")
    .run(encrypted.data, encrypted.iv, encrypted.tag, entry.id);

  auditLog(ctx.username, "PASSWORD_CREATE", entry.id, `Created password "${cleanedTitle}" in group "${group_cn}"`);

  return new Response(JSON.stringify({ id: entry.id, title: entry.title, group_cn: entry.group_cn }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

export function deletePasswordJson(ctx: RequestContext): Response {
  const rateCheck = checkCrudRateLimit(ctx, 20);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter) },
    });
  }

  const id = Number(ctx.params.id);
  if (Number.isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const entry = getPasswordById(id);
  if (!entry) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Group authorization: super users can delete any entry
  if (!ctx.isSuper && !ctx.userGroups.includes(entry.group_cn)) {
    return new Response(JSON.stringify({ error: "You do not have access to this entry" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  deletePassword(id);

  auditLog(ctx.username, "PASSWORD_DELETE", id, `Deleted password "${entry.title}" from group "${entry.group_cn}"`);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function updatePasswordJson(ctx: RequestContext): Promise<Response> {
  const rateCheck = checkCrudRateLimit(ctx, 20);
  if (!rateCheck.allowed) {
    return new Response(JSON.stringify({ error: "Too many requests. Try again later." }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(rateCheck.retryAfter) },
    });
  }

  const id = Number(ctx.params.id);
  if (Number.isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid ID" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const entry = getPasswordById(id);
  if (!entry) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Group authorization: super users can update any entry
  if (!ctx.isSuper && !ctx.userGroups.includes(entry.group_cn)) {
    return new Response(JSON.stringify({ error: "You do not have access to this entry" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await ctx.request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { title, username, url, password, group_cn } = body;
  if (!title || !username || !group_cn) {
    return new Response(JSON.stringify({ error: "title, username, and group_cn are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Server-side length validation
  if (title.length > MAX_TITLE) {
    return new Response(JSON.stringify({ error: `title must be at most ${MAX_TITLE} characters` }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  if (username.length > MAX_USERNAME) {
    return new Response(JSON.stringify({ error: `username must be at most ${MAX_USERNAME} characters` }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  if ((url || "").length > MAX_URL) {
    return new Response(JSON.stringify({ error: `url must be at most ${MAX_URL} characters` }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }
  if (password && password.length > MAX_PASSWORD) {
    return new Response(JSON.stringify({ error: `password must be at most ${MAX_PASSWORD} characters` }), {
      status: 400, headers: { "Content-Type": "application/json" },
    });
  }

  // Group authorization: super users can write to any group
  if (!ctx.isSuper && !ctx.userGroups.includes(group_cn)) {
    return new Response(JSON.stringify({ error: "You do not have access to this group" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanedTitle = stripCtrl(title.trim());
  const cleanedUsername = stripCtrl(username.trim());
  const cleanedUrl = sanitizeUrl(stripCtrl((url || "").trim()));

  // If a new password is provided, re-encrypt with the existing entry id as AAD
  let encPassword = entry.enc_password;
  let encIv = entry.enc_iv;
  let encTag = entry.enc_tag;
  if (password) {
    const encrypted = encrypt(password, String(id));
    encPassword = encrypted.data;
    encIv = encrypted.iv;
    encTag = encrypted.tag;
  }

  const updated = updatePassword(id, {
    title: cleanedTitle,
    username: cleanedUsername,
    url: cleanedUrl,
    enc_password: encPassword,
    enc_iv: encIv,
    enc_tag: encTag,
    group_cn,
  });

  if (!updated) {
    return new Response(JSON.stringify({ error: "Update failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  auditLog(ctx.username, "PASSWORD_UPDATE", id, `Updated password "${cleanedTitle}" in group "${group_cn}"`);

  return new Response(JSON.stringify({ id: updated.id, title: updated.title, group_cn: updated.group_cn }), {
    headers: { "Content-Type": "application/json" },
  });
}