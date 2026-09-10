// Removes probe-created junk entries from data/passwordeeri.db
// Entries: 12,13,14,15,16,17 — all created by test/security-probe.ts runs.
// Keeps only the pre-existing seeded entries (10=Zarząd, 11=Koordynator).
import { Database } from "bun:sqlite";

const db = new Database("./data/passwordeeri.db");
const junkIds = [12, 13, 14, 15, 16, 17];
for (const id of junkIds) {
  const res = db.query("DELETE FROM passwords WHERE id = ?").run(id);
  console.log(`deleted id ${id}: changes=${res.changes}`);
}
const remaining = db.query("SELECT id, title, group_cn FROM passwords ORDER BY id").all();
console.log("Remaining:", JSON.stringify(remaining));
db.close();