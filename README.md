# passwordeeri

Tiny self-hosted vault that logs you in through your org's LDAP and only shows passwords for groups you're in.

- **Bun** — comes with HTTP, SQLite, crypto built in
- One real dependency (`ldapjs`)
- Passwords encrypted at rest (AES-256-GCM)
- Plain light UI. No bullshit bebops
- Single-container Docker deploy

---

## How it works

1. You type your LDAP user/pass.
2. Server binds with a **service account**, finds your DN, then re-binds **as you** to actually check the password.
3. Grabs your group CNs.
4. Makes a session row, sets an HttpOnly cookie.
5. Dashboard only lists entries whose `group_cn` is one of your groups.
6. You can add passwords to groups you're in and delete passwords from groups you're in. That's it.

## Setup

```bash
cp .env.example config.env      # then edit it
openssl rand -hex 32            # -> MASTER_KEY (must be exactly 64 hex chars)
openssl rand -hex 16            # -> SESSION_SECRET
```

Key bits in the env file:

| Var | What |
|---|---|
| `LDAP_URL` | `ldap://host:389` or `ldaps://` for TLS |
| `LDAP_BIND_DN` / `LDAP_BIND_PASSWORD` | service account |
| `LDAP_SEARCH_BASE` | base DN to search under |
| `LDAP_USER_FILTER` | finds the user; `{{username}}` gets swapped in. AD: `(&(objectClass=user)(sAMAccountName={{username}}))` |
| `LDAP_GROUP_FILTER` | only needed if `memberOf` isn't set. `{{user_dn}}` gets swapped in. OpenLDAP: `(&(objectClass=groupOfNames)(member={{user_dn}}))` |
| `MASTER_KEY` | `openssl rand -hex 32` |
| `SESSION_SECRET` | any random string ≥16 chars |

### Docker

```bash
docker compose up -d --build
```

App at `http://localhost:3000`, SQLite data in `./data/`.

### No Docker (dev)

```bash
bun install
# set the env vars from config.env in your shell, then:
bun run dev
```

### Local testing on Windows (mock LDAP, no docker)

```powershell
bun run test:mock   # terminal 1 — fake LDAP on :1389
bun run test:app    # terminal 2 — app on :3000 (reads test/config.env)
```

## Access model

- Every entry has a `group_cn` (the LDAP group that can see it).
- You see entries where `group_cn` matches any group you're in.
- Create only for your groups, delete only from your groups.

## API

| Method | Path | Auth | Desc |
|---|---|---|---|
| GET | `/` | – | bounce to `/dashboard` or `/login` |
| GET | `/login` | – | login page |
| POST | `/login` | – | `{username,password}` → sets session cookie |
| GET | `/logout` | – | kills session |
| GET | `/dashboard` | session | dashboard |
| GET | `/api/passwords` | session | decrypted entries you can see |
| POST | `/api/passwords` | session | `{title,username,url,password,group_cn}` |
| DELETE | `/api/passwords/:id` | session | delete (group-scoped) |

## Security (kept reasonable, not paranoid)

- AES-256-GCM, master key only in env, never in the DB
- HttpOnly + SameSite cookie, server-side tokens in SQLite
- Parameterized SQL, HTML-escaped output, CSP + nosniff + frame/ref headers
- Generic "invalid username or password" — no user enumeration
- Rate-limited logins (5/min/IP), login delay
- Sessions re-check LDAP groups periodically, expire if user disappears
- Create/delete is audit-logged
- Container runs as non-root. Put an HTTPS reverse proxy in front of it in prod.

## Structure

```
src/
  index.ts      # server + routes
  config.ts     # env loading
  db.ts         # sqlite + queries + audit log
  crypto.ts     # AES-256-GCM
  ldap.ts       # ldap auth + groups
  middleware.ts # session guards + csrf
  routes/       # auth.ts, passwords.ts
public/
  styles.css    # all the fluff-free styling