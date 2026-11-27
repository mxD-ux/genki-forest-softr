# App Access Instructions (copy-paste)

Use the blocks below in **Component 3 → App access instructions** and in the **Digital Prototype Report → access instructions for assessors**. Keep them identical so the submission is consistent.

---

## A. Short version (for forms with limited space)

```
Primary access (runnable app):
https://larae79836.softr.app/

Test account:
Email: 2051182778@qq.com
Password: Ddz_331415@ddz

Code evidence (repository):
https://github.com/mxD-ux/genki-forest-softr

README (project structure, features, access, limitations):
https://github.com/mxD-ux/genki-forest-softr#readme

Note: the Softr link is the primary runnable entry point. The GitHub repository is supporting code evidence only and does not replace the live app or the live Demo Day demonstration.
```

---

## B. Full version (Component 3 / report)

### 1. Primary access — runnable application

- **URL:** https://larae79836.softr.app/
- **Test account:** `2051182778@qq.com`
- **Password:** `Ddz_331415@ddz`
- **Account type:** administrator (full access, including the Admin Console)

> To review the standard non-administrator experience, sign up with any email address. New accounts are regular users by default.

### 2. Code evidence — repository

- **GitHub repository:** https://github.com/mxD-ux/genki-forest-softr
- The repository contains the complete source of all Vibe Coding blocks (React + TypeScript + Tailwind), plus page/navigation/database documentation.
- It is **supporting evidence**, not a replacement for the live app: the project runs on Softr, so the blocks cannot be executed standalone.

### 3. README

- **README:** https://github.com/mxD-ux/genki-forest-softr#readme
- Covers: project overview, repository structure, tech stack, core features, feature-to-screen mapping, navigation, assessor walkthrough, known limitations, contact.

### 4. Core features and where to find them

| # | Core feature | Screens | What to do |
|---|---|---|---|
| 1 | Product discovery, AI picks, cart & checkout | `/` → `/checkout` → `/events` | Browse/search products, add to cart, claim a coupon, run demo payment, receive pickup code |
| 2 | Real-time stock search across cabinets | `/stock-pro` → `/product-stock` → `/cabinets` | Search by product or cabinet, filter by category, inspect slot-level stock |
| 3 | Orders, appeals and admin operations | `/orders` → `/admin` | Confirm pickup, submit/edit an order appeal, manage users/orders/stock as administrator |

### 5. Navigation — 5+ screens

Main navigation (signed-in): **Home**, **Stock Search**, **Events**, **My Orders**.

| Screen | Path |
|---|---|
| Home | `/` |
| Products | `/products` |
| Cabinets | `/cabinets` |
| Stock Search | `/stock-pro` |
| Product Stock | `/product-stock` |
| Events | `/events` |
| My Orders | `/orders` |
| Checkout | `/checkout` |
| Admin Console | `/admin` |
| AI Support | `/support` |

Suggested 5-screen walkthrough:
`/` → `/checkout` → `/orders` → `/admin` → `/stock-pro` → `/events`.

### 6. Known limitations

- Softr classic app: the repository is a source export, not a standalone runnable codebase.
- Free plan: no custom user groups; the administrator is a hard-coded email whitelist, and new sign-ups are regular users.
- Tablet: navigation item device visibility follows desktop, so the Login / Sign up buttons remain visible; tablet is otherwise a guest-only flow with a QR member-payment screen at checkout.
- Payments are simulated (demo): no merchant account, no real charge.
- Member-payment QR points to the checkout page until a real member-app URL is configured.
- AI recommendations depend on an external worker calling DeepSeek; if it is not running, requests stay “pending”. Softr-side AI is not used on the current plan.
- AI Support (`/support`) is keyword matching over FAQ records, not an LLM chat.
- All data is demo/test data.

### 7. Pre-submission verification checklist

- [ ] Open the Softr link in an **incognito** window — it loads without an existing session.
- [ ] Sign in with the test account — login succeeds and Home renders.
- [ ] Open at least 5 screens from the navigation / links.
- [ ] Complete a demo payment — an order appears in My Orders.
- [ ] Submit an order appeal — status shows “Appeal: In progress”.
- [ ] Open the GitHub repository in an **incognito** window — it is accessible without an account (public, or assessors invited).
- [ ] README renders on the repository landing page (not only inside a code file).
- [ ] Confirm no API keys, tokens or real customer data are present in the repository.

---

## C. Repository visibility note

The brief requires assessors to be able to open the code evidence. Either:

- make the repository **public**, or
- keep it private and ensure the **module team / assessors are invited** as collaborators.

If the repository is private and access is not granted, it may be treated as inaccessible.
