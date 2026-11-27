# CHI FOREST GO — Campus Smart Vending (Softr App)

> A campus smart vending machine web app built with **Softr + Vibe Coding**: product discovery, AI recommendations, coupon campaigns, QR / member-account payment, order pickup and appeals, and an admin console for users, orders and stock.

---

## Live Demo

| Item | Value |
|---|---|
| **Softr app (primary access)** | https://larae79836.softr.app/ |
| **Test account** | `2051182778@qq.com` |
| **Password** | `Ddz_331415@ddz` |

> The test account is the application **administrator**, so it can open every screen — including the Admin Console (`/admin`).
> To review the standard (non-administrator) experience, sign up with any email address; new accounts are regular users by default.

---

## Repository Overview

This repository is the **source export** of the Softr application — not a standalone deployable codebase.
Softr hosts the pages, navigation, permissions, authentication and database; this repository contains:

- The complete source of every **Vibe Coding block** (React + TypeScript + Tailwind)
- Page, navigation and permission documentation
- The database schema (tables, fields, relations)
- This README with feature mapping, navigation and known limitations

```
softr-genki-forest/
├── README.md
├── blocks/
│   ├── README.md                      # block ↔ page mapping and platform dependencies
│   ├── home/shop-drinks.tsx           # product discovery, cart, AI picks, brand landing
│   ├── home/admin-entry.tsx           # admin-only entry bar (email whitelist)
│   ├── checkout/checkout.tsx          # checkout, coupons, QR member payment, order writes
│   ├── orders/my-orders.tsx           # order list, confirm pickup, order appeals
│   ├── admin/admin-console.tsx        # users / orders / stock management
│   ├── stock-search/stock-search.tsx  # stock search across cabinets
│   ├── events/events.tsx              # campaigns and coupon claiming
│   ├── product-stock/product-stock.tsx# per-product cabinet availability
│   ├── support/ai-support.tsx         # FAQ-based support assistant
│   └── shared/language-toggle.tsx     # global Chinese / English switch
└── docs/
    ├── pages.md                       # 14 business pages + system pages
    ├── navigation.md                  # 2 navigations, items and visibility
    ├── database-schema.md             # 9 tables, fields and relations
    └── access-instructions.md         # copy-paste access text for submission
```

> Softr runtime modules (`@/lib/datasource`, `@/lib/user`, `@/lib/editable-settings`, `@/components/ui/*`) are provided by the Softr platform and are intentionally **not** included here.

---

## Tech Stack

| Layer | Technology |
|---|---|
| App platform | Softr (classic app, no-code / AI-native) |
| Custom UI | Vibe Coding blocks — React, TypeScript, Tailwind CSS |
| Data | Softr Databases (9 tables) |
| Icons | `lucide-react` |
| QR code | `qrcode.react` |
| Notifications | `sonner` |
| Auth | Softr email + password |

---

## Core Features

### 1. Product discovery, AI picks and cart checkout

- Product grid with categories, search, stock hints and quantity controls.
- Cart persisted in `localStorage`; checkout summary with coupon support.
- “AI picks for you”: per-user recommendation cards generated from purchase history and the current time.
- Checkout supports demo WeChat / Alipay, coupon redemption, order creation and a success screen.

**Where:** `/` (Home) → `/checkout` (Checkout)

### 2. Real-time stock search across cabinets

- Search by product name or cabinet code, filter by category, sorted by distance.
- Per-product cabinet availability page showing slot-level stock.
- Cabinet list with location, area, distance and opening hours.

**Where:** `/stock-pro` (Stock Search) → `/product-stock` (Product Stock) → `/cabinets` (Cabinets)

### 3. Order lifecycle, appeals and admin operations

- “My Orders” lists only the signed-in user’s orders, newest first.
- Pending orders can be confirmed as picked up.
- Every order supports an **appeal** (status + note), including automatically created exception orders when a payment fails before any order is written.
- Admin Console manages users, order statuses and stock records; access is restricted to the administrator email.

**Where:** `/orders` (My Orders) → `/admin` (Admin Console)

### Feature → screen mapping (quick reference)

| # | Core feature | Primary screens | Key actions |
|---|---|---|---|
| 1 | Product discovery & checkout | `/`, `/checkout`, `/events` | Browse, search, add to cart, claim coupon, pay (demo), create order |
| 2 | Stock search | `/stock-pro`, `/product-stock`, `/cabinets` | Search product/cabinet, filter, view slot stock |
| 3 | Orders, appeals & admin | `/orders`, `/admin` | Confirm pickup, submit/edit appeal, manage users/orders/stock |

---

## App Navigation / Screens

The main navigation (top bar on desktop, bottom bar on mobile) exposes four items to signed-in users: Home, Stock Search, Events, My Orders. Additional screens are reachable from cards, links and the admin entry bar.

| # | Screen | Path | Purpose |
|---|---|---|---|
| 1 | Home | `/` | Product grid, cart, AI picks; public brand landing when signed out |
| 2 | Products | `/products` | Full product list |
| 3 | Cabinets | `/cabinets` | Cabinet list with area / distance / hours |
| 4 | Cabinet detail | `/cabinet` | Single cabinet detail |
| 5 | Stock Search | `/stock-pro` | Search stock by product or cabinet, nearest first |
| 6 | Stock Search (map) | `/stock` | Map + list view of stock |
| 7 | Product Stock | `/product-stock` | Slot-level availability for one product |
| 8 | Events | `/events` | Campaigns and coupon claiming |
| 9 | My Orders | `/orders` | User orders, pickup confirmation, appeals |
| 10 | Checkout | `/checkout` | Cart summary, coupons, demo payment, QR member payment |
| 11 | Admin Console | `/admin` | Users / orders / stock management (administrator only) |
| 12 | AI Support | `/support` | FAQ-based support assistant |
| 13 | Account | `/account` | Softr account settings |

**Suggested walkthrough for assessors (5+ screens):**
`/` → add items to cart → `/checkout` → pay (demo) → `/orders` → confirm pickup → open appeal → `/admin` (administrator) → `/stock-pro` → `/events`.

---

## How to Use for Assessors

1. Open **https://larae79836.softr.app/** in a normal or incognito window.
2. Sign in with the test account above (email + password).
3. **Browse & shop:** on Home, use search/category filters, add 2–3 items to the cart, open the cart bar and proceed to checkout.
4. **Checkout:** optionally select a claimed coupon, choose WeChat/Alipay (demo), press “Demo pay”. A success screen shows the pickup code and order count.
5. **Orders & appeal:** open “My Orders”, find the new order, press “Confirm pickup”, then use “Order appeal” to submit or edit an appeal note.
6. **Stock:** open “Stock Search”, search for a product (e.g. “白桃”) or a cabinet code; open a product to see slot-level stock.
7. **Events:** open “Events”, claim an available coupon, then return to checkout and apply it.
8. **Admin:** the test account sees a green “Admin” bar on Home / Stock Search / Events / My Orders; open “Admin Console” to review users, orders and stock.
9. **Language:** use the 中文 / EN switch (top-right) to toggle the whole app between Chinese and English.
10. **Tablet behaviour (optional):** open the app on a tablet-sized viewport. The navigation shows only “Home”, and the checkout page presents a **“Pay via member account” QR code** instead of the signed-in payment form.

---

## Known Limitations

- **Low-code platform constraints.** This is a Softr classic app; the repository is a source export, not a runnable standalone project. Pages, auth and data access are enforced by Softr.
- **No custom user groups on the current plan.** Softr’s Free plan does not include custom user groups, so the administrator is identified by a hard-coded email whitelist (`ADMIN_EMAIL`) instead of a role group. New sign-ups are always regular users.
- **Tablet login button cannot be hidden.** Softr navigation item device visibility makes tablets follow the desktop setting, so the Login / Sign up buttons remain visible on tablet even though the tablet flow is guest-only.
- **Payments are simulated.** No real merchant account or server callback is connected; “Demo pay” writes orders only and never charges money.
- **Member payment QR is configurable.** Until a real member-app payment URL is configured, the QR code points to the checkout page itself; the page displays a notice in that state.
- **AI recommendations depend on an external worker.** The app writes anonymised purchase summaries to the `AI推荐请求` table; a separate backend calls DeepSeek and writes results back. If that worker is not running, requests remain “pending”. Softr-side AI was not used because the current plan does not include the required workflow/AI capacity.
- **AI Support is FAQ-based.** `/support` performs keyword matching over 40 FAQ records; it is not an LLM chat.
- **Demo data only.** All products, cabinets, orders and users are test data; no real customer data is included in this repository.

---

## Security Notes

- This repository contains **no API keys, tokens or credentials**.
- The test account above is provided solely for assessment. Please do not redistribute it.
- If the repository is made public, the test password should be rotated after Demo Day.

---

## Team / Contact

| Role | Name | Contact |
|---|---|---|
| Team / Author | _TBD_ | _TBD_ |

> Replace this table with the final team names and contact details before submission.
