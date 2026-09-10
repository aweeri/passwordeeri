import { authenticate } from "../src/ldap";
import { loadConfig } from "../src/config";

loadConfig();

try {
  const result = await authenticate("alice", "alicepass");
  console.log("SUCCESS:", JSON.stringify(result));
} catch (e) {
  console.log("ERROR:", e instanceof Error ? e.message : e);
}
