# 🍔 FoodExpress — Premium Food Delivery Marketplace & Dispatch Dashboard

A modern, full-stack food delivery marketplace platform built with **Astro**, **TypeScript**, and **Firebase** (Authentication, Firestore, and Hosting). FoodExpress acts as a middleman hub connecting customers with local partner restaurants, featuring a live order dispatch pipeline and a unified role-based administrative control center.

---

## 🚀 Live Demo
* **Deployment URL:** [https://foodexpress-8f825.web.app](https://foodexpress-8f825.web.app)

---

## ✨ Key Features

### 🏪 1. Partner Restaurant Marketplace (Middleman Architecture)
- Food items are categorized and mapped directly to partner restaurants (e.g., *Paradise Biryani, Shah Ghouse, Mehfil, Chutneys, Irani Cafe*).
- Customer orders track and partition items by their preparation source, acting as a unified middleman aggregator.

### 📖 2. Interactive Floating "Menu Book"
- Triggered directly from the navigation bar.
- Displays a clean, text-based, print-style restaurant menu layout grouped by culinary categories (*Biryanis, Tiffins, Breads, Combos, Beverages, Desserts, Curries*).
- Interactive quantity controllers (`+ Add` and `- Qty +`) let users configure their cart straight from the menu book modal.

### 🔢 3. Page-by-Page Menu Pagination
- The landing page features a paginated food grid limited to **6 items per page** for fast loading and clean layout.
- Integrates smooth, responsive page controllers with automatic scroll-to-top transition.

### 📋 4. Secure Customer Checkout
- Structured delivery capture during checkout collecting:
  - **Full Customer Name**
  - **Phone Number**
  - **Delivery Address**
  - **Payment Mode** (Cash on Delivery)

### 🚚 5. Live Order Dispatch Dashboard (Admin Panel)
- **Role-Based Views:** Administrative panels feature dynamic headings and tailored layout controls depending on the authenticated account's permissions:
  - **Super Admin Dashboard** (for account `srinidhijena@gmail.com`)
  - **Developer Admin Panel**
  - **Menu Editor Panel**
- **Zomato/Swiggy-style Delivery Pipeline:** An interactive progress visualizer tracking delivery status from `Received` ➔ `Kitchen Cooking` ➔ `Out for Delivery` ➔ `Delivered` in real-time.
- **🖨️ Invoice Generator:** Instant print-ready invoice formatting containing order details, restaurant sources, and customer shipping logs.

---

## 📁 Project Directory Structure

```text
food_delivery/
├── src/
│   ├── pages/
│   │   ├── index.astro        ← Marketplace Home, Food Grid, Menu Book
│   │   ├── admin.astro        ← Admin Dashboard, Live Pipeline, Invoice Printer
│   │   ├── login.astro        ← Account Authentication Login Form
│   │   ├── signup.astro       ← Account Authentication Registration Form
│   │   ├── cart.astro         ← Interactive Shopping Cart
│   │   ├── checkout.astro     ← Delivery Address and Contact Checkout Form
│   │   ├── orders.astro       ← Customer Real-time Order Tracking
│   │   └── edit-menu.astro    ← Deprecated route (redirects to admin)
│   │
│   ├── components/
│   │   ├── Header.astro       ← Main Navigation Header with cart quantity counter
│   │   └── Footer.astro       ← Extended Footer (features, quick links, contact)
│   │
│   ├── scripts/
│   │   └── firebaseApp.js     ← Firestore and Firebase Auth configuration
│   │
│   └── styles/
│       └── globals.css        ← Color tokens, typography, and utility classes
│
├── public/
│   └── images/                ← Product mockups and seeded imagery
├── firebase.json              ← Firebase Hosting configurations
├── firestore.rules            ← Role-based Firestore security rules
└── firestore.indexes.json     ← Firestore composite queries configuration
```

---

## ⚙️ Local Setup and Installation

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) (v18.0.0 or higher) installed.

### Step 1: Clone and Navigate
```bash
cd food_delivery
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Create a `.env` file in the root directory (or update the config in `src/scripts/firebaseApp.js`) with your Firebase Project coordinates:
```env
PUBLIC_FIREBASE_API_KEY=your_api_key
PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
PUBLIC_FIREBASE_PROJECT_ID=your_project_id
PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open **[http://localhost:4321](http://localhost:4321)** in your browser to view the application locally.

---

## 🛡️ Firestore Security Configuration
Security rules in `firestore.rules` protect the marketplace records:
* **Foods Collection:** Read is public. Write operations (Create, Update, Delete) are authorized only for editors verified against the `/editors` collection.
* **Orders Collection:** Read is public (for order tracking page lookup). Create is allowed for any authenticated user. Write/update is restricted to authorized administrative users.

To deploy security rules:
```bash
firebase deploy --only firestore:rules
```

---

## 🚀 Building & Deploying

### Build Production Bundle
To compile a static production build:
```bash
npm run build
```

### Deploy to Firebase Hosting
```bash
firebase deploy --only hosting
```

---

## 🛠️ Technology Stack
- **Frontend Framework:** [Astro](https://astro.build/) (Static Site Generation / Islands Architecture)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styles:** Vanilla CSS (Custom custom tokens, glassmorphism, responsive breakpoints)
- **Database & Auth:** [Firebase Firestore / Authentication](https://firebase.google.com/)
- **Hosting:** [Firebase Hosting](https://firebase.google.com/docs/hosting)
