# Project: FoodExpress

## Architecture
FoodExpress is a simple fullstack Food Delivery web application.
- **Frontend**: Vanilla HTML5, CSS3, and JavaScript (ES6) running in the browser, communicating with the backend via REST APIs using `fetch` and maintaining local state (authentication JWT, shopping cart) in `localStorage`.
- **Backend**: Node.js and Express server serving static files and API routes.
- **Database**: MongoDB (via Mongoose ODM) with schemas for Users, Foods, and Orders.

### Data Flow
1. **User Authentication**: Client submits form -> API generates JWT -> Client stores JWT -> Client includes JWT in subsequent requests' Authorization headers.
2. **Menu Loading**: Client requests `/api/foods` -> Backend queries Mongoose -> Client renders food cards dynamically.
3. **Cart & Checkout**: Client builds cart in `localStorage` -> Client posts order to `/api/orders/place` with cart item IDs and quantities -> Backend verifies prices and creates order.
4. **Order History**: Client fetches `/api/orders/my-orders` -> Backend returns user-specific orders.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Backend Seeding & API Verification | Implement DB seeding for foods & dev user; verify all backend endpoints using mock script. | None | PLANNED |
| 2 | Front-End Authentication & Header Context | Integrate Login/Signup frontend pages with backend APIs, store token in local storage, and dynamically show logged-in/logged-out states in header. | M1 | PLANNED |
| 3 | Dynamic Menu & Sliding Food Carousel | Fetch and display foods dynamically on index.html; implement smooth sliding food carousel. | M1, M2 | PLANNED |
| 4 | Shopping Cart & Checkout Integration | Implement client-side cart (add/modify/total) in localStorage and connect checkout page to place orders. | M1, M2, M3 | PLANNED |
| 5 | Order History Page | Create orders.html and display past orders dynamically from backend. | M1, M2, M4 | PLANNED |
| 6 | Documentation & Final E2E Test Pass | Write README.md and verify the entire app passes all E2E test tiers. | M1, M2, M3, M4, M5 | PLANNED |

## Interface Contracts
### 1. Authentication APIs
- `POST /api/auth/signup`
  - Request body: `{ name, email, phone, password }`
  - Response (201): `{ success: true, message: "User registered successfully", data: { _id, name, email, phone, token } }`
- `POST /api/auth/login`
  - Request body: `{ email, password }`
  - Response (200): `{ success: true, message: "Logged in successfully", data: { _id, name, email, phone, token } }`

### 2. Food APIs
- `GET /api/foods`
  - Response (200): `{ success: true, count, data: [ { _id, foodName, category, price, image, description } ] }`
- `POST /api/foods/add` (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Request body: `{ foodName, category, price, image, description }`
  - Response (201): `{ success: true, message: "Food item added successfully", data: { _id, foodName, ... } }`

### 3. Order APIs
- `POST /api/orders/place` (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Request body: `{ foodItems: [ { foodId, quantity } ], address, paymentMethod }`
  - Response (201): `{ success: true, message: "Order placed successfully", data: { _id, userId, foodItems, totalPrice, address, paymentMethod, orderStatus } }`
- `GET /api/orders/my-orders` (Protected)
  - Headers: `Authorization: Bearer <token>`
  - Response (200): `{ success: true, count, data: [ { _id, foodItems, totalPrice, address, paymentMethod, orderStatus, createdAt } ] }`

## Code Layout
- `server.js` - Main entry point
- `package.json` - Dependencies and start scripts
- `config/`
  - `db.js` - Database connection and seeding helper
- `middleware/`
  - `authMiddleware.js` - JWT token validation middleware
- `models/`
  - `User.js` - User database schema
  - `Food.js` - Food database schema
  - `Order.js` - Order database schema
- `controllers/`
  - `authController.js` - Authentication handler logic
  - `foodController.js` - Food management handler logic
  - `orderController.js` - Order placement and retrieval logic
- `routes/`
  - `authRoutes.js` - Route definitions for auth
  - `foodRoutes.js` - Route definitions for food
  - `orderRoutes.js` - Route definitions for orders
- Frontend Files (Root):
  - `index.html` - Home & Menu page
  - `login.html` - User Login page
  - `signup.html` - User Registration page
  - `cart.html` - Shopping Cart review page
  - `checkout.html` - Checkout & Payment method selection page
  - `orders.html` - User Order history page
  - `script.js` - Shared frontend client-side scripts
  - `style.css` - UI styles and responsiveness rules
