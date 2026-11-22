# DisKart Frontend

React 19 + react-router-dom 7 e-commerce frontend for DisKart. The backend is a Spring Boot REST API; JWT auth tokens are stored in `localStorage`.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and point it at your backend:

   ```bash
   cp .env.example .env
   ```

   `REACT_APP_API_URL` defaults to `http://localhost:8080/api` when not set. Restart the dev server after editing `.env`.

3. Start the app:

   ```bash
   npm start
   ```

   Open http://localhost:3000.

## Scripts

| Script | Description |
| --- | --- |
| `npm start` | Run the dev server with hot reload. |
| `npm run build` | Create an optimized production build in `build/`. |
| `npm test` | Run tests in watch mode. |

## Features

- Product catalogue with search, category filter, sorting (name/price) and pagination.
- Product detail page with image gallery and quantity picker.
- Shared cart context (`CartContext`) so the cart stays in sync across pages; persisted to `localStorage`.
- Authentication with protected `/cart` and `/orders` routes and an admin-only `/admin/products` area.
- Admin product management: create, edit and delete products.
- Orders with latest-first listing and admin status updates; customers see coloured status badges.
- Toast notifications instead of blocking `alert()` dialogs.
- 404 fallback page and responsive layout for phone, tablet and desktop.

## Installing as a PWA

The production build registers `service-worker.js` and uses `manifest.json`, so the app can be installed offline-capable.

**Android (Chrome):** open the deployed HTTPS site, tap the three-dot menu, then **Install app** / **Add to Home screen**.

**PC (Chrome / Edge):** open the site, click the install icon in the address bar, or use **More tools → Install this site as an app**.

> Service workers require HTTPS (or `localhost`) and are only registered in production builds (`npm run build`). Serve the `build/` folder with a static server (for example `npx serve build`) to try the installed experience locally.

## API expectations

All endpoints are relative to `REACT_APP_API_URL`. The user is identified from the `Authorization: Bearer <token>` header, not from request bodies. See the report from the frontend integration for the full endpoint contract.
