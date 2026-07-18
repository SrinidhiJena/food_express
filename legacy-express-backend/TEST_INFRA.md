# FoodExpress Test Infrastructure Mappings

This document defines the test architecture and maps all 82 E2E test cases across 4 Tiers for FoodExpress.

## Test Harness Architecture

- **Runtime**: Node.js
- **Server Startup**: Programmatic startup of backend server in-process on testing port `3009`.
- **Database Layer**: In-memory mocks for Mongoose connections and collections (User, Food, Order) to guarantee test execution stability and eliminate external MongoDB Atlas network dependencies under `CODE_ONLY` constraints.
- **HTTP Client**: Standard `fetch` API for making requests to the programmatically started server.
- **Static Analysis**: File reads and regex/DOM inspection to verify the frontend HTML file structure and script.js contents.

---

## Test Cases Mapping

### Tier 1: Feature Coverage (35 tests, 5 per feature)

#### Feature 1: User Authentication
- **Test 1.1**: Signup endpoint (`POST /api/auth/signup`) registers a new user and returns success, details, and JWT token.
- **Test 1.2**: Login endpoint (`POST /api/auth/login`) authenticates user and returns success and JWT token.
- **Test 1.3**: Frontend signup page (`signup.html`) exists and contains name, email, phone, password fields and a register button.
- **Test 1.4**: Frontend login page (`login.html`) exists and contains email, password fields and a login button.
- **Test 1.5**: Frontend script (`script.js`) contains login and signup form integration code (e.g. `submit` listeners, `/api/auth` fetch calls).

#### Feature 2: Dynamic Menu Retrieval & Display
- **Test 2.1**: Get Foods endpoint (`GET /api/foods`) returns list of seeded food items.
- **Test 2.2**: Main homepage (`index.html`) contains container for dynamic menu rendering (e.g. `#menu-container` or `#food-list`).
- **Test 2.3**: Backend API returns JSON content-type and correct structure for foods: array with name, category, price, image, description.
- **Test 2.4**: index.html references the frontend JS script (`script.js`).
- **Test 2.5**: script.js has fetch code querying `/api/foods` and inserting elements into the DOM.

#### Feature 3: Database Seeding on Startup
- **Test 3.1**: Startup seeder creates default food items (Pizza, Burger, Pasta, Biryani) if food collection is empty.
- **Test 3.2**: Default food items have correct properties (name, category, price, description).
- **Test 3.3**: Startup seeder creates developer account `dev@foodexpress.com` if user collection is empty.
- **Test 3.4**: Developer account has password securely hashed (verified via bcrypt/compare).
- **Test 3.5**: Developer account can log in successfully with password `dev@123`.

#### Feature 4: Food Carousel & UI Enhancements
- **Test 4.1**: Carousel container or element (e.g. `.carousel` or `#carousel`) is present in `index.html`.
- **Test 4.2**: Carousel contains slide elements representing different food items.
- **Test 4.3**: index.html or script.js contains logic/elements for transitioning slides (e.g. prev/next buttons, interval sliding).
- **Test 4.4**: Carousel styling is defined in `style.css` (e.g. CSS animation, transform, transition, display flex).
- **Test 4.5**: Carousel structure has clean HTML nesting and is placed correctly below/in the hero section.

#### Feature 5: Shopping Cart & Checkout Integration
- **Test 5.1**: Cart page (`cart.html`) exists and contains cart items container and total price display.
- **Test 5.2**: Checkout page (`checkout.html`) exists and contains checkout form with address, payment method selection, and order summary.
- **Test 5.3**: script.js contains local storage operations for cart (adding, modifying, clearing items).
- **Test 5.4**: Checkout endpoint (`POST /api/orders/place`) accepts order details and creates a new order in DB.
- **Test 5.5**: Order checkout requires JWT token and fails with 401 if token is not sent.

#### Feature 6: Order History Page
- **Test 6.1**: Order history page (`orders.html`) exists and contains a container for displaying orders.
- **Test 6.2**: Fetch Orders endpoint (`GET /api/orders/my-orders`) retrieves orders placed by the authenticated user.
- **Test 6.3**: Get my-orders requires JWT token and fails with 401 if token is not sent.
- **Test 6.4**: Order history displays ordered items, quantities, total price, status, and date.
- **Test 6.5**: Orders are returned in reverse chronological order (newest first).

#### Feature 7: Run Documentation (README.md)
- **Test 7.1**: `README.md` file exists in the root directory.
- **Test 7.2**: README.md contains instructions for setting up/installing prerequisites (e.g. `npm install`).
- **Test 7.3**: README.md contains instructions for running/starting the server (e.g. `npm start`).
- **Test 7.4**: README.md contains instructions for testing the application.
- **Test 7.5**: README.md is properly formatted in Markdown (starts with title, uses section headers).

---

### Tier 2: Boundary & Corner Cases (35 tests, 5 per feature)

#### Feature 1: User Authentication
- **Test 1.6**: Signup fails with 400 when name/email/phone/password is missing or invalid.
- **Test 1.7**: Signup fails when attempting to register an already existing email.
- **Test 1.8**: Login fails with 401/400 for incorrect password or non-existent email.
- **Test 1.9**: Authentication middleware rejects expired or malformed JWT tokens.
- **Test 1.10**: Auth middleware rejects request with empty Auth header.

#### Feature 2: Dynamic Menu Retrieval & Display
- **Test 2.6**: Get foods endpoint returns empty array (status 200) instead of crashing if DB has no foods.
- **Test 2.7**: Fetching food by invalid ID returns 404.
- **Test 2.8**: Fetching food by malformed ID string returns 400 or 404 (handled gracefully, no 500 crash).
- **Test 2.9**: Frontend script handles empty menu list gracefully (e.g., displaying "No items available" message).
- **Test 2.10**: Frontend menu rendering handles missing image URL or broken images (fallback or default image).

#### Feature 3: Database Seeding on Startup
- **Test 3.6**: If database is not empty, server startup does NOT overwrite or duplicate seeded foods.
- **Test 3.7**: If database is not empty, server startup does NOT overwrite or duplicate seeded developer account.
- **Test 3.8**: Database seeder handles missing environment variables gracefully (does not crash if MONGO_URI is missing, but prints error).
- **Test 3.9**: Multiple rapid restarts do not lead to race conditions or duplicate entries.
- **Test 3.10**: Seeder sets correct default prices and details for Pizza, Burger, Pasta, Biryani.

#### Feature 4: Food Carousel & UI Enhancements
- **Test 4.6**: Carousel JS does not throw exceptions if there are zero items in the list.
- **Test 4.7**: Carousel handles single food item without attempting loop/transition.
- **Test 4.8**: Rapid clicking of prev/next buttons does not cause layout breakdown or JS exceptions.
- **Test 4.9**: Carousel CSS remains responsive and readable on small screens (mobile view).
- **Test 4.10**: Carousel JS runs asynchronously and does not block page load or main menu fetching.

#### Feature 5: Shopping Cart & Checkout Integration
- **Test 5.6**: Checkout API rejects empty cart order (`foodItems` empty array).
- **Test 5.7**: Checkout API rejects items with zero or negative quantities.
- **Test 5.8**: Checkout API rejects invalid or non-existent `foodId`.
- **Test 5.9**: Checkout API rejects order with empty address or missing paymentMethod.
- **Test 5.10**: Shopping cart total matches exact decimal addition (no IEEE 754 precision issues like 99.99 + 10.00 = 109.99000000000001).

#### Feature 6: Order History Page
- **Test 6.6**: Fetch my-orders returns 200 with empty array if user has no orders.
- **Test 6.7**: Fetching my-orders with token from user A does not return orders from user B.
- **Test 6.8**: Order history page handles long lists of orders without breaking styling.
- **Test 6.9**: Backend rejects changing order status via unauthorized API endpoints (if any).
- **Test 6.10**: Expired JWT tokens are cleared from localStorage, and user is redirected to login page when requesting orders.

#### Feature 7: Run Documentation (README.md)
- **Test 7.6**: README.md contains no placeholder or TODO comments.
- **Test 7.7**: README.md specifies correct environment variables (.env setup).
- **Test 7.8**: README.md specifies correct MongoDB requirements.
- **Test 7.9**: README.md contains correct default port number.
- **Test 7.10**: README.md has no broken links or invalid markup.

---

### Tier 3: Cross-Feature Combinations (7 tests)
- **Test 3_1**: DB Startup Seed -> Fetch foods endpoint successfully returns Pizza, Burger, Pasta, and Biryani.
- **Test 3_2**: Signup -> Login -> Seeded developer login works immediately in sequence.
- **Test 3_3**: Login -> Create Food (Admin) -> Fetch foods endpoint contains the newly created food item.
- **Test 3_4**: Login -> Fetch Foods -> Add to Cart -> Checkout -> View Order History (checks complete state transition).
- **Test 3_5**: Cart localstorage updates UI -> Log out -> Cart state remains intact in localstorage for next session.
- **Test 3_6**: Place order -> Verify details (quantities, item IDs) in Order History match original checkout cart details.
- **Test 3_7**: Place multiple orders -> View order history -> Verify orders are correctly sorted by date (newest first).

---

### Tier 4: Real-World Application Scenarios (5 tests)
- **Test 4_A**: **New User Ordering Scenario**: Signup -> Login -> Load homepage -> Add 1 Burger & 1 Pizza -> Go to Checkout -> Enter address & pay on delivery -> Complete checkout -> Verify order history.
- **Test 4_B**: **Developer Admin Add & Verify Scenario**: Login as `dev@foodexpress.com` -> Add a custom food item via API `/api/foods/add` -> Refresh menu -> Verify new item is visible in the dynamic menu card list.
- **Test 4_C**: **Guest Persistent Shopping Flow**: Add Biryani to cart as anonymous guest -> Navigate to login/signup -> Perform signup -> Login -> Check cart is still preserved in localStorage -> Proceed to checkout -> Complete checkout successfully.
- **Test 4_D**: **Cart Modification & Checkout Flow**: User logs in -> Adds 3 Pastas & 2 Burgers to cart -> Navigates to cart page -> Reduces Pasta quantity to 2 -> Increases Burger quantity to 3 -> Proceeds to checkout -> Places order -> Verifies order history shows 2 Pastas and 3 Burgers with correct total.
- **Test 4_E**: **Unauthorized Checkout Prevention Flow**: Attempt to access checkout page directly without token -> Redirected/Blocked -> Send direct POST request to `/api/orders/place` with invalid token -> Verify 401 response -> Login -> Resend POST request with valid token -> Verify 201 success response.
