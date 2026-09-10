export interface Config {
  APP_NAME: string;
  PORT: number;
  BASE_PATH: string;
  SESSION_SECRET: string;
  MASTER_KEY: string;
  COOKIE_SECURE: boolean;
  SESSION_TTL_HOURS: number;
  SESSION_REFRESH_MINUTES: number;
  LDAP_URL: string;
  LDAP_BIND_DN: string;
  LDAP_BIND_PASSWORD: string;
  LDAP_SEARCH_BASE: string;
  LDAP_USER_FILTER: string;
  LDAP_GROUP_FILTER: string;
  LDAP_GROUP_ATTR: string;
  SUPER_GROUPS: string[];
  LOGIN_GROUPS: string[];
  DATA_DIR: string;
}

let config: Config | null = null;

function env(key: string): string {
  const val = process.env[key];
  if (!val) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return val;
}

function envOpt(key: string, fallback: string): string {
  const val = process.env[key];
  return val ?? fallback;
}

function envNum(key: string, fallback: number): number {
  const val = process.env[key];
  if (!val) return fallback;
  const n = Number(val);
  if (Number.isNaN(n)) {
    console.error(`Invalid number for ${key}: ${val}`);
    process.exit(1);
  }
  return n;
}

function envBool(key: string, fallback: boolean): boolean {
  const val = process.env[key];
  if (!val) return fallback;
  const normalized = val.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on";
}

export function loadConfig(): Config {
  if (config) return config;

  const masterKey = env("MASTER_KEY");
  if (masterKey.length !== 64) {
    console.error("MASTER_KEY must be exactly 64 hex characters (32 bytes)");
    process.exit(1);
  }

  const sessionSecret = env("SESSION_SECRET");
  if (sessionSecret.length < 16) {
    console.error("SESSION_SECRET must be at least 16 characters");
    process.exit(1);
  }

  config = {
    APP_NAME: envOpt("APP_NAME", "passwordeeri"),
    PORT: envNum("PORT", 3000),
    // URL subpath the app is served under, e.g. "/passwords". Empty = root.
    BASE_PATH: normalizeBasePath(envOpt("BASE_PATH", "")),
    SESSION_SECRET: sessionSecret,
    MASTER_KEY: masterKey,
    COOKIE_SECURE: envBool("COOKIE_SECURE", false),
    SESSION_TTL_HOURS: envNum("SESSION_TTL_HOURS", 8),
    SESSION_REFRESH_MINUTES: envNum("SESSION_REFRESH_MINUTES", 15),
    LDAP_URL: env("LDAP_URL"),
    LDAP_BIND_DN: env("LDAP_BIND_DN"),
    LDAP_BIND_PASSWORD: env("LDAP_BIND_PASSWORD"),
    LDAP_SEARCH_BASE: env("LDAP_SEARCH_BASE"),
    LDAP_USER_FILTER: env("LDAP_USER_FILTER"),
    // Optional — only needed when the memberOf attribute is not populated
    LDAP_GROUP_FILTER: envOpt("LDAP_GROUP_FILTER", ""),
    LDAP_GROUP_ATTR: envOpt("LDAP_GROUP_ATTR", "memberOf"),
    // Comma-separated list of group names that get full access to ALL entries
    SUPER_GROUPS: envOpt("SUPER_GROUPS", "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    // Comma-separated whitelist of groups allowed to log in. Empty = allow all.
    LOGIN_GROUPS: envOpt("LOGIN_GROUPS", "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    DATA_DIR: envOpt("DATA_DIR", "./data"),
  };

  return config;
}

/**
 * Normalize a BASE_PATH to the form "/sub/path" (leading slash, no trailing
 * slash). Returns "" when unset. Accepts "passwords", "/passwords/", "/".
 */
function normalizeBasePath(raw: string): string {
  let p = raw.trim();
  if (!p || p === "/") return "";
  if (!p.startsWith("/")) p = "/" + p;
  p = p.replace(/\/+$/, "");
  return p;
}

export function getConfig(): Config {
  if (!config) {
    throw new Error("Config not loaded. Call loadConfig() first.");
  }
  return config;
}