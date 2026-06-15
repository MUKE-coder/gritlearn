# Deploying JEditor to Dokploy

This guide walks through a production install on **jbeditor.com** using
[Dokploy](https://dokploy.com) **Docker Compose** mode. The whole stack —
api, web, admin, postgres, redis, minio — boots from one file
(`docker-compose.prod.yml`) and one env file (`.env.production`).

Assumes:

- A VPS with Dokploy installed and reachable.
- DNS for `jbeditor.com` managed somewhere you can add A records.
- The git repo connected to Dokploy via your Git provider.

The populated env values live in `.env.production` at the repo root
(gitignored — read it locally and paste once into Dokploy).

---

## 1. DNS records

Point all five hostnames at your Dokploy server's public IP:

| Type | Host        | Value       |
| ---- | ----------- | ----------- |
| A    | `@`         | <server IP> |
| A    | `www`       | <server IP> |
| A    | `api`       | <server IP> |
| A    | `admin`     | <server IP> |
| A    | `downloads` | <server IP> |

`downloads.jbeditor.com` is for the desktop binaries (MinIO or R2 later).
It can wait until B12 — the marketing page links return 404 until you upload
the first release.

---

## 2. Create the Dokploy compose service

1. **New Project** → name it `jeditor`.
2. **+ Create Service → Compose**.
3. **Source → Git**: paste your repo URL + branch (`main`).
4. **Compose file**: `docker-compose.prod.yml`.
5. **Save** — don't deploy yet, the env still needs to land.

---

## 3. Paste the env file

In the compose service's **Environment** tab:

- Open `.env.production` locally.
- Replace `RESEND_API_KEY=re_REPLACE_ME_WITH_YOUR_RESEND_API_KEY` with the
  real key (see **§6 Email — Resend** below).
- Copy the entire file. Paste into Dokploy's Environment textarea.

Dokploy writes that to a `.env` file alongside `docker-compose.prod.yml`
before each build, so:

- `env_file: .env` lines in the compose file pick it up for the api,
  postgres, and minio containers.
- `${API_URL}` substitution in the web and admin **build args** picks it
  up at image-build time — this is how `NEXT_PUBLIC_API_URL` gets inlined
  into the Next.js bundles.

That's it for env config. One file. No per-service panels.

---

## 4. Public domains

In Dokploy, under the compose service → **Domains**, map hostnames to the
exposed container ports:

| Container | Container port | Domain                                  |
| --------- | -------------- | --------------------------------------- |
| `api`     | `8080`         | `api.jbeditor.com`                      |
| `web`     | `3000`         | `jbeditor.com` AND `www.jbeditor.com`   |
| `admin`   | `3000`         | `admin.jbeditor.com`                    |

Dokploy auto-provisions Let's Encrypt for each. The `postgres`, `redis`,
and `minio` containers stay internal — they only `expose:` (not `ports:`)
in the compose file, so they're reachable only inside the Docker network.

---

## 5. Deploy

Hit **Deploy**. First build takes ~5–8 minutes (Go compile + two Next.js
builds + pulling postgres/redis/minio images).

After it's green:

1. `https://api.jbeditor.com/health` → `{"status":"ok"}`
2. `https://api.jbeditor.com/pulse/ui/` → log in with the Pulse creds from
   `.env.production`.
3. `https://api.jbeditor.com/sentinel/ui` → log in with the Sentinel creds.

---

## 6. Email — Resend

The placeholder `RESEND_API_KEY=re_REPLACE_ME_WITH_YOUR_RESEND_API_KEY` in
`.env.production` must be replaced before sign-up emails will go out.

1. Create an account at [resend.com](https://resend.com).
2. **Domains → Add Domain → `jbeditor.com`**.
3. Add the DNS records Resend gives you (SPF + DKIM, three records).
4. **API Keys → Create**. Scope: `Sending access`. Domain: `jbeditor.com`.
5. Paste the key into your local `.env.production`.
6. In Dokploy, update the same key in the Environment tab and redeploy.

Test from the web app: visit `/auth/register`, complete sign-up — the
verification email should land in your inbox within seconds.

> No Resend in your region? Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
> `SMTP_PASS` instead. The mailer auto-detects SMTP when those four are
> populated and ignores `RESEND_API_KEY`.

---

## 7. MinIO bucket bootstrap

The compose stack ships a MinIO container, but the upload bucket has to
exist before the api can write to it.

After the first deploy:

1. From your laptop, port-forward the MinIO console once:
   ```bash
   ssh -L 9001:localhost:9001 user@your-dokploy-host
   ```
   then open `http://localhost:9001`.
2. Log in with `MINIO_ACCESS_KEY` / `MINIO_SECRET_KEY` from
   `.env.production`.
3. Create a bucket named `jeditor-uploads` (matches `MINIO_BUCKET`).
4. Close the tunnel. You won't need it again until you rotate keys.

> Prefer **Cloudflare R2**? Skip the MinIO container entirely:
> in `.env.production` set `STORAGE_DRIVER=r2` and fill in the `R2_*`
> block. Then drop the `minio` service from `docker-compose.prod.yml`.

---

## 8. Smoke test checklist

After all six containers are green:

- [ ] `https://api.jbeditor.com/health` returns 200
- [ ] `https://jbeditor.com` renders the landing page
- [ ] `https://www.jbeditor.com` redirects to apex
- [ ] `https://admin.jbeditor.com` redirects to `/login`
- [ ] Sign up at `https://jbeditor.com/register` — receive verification email
- [ ] Verify, log in, hit the dashboard
- [ ] Pulse dashboard loads at `/pulse/ui/`
- [ ] Sentinel dashboard loads at `/sentinel/ui`

If all eight pass, the platform is live.

---

## 9. Updates

Dokploy can auto-deploy on every push to `main`. Turn that on once you
trust the smoke tests. Until then, hit **Deploy** manually after each
merge.

Env changes (rotating Resend key, swapping storage driver) are an
edit-paste-redeploy cycle in the same Environment tab. Keep your local
`.env.production` as the canonical copy — Dokploy's textarea is the
mirror, not the source of truth.

The desktop app updates are independent of this stack — they ship through
the embedded MDX bundle on the next desktop release (B12).
