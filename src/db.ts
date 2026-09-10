import { Database } from "bun:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { timingSafeEqual } from "node:crypto";
import { getConfig } from "./config";

export interface PasswordEntry {
  id: number;
  title: string;
  username: string;
  url: string;
  enc_password: string;
  enc_iv: string;
  enc_tag: string;
  group_cn: string;
  created_at: string;
  updated_at: string;
}

export interface SessionRow {
  token: string;
  username: string;
  groups: string;
  created_at: string;
  expires_at: string;
  last_refreshed: string;
}

export interface AuditLogEntry {
  id?: number;
  username: string;
  action: string;
  target_id: number | null;
  detail: string;
  created_at: string;
}

const MIGRATIONS = `
CREATE TABLE IF NOT EXISTS passwords (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    username    TEXT NOT NULL,
    url         TEXT DEFAULT '',
    enc_password TEXT NOT NULL,
    enc_iv      TEXT NOT NULL,
    enc_tag     TEXT NOT NULL,
    group_cn    TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
    token       TEXT PRIMARY KEY,
    username    TEXT NOT NULL,
    groups      TEXT NOT NULL,
    created_at  TEXT DEFAULT (datetime('now')),
    expires_at  TEXT NOT NULL,
    last_refreshed TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT NOT NULL,
    action      TEXT NOT NULL,
    target_id   INTEGER,
    detail      TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_passwords_group ON passwords(group_cn);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
`;

let db: Database | null = null;

export function getDb(): Database {
  if (db) return db;

  const cfg = getConfig();
  mkdirSync(cfg.DATA_DIR, { recursive: true });

  db = new Database(join(cfg.DATA_DIR, "passwordeeri.db"));
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(MIGRATIONS);
  return db;
}

// ---- Timing-safe token comparison ----

export function isTokenValid(inputToken: string, storedToken: string): boolean {
  try {
    const input = Buffer.from(inputToken, "utf8");
    const stored = Buffer.from(storedToken, "utf8");
    if (input.length !== stored.length) return false;
    return timingSafeEqual(input, stored);
  } catch {
    return false;
  }
}

// ---- Passwords ----

export function listPasswordsForGroups(groups: string[]): PasswordEntry[] {
  if (groups.length === 0) return [];
  const placeholders = groups.map(() => "?").join(", ");
  return getDb()
    .query(`SELECT * FROM passwords WHERE group_cn IN (${placeholders}) ORDER BY title`)
    .all(...groups) as PasswordEntry[];
}

export function getPasswordById(id: number): PasswordEntry | null {
  return getDb().query("SELECT * FROM passwords WHERE id = ?").get(id) as PasswordEntry | null;
}

export function createPassword(data: {
  title: string;
  username: string;
  url: string;
  enc_password: string;
  enc_iv: string;
  enc_tag: string;
  group_cn: string;
}): PasswordEntry {
  const result = getDb()
    .query(
      `INSERT INTO passwords (title, username, url, enc_password, enc_iv, enc_tag, group_cn)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(data.title, data.username, data.url, data.enc_password, data.enc_iv, data.enc_tag, data.group_cn);
  return getPasswordById(Number(result.lastInsertRowid))!;
}

export function deletePassword(id: number): boolean {
  const result = getDb().query("DELETE FROM passwords WHERE id = ?").run(id);
  return result.changes > 0;
}

// ---- Sessions ----

export function createSession(token: string, username: string, groups: string[]): void {
  const cfg = getConfig();
  const expiresAt = new Date(Date.now() + cfg.SESSION_TTL_HOURS * 3600 * 1000).toISOString();
  const now = new Date().toISOString();
  getDb()
    .query("INSERT INTO sessions (token, username, groups, expires_at, last_refreshed) VALUES (?, ?, ?, ?, ?)")
    .run(token, username, JSON.stringify(groups), expiresAt, now);
}

export function getSession(token: string): SessionRow | null {
  const row = getDb().query("SELECT * FROM sessions WHERE token = ?").get(token) as SessionRow | null;
  if (!row) return null;
  if (!isTokenValid(token, row.token)) return null;
  if (new Date(row.expires_at) < new Date()) {
    deleteSession(token);
    return null;
  }
  return row;
}

export function refreshSessionGroups(token: string, groups: string[]): void {
  const now = new Date().toISOString();
  getDb()
    .query("UPDATE sessions SET groups = ?, last_refreshed = ? WHERE token = ?")
    .run(JSON.stringify(groups), now, token);
}

export function deleteSession(token: string): void {
  getDb().query("DELETE FROM sessions WHERE token = ?").run(token);
}

export function parseGroups(session: SessionRow): string[] {
  try {
    const parsed = JSON.parse(session.groups);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

// ---- Audit log ----

export function logAudit(username: string, action: string, targetId: number | null, detail: string): void {
  try {
    getDb()
      .query("INSERT INTO audit_log (username, action, target_id, detail) VALUES (?, ?, ?, ?)")
      .run(username, action, targetId, detail);
  } catch {
    // audit logging should never break the app
    console.error("Audit log write failed:", (Error as any).message);
  }
}