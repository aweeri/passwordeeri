import { createClient } from "ldapjs";

const client = createClient({ url: "ldap://localhost:1389", reconnect: false });

function bind(dn: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err: Error | null) => {
      err ? reject(err) : resolve();
    });
  });
}

function search(base: string, filter: string, attributes: string[]): Promise<any> {
  return new Promise((resolve, reject) => {
    const entries: any[] = [];
    client.search(base, { filter, scope: "sub", attributes }, (err: Error | null, res: any) => {
      if (err) return reject(err);
      res.on("searchEntry", (entry: any) => {
        const parsed: any = {
          objectName: entry.objectName,
          objectNameStr: entry.objectName?.toString?.() ?? entry.objectName,
          dnStr: entry.dn?.toString?.() ?? null,
          attributesType: typeof entry.attributes,
          attributes: entry.attributes?.map?.((a: any) => ({
            type: a.type,
            values: a.values,
            vals: a.vals,
          })),
        };
        entries.push(parsed);
      });
      res.on("error", (e: Error) => reject(e));
      res.on("end", () => resolve(entries));
    });
  });
}

await bind("cn=admin,dc=test,dc=local", "adminpass");
const entries = await search("dc=test,dc=local", "(&(objectClass=inetOrgPerson)(uid=alice))", ["dn", "memberOf"]);
console.log(JSON.stringify(entries, null, 2));