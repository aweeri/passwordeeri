## Setup
1. Copy `config.env.template` to `config.env`
2. Fill in the values in `config.env`
3. Run the application

# passwordeeri

Tiny self-hosted vault that logs you in through your org's LDAP and only shows passwords for groups you're in.

- **Bun** — comes with HTTP, SQLite, crypto built in
- One real dependency (`ldapjs`)
- Passwords encrypted at rest (AES-256-GCM)
- Plain light UI. No bullshit bebops

---

## How it works

1. You type your LDAP user/pass.
2. Server binds with a **service account**, finds your DN, then re-binds **as you** to actually check the password.
3. Grabs your group CNs.
4. Makes a session row, sets an HttpOnly cookie.
5. Dashboard only lists entries whose `group_cn` is one of your groups.
6. You can add passwords to groups you're in and delete passwords from groups you're in. That's it.

## Deploy on a server

```bash
git clone https://github.com/aweeri/passwordeeri.git
cd passwordeeri
./setup.sh          # creates config.env + generates MASTER_KEY/SESSION_SECRET
# edit config.env, set your LDAP_* values, then:
./setup.sh          # builds and starts
```

Script generates the crypto secrets for you so you only need to fill in LDAP bits. App at `http://your-server:3000`. SQLite data in `./data/`.

The compose file is just this:

```yaml
version: "3.8"
services:
  passwordeeri:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
    env_file:
      - ./config.env
    restart: unless-stopped
```

Put an nginx/Caddy in front with HTTPS if prod. Enable `COOKIE_SECURE=true` in that case.

## Env vars

| Var | What |
|---|---|
| `APP_NAME` | brand name shown in title/heading/topbar (default `passwordeeri`) |
| `LDAP_URL` | `ldap://host:389` or `ldaps://` |
| `LDAP_BIND_DN` / `LDAP_BIND_PASSWORD` | service account creds |
| `LDAP_SEARCH_BASE` | e.g. `dc=example,dc=com` |
| `LDAP_USER_FILTER` | find the user; `{{username}}` gets swapped. AD: `(&(objectClass=user)(sAMAccountName={{username}}))` |
| `LDAP_GROUP_FILTER` | only if `memberOf` isn't populated; `{{user_dn}}` gets swapped. OpenLDAP: `(&(objectClass=groupOfNames)(member={{user_dn}}))` |
| `MASTER_KEY` | `openssl rand -hex 32` |
| `SESSION_SECRET` | random string ≥16 chars |
| `COOKIE_SECURE` | `true` if behind HTTPS |
| `SESSION_TTL_HOURS` | default 8 |
| `SESSION_REFRESH_MINUTES` | how often to re-check LDAP groups, default 15 |

## Local testing (Windows, no docker)

```powershell
bun run test:mock   # terminal 1 — fake LDAP on :1389
bun run test:app    # terminal 2 — app on :3000
```

Users: `alice`/`alicepass` (engineering+devops), `bob`/`bobpass` (devops only).

## Access model

- Every entry has a `group_cn`. You see it if you're in that group.
- Create/delete only works for groups you belong to.

## API

| Method | Path | Auth | Body |
|---|---|---|---|
| GET | `/login` | – | login page |
| POST | `/login` | – | `{username,password}` → session cookie |
| GET | `/logout` | – | kills session |
| GET | `/dashboard` | session | the UI |
| GET | `/api/passwords` | session | decrypted entries you can see |
| POST | `/api/passwords` | session | `{title,username,url,password,group_cn}` |
| DELETE | `/api/passwords/:id` | session | – |

## Security (reasonable, not paranoid)

- AES-256-GCM, master key only in env, never in the DB
- HttpOnly + SameSite cookie, server-side tokens, timing-safe comparison
- Parameterized SQL, HTML-escaped output, CSP + nosniff + frame/ref headers
- Generic "invalid username or password" — no user enumeration
- Rate-limited logins (5/min/IP) plus a random delay
- Sessions re-verify LDAP groups every 15 min, auto-expire if you're gone
- All creates/deletes are audit-logged
- Container runs as non-root

## Structure

```
src/
  index.ts      server + routes
  config.ts     env loading
  db.ts         sqlite, queries, audit log
  crypto.ts     AES-256-GCM
  ldap.ts       LDAP auth + group resolution
  middleware.ts session guards, CSRF
  routes/       auth.ts, passwords.ts
public/
  styles.css    the whole ui