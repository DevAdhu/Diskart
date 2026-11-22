# Deployment checklist

This covers the configuration that must be set outside the repository. Application code and defaults are already in place.

## 1. Backend (Spring Boot)

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
