# Nice To Meet You

A personal landing page creator for real-world social discovery. Print a QR code on a tote bag, business card, or hat — it links to your page.

## Local Development

### Prerequisites

- Node.js 20+
- Docker Engine running in WSL2 Ubuntu

> **Windows note**: Docker runs inside WSL2. Open Ubuntu and run `sudo service docker start` — keep that window open while developing (closing it stops the Docker daemon). All other commands run normally in PowerShell.

### First-time setup

All commands run in PowerShell from the project root, except the Docker daemon start.

```bash
# 1. Open Ubuntu and start the Docker daemon (keep the window open)
sudo service docker start

# 2. Back in PowerShell — start backing services
wsl -e docker compose up -d

# 3. Install dependencies
npm install

# 4. Set up local environment
cp .env.local .env

# 5. Run database migrations (.env provides DATABASE_URL)
npm run db:migrate

# 6. Create the MinIO storage bucket and allow unauthenticated reads
wsl -e docker compose exec minio mc mb local/nicetomeetyou
wsl -e docker compose exec minio mc anonymous set download local/nicetomeetyou
```

### Daily startup

```bash
# In Ubuntu: start the Docker daemon (keep the window open)
sudo service docker start

# In PowerShell: start backing services and the app
wsl -e docker compose up -d
npm run dev
```

App runs at **http://localhost:3000**

### Local services

| Service | URL | Purpose |
|---|---|---|
| App | http://localhost:3000 | Nuxt dev server |
| Mailpit | http://localhost:8025 | Inspect outgoing emails |
| MinIO console | http://localhost:9001 | Browse file storage (minioadmin / minioadmin) |
| Postgres | localhost:5432 | Database (postgres / postgres) |

### Useful commands

```bash
npm test              # Run test suite
npm run db:generate   # Generate Drizzle migration from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:studio     # Open Drizzle Studio (database browser)
```

## Deployment (Fly.io)

After running `fly launch`, set production secrets:

```bash
fly secrets set DATABASE_URL="..."
fly secrets set BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
fly secrets set S3_ENDPOINT="https://<account-id>.r2.cloudflarestorage.com"
fly secrets set S3_ACCESS_KEY="..."
fly secrets set S3_SECRET_KEY="..."
fly secrets set S3_BUCKET="nicetomeetyou"
fly secrets set S3_PUBLIC_URL="https://your-r2-public-url"
fly secrets set RESEND_API_KEY="re_..."
fly secrets set NUXT_PUBLIC_APP_URL="https://your-app.fly.dev"
```
