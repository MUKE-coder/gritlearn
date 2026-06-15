# Deploying JEditor to Dokploy

This guide walks through a clean production install on **jbeditor.com** using
[Dokploy](https://dokploy.com). It assumes:

- A VPS with Dokploy already installed and accessible.
- DNS for `jbeditor.com` managed somewhere you can add A records.
- The git repo connected to Dokploy via your Git provider.

The populated env values you'll paste into each service live in
`.env.production` at the repo root (gitignored — read it locally).

---

## 1. DNS records

Point all four hostnames at your Dokploy server's public IP:

| Type | Host             | Value          |
| ---- | ---------------- | -------------- |
| A    | `@`              | <server IP>    |
| A    | `www`            | <server IP>    |
| A    | `api`            | <server IP>    |
| A    | `admin`          | <server IP>    |
| A    | `downloads`      | <server IP>    |

`downloads.jbeditor.com` is for the desktop binaries served by MinIO (or R2 if
you switch later). It can wait until B12 — the marketing page links work but
return 404 until you upload the first release.

---

## 2. Service plan

Create these inside a single Dokploy **Project** (call it `jeditor`). Order
matters — databases first so the app services can resolve them.

| # | Service | Type | Source | Public domain |
| - | ------- | ---- | ------ | ------------- |
| 1 | `postgres` | Database → Postgres | Dokploy preset | (internal only) |
| 2 | `redis`    | Database → Redis    | Dokploy preset | (internal only) |
| 3 | `minio`    | Application → Docker image (`minio/minio`) | image | (internal only — see step 6) |
| 4 | `api`      | Application → Dockerfile build | this repo, `apps/api/Dockerfile` | `api.jbeditor.com` |
| 5 | `web`      | Application → Dockerfile build | this repo, `apps/web/Dockerfile` (context: repo root) | `jbeditor.com` + `www.jbeditor.com` |
| 6 | `admin`    | Application → Dockerfile build | this repo, `apps/admin/Dockerfile` (context: repo root) | `admin.jbeditor.com` |

All six services live on Dokploy's internal Docker network. The api can reach
`postgres:5432`, `redis:6379`, `minio:9000` by service name — no env tweaks
required.

---

## 3. Database services (steps 1–2)

### Postgres
- Name: `postgres`
- User: `jeditor`
- Password: copy `POSTGRES_PASSWORD` from `.env.production`
- Database: `jeditor`

Dokploy will auto-create the volume and expose it on the internal network as
`postgres:5432`.

### Redis
- Name: `redis`
- Leave the defaults. Internal hostname will be `redis:6379`.

---

## 4. MinIO (step 3) — self-hosted file storage

Create an **Application** of type **Docker image**:

- Image: `minio/minio:latest`
- Command: `server /data --console-address ":9001"`
- Environment:
  ```
  MINIO_ROOT_USER=<MINIO_ACCESS_KEY from .env.production>
  MINIO_ROOT_PASSWORD=<MINIO_SECRET_KEY from .env.production>
  ```
- Volume: `/data` (Dokploy will provision)
- Public domain: leave empty for now (only the api needs to reach it,
  internally at `minio:9000`).

After it's up, port-forward locally to the console (`9001`) once and create
the `jeditor-uploads` bucket. Then forget about it.

> Prefer **Cloudflare R2** for production? Skip this service entirely.
> Change `STORAGE_DRIVER=r2` in `.env.production` and fill in the `R2_*`
> block instead. Migration later is a one-bucket copy.

---

## 5. API service (step 4)

- Source: this Git repo.
- Build path: `apps/api/Dockerfile`.
- Public domain: `api.jbeditor.com`. Dokploy auto-provisions Let's Encrypt.
- Internal port: `8080`.
- Environment: paste the entire contents of `.env.production` into the
  service's Environment panel. (Dokploy ignores the `# comments` and blank
  lines.)

After the first deploy:

1. Hit `https://api.jbeditor.com/health` → expect `{"status":"ok"}`.
2. Hit `https://api.jbeditor.com/pulse/ui/` and log in with the Pulse creds.
3. Hit `https://api.jbeditor.com/sentinel/ui` and log in with the Sentinel
   creds — confirm WAF rules are loaded.

---

## 6. Web + Admin services (steps 5–6)

Both Next.js services build the **same way**:

- Source: this Git repo.
- Build path: `apps/web/Dockerfile` (or `apps/admin/Dockerfile`).
- **Build context: repo root** (the Dockerfile pulls from the monorepo).
- **Build args** (Dokploy → Build → Build Args):
  ```
  NEXT_PUBLIC_API_URL=https://api.jbeditor.com
  ```
  This is critical — Next.js inlines `NEXT_PUBLIC_*` vars at build time, so
  setting them as runtime env vars later does **nothing**.
- Public domain:
  - `web`   → `jbeditor.com` AND `www.jbeditor.com` (add both; Dokploy lets
    you redirect www → apex)
  - `admin` → `admin.jbeditor.com`
- Internal port: `3000`.

The contents of `apps/web/.env.production` and `apps/admin/.env.production`
are your source of truth — copy the `NEXT_PUBLIC_*` values from there.

---

## 7. Email — Resend

The placeholder `RESEND_API_KEY=re_REPLACE_ME_WITH_YOUR_RESEND_API_KEY` in
`.env.production` must be replaced before sign-up emails will go out.

1. Create an account at [resend.com](https://resend.com).
2. **Domains → Add Domain → `jbeditor.com`**.
3. Add the DNS records Resend gives you (SPF + DKIM, three records total).
4. **API Keys → Create**. Scope: `Sending access`. Domain: `jbeditor.com`.
5. Paste the key into the api service's `RESEND_API_KEY` env var and
   redeploy.

Test from the api host: visit `/auth/register` on the web app and complete
sign-up — the verification email should land in your inbox within seconds.

> If Resend isn't available in your region, swap to SMTP by setting
> `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`. The mailer auto-detects
> SMTP when those four are populated.

---

## 8. Smoke test checklist

After all six services are green in Dokploy:

- [ ] `https://api.jbeditor.com/health` returns 200
- [ ] `https://jbeditor.com` renders the landing page
- [ ] `https://admin.jbeditor.com` redirects to `/login`
- [ ] Sign up at `https://jbeditor.com/register` — receive verification email
- [ ] Verify, log in, hit the dashboard
- [ ] Pulse dashboard loads at `/pulse/ui/`
- [ ] Sentinel dashboard loads at `/sentinel/ui`

If all six pass, the platform is live. Bookmark Pulse and Sentinel — they're
your first line of insight when something looks off.

---

## 9. Updates

Dokploy can auto-deploy on every push to `main`. Turn that on once you trust
the smoke tests. Until then, hit **Deploy** manually after each merge.

The desktop app updates are independent of this stack — they ship through the
embedded MDX bundle on the next desktop release (B12).
