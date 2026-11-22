# DisKart

A full-stack e-commerce application built with **Spring Boot 3.5 (Java 17)** and **React 19**. It supports a customer shopping flow (browse, search, filter, cart, place orders, track orders) and an admin flow (manage products and update order statuses). The frontend is a responsive **PWA**, so it runs in a browser on PC and can be installed as an app on Android.

For cloud deployment, see [DEPLOYMENT.md](DEPLOYMENT.md) — it includes exact Railway + Vercel steps for this monorepo.

## Repository layout

```
Diskart/
├── Backend/    Spring Boot REST API (Maven, JPA/Hibernate, MySQL, Spring Security + JWT)
└── Frontend/   React 19 SPA (Create React App, axios, react-router-dom 7, react-icons)
```

## Features

- Product catalogue with search, category filtering, pagination and sorting
- Product detail page with image gallery and quantity selection
- Client-side cart shared across all pages via React context
- JWT authentication with BCrypt password hashing
- Role-based access control: `CUSTOMER` and `ADMIN`
- Order placement with stock validation and transactional updates
- Order history and status tracking
- Admin product management console (create / edit / delete)
- Responsive PWA installable on Android and desktop

## Running locally

### Prerequisites
- JDK 17 or newer (JDK 21 works)
- Node.js 18+ and npm
- MySQL 8 (or use the H2 test profile for the backend tests)

### 1. Backend

```powershell
cd Backend
.\mvnw.cmd spring-boot:run
```

Configuration is read from environment variables (defaults are for local development only):

| Variable | Default | Purpose |
|---|---|---|
| `SPRING_DATASOURCE_URL` | `jdbc:mysql://localhost:3306/ecommerce_db?createDatabaseIfNotExist=true` | JDBC URL |
| `SPRING_DATASOURCE_USERNAME` | `advancejava` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `root` | DB password |
| `APP_JWT_SECRET` | dev-only value | HS256 signing key — **set a 32+ character secret in production** |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,https://diskart.vercel.app` | Comma-separated allowed origins — override if you deploy to other domains |
| `PORT` | `8080` | Server port |

The API is served at `http://localhost:8080/api`. A dev-only seeder creates an admin account on startup if one does not exist (see `application.properties` for the configurable email/password). **Do not enable the seeder in production.**

Run the tests with:

```powershell
.\mvnw.cmd test
```

Tests use an in-memory H2 database, so no MySQL instance is needed for them.

### 2. Frontend

```powershell
cd Frontend
npm install
copy .env.example .env
npm start
```

`REACT_APP_API_URL` must point at the backend base path, e.g. `http://localhost:8080/api`.

Production build:

```powershell
npm run build
```

## Using it on Android and PC

- **PC:** open the deployed site (or `http://localhost:3000` locally) in any modern browser.
- **Android:** open the site in Chrome, then use **Menu → Install app / Add to Home screen**. The service worker caches the app shell so it opens offline, and the app runs full-screen without browser chrome.
- The layout adapts from desktop widths down to ~360px phones.

## Security notes

- Passwords are stored as BCrypt hashes; plain passwords are never returned by the API.
- The authenticated user is resolved from the JWT on every request — user IDs are **not** trusted from request parameters.
- Customers can only read and place their own orders. Admin-only endpoints are protected by method security.
- CORS is restricted to an explicit allowlist; credentials are never combined with wildcard origins.
- JWT secret and database credentials should always be supplied via environment variables in any deployed environment.

## Known limitations / next steps

- No payment gateway integration; orders are recorded but not charged.
- No email notifications on order status changes.
- Product images are referenced by URL rather than uploaded to object storage.
- A native Android APK would require wrapping the PWA (e.g. Capacitor/Trusted Web Activity); the current PWA install flow needs no app store.
