# 🍔 FoodExpress — Fullstack Food Delivery App

A simple fullstack food delivery web application built as a college project using **Node.js**, **Express**, **MongoDB**, and **Vanilla HTML/CSS/JS**.

---

## 📁 Project Structure

```
food_delivery/
├── server.js              ← Express app entry point
├── .env                   ← Environment variables (you must configure this)
├── .env.example           ← Template for .env
├── package.json
│
├── config/
│   ├── db.js              ← MongoDB connection
│   └── seeder.js          ← Auto-seeds food items + developer user on startup
│
├── models/
│   ├── User.js            ← User schema (bcrypt password hashing)
│   ├── Food.js            ← Food item schema
│   └── Order.js           ← Order schema
│
├── controllers/
│   ├── authController.js  ← Signup & Login logic
│   ├── foodController.js  ← Add / Get food items
│   └── orderController.js ← Place & View orders
│
├── routes/
│   ├── authRoutes.js      ← /api/auth/signup, /api/auth/login
│   ├── foodRoutes.js      ← /api/foods
│   └── orderRoutes.js     ← /api/orders
│
├── middleware/
│   └── authMiddleware.js  ← JWT token verification
│
└── (Frontend HTML pages)
    ├── index.html         ← Home + Food Carousel + Menu
    ├── login.html         ← Login form
    ├── signup.html        ← Registration form
    ├── cart.html          ← Shopping cart
    ├── checkout.html      ← Checkout + Place Order
    └── orders.html        ← Order history
```

---

## ⚙️ Prerequisites

Make sure you have the following installed:

- **Node.js** v16 or higher → [Download](https://nodejs.org/)
- **MongoDB** → Either:
  - Local: [Download MongoDB Community](https://www.mongodb.com/try/download/community)
  - Cloud: [MongoDB Atlas (Free)](https://www.mongodb.com/atlas)

---

## 🚀 How to Run

### Step 1 — Clone / Navigate to the Project

```bash
cd food_delivery
```

### Step 2 — Install Dependencies

```bash
npm install
```

### Step 3 — Configure Environment Variables

Open the `.env` file and update the MongoDB URI:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/foodexpress
JWT_SECRET=supersecretkey_foodexpress_jwt_token_2026
```

> **MongoDB Atlas users:** Replace `MONGO_URI` with your Atlas connection string:
> ```
> MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/foodexpress?retryWrites=true&w=majority
> ```

### Step 4 — Start the Server

```bash
node server.js
```

You should see:

```
🚀 Server is running on http://localhost:3000
🔌 MongoDB Connected: 127.0.0.1
🌱 Food collection empty. Seeding default items...
✅ Seeded default food items.
🌱 Developer account missing. Seeding dev@foodexpress.com...
✅ Seeded developer account.
```

### Step 5 — Open in Browser

Go to: **http://localhost:3000**

---

## 👤 Developer Account

A developer account is automatically seeded on the first run:

| Field    | Value                    |
|----------|--------------------------|
| Email    | `dev@foodexpress.com`    |
| Password | `dev@123`                |

You can use this to log in immediately without signing up.

---

## 🌐 REST API Endpoints

| Method | Endpoint                | Auth Required | Description              |
|--------|-------------------------|---------------|--------------------------|
| POST   | `/api/auth/signup`      | No            | Register a new user      |
| POST   | `/api/auth/login`       | No            | Login and get JWT token  |
| GET    | `/api/foods`            | No            | Get all food items       |
| GET    | `/api/foods/:id`        | No            | Get food item by ID      |
| POST   | `/api/foods/add`        | Yes (JWT)     | Add a new food item      |
| POST   | `/api/orders/place`     | Yes (JWT)     | Place a new order        |
| GET    | `/api/orders/my-orders` | Yes (JWT)     | Get logged-in user orders|

### Example: Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@foodexpress.com","password":"dev@123"}'
```

---

## 🛒 How to Use the App

1. **Home Page** → Browse the food carousel and dynamic menu
2. **Login/Signup** → Create an account or use `dev@foodexpress.com` / `dev@123`
3. **Add to Cart** → Click "Add to Cart" on any food item
4. **Cart** → Review items, adjust quantities
5. **Checkout** → Enter delivery address and payment method → Place Order
6. **My Orders** → View order history (accessible after login)

---

## 🧪 Run Integration Tests (Optional)

To run the mock-based integration test suite (no real DB needed):

```bash
node run_mock_verification.js
```

---

## 🛠️ Tech Stack

| Layer      | Technology               |
|------------|--------------------------|
| Backend    | Node.js + Express.js     |
| Database   | MongoDB + Mongoose ODM   |
| Auth       | JWT + bcryptjs           |
| Frontend   | HTML + CSS + Vanilla JS  |

---

## 📌 Notes

- Passwords are **always hashed** using bcrypt before storing in the database.
- JWT tokens are stored in `localStorage` on the client side.
- The cart is managed entirely in the browser using `localStorage`.
- On the first server start, the database is **automatically seeded** with food items and the developer account.
