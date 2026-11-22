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
- Authentication with protected `/cart`, `/checkout`, `/addresses`, `/orders` and `/orders/:id/invoice` routes and an admin-only `/admin/products` area.
- Admin product management: create, edit and delete products, including brand, SKU, warranty and specifications.
- Saved address book (`/addresses`): add, edit, delete and set a default delivery address; linked from the navbar user menu and from checkout.
- Razorpay checkout (`/checkout`): select an address, review a subtotal + 18% GST + shipping breakdown, and pay securely. The Razorpay script is injected on demand — no npm package.
- Printable invoices at `/orders/:id/invoice` with seller/customer/address details, line items, tax breakdown and a **Print / Save as PDF** button.
- Orders with latest-first listing, address snapshot, tax/shipping breakdown, admin status updates and coloured status badges (including `PAYMENT_FAILED`).
- Product ratings & reviews: average rating, star distribution, review list, submit/delete reviews, plus richer brand/SKU/warranty/specifications details.
- Toast notifications instead of blocking `alert()` dialogs.
- 404 fallback page, responsive layout for phone, tablet and desktop, and installable PWA support.

## Installing as a PWA

The production build registers `service-worker.js` and uses `manifest.json`, so the app can be installed offline-capable.

**Android (Chrome):** open the deployed HTTPS site, tap the three-dot menu, then **Install app** / **Add to Home screen**.

**PC (Chrome / Edge):** open the site, click the install icon in the address bar, or use **More tools → Install this site as an app**.

> Service workers require HTTPS (or `localhost`) and are only registered in production builds (`npm run build`). Serve the `build/` folder with a static server (for example `npx serve build`) to try the installed experience locally.

## Payments (Razorpay)

Razorpay credentials are configured on the **backend** (for example `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in the backend environment). The frontend never reads a secret and does not need `REACT_APP_RAZORPAY_KEY_ID`: the public key id is returned by `POST /payments/razorpay/order` as `keyId` and passed straight to the Razorpay checkout widget.

When the backend returns no `keyId`, or a placeholder such as `rzp_test_your...`, the checkout automatically falls back to a **simulated payment**: it waits briefly, calls the verify endpoint with dummy payment values, clears the cart and navigates to the invoice while showing a toast that no real money was charged. This keeps the whole flow demoable locally without a Razorpay account. Failed or dismissed real payments call the failure endpoint and mark the order `PAYMENT_FAILED`.

## API expectations

All endpoints are relative to `REACT_APP_API_URL`. The user is identified from the `Authorization: Bearer <token>` header, not from request bodies. The frontend uses:

- `GET/POST/PUT/DELETE /addresses[/{id}]` for the address book.
- `POST /payments/razorpay/order`, `/verify`, `/failure` for checkout.
- `GET/POST/DELETE /products/{id}/reviews[/{reviewId}]` for reviews.
- `GET /orders/{id}` for invoices, in addition to the existing order endpoints.

The checkout breakdown is an estimate: subtotal = sum of item prices × quantities, GST = 18% of subtotal, shipping = ₹40 below ₹499 (free otherwise). The backend computes the authoritative amounts and returns them in the order and Razorpay order response.
