// Test what format ldapjs server res.send() accepts
import ldap, { Attribute } from "ldapjs";

// Try 1: plain object like the old (broken) format
const oldFormat = {
  dn: "uid=alice,ou=people,dc=test,dc=local",
  attributes: [
    { type: "objectClass", values: ["inetOrgPerson", "top"] },
    { type: "uid", values: ["alice"] },
    { type: "memberOf", values: ["cn=engineering,ou=groups,dc=test,dc=local"] },
  ],
};

// Try 2: with Attribute instances
const withAttributes = {
  dn: "uid=alice,ou=people,dc=test,dc=local",
  attributes: [
    new Attribute({ type: "objectClass", values: ["inetOrgPerson", "top"] }),
    new Attribute({ type: "uid", values: ["alice"] }),
  ],
};

// Try 3: Attribute.fromObject -> array of plain objects
const fromObject = Attribute.fromObject({
  objectclass: ["inetOrgPerson", "top"],
  uid: "alice",
});

console.log("oldFormat keys:", Object.keys(oldFormat));
console.log("withAttributes[0].constructor.name:", withAttributes.attributes[0].constructor.name);
console.log("fromObject:", JSON.stringify(fromObject));
console.log("fromObject[0].constructor.name:", fromObject[0].constructor.name);
console.log("isAttribute:", Attribute.isAttribute(fromObject[0]));

// Check what the ldapjs server does with each
const { SearchResponse } = ldap;
// SearchResponse is internal, let's see how send filters attributes
const attr = withAttributes.attributes[0];
console.log("Attribute instance toString:", attr.toString());
console.log("Attribute has values:", attr.values, "vals:", attr.vals);