import { Database } from "bun:sqlite";

const db = new Database("./data/passwordeeri.db");
const sessions = db.query("SELECT token, username, groups, created_at, expires_at FROM sessions").all();
console.log("=== Sessions in DB ===");
console.log(JSON.stringify(sessions, null, 2));

const audit = db.query("SELECT username, action, detail, created_at FROM audit_log ORDER BY id DESC LIMIT 10").all();
console.log("\n=== Recent audit log ===");
console.log(JSON.stringify(audit, null, 2));

const pws = db.query("SELECT id, title, group_cn FROM passwords").all();
console.log("\n=== Passwords in DB ===");
console.log(JSON.stringify(pws, null, 2));