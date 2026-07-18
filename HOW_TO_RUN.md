# 🚀 How to Run FoodExpress in VS Code

A step-by-step guide to set up and run the FoodExpress fullstack project from scratch using Visual Studio Code.

---

## 📦 Step 1 — Install Required Software

Before starting, make sure all of these are installed:

### 1.1 Node.js
- Download from: https://nodejs.org/
- Choose the **LTS version** (e.g., v20.x)
- After install, verify in terminal:
  ```bash
  node -v
  npm -v
  ```
  Both should print version numbers.

### 1.2 MongoDB (Local)
- Download: https://www.mongodb.com/try/download/community
- Install with default settings
- MongoDB runs as a background service automatically after install
- Verify it's running:
  ```bash
  mongod --version
  ```

> **OR use MongoDB Atlas (Free Cloud)**
> 1. Go to https://www.mongodb.com/atlas
> 2. Create a free account → Create a free cluster
> 3. Click **Connect** → **Drivers** → Copy the connection string
> 4. Replace `MONGO_URI` in your `.env` with this string

### 1.3 Visual Studio Code
- Download: https://code.visualstudio.com/

---

## 📂 Step 2 — Open the Project in VS Code

1. Open **VS Code**
2. Go to **File → Open Folder**
3. Select the `food_delivery` folder on your Desktop
4. VS Code will open the project

---

## 💻 Step 3 — Open the Integrated Terminal

In VS Code:
- Press `` Ctrl + ` `` (backtick) to open the terminal
- OR go to **Terminal → New Terminal** from the top menu

You should see a terminal at the bottom of VS Code showing something like:
```
PS C:\Users\srini\OneDrive\Desktop\food_delivery>
```

---

## 📥 Step 4 — Install Dependencies

In the VS Code terminal, type:

```bash
npm install
```

This installs all required packages (`express`, `mongoose`, `dotenv`, `jsonwebtoken`, `bcryptjs`).

You should see:
```
added 102 packages in 5s
```

---

## ⚙️ Step 5 — Configure the `.env` File

1. In VS Code's file explorer (left sidebar), find the `.env` file
2. Click it to open
3. It should look like this:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/foodexpress
JWT_SECRET=supersecretkey_foodexpress_jwt_token_2026
```

> **If using MongoDB Atlas**, replace the `MONGO_URI` line with your Atlas connection string:
> ```env
> MONGO_URI=mongodb+srv://youruser:yourpassword@cluster0.mongodb.net/foodexpress?retryWrites=true&w=majority
> ```

4. Press `Ctrl + S` to save

---

## ▶️ Step 6 — Run the Server

In the VS Code terminal:

```bash
node server.js
```

You should see this output:

```
🚀 Server is running on http://localhost:3000
🔌 MongoDB Connected: 127.0.0.1
🌱 Food collection empty. Seeding default items...
✅ Seeded default food items.
🌱 Developer account missing. Seeding dev@foodexpress.com...
✅ Seeded developer account.
```

> **The server is now running!**

---

## 🌐 Step 7 — Open in Browser

1. Open any browser (Chrome, Edge, Firefox)
2. Go to: **http://localhost:3000**
3. You should see the FoodExpress home page with:
   - A hero section with smooth animation
   - A food carousel below the hero
   - A dynamic menu loaded from MongoDB

---

## 👤 Step 8 — Log In with Developer Account

The developer account is **automatically created** when the server starts.

| Field    | Value                  |
|----------|------------------------|
| Email    | `dev@foodexpress.com`  |
| Password | `dev@123`              |

1. Click **Login** in the navigation bar
2. Enter the credentials above
3. Click **Login** button
4. You will be redirected to the home page with your name in the nav bar

---

## 🛒 Step 9 — Test the Full User Flow

Follow this order to test everything:

```
Home Page → Add items to cart → View Cart → Checkout → Place Order → My Orders
```

| Page           | URL                              | What to do                           |
|----------------|----------------------------------|--------------------------------------|
| Home           | http://localhost:3000/           | Browse menu, click "Add to Cart"     |
| Cart           | http://localhost:3000/cart.html  | Adjust quantities, proceed           |
| Checkout       | http://localhost:3000/checkout.html | Enter address, select payment, place order |
| My Orders      | http://localhost:3000/orders.html | View your order history              |
| Login          | http://localhost:3000/login.html | Log in with credentials              |
| Sign Up        | http://localhost:3000/signup.html | Create a new account                |

---

## 🔌 Step 10 — Test REST APIs Directly (Optional)

You can test the APIs using VS Code's built-in terminal with `curl` or install the **Thunder Client** extension.

### Install Thunder Client
1. In VS Code, go to **Extensions** (Ctrl+Shift+X)
2. Search for **Thunder Client**
3. Install it
4. Click the thunder bolt icon in the left sidebar

### Test Login API
- Method: `POST`
- URL: `http://localhost:3000/api/auth/login`
- Body (JSON):
```json
{
  "email": "dev@foodexpress.com",
  "password": "dev@123"
}
```
- Expected response:
```json
{
  "success": true,
  "message": "Logged in successfully",
  "data": {
    "name": "Developer",
    "email": "dev@foodexpress.com",
    "token": "eyJ..."
  }
}
```

### Test Get All Foods
- Method: `GET`
- URL: `http://localhost:3000/api/foods`
- No auth needed

---

## 🛑 Step 11 — Stop the Server

In the VS Code terminal, press:
```
Ctrl + C
```

You will see:
```
^C
```
The server has stopped.

---

## 🔁 Restarting the Server

Every time you want to run the project again:

1. Open VS Code
2. Open the terminal (`` Ctrl + ` ``)
3. Run:
   ```bash
   node server.js
   ```
4. Open http://localhost:3000 in browser

> **Tip:** Install `nodemon` for auto-restart on file changes:
> ```bash
> npm install -g nodemon
> nodemon server.js
> ```

---

## ❌ Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNREFUSED 127.0.0.1:27017` | MongoDB not running | Start MongoDB service or use Atlas URI |
| `Cannot find module 'express'` | Dependencies not installed | Run `npm install` |
| `JWT_SECRET missing` | `.env` file not configured | Check `.env` file exists and has all 3 variables |
| `Port 3000 already in use` | Another process using port 3000 | Change `PORT=3001` in `.env` or kill the other process |
| Page loads but menu is empty | Server not running | Make sure `node server.js` is running |

---

## 📁 Key Files Reference

| File | Purpose |
|------|---------|
| `server.js` | Main server entry point |
| `.env` | Your secret config (MongoDB URI, JWT secret) |
| `config/db.js` | Database connection |
| `config/seeder.js` | Auto-seeds food items + developer account |
| `script.js` | All frontend JavaScript (auth, cart, orders) |
| `index.html` | Home page with carousel and menu |
| `login.html` | Login page |
| `signup.html` | Registration page |
| `cart.html` | Shopping cart |
| `checkout.html` | Checkout and order placement |
| `orders.html` | Order history |

---

*Made with ❤️ as a college fullstack project — FoodExpress*
