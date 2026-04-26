# Mail Server Configuration — z2Lab OrderEntry

Outbound email is used for password resets, pool-threshold notifications, admin alerts, and (with HIN) encrypted lab-report delivery. The transport layer is provider-agnostic: any of `smtp`, `gmail`, `smtp_oauth2`, `google_workspace_relay`, or `hin` can be selected via environment variables and switched without code changes.

> **Provider-agnostic:** Code never references „Gmail" or „HIN" directly — only the configured provider key. Switch providers by changing ENV vars and restarting the server.

---

## Quickest path: Gmail (DEV ONLY)

Gmail works for development and personal projects, but **not for production with patient data** — it is not nDSG-compliant. For real lab traffic use HIN, hospital SMTP relay, or Office 365 OAuth2.

### Step 1 — Enable 2-Factor Authentication

Open https://myaccount.google.com/security and turn on „2-Step Verification". Without 2-FA, Google does not allow App Passwords.

### Step 2 — Create an App Password

1. Open https://myaccount.google.com/apppasswords
2. **App name:** anything memorable, e.g. `z2Lab OrderEntry`
3. Click **Create**
4. Google shows a **16-character password** like `abcd efgh ijkl mnop` — exactly once
5. **Copy it immediately** — Google will not show it again. Spaces can be omitted; what matters are the 16 characters.

### Step 3 — Configure `.env.local`

Open `frontend/orderentry/.env.local` and add (or edit) the following block. Field-by-field:

```bash
# Provider selector — must be one of: smtp | gmail | smtp_oauth2 | google_workspace_relay | hin
ORDERENTRY_MAIL__PROVIDER=gmail

# Authentication mode — fixed string, NOT a password.
# Allowed values: APP_PASSWORD | OAUTH2 | NONE
# For Gmail with App Password use APP_PASSWORD.
ORDERENTRY_MAIL__AUTH_TYPE=APP_PASSWORD

# SMTP host + port — fixed for Gmail
ORDERENTRY_MAIL__HOST=smtp.gmail.com
ORDERENTRY_MAIL__PORT=587
ORDERENTRY_MAIL__SECURE=false

# Your Gmail address
ORDERENTRY_MAIL__USER=your.address@gmail.com

# THE 16-CHARACTER APP PASSWORD GOES HERE — never your normal Gmail login password
ORDERENTRY_MAIL__PASSWORD=abcdefghijklmnop

# Display name + sender address
ORDERENTRY_MAIL__FROM=z2Lab OrderEntry <your.address@gmail.com>
```

> ⚠️ **Common mistake:** the App Password belongs in `ORDERENTRY_MAIL__PASSWORD`, **not** in `ORDERENTRY_MAIL__AUTH_TYPE`. The `AUTH_TYPE` variable is a mode selector and must always be one of `APP_PASSWORD`, `OAUTH2`, or `NONE` — pasting the secret here makes the whole config invalid and the test endpoint returns 503.

### Step 4 — Restart the dev server

ENV variables are read once at startup; there is no hot-reload.

```bash
# In the terminal where `npm run dev` is running:
# 1. Press Ctrl+C
# 2. Start again:
npm run dev
```

### Step 5 — Test

In the Admin UI: **Settings → Mail → "Verbindung testen"**.

Or via curl with an active session cookie:

```bash
# SMTP verify only (no email sent)
curl -X POST http://localhost:3000/api/v1/admin/mail/test \
  -H "Content-Type: application/json" \
  -b "session=YOUR_COOKIE" \
  -d '{}'

# Send a test email to verify end-to-end
curl -X POST http://localhost:3000/api/v1/admin/mail/test \
  -H "Content-Type: application/json" \
  -b "session=YOUR_COOKIE" \
  -d '{"to":"your.address@gmail.com"}'
```

A successful verify returns:

```json
{ "ok": true,
  "message": "Mail-Server erreichbar und Authentifizierung erfolgreich",
  "provider": "gmail",
  "from":     "your.address@gmail.com",
  "durationMs": 234 }
```

A test send (with `to`) additionally puts an email titled „z2Lab OrderEntry — Test-E-Mail" in the inbox.

---

## All ENV variables

All variables use the project prefix (`ORDERENTRY_` by default; configurable via `APP_NAME`).

| Variable | Required | Notes |
|---|---|---|
| `ORDERENTRY_MAIL__PROVIDER` | Yes | `smtp` \| `gmail` \| `smtp_oauth2` \| `google_workspace_relay` \| `hin` — empty/`none` disables mail |
| `ORDERENTRY_MAIL__AUTH_TYPE` | Yes | `APP_PASSWORD` \| `OAUTH2` \| `NONE` — must be valid for the chosen provider (see matrix below) |
| `ORDERENTRY_MAIL__HOST` | for SMTP/Gmail/relay | SMTP server hostname |
| `ORDERENTRY_MAIL__PORT` | No | Default `587`. Use `465` only if `MAIL__SECURE=true` |
| `ORDERENTRY_MAIL__SECURE` | No | `true` = direct TLS (port 465); `false` = STARTTLS (port 587, default) |
| `ORDERENTRY_MAIL__USER` | for APP_PASSWORD | Username / email address |
| `ORDERENTRY_MAIL__PASSWORD` | for APP_PASSWORD | App Password / SMTP password — **secret, never log or commit** |
| `ORDERENTRY_MAIL__OAUTH_CLIENT_ID` | for OAUTH2 | OAuth2 client ID |
| `ORDERENTRY_MAIL__OAUTH_CLIENT_SECRET` | for OAUTH2 | **Secret** — never log or commit |
| `ORDERENTRY_MAIL__OAUTH_REFRESH_TOKEN` | for OAUTH2 | Long-lived refresh token — **secret** |
| `ORDERENTRY_MAIL__FROM` | Recommended | Display sender, e.g. `OrderEntry <noreply@example.com>` |
| `ORDERENTRY_MAIL__ALIAS` | No | Reply-To override |
| `ORDERENTRY_MAIL__DOMAIN` | for Workspace relay | Google Workspace domain |

### Provider × Auth-Type matrix

The `MailServiceFactory` rejects invalid combinations and falls back to a `NullMailService` (mail disabled). Valid combinations:

| Provider | Allowed AUTH_TYPE | Production? |
|---|---|---|
| `smtp` | `APP_PASSWORD`, `OAUTH2` | ✅ Yes (hospital relay, generic SMTP) |
| `gmail` | `APP_PASSWORD`, `OAUTH2` | ❌ Dev only — not nDSG-compliant |
| `smtp_oauth2` | `OAUTH2` | ✅ Yes (Office 365 / Exchange Online) |
| `google_workspace_relay` | `NONE`, `APP_PASSWORD` | ✅ Yes (org with Workspace subscription) |
| `hin` | `APP_PASSWORD` | ✅ Yes — required for Swiss patient data |

---

## Variable-by-variable reference

Detailed explanation of every Mail ENV variable: meaning, how to configure, concrete example.

### 1. `ORDERENTRY_MAIL__PROVIDER`

**Meaning:** Selects which mail provider implementation `MailServiceFactory` instantiates. Drives the entire mail pipeline.

**Allowed values:** `smtp` · `gmail` · `smtp_oauth2` · `google_workspace_relay` · `hin` — empty or `none` disables mail entirely.

**How to configure:** Pick by use case:
- Hospital / on-prem mail server → `smtp`
- Test mail from a personal Google account → `gmail`
- Office 365 / Exchange Online → `smtp_oauth2`
- Organisation with Google Workspace subscription → `google_workspace_relay`
- Swiss patient data (nDSG) → `hin`

**Example:**
```bash
ORDERENTRY_MAIL__PROVIDER=gmail
```

---

### 2. `ORDERENTRY_MAIL__AUTH_TYPE`

**Meaning:** Authentication mode the SMTP transport uses. **Mode selector — not a password.** Common pitfall: pasting the App Password here instead of into `MAIL__PASSWORD`.

**Allowed values:** `APP_PASSWORD` · `OAUTH2` · `NONE`

**How to configure:** Depends on the provider (see matrix above):
| Provider | Valid AUTH_TYPE |
|---|---|
| `smtp` | `APP_PASSWORD`, `OAUTH2` |
| `gmail` | `APP_PASSWORD`, `OAUTH2` |
| `smtp_oauth2` | `OAUTH2` |
| `google_workspace_relay` | `NONE`, `APP_PASSWORD` |
| `hin` | `APP_PASSWORD` |

**Example:**
```bash
ORDERENTRY_MAIL__AUTH_TYPE=APP_PASSWORD
```

---

### 3. `ORDERENTRY_MAIL__HOST`

**Meaning:** SMTP server hostname.

**How to configure:** Provider-specific:
| Provider | Hostname |
|---|---|
| Gmail | `smtp.gmail.com` |
| Office 365 | `smtp.office365.com` |
| HIN | `smtp.hin.ch` |
| Google Workspace Relay | `smtp-relay.gmail.com` |
| Generic SMTP | hostname of your server, e.g. `mail.klinik-im-park.ch` |

**Example:**
```bash
ORDERENTRY_MAIL__HOST=smtp.gmail.com
```

---

### 4. `ORDERENTRY_MAIL__PORT`

**Meaning:** TCP port on the SMTP server. Default `587`.

**How to configure:** Must match `MAIL__SECURE`:
- `587` → STARTTLS (plaintext connect, then TLS upgrade — modern default)
- `465` → direct TLS/SSL on connect (older but valid)
- `25` → unencrypted (only inside closed networks; never over the internet)

**Example:**
```bash
ORDERENTRY_MAIL__PORT=587
```

---

### 5. `ORDERENTRY_MAIL__SECURE`

**Meaning:** Selects the encryption model.

**Allowed values:** `true` · `false`

**How to configure:** Must agree with `MAIL__PORT`:
| Port | SECURE | Behaviour |
|---|---|---|
| `587` | `false` | Plaintext connect → STARTTLS upgrade (Gmail/HIN/Office 365 standard) |
| `465` | `true` | Immediate TLS, no plaintext phase |
| `25` | `false` | Plaintext (no encryption) |

**Example:**
```bash
ORDERENTRY_MAIL__SECURE=false
```

---

### 6. `ORDERENTRY_MAIL__USER`

**Meaning:** Username for SMTP authentication. For Gmail / Office 365 / HIN this is the email address itself.

**How to configure:** Required when `AUTH_TYPE=APP_PASSWORD` or `OAUTH2`. Not used with `NONE`.

**Example:**
```bash
ORDERENTRY_MAIL__USER=mcse.arian@gmail.com
```

---

### 7. `ORDERENTRY_MAIL__PASSWORD`

**Meaning:** SMTP password. For Gmail / Workspace this is the **App Password**, not the regular login password. **Secret — never log or commit.**

**How to configure:**
- **Gmail:** 16-character string from https://myaccount.google.com/apppasswords (spaces optional)
- **Office 365 / Exchange:** SMTP-specific password of the service account
- **HIN:** the HIN account password
- **Generic SMTP:** the SMTP user's password

Required when `AUTH_TYPE=APP_PASSWORD`. Do not set with `OAUTH2` or `NONE`.

**Example:**
```bash
ORDERENTRY_MAIL__PASSWORD=nbkcyqtmieqqqsxx
```

> ⚠️ Never use your regular Gmail login password — Google has fully blocked that path since 2022. Only App Passwords work.

---

### 8. `ORDERENTRY_MAIL__FROM`

**Meaning:** `From:` header of every outgoing mail. Recommended format: display name + address.

**How to configure:** Use `Display Name <email@domain>`:

**Example:**
```bash
ORDERENTRY_MAIL__FROM=z2Lab OrderEntry <mcse.arian@gmail.com>
```

> If empty, the code falls back to `OrderEntry <{MAIL__USER}>` — or `noreply@localhost` if `MAIL__USER` is also empty.

---

### 9. `ORDERENTRY_MAIL__ALIAS`

**Meaning:** Reply-To header. When the recipient hits "Reply", the response goes to this address instead of `MAIL__FROM`.

**How to configure:** Optional. Useful when the sender is `noreply@…` but replies should land in a service mailbox.

**Example:**
```bash
ORDERENTRY_MAIL__ALIAS=auftrag@zlz.ch
```

---

### 10. `ORDERENTRY_MAIL__OAUTH_CLIENT_ID`

**Meaning:** Client ID of the OAuth2 application (Azure AD App Registration, Google Cloud Project). Only used when `AUTH_TYPE=OAUTH2`.

**How to configure:**
- **Office 365:** Azure Portal → App Registrations → new App → copy Application (client) ID
- **Gmail OAuth2:** Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client → copy Client ID

**Example:**
```bash
ORDERENTRY_MAIL__OAUTH_CLIENT_ID=12345678-aaaa-bbbb-cccc-1234567890ab
```

---

### 11. `ORDERENTRY_MAIL__OAUTH_CLIENT_SECRET`

**Meaning:** Client secret of the OAuth2 app. **Secret — never log or commit.**

**How to configure:** Generated when the app is created in Azure Portal / Google Cloud Console. Often has an expiry (max. 24 months in Azure).

**Example:**
```bash
ORDERENTRY_MAIL__OAUTH_CLIENT_SECRET=Z3p8Q~AbCdEfGhIjKlMnOpQrStUv-XyZ1234567
```

---

### 12. `ORDERENTRY_MAIL__OAUTH_REFRESH_TOKEN`

**Meaning:** Long-lived refresh token granting `Mail.Send` scope. The server uses it to fetch short-lived access tokens automatically. **Secret.**

**How to configure:** Obtained once via an OAuth2 flow (e.g. `oauth2-proxy` or the Google OAuth Playground). Does not expire as long as the app stays in active use.

**Example:**
```bash
ORDERENTRY_MAIL__OAUTH_REFRESH_TOKEN=1//0gAbCdEfGhIjKlMnOpQrStUvWxYz1234567890
```

---

### 13. `ORDERENTRY_MAIL__DOMAIN`

**Meaning:** Google Workspace domain — only with `provider=google_workspace_relay`.

**How to configure:** Your Workspace domain. Google uses it to validate the sender as belonging to this domain (and to apply IP-allow-list rules).

**Example:**
```bash
ORDERENTRY_MAIL__DOMAIN=zlz.ch
```

---

### Quick formula

```
PROVIDER  ─→ which implementation
AUTH_TYPE ─→ which auth method (mode string — NEVER a password)
HOST/PORT/SECURE ─→ connection
USER/PASSWORD     ─→ classic auth (APP_PASSWORD)
OAUTH_*           ─→ OAuth2 (three fields together)
FROM/ALIAS        ─→ how recipients see the sender
DOMAIN            ─→ Workspace Relay only
```

---

## Other providers — quick configurations

### Generic SMTP (hospital relay, Exchange on-prem)

```bash
ORDERENTRY_MAIL__PROVIDER=smtp
ORDERENTRY_MAIL__AUTH_TYPE=APP_PASSWORD
ORDERENTRY_MAIL__HOST=mail.klinik-im-park.ch
ORDERENTRY_MAIL__PORT=587
ORDERENTRY_MAIL__SECURE=false
ORDERENTRY_MAIL__USER=lab-noreply
ORDERENTRY_MAIL__PASSWORD=<smtp password>
ORDERENTRY_MAIL__FROM=z2Lab OrderEntry <lab-noreply@klinik-im-park.ch>
```

### Office 365 / Exchange Online (OAuth2)

```bash
ORDERENTRY_MAIL__PROVIDER=smtp_oauth2
ORDERENTRY_MAIL__AUTH_TYPE=OAUTH2
ORDERENTRY_MAIL__HOST=smtp.office365.com
ORDERENTRY_MAIL__PORT=587
ORDERENTRY_MAIL__USER=lab-noreply@klinik.ch
ORDERENTRY_MAIL__OAUTH_CLIENT_ID=<azure app id>
ORDERENTRY_MAIL__OAUTH_CLIENT_SECRET=<azure app secret>
ORDERENTRY_MAIL__OAUTH_REFRESH_TOKEN=<refresh token>
ORDERENTRY_MAIL__FROM=z2Lab OrderEntry <lab-noreply@klinik.ch>
```

### HIN (Swiss Health Info Net) — production for patient data

```bash
ORDERENTRY_MAIL__PROVIDER=hin
ORDERENTRY_MAIL__AUTH_TYPE=APP_PASSWORD
ORDERENTRY_MAIL__HOST=smtp.hin.ch
ORDERENTRY_MAIL__PORT=587
ORDERENTRY_MAIL__USER=<hin account>
ORDERENTRY_MAIL__PASSWORD=<hin password>
ORDERENTRY_MAIL__FROM=ZLZ Zentrallabor <noreply@zlz.hin.ch>
```

### Google Workspace Relay (org with Workspace)

```bash
ORDERENTRY_MAIL__PROVIDER=google_workspace_relay
ORDERENTRY_MAIL__AUTH_TYPE=NONE
ORDERENTRY_MAIL__HOST=smtp-relay.gmail.com
ORDERENTRY_MAIL__PORT=587
ORDERENTRY_MAIL__DOMAIN=zlz.ch
ORDERENTRY_MAIL__FROM=z2Lab OrderEntry <noreply@zlz.ch>
```

---

## API endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `GET`  | `/api/v1/admin/mail/status` | admin | Current configuration without secrets |
| `POST` | `/api/v1/admin/mail/test`   | admin | Verify SMTP + optionally send test email |

The `POST` body is optional:

```json
// SMTP verify only — no email sent
{}

// Verify + send a test email to <to>
{ "to": "admin@example.com" }
```

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `503 — Mail server not configured` | No provider set, or invalid `provider`/`auth_type` combo | Check ENV vars match the matrix above; restart server |
| `502 — Username and Password not accepted` (Gmail) | Using normal Gmail password instead of App Password | Generate an App Password and use it in `MAIL__PASSWORD` |
| `502 — Connection timeout` | Firewall blocks port 587 | Try port 465 with `MAIL__SECURE=true`; or check egress rules |
| Test endpoint returns `502` immediately | `auth_type` value is not one of `APP_PASSWORD`/`OAUTH2`/`NONE` (e.g. someone pasted the password into `MAIL__AUTH_TYPE`) | `MAIL__AUTH_TYPE` is a mode string, not a secret. Set it to `APP_PASSWORD` and put the actual password in `MAIL__PASSWORD` |
| Mail config changes have no effect | ENV vars are read at startup only | Restart the Next.js dev server (Ctrl+C, then `npm run dev`); for Docker restart the container |
| `503` after correct config | `nodemailer` cannot reach the host | Verify hostname / port from the same machine: `openssl s_client -connect host:587 -starttls smtp` |

---

## Security & operations

- **Never commit `.env.local`** — it contains secrets. The file is in `.gitignore`.
- **Never log credentials** — the `MailController` and `MailServiceFactory` log only the provider name and outcome, never the password or token.
- **Rotate secrets** when an employee leaves or a key is suspected of leaking. App Passwords can be revoked at https://myaccount.google.com/apppasswords.
- **Production must use HIN, hospital relay, or Office 365 OAuth2** for any traffic touching patient data — Gmail is dev-only and explicitly blocked by nDSG compliance.
- **Logs include `durationMs` and `provider`** — useful to detect throttling or routing changes.

---

## Related code

| Path | Purpose |
|---|---|
| [src/infrastructure/mail/types/MailConfig.ts](../../frontend/orderentry/src/infrastructure/mail/types/MailConfig.ts) | `MailProvider`, `MailAuthType`, valid combination matrix |
| [src/infrastructure/mail/mailEnvConfig.ts](../../frontend/orderentry/src/infrastructure/mail/mailEnvConfig.ts) | Builds `MailConfig` from ENV vars; returns `null` on invalid combos |
| [src/infrastructure/mail/MailServiceFactory.ts](../../frontend/orderentry/src/infrastructure/mail/MailServiceFactory.ts) | Singleton; returns `NullMailService` when not configured |
| [src/infrastructure/mail/NodemailerMailService.ts](../../frontend/orderentry/src/infrastructure/mail/NodemailerMailService.ts) | Concrete `nodemailer`-based implementation |
| [src/infrastructure/api/controllers/MailController.ts](../../frontend/orderentry/src/infrastructure/api/controllers/MailController.ts) | `getStatus()`, `test()` — admin endpoints |
| [src/app/api/v1/admin/mail/](../../frontend/orderentry/src/app/api/v1/admin/mail/) | Route handlers (`status`, `test`) wrapped via `apiGateway` |
| [CLAUDE.md → "Mail System"](../../CLAUDE.md) | Architecture summary in the master doc |
