# passwordeeri

A tiny self-hosted vault that logs you in through your org's LDAP and only ever shows passwords for the groups you're in.

Built on **Bun** (HTTP, SQLite, and crypto all built in) with just one real dependency (`ldapjs`). Passwords are encrypted at rest with AES-256-GCM. The UI is plain, fast, and has no build step.

## How it works

1. You type in your LDAP user/pass.
2. The server binds with a **service account**, finds your DN, then re-binds **as you** to actually verify the password.
3. It grabs your group CNs and issues a session cookie (HttpOnly).
4. The dashboard only lists entries whose `group_cn` matches one of your groups. You can add/delete passwords only for groups you belong to. That's it.

## Quick start (Docker)

```bash
git clone https://github.com/aweeri/passwordeeri.git
cd passwordeeri
./setup.sh          # creates config.env and generates a random MASTER_KEY
# edit config.env, set your LDAP_* values, then run it again:
./setup.sh          # builds and starts
```

That's all. The script generates the crypto secrets for you, so you only really need to fill in the LDAP bits. The app will be at `http://your-server:3000`, with SQLite data stored in `./data/`.

If you're serving under a subpath (e.g. `https://your-server/passwords`), set `BASE_PATH=/passwords` and forward that path in your reverse proxy. Enable `COOKIE_SECURE=true` whenever you're behind HTTPS.

## Local dev (no Docker, needs Bun)

```powershell
bun install
bun run test:mock   # terminal 1: fake LDAP on :1389
bun run test:app    # terminal 2: app on :3000
```

Test users: `alice`/`alicepass` (engineering + devops), `bob`/`bobpass` (devops only).

## Config essentials

Copy `.env.example` to `config.env` and fill in:

| Var | What |
|---|---|
| `LDAP_URL` | `ldap://host:389` or `ldaps://` |
| `LDAP_BIND_DN` / `LDAP_BIND_PASSWORD` | service account creds |
| `LDAP_SEARCH_BASE` | e.g. `dc=example,dc=com` |
| `LDAP_USER_FILTER` | finds the user; `{{username}}` is swapped. AD: `(&(objectClass=user)(sAMAccountName={{username}}))` |
| `LDAP_GROUP_FILTER` | only if `memberOf` isn't populated; `{{user_dn}}` is swapped |
| `MASTER_KEY` | 64 hex chars, `openssl rand -hex 32` (generated for you by `setup.sh`) |

Optionally: `APP_NAME` (branding), `BASE_PATH` (subpath), `COOKIE_SECURE` (HTTPS), `SESSION_TTL_HOURS` (default 8), `SESSION_REFRESH_MINUTES` (LDAP group re-check, default 15), `LOGIN_GROUPS` (allow-list), `SUPER_GROUPS` (full access to all entries).

## Access model

- Every entry has a `group_cn`. You see it if you're in that group.
- Create/delete works only for groups you belong to.

## API

| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/login` | - | login page |
| POST | `/login` | - | `{username,password}`, sets session cookie |
| GET | `/logout` | - | kills session |
| GET | `/dashboard` | session | the UI |
| GET | `/api/passwords` | session | decrypted entries you can see |
| POST | `/api/passwords` | session | `{title,username,url,password,group_cn}` |
| DELETE | `/api/passwords/:id` | session | - |

## Security (reasonable, without being paranoid)

- AES-256-GCM, master key only in env, never in the DB
- HttpOnly + SameSite cookies, server-side tokens, timing-safe comparison
- Parameterized SQL, HTML-escaped output, CSP + nosniff headers
- Generic "invalid username or password", no user enumeration
- Rate-limited logins plus a random delay
- Sessions re-verify LDAP groups every 15 min, auto-expire if you're gone
- Creates/deletes are audit-logged; container runs as non-root

## Structure

Code lives in `src/` (`index.ts` server, `config.ts` env, `db.ts` SQLite, `crypto.ts` AES-256-GCM, `ldap.ts` auth + groups, `middleware.ts` sessions/CSRF, `routes/` auth + passwords) and the UI is in `public/`.