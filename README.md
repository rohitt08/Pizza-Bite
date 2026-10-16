# 🍕 Pizza Bite — QR Ordering System & Staff POS Dashboard

A modern, mobile-first QR-based food ordering web application and staff order management dashboard for **Pizza Bite**, a fast-food stall.

- **Brand:** Pizza Bite
- **Instagram:** [@thepizzabitee](https://instagram.com/thepizzabitee)
- **Currency:** INR (₹)
- **Timezone:** Asia/Kolkata (IST)
- **Architecture:** React frontend with Supabase PostgreSQL and Realtime for cross-device order sync; local storage is only a same-browser fallback.

---

## 🌟 Key Features

### 1. Customer Ordering Interface (`/`)
Mobile-first layout optimized for customers scanning a QR code at the food stall:

- **Step 1: Customer Details**
  - Name and 10-digit Indian mobile number input with real-time inline validation (`^[6-9]\d{9}$`).
  - No password, email, or mandatory OTP required.
  - Automatically preserved across navigation so returning customers aren't prompted again.
- **Step 2: Stall Menu**
  - Instant category filtering: `All`, `Pizza`, `Burgers`, `Sandwiches`, `Fries`, `Beverages`.
  - Live search input matching product names and descriptions.
  - Compact product cards with appetizing imagery, veg indicator, ₹ pricing, and availability states.
  - Tactile quantity stepper (`-` / `+`) that activates once added.
- **Step 3: Persistent Cart**
  - Sticky bottom cart bar showing total items count and ₹ total.
  - Slide-up cart drawer supporting real-time quantity adjustments, item removals, and zero floating-point arithmetic errors (using integer paise arithmetic).
- **Step 4: Order Review & Placement**
  - Complete itemized breakdown with unit rates, quantities, and line totals.
  - Single prominent button: **`PLACE ORDER · ₹TOTAL`**.
  - Double-click prevention and realistic kitchen-sending loading state.
- **Step 5: Printable Receipt**
  - Clean confirmation with Pickup Token Number (e.g. `PB-1042`), unique Bill ID (`PB-YYYYMMDD-XXXX`), customer details, IST timestamp, and status badge.
  - Dedicated `@media print` style sheet: Clicking **Print Receipt** prints only the clean thermal-style bill without web headers or buttons.

---

### 2. Staff POS Dashboard (`/admin`)
Desktop- and tablet-friendly order management dashboard for stall staff with responsive mobile support:

- **Header Controls**
  - Live Orders pulsating indicator.
  - Real-time ticking clock in Indian Standard Time (`HH:mm:ss · Asia/Kolkata`).
  - Sound alert mute/unmute toggle (synthesizes audio chimes via Web Audio API, no external audio files required).
  - Quick switcher to Customer Menu for testing.
- **Dynamic Summary Counters**
  - **New Orders** (Amber)
  - **Accepted Orders** (Blue)
  - **Completed Today** (Green)
- **Two Active Queues**
  - **Queue A: NEW ORDERS** — Orders waiting for kitchen acceptance. Displays large token ID, bill ID, customer name, phone number, order items, exact timestamp, and live ticking elapsed time.
    - **Single Action Button:** `ACCEPT` (transitions order from `NEW` to `ACCEPTED`).
  - **Queue B: ACCEPTED ORDERS** — Orders in preparation or ready for handover.
    - **Single Action Button:** `COMPLETE` (transitions order from `ACCEPTED` to `COMPLETED`, moves to History).
  - *Strict rule:* Only `ACCEPT` and `COMPLETE` buttons are used for the order workflow.
- **Undo Feature**
  - Toast banner appears on completion with an `UNDO` action to reverse accidental clicks within 7 seconds.
- **Rush Mode Toggle**
  - Increases card density and enlarges action buttons.
  - Emphasizes Token IDs and item quantities for fast reading.
  - Automatically highlights the **longest waiting order** with an amber alert border.
- **Completed Order History**
  - Collapsible archive displaying all completed tickets today.
  - Instant search filter by Order ID, Bill ID, customer name, or phone number.
- **Order Synchronization**
  - With Supabase configured, customer orders and staff status changes sync through PostgreSQL Realtime across devices.
  - Without Supabase credentials, orders are stored locally and synchronize only between tabs in the same browser; they are not shared across devices.

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| **React 19 + TypeScript** | Core UI components and strict typing |
| **Vite 8** | Ultra-fast local development server and optimized bundle build |
| **Tailwind CSS v4** | Clean, fast-food POS aesthetic and utility styling |
| **Lucide React** | Consistent, touch-friendly icon system |
| **Web Audio API** | Standalone synthesized POS order notification chime |

---

## 🚀 Getting Started Locally

The app can run locally without cloud credentials, but cross-device order synchronization requires the Supabase setup below.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm`

### Installation

1. Clone or open the repository folder:
   ```bash
   cd "Pizza Bite"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Vite local development server:
   ```bash
   npm run dev
   ```

4. Open your browser:
   - **Customer Ordering App:** [http://localhost:5173/](http://localhost:5173/)
   - **Staff POS Dashboard:** [http://localhost:5173/admin](http://localhost:5173/admin)

---

## 🚢 Deployment (Cloudflare Pages)

The project is structured for 1-click deployment to Cloudflare Pages (or Vercel / Netlify):

1. **Build Settings:**
   - **Framework Preset:** Vite
   - **Build Command:** `npm run build`
   - **Build Output Directory:** `dist`
2. **SPA Routing:**
   Vite builds a single-page application (`index.html`). For Cloudflare Pages, routing to `/admin` or `#admin` is handled seamlessly.

---

## 📂 Project Structure

```
Pizza Bite/
├── public/
│   ├── images/              # Local food photography assets (zero external API dependencies)
│   ├── logo.png             # Pizza Bite brand logo
│   └── favicon.svg          # Stall favicon
├── src/
│   ├── components/
│   │   ├── admin/           # Staff POS components (DashboardHeader, SummaryCounters, OrderCard, ActiveQueues, OrderHistory, UndoToast)
│   │   └── customer/        # Customer ordering components (CustomerHeader, CustomerDetailsModal, CategoryTabs, ProductCard, StickyCartBar, CartDrawer, OrderReviewModal, ReceiptModal)
│   ├── context/
│   │   └── OrderContext.tsx # Central order state, cart management, audio chime, and cross-tab storage
│   ├── data/
│   │   ├── mockOrders.ts    # Initial mock orders in NEW, ACCEPTED, and COMPLETED statuses
│   │   └── mockProducts.ts  # Editable 10 stall menu items with INR pricing
│   ├── pages/
│   │   ├── AdminView.tsx    # Staff POS Dashboard (/admin)
│   │   └── CustomerView.tsx # Mobile-first QR Ordering View (/)
│   ├── types/
│   │   └── index.ts         # Strict TypeScript definitions for Products, Orders, and Items
│   ├── utils/
│   │   ├── currency.ts      # Accurate integer paise arithmetic & INR formatting
│   │   └── formatters.ts    # IST time, phone, and order ID helpers
│   ├── App.tsx              # Root component & path/hash route controller
│   ├── index.css            # Tailwind CSS v4 & @media print receipt rules
│   └── main.tsx             # Entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Supabase Setup

Cross-device order sync requires a Supabase project. Run `supabase_schema.sql` in the project's SQL Editor, then add these frontend environment variables in `.env.local` for local development and in the hosting provider for every deployment:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<publishable-anon-key>
```

Use the project's public anon/publishable key only; never put a service-role key in frontend variables. Redeploy after changing environment variables. The schema enables row-level policies and Realtime for `public.orders`, and provides a database sequence so order tokens remain unique across devices. If either credential is missing or still a template value, the app falls back to local storage and cannot synchronize separate devices.
