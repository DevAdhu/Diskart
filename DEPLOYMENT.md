# Deployment checklist

This covers the configuration that must be set outside the repository. Application code and defaults are already in place.

## Railway — exact steps for this repo

The repository is a monorepo (`Backend/` + `Frontend/`), so the backend service needs its **Root Directory** set to `/Backend`.

### 1. Create the project and MySQL database

1. Sign in at <https://railway.com> and connect your GitHub account.
2. Click **New Project → Empty Project**.
3. On the project canvas click **+ New → Database → Add MySQL**. Railway creates a MySQL service automatically.
4. Open that MySQL service → **Variables** tab. You will see `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE` and `MYSQL_URL`. You will reference these from the backend service in the next step — no need to copy their values manually.

### 2. Add the backend service

1. Click **+ New → GitHub Repo → DevAdhu/Diskart**.
2. Open the new service → **Settings** → set **Root Directory** to `/Backend`. Railway auto-detects the Java/Maven project from `pom.xml`.
3. On the service's **Variables** tab, add:

| Variable | Value |
|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}` |
| `SPRING_DATASOURCE_USERNAME` | `${{MySQL.MYSQLUSER}}` |
| `SPRING_DATASOURCE_PASSWORD` | `${{MySQL.MYSQLPASSWORD}}` |
| `APP_JWT_SECRET` | Paste the generated secret from `Backend/.env.production.local` |
| `APP_SEED_ENABLED` | `false` |
| `CORS_ALLOWED_ORIGINS` | Your real Vercel domain, e.g. `https://diskart.vercel.app` |
| `SPRING_PROFILES_ACTIVE` | `prod` |

   The `${{MySQL.*}}` references are Railway's syntax for referencing another service's variables — they stay in sync automatically.

4. Go to **Settings → Networking → Generate Domain**. Copy the generated URL, e.g. `https://diskart-production.up.railway.app`.

### 3. Create an admin account (one-time)

With `prod` + `APP_SEED_ENABLED=false`, no admin exists. To create one:

1. Temporarily set `SPRING_PROFILES_ACTIVE` to `local` (or remove it) and `APP_SEED_ENABLED` to `true`.
2. Add `APP_SEED_ADMIN_EMAIL=admin@yourdomain.com` and `APP_SEED_ADMIN_PASSWORD=<strong-password>`.
3. Redeploy once — the seeder creates the admin (it skips if the email already exists).
4. Set `SPRING_PROFILES_ACTIVE=prod` and `APP_SEED_ENABLED=false` again and redeploy.

### 4. Point the Vercel frontend at Railway

1. In Vercel, open the DisKart project → **Settings → Environment Variables**.
2. Set `REACT_APP_API_URL=https://<your-railway-domain>/api`.
3. Redeploy the frontend (Vercel rebuilds automatically when the env var changes).

### 5. Verify

- Open `https://<your-railway-domain>/api/products` — you should get JSON product data.
- Open the Vercel site and confirm products load.
- Log in as the admin you seeded and check the **Admin** nav link, product management and order status controls.
- Optional: to view the Railway MySQL data in Workbench, open the MySQL service → **Settings → Networking → Public Access**, then connect using the `MYSQL_PUBLIC_URL` value.

## Generic backend notes (Spring Boot)

Deploy the `Backend/` folder as a Java 17+ / Maven service (Render, Railway, Fly.io, AWS Elastic Beanstalk, etc.).

Set these environment variables in the hosting platform:

| Variable | Value |
|---|---|
| `SPRING_DATASOURCE_URL` | Your production MySQL JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | Production DB user |
| `SPRING_DATASOURCE_PASSWORD` | Production DB password |
| `APP_JWT_SECRET` | A fresh random secret, 32+ characters |
| `APP_SEED_ENABLED` | `false` |
| `CORS_ALLOWED_ORIGINS` | `https://diskart.vercel.app` (plus any other frontend domains, comma-separated) |
| `PORT` | The port your platform injects (defaults to 8080) |

Generate a JWT secret with:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

A ready-to-copy local reference (including a generated secret) is in `Backend/.env.production.local`. **It is gitignored.** Never paste real credentials into a tracked file.

The dev admin seeder is automatically disabled under the `prod` Spring profile and is additionally gated by `APP_SEED_ENABLED=false`.

Build command: `./mvnw clean package -DskipTests`
Start command: `java -jar target/ecomerce-0.0.1-SNAPSHOT.jar`

## 2. Frontend (React PWA)

The `Frontend/` folder is already configured for Vercel-style static hosting.

| Variable | Value |
|---|---|
| `REACT_APP_API_URL` | `https://<your-backend-host>/api` |

Build command: `npm run build`
Output directory: `build`

`npm run build` also produces the service worker and manifest, so the deployed app remains installable on Android and desktop.

## 3. After deployment

1. Confirm the frontend loads products from the deployed API (check the browser Network tab).
2. Log in with a real admin account and verify the **Admin** nav link, product management and order status controls appear.
3. In Chrome on Android, open the site and use **Menu → Install app / Add to Home screen** to install the PWA.
4. Point the resume's project links at `https://github.com/DevAdhu/Diskart` and the live demo URL.

## 4. Git

Configuration, secrets and deployment settings are intentionally kept out of commits. Only source and documentation changes are committed.
