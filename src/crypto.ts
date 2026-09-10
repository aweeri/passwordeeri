import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { getConfig } from "./config";

export interface EncryptedBlob {
  data: string; // base64 ciphertext
  iv: string;   // base64 iv
  tag: string;  // base64 auth tag
}

function keyBytes(): Buffer {
  return Buffer.from(getConfig().MASTER_KEY, "hex");
}

export function encrypt(plaintext: string, aad?: string | Buffer): EncryptedBlob {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyBytes(), iv);
  if (aad !== undefined) {
    // Bind the ciphertext to contextual data (e.g. entry id) so it cannot be
    // replayed or swapped across records.
    cipher.setAAD(typeof aad === "string" ? Buffer.from(aad, "utf8") : aad);
  }
  const data = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    data: data.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decrypt(blob: EncryptedBlob, aad?: string | Buffer): string {
  try {
    const iv = Buffer.from(blob.iv, "base64");
    const tag = Buffer.from(blob.tag, "base64");
    const data = Buffer.from(blob.data, "base64");
    const decipher = createDecipheriv("aes-256-gcm", keyBytes(), iv);
    decipher.setAuthTag(tag);
    if (aad !== undefined) {
      decipher.setAAD(typeof aad === "string" ? Buffer.from(aad, "utf8") : aad);
    }
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch {
    throw new Error("Failed to decrypt: data may be corrupted or MASTER_KEY has changed");
  }
}