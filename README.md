# Shendam Connect - Smart Local Government Digital Directory & Tourism Platform

Shendam Connect is an all-in-one digital directory, hotel booking engine, and local tourism platform for **Shendam Local Government Area (LGA), Plateau State, Nigeria**. It features a comprehensive public web app, interactive business & attractions explorer, direct WhatsApp/Call integrations, a real-time guest booking workflow, and a fully integrated **Executive Admin Command Dashboard** (`/admin`).

---

## 🌟 Application Features

### Public Portal
- **Interactive Directory**: Discover certified hotels, restaurants, healthcare services, markets, schools, transport parks, and cultural attractions in Shendam.
- **Hotel Booking Engine**: Real-time room availability, live reservation requests, guest confirmation details, and direct contact options.
- **Local Tourism & Culture**: Highlighting landmarks like Long Goemai Palace, Kwolla / Katsina Falls, Shimankar Beach, and cultural heritage sites.
- **Privacy-First Live Tracking**: Client-side background heartbeat mechanism measuring active online visitors without harvesting private user data or IP addresses.
- **PWA & Mobile-First**: Installable Progressive Web App with offline fallback support, fast mobile navigation, and responsive touch controls.

### Executive Admin Dashboard (`/admin`)
- **Executive Security & Authentication**: Server-side JWT token verification with rate limiting, input validation, role checks, and password hashing.
- **🟢 Live Users Tracker**: Real-time visitor presence updating every 60–90 seconds via an active heartbeat collector.
- **Analytics & Traffic Insights**: Historical chart visualizations for Visitors Over Time (7/30 days), Page Views, Popular Hotels, Top Businesses, and Device Breakdowns (Mobile vs. Desktop vs. Tablet).
- **Hotel Management (`/admin/hotels`)**: Add, edit, verify, feature, activate/deactivate, upload photos, and archive accommodations.
- **Business Management (`/admin/businesses`)**: Manage commercial enterprises across Shendam LGA with contact numbers, WhatsApp links, categories, and coordinates.
- **Attraction Management (`/admin/attractions`)**: Curate cultural heritage sites, historical monuments, natural landmarks, and coordinates.
- **Booking Management (`/admin/bookings`)**: Comprehensive reservation ledger with instant status transitions (`Pending`, `Confirmed`, `Completed`, `Cancelled`), customer details, and room types.
- **Audit Logs (`/admin/activity`)**: Immutable tracking of administrator actions (login, edits, status modifications, record creations).
- **💰 Revenue & Finance Command**: Structured financial breakdown covering Booking Commissions (10%), Commercial Advertising, Sponsored Listings, Premium Merchant Accounts, and Pending Settlements with CSV ledger export.
- **LGA Broadcast & Emergency Alerts**: Publish real-time announcements displayed as alert banners across the public portal.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas-based chart renderers, Motion UI transitions.
- **Backend**: Node.js, Express, Vite middleware mode, crypto session generator.
- **Database & Storage**: JSON file database (`/server/data/shendam_db.json`) with auto-seeding, data persistence, and index querying.
- **Security**: Server-side token authorization (`Bearer JWT`), crypto password hashing, rate limiting, and sanitization.

---

## 🔐 Admin Access & Production Authentication

The private administration suite is located at:
```
/admin
```
or via the **Admin Portal** quick link in the site menu.

### Super Admin Account
- **Initial Super Admin**: `domnanraymond9@gmail.com`
- **Initial Setup Password**: `ShendamAdmin2026!` (configurable via `ADMIN_PASSWORD_HASH` / `ADMIN_PASSWORD` in production).

Only whitelisted administrative accounts can access the `/admin` portal or query administrative endpoints. Ordinary public users are blocked with 401 Unauthorized errors and brute-force lockouts.

---

## ⚙️ Environment Variables

Copy the `.env.example` file to create your `.env` configuration:

```env
# Gemini API Key (Server-side AI capabilities)
GEMINI_API_KEY=your_gemini_api_key_here

# App URL (Auto-injected in production)
APP_URL=https://your-domain.com

# Administrator Credentials
ADMIN_EMAIL=domnanraymond9@gmail.com
ADMIN_PASSWORD_HASH=ShendamAdmin2026!

# JWT Token Secret
JWT_SECRET=shendam_connect_secret_jwt_key_2026

# Session Settings
ADMIN_SESSION_TTL_MS=86400000
ACTIVE_USER_TIMEOUT_MS=90000
```

---

## 🚀 Setup & Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev
   ```
   The application will boot at `http://localhost:3000`.

3. **Build for Production**:
   ```bash
   npm run build
   ```

4. **Start Production Server**:
   ```bash
   npm start
   ```

---

## 📊 Analytics & Privacy Architecture

- **Session Handling**: Every visitor receives an anonymous, non-reversible session identifier (`anon-xxxxxx`) stored in `localStorage`.
- **Heartbeat Engine**: The frontend client sends periodic lightweight beacons (`POST /api/analytics/heartbeat`) every 45 seconds to maintain active presence.
- **Active User Calculation**: Visitors with a heartbeat within the last 90 seconds are counted as active online users. Inactive sessions automatically expire.
- **Zero PII**: No IP addresses, device identifiers, or personal communications are ever captured or exposed.

---

## 💰 Revenue Tracking Architecture

The revenue management layer records and tracks digital economy transactions across Shendam LGA:
1. **Hotel Booking Commission (10%)**: Automatically calculated on settled room bookings.
2. **Advertising**: Hero banner placements and promotional campaign sponsorships.
3. **Sponsored Listings**: Priority search rankings and certified directory badges.
4. **Premium Merchant Accounts**: Annual verified business subscriptions.
5. **Ledger Export**: Administrators can export full audit trails as `.csv` spreadsheets.

---

## 🚢 Deployment Guidelines

### Vercel / Node.js Containers / Cloud Run
The application is structured for containerized Node.js and static bundle serving:
1. Set the build command to `npm run build`.
2. Set the start command to `npm start` (which executes `node dist/server.cjs`).
3. Add the required environment variables (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `JWT_SECRET`).
4. Ingress port is standard `3000`.
