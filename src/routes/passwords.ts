import { listPasswordsForGroups, getPasswordById, createPassword, deletePassword, logAudit } from "../db";
import { encrypt, decrypt } from "../crypto";
import type { RequestContext } from "../middleware";

const MAX_TITLE = 200;
const MAX_USERNAME = 200;
const MAX_URL = 2000;
const MAX_PASSWORD = 10000;

function stripCtrl(s: string): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
}

export function listPasswordsJson(ctx: RequestContext): Response {
  const entries = listPasswordsForGroups(ctx.userGroups);
  const decrypted = entries.map((e) => ({
    id: e.id,
    title: e.title,
    username: e.username,
    url: e.url,
    group_cn: e.group_cn,
    password: decrypt({ data: e.enc_password, iv: e.enc_iv, tag: e.enc_tag }),
    created_at: e.created_at,
  }));
  return new Response(JSON.stringify(decrypted), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function createPasswordJson(ctx: RequestContext): Promise<Response> {
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
  if (!ctx.userGroups.includes(group_cn)) {
    return new Response(JSON.stringify({ error: "You do not have access to this group" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cleanedTitle = stripCtrl(title.trim());
  const cleanedUsername = stripCtrl(username.trim());
  const cleanedUrl = stripCtrl((url || "").trim());

  const encrypted = encrypt(password);
  const entry = createPassword({
    title: cleanedTitle,
    username: cleanedUsername,
    url: cleanedUrl,
    enc_password: encrypted.data,
    enc_iv: encrypted.iv,
    enc_tag: encrypted.tag,
    group_cn,
  });

  logAudit(ctx.username, "create", entry.id, `Created password "${cleanedTitle}" in group "${group_cn}"`);

  return new Response(JSON.stringify({ id: entry.id, title: entry.title, group_cn: entry.group_cn }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
}

export function deletePasswordJson(ctx: RequestContext): Response {
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

  // Group authorization: user must belong to the entry's group
  if (!ctx.userGroups.includes(entry.group_cn)) {
    return new Response(JSON.stringify({ error: "You do not have access to this entry" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  deletePassword(id);

  logAudit(ctx.username, "delete", id, `Deleted password "${entry.title}" from group "${entry.group_cn}"`);

  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
}