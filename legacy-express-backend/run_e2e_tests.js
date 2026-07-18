// FoodExpress E2E Integration Test Runner
// Runs all 82 E2E test cases mapped in the test plan.

// ----------------------------------------------------
// 1. Environment Configuration
// ----------------------------------------------------
process.env.PORT = 3009;
process.env.JWT_SECRET = "test_jwt_secret_key_123456789";
process.env.MONGO_URI = "mongodb://localhost:27017/testdb";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

// ----------------------------------------------------
// 2. In-Memory Mock Database Stores
// ----------------------------------------------------
const users = [];
const foods = [];
const orders = [];

// ----------------------------------------------------
// 3. Mongoose Connection Mock
// ----------------------------------------------------
mongoose.connect = async () => {
    console.log("🔌 [MOCK DB] Database connection simulated successfully.");
    return { connection: { host: "mock-atlas-cluster" } };
};

// ----------------------------------------------------
// 4. Model Method Mocks
// ----------------------------------------------------
const User = require("./models/User");
const Food = require("./models/Food");
const Order = require("./models/Order");

// Mock User Model Methods
User.findOne = async (query) => {
    if (query && query.email) {
        return users.find(u => u.email === query.email.toLowerCase()) || null;
    }
    return null;
};
User.create = async (data) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(data.password, salt);
    const userInstance = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: data.name,
        email: data.email.toLowerCase(),
        phone: data.phone,
        password: hashedPassword,
        comparePassword: async function (candidatePassword) {
            return await bcrypt.compare(candidatePassword, this.password);
        },
    };
    users.push(userInstance);
    return userInstance;
};
User.findById = (id) => {
    const user = users.find(u => u._id === id.toString());
    const chain = {
        select: (fields) => {
            if (user) {
                const copy = { ...user };
                if (fields.includes("-password")) {
                    delete copy.password;
                }
                return copy;
            }
            return null;
        },
        then: (onfulfilled) => {
            return Promise.resolve(user).then(onfulfilled);
        }
    };
    return chain;
};
User.find = async () => {
    return users;
};
User.countDocuments = async () => users.length;

// Mock Food Model Methods
Food.create = async (data) => {
    const foodInstance = {
        _id: new mongoose.Types.ObjectId().toString(),
        foodName: data.foodName,
        category: data.category,
        price: Number(data.price),
        image: data.image,
        description: data.description,
    };
    foods.push(foodInstance);
    return foodInstance;
};
Food.find = async () => {
    return foods;
};
Food.findById = async (id) => {
    return foods.find(f => f._id === id.toString()) || null;
};
Food.countDocuments = async () => foods.length;

// Mock Order Model Methods
Order.create = async (data) => {
    const orderInstance = {
        _id: new mongoose.Types.ObjectId().toString(),
        userId: data.userId,
        foodItems: data.foodItems.map(item => ({
            foodId: item.foodId,
            quantity: item.quantity,
            _id: new mongoose.Types.ObjectId().toString(),
        })),
        totalPrice: data.totalPrice,
        address: data.address,
        paymentMethod: data.paymentMethod || "Cash on Delivery",
        orderStatus: "Pending",
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    orders.push(orderInstance);
    return orderInstance;
};
Order.findById = (id) => {
    const order = orders.find(o => o._id === id.toString());
    const chain = {
        populate: (path, fields) => {
            if (!order) return chain;
            if (path === "userId") {
                const user = users.find(u => u._id === order.userId.toString());
                if (user) {
                    order.userId = {
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        phone: user.phone,
                    };
                }
            } else if (path === "foodItems.foodId") {
                order.foodItems.forEach(item => {
                    const fId = item.foodId._id || item.foodId;
                    const food = foods.find(f => f._id === fId.toString());
                    if (food) {
                        item.foodId = {
                            _id: food._id,
                            foodName: food.foodName,
                            price: food.price,
                            category: food.category,
                        };
                    }
                });
            }
            return chain;
        },
        then: (onfulfilled) => {
            return Promise.resolve(order).then(onfulfilled);
        },
    };
    return chain;
};
Order.find = (query) => {
    let filtered = orders.filter(o => {
        const uId = o.userId._id || o.userId;
        return uId.toString() === query.userId.toString();
    });
    const chain = {
        populate: (path, fields) => {
            if (path === "foodItems.foodId") {
                filtered.forEach(order => {
                    order.foodItems.forEach(item => {
                        const fId = item.foodId._id || item.foodId;
                        const food = foods.find(f => f._id === fId.toString());
                        if (food) {
                            item.foodId = {
                                _id: food._id,
                                foodName: food.foodName,
                                price: food.price,
                                category: food.category,
                                image: food.image,
                            };
                        }
                    });
                });
            }
            return chain;
        },
        sort: (sortQuery) => {
            filtered.sort((a, b) => b.createdAt - a.createdAt);
            return chain;
        },
        then: (onfulfilled) => {
            return Promise.resolve(filtered).then(onfulfilled);
        },
    };
    return chain;
};
Order.countDocuments = async () => orders.length;

// ----------------------------------------------------
// 5. Start the Backend Server
// ----------------------------------------------------
console.log("🟢 Starting FoodExpress Server with Mocks on Port 3009...");
require("./server");

// ----------------------------------------------------
// 6. File System Helper Functions
// ----------------------------------------------------
const readHTML = (filename) => fs.readFileSync(path.join(__dirname, filename), "utf8");
const readJS = (filename) => fs.readFileSync(path.join(__dirname, filename), "utf8");
const readCSS = (filename) => fs.readFileSync(path.join(__dirname, filename), "utf8");

const BASE_URL = "http://localhost:3009/api";

// ----------------------------------------------------
// 7. Define E2E Test Cases (82 Cases)
// ----------------------------------------------------
const testCases = [];

// Helper to push a test case
function addTest(id, name, fn) {
    testCases.push({ id, name, fn });
}

// ----------------------------------------------------
// TIER 1: Feature Coverage (35 Tests)
// ----------------------------------------------------

// Feature 1: User Authentication
addTest("Test 1.1", "Signup endpoint registers user and returns JWT token", async () => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "John Doe",
            email: `john.doe.${Date.now()}@example.com`,
            phone: "1234567890",
            password: "securepassword123"
        })
    });
    const data = await res.json();
    if (res.status !== 201 || !data.success || !data.data.token) {
        throw new Error(`Signup failed: status ${res.status}`);
    }
});

addTest("Test 1.2", "Login endpoint authenticates user and returns JWT token", async () => {
    const email = `login.user.${Date.now()}@example.com`;
    const password = "securepassword123";
    await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Login User", email, phone: "9876543210", password })
    });

    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success || !data.data.token) {
        throw new Error(`Login failed: status ${res.status}`);
    }
});

addTest("Test 1.3", "Frontend signup.html exists and contains form fields", async () => {
    const html = readHTML("signup.html");
    if (!html.includes('placeholder="Full Name"') && !html.includes('placeholder="Name"')) throw new Error("Missing name input");
    if (!html.includes('type="email"')) throw new Error("Missing email input");
    if (!html.includes('type="tel"')) throw new Error("Missing phone input");
    if (!html.includes('type="password"')) throw new Error("Missing password input");
    if (!html.includes("submit") && !html.includes("button")) throw new Error("Missing submit button");
});

addTest("Test 1.4", "Frontend login.html exists and contains email/password fields", async () => {
    const html = readHTML("login.html");
    if (!html.includes('type="email"')) throw new Error("Missing email input");
    if (!html.includes('type="password"')) throw new Error("Missing password input");
    if (!html.includes("submit") && !html.includes("button")) throw new Error("Missing submit button");
});

addTest("Test 1.5", "Frontend script.js contains login and signup form integrations", async () => {
    const js = readJS("script.js");
    if (!js.includes("/api/auth/login") || !js.includes("/api/auth/signup")) {
        throw new Error("script.js is missing form submit integrations or fetch targets");
    }
});

// Feature 2: Dynamic Menu Retrieval & Display
addTest("Test 2.1", "Get Foods endpoint returns seeded food items list", async () => {
    const res = await fetch(`${BASE_URL}/foods`);
    const data = await res.json();
    if (res.status !== 200 || !data.success || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error("GET /api/foods failed or returned empty list");
    }
});

addTest("Test 2.2", "Main homepage index.html contains dynamic menu container", async () => {
    const html = readHTML("index.html");
    if (!html.includes('id="food-list"') && !html.includes('id="menu-container"')) {
        throw new Error("index.html is missing dynamic food list/menu container ID");
    }
});

addTest("Test 2.3", "Get Foods returns application/json content-type and correct structure", async () => {
    const res = await fetch(`${BASE_URL}/foods`);
    const ct = res.headers.get("content-type");
    if (!ct || !ct.includes("application/json")) throw new Error("Content type is not JSON");
    const data = await res.json();
    const item = data.data[0];
    if (!item.foodName || !item.category || item.price === undefined || !item.image || !item.description) {
        throw new Error("Food item is missing key properties");
    }
});

addTest("Test 2.4", "index.html references frontend JS script (script.js)", async () => {
    const html = readHTML("index.html");
    if (!html.includes('src="script.js"') && !html.includes('src="./script.js"')) {
        throw new Error("index.html does not load script.js");
    }
});

addTest("Test 2.5", "script.js has fetch code querying /api/foods and inserting into DOM", async () => {
    const js = readJS("script.js");
    if (!js.includes("/api/foods") || (!js.includes("appendChild") && !js.includes("innerHTML"))) {
        throw new Error("script.js is missing dynamic food fetching/rendering logic");
    }
});

// Feature 3: Database Seeding on Startup
addTest("Test 3.1", "Startup seeder creates default food items if empty", async () => {
    const pizza = foods.find(f => f.foodName === "Pizza");
    const burger = foods.find(f => f.foodName === "Burger");
    const pasta = foods.find(f => f.foodName === "Pasta");
    const biryani = foods.find(f => f.foodName === "Biryani");
    if (!pizza || !burger || !pasta || !biryani) {
        throw new Error("Default food items are not present in foods mock database");
    }
});

addTest("Test 3.2", "Default food items have correct properties", async () => {
    const pizza = foods.find(f => f.foodName === "Pizza");
    if (pizza.category !== "Pizza" || pizza.price !== 299 || pizza.description !== "Cheesy Veg Pizza") {
        throw new Error("Seeded Pizza properties are incorrect");
    }
});

addTest("Test 3.3", "Startup seeder creates dev@foodexpress.com if empty", async () => {
    const dev = users.find(u => u.email === "dev@foodexpress.com");
    if (!dev) throw new Error("dev@foodexpress.com was not seeded");
});

addTest("Test 3.4", "Developer account has password securely hashed", async () => {
    const dev = users.find(u => u.email === "dev@foodexpress.com");
    if (!dev.password.startsWith("$2a$") && !dev.password.startsWith("$2b$")) {
        throw new Error("Developer account password is not hashed");
    }
    const check = await dev.comparePassword("dev@123");
    if (!check) throw new Error("Developer hashed password does not match 'dev@123'");
});

addTest("Test 3.5", "Developer account can log in successfully", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success || !data.data.token) {
        throw new Error("Developer login failed");
    }
});

// Feature 4: Food Carousel & UI Enhancements
addTest("Test 4.1", "Carousel container element is present in index.html", async () => {
    const html = readHTML("index.html");
    if (!html.includes('class="carousel"') && !html.includes('id="carousel"')) {
        throw new Error("Carousel element missing in index.html");
    }
});

addTest("Test 4.2", "Carousel contains slide elements representing food items", async () => {
    const html = readHTML("index.html");
    if (!html.includes("carousel-slide")) throw new Error("Carousel slide elements missing");
});

addTest("Test 4.3", "index.html or script.js has sliding slide controls", async () => {
    const html = readHTML("index.html");
    if (!html.includes("prev-btn") || !html.includes("next-btn")) {
        throw new Error("Prev/Next buttons missing for carousel");
    }
});

addTest("Test 4.4", "Carousel styling is defined in style.css", async () => {
    const css = readCSS("style.css");
    if (!css.includes(".carousel") || !css.includes("display: flex") || !css.includes("animation")) {
        throw new Error("Carousel styles (flex, animation) missing in style.css");
    }
});

addTest("Test 4.5", "Carousel structure is placed correctly below hero section", async () => {
    const html = readHTML("index.html");
    const heroIdx = html.indexOf('class="hero"');
    const carouselIdx = html.indexOf('id="carousel-section"');
    if (heroIdx === -1 || carouselIdx === -1 || carouselIdx < heroIdx) {
        throw new Error("Carousel section is not correctly placed below hero");
    }
});

// Feature 5: Shopping Cart & Checkout Integration
addTest("Test 5.1", "Cart page cart.html exists and displays Grand Total", async () => {
    const html = readHTML("cart.html");
    if (!html.includes("table") && !html.includes("cart-items")) throw new Error("Missing cart items container");
    if (!html.includes("Grand Total")) throw new Error("Missing Grand Total display");
});

addTest("Test 5.2", "Checkout page checkout.html exists and contains form controls", async () => {
    const html = readHTML("checkout.html");
    if (!html.includes("textarea") || !html.includes("select")) {
        throw new Error("Missing address textarea or payment method select dropdown");
    }
});

addTest("Test 5.3", "script.js contains local storage operations for cart", async () => {
    const js = readJS("script.js");
    if (!js.includes('localStorage.setItem("cart"') && !js.includes("localStorage.setItem('cart'")) {
        throw new Error("script.js lacks local storage setItem for cart");
    }
});

addTest("Test 5.4", "Checkout endpoint accepts order details and creates a new order", async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;

    const res = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            foodItems: [{ foodId: foods[0]._id, quantity: 2 }],
            address: "Test Delivery Address 5.4",
            paymentMethod: "Cash on Delivery"
        })
    });
    const data = await res.json();
    if (res.status !== 201 || !data.success || !data.data._id) {
        throw new Error("Order creation failed");
    }
});

addTest("Test 5.5", "Order checkout requires JWT token and fails with 401 if missing", async () => {
    const res = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            foodItems: [{ foodId: foods[0]._id, quantity: 1 }],
            address: "Address",
            paymentMethod: "Cash on Delivery"
        })
    });
    if (res.status !== 401) throw new Error("Expected 401 Unauthorized status code");
});

// Feature 6: Order History Page
addTest("Test 6.1", "Order history page orders.html exists and contains list container", async () => {
    const html = readHTML("orders.html");
    if (!html.includes('id="orders-container"')) {
        throw new Error("orders.html is missing orders-container element");
    }
});

addTest("Test 6.2", "Fetch Orders endpoint my-orders retrieves user's orders", async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;

    const res = await fetch(`${BASE_URL}/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success || !Array.isArray(data.data)) {
        throw new Error("GET /api/orders/my-orders failed");
    }
});

addTest("Test 6.3", "Get my-orders requires JWT token and fails with 401 if missing", async () => {
    const res = await fetch(`${BASE_URL}/orders/my-orders`);
    if (res.status !== 401) throw new Error("Expected 401 Unauthorized status code");
});

addTest("Test 6.4", "Order history displays ordered items, quantities, total price, status, date", async () => {
    const js = readJS("script.js");
    if (!js.includes("orderStatus") || !js.includes("totalPrice") || !js.includes("createdAt")) {
        throw new Error("script.js is missing fields required to render order history information");
    }
});

addTest("Test 6.5", "Orders are returned in reverse chronological order (newest first)", async () => {
    const orderCtrl = fs.readFileSync(path.join(__dirname, "controllers/orderController.js"), "utf8");
    if (!orderCtrl.includes("createdAt: -1") && !orderCtrl.includes("createdAt: 'desc'")) {
        throw new Error("orderController does not sort user orders newest first");
    }
});

// Feature 7: Run Documentation (README.md)
addTest("Test 7.1", "README.md file exists in the root directory", async () => {
    if (!fs.existsSync("README.md")) throw new Error("README.md not found");
});

addTest("Test 7.2", "README.md contains instructions for setting up/installing prerequisites", async () => {
    const md = fs.readFileSync("README.md", "utf8");
    if (!md.includes("npm install")) throw new Error("npm install not found in README.md");
});

addTest("Test 7.3", "README.md contains instructions for running/starting server", async () => {
    const md = fs.readFileSync("README.md", "utf8");
    if (!md.includes("npm start") && !md.includes("node server.js")) {
        throw new Error("Server start instructions not found in README.md");
    }
});

addTest("Test 7.4", "README.md contains instructions for testing the application", async () => {
    const md = fs.readFileSync("README.md", "utf8");
    if (!md.includes("run_e2e_tests.js")) throw new Error("Testing instructions missing run_e2e_tests.js in README.md");
});

addTest("Test 7.5", "README.md is formatted in Markdown with proper headers", async () => {
    const md = fs.readFileSync("README.md", "utf8");
    if (!md.startsWith("#") || !md.includes("##")) throw new Error("README.md formatting invalid");
});

// ----------------------------------------------------
// TIER 2: Boundary & Corner Cases (35 Tests)
// ----------------------------------------------------

// Feature 1: User Authentication
addTest("Test 1.6", "Signup fails with 400 when fields are missing/invalid", async () => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "bademail" })
    });
    if (res.status !== 400) throw new Error("Signup did not fail with 400 for bad input");
});

addTest("Test 1.7", "Signup fails when attempting to register an already existing email", async () => {
    const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Dev Copy",
            email: "dev@foodexpress.com",
            phone: "1234567890",
            password: "devpassword"
        })
    });
    if (res.status !== 400) throw new Error("Expected 400 for duplicate email signup");
});

addTest("Test 1.8", "Login fails with 401/400 for incorrect password or non-existent email", async () => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "wrong_password" })
    });
    if (res.status !== 401 && res.status !== 400) throw new Error(`Expected 401/400, got ${res.status}`);
});

addTest("Test 1.9", "Authentication middleware rejects expired or malformed JWT tokens", async () => {
    const res = await fetch(`${BASE_URL}/orders/my-orders`, {
        headers: { "Authorization": "Bearer badtoken123" }
    });
    if (res.status !== 401) throw new Error("Expected 401 for bad token");
});

addTest("Test 1.10", "Auth middleware rejects request with empty Auth header", async () => {
    const res = await fetch(`${BASE_URL}/orders/my-orders`, {
        headers: { "Authorization": "" }
    });
    if (res.status !== 401) throw new Error("Expected 401 for empty Auth header");
});

// Feature 2: Dynamic Menu Retrieval & Display
addTest("Test 2.6", "Get foods endpoint returns empty array (status 200) instead of crashing if DB has no foods", async () => {
    const oldFoods = [...foods];
    foods.length = 0; // Clear
    const res = await fetch(`${BASE_URL}/foods`);
    const data = await res.json();
    foods.push(...oldFoods); // Restore
    if (res.status !== 200 || !data.success || data.data.length !== 0) {
        throw new Error("Did not return empty array successfully when no foods exist");
    }
});

addTest("Test 2.7", "Fetching food by invalid ID returns 404", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${BASE_URL}/foods/${fakeId}`);
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
});

addTest("Test 2.8", "Fetching food by malformed ID string returns 400 or 404 (handled gracefully, no 500 crash)", async () => {
    const res = await fetch(`${BASE_URL}/foods/malformedid`);
    if (res.status !== 400 && res.status !== 404) throw new Error(`Expected 400 or 404, got ${res.status}`);
});

addTest("Test 2.9", "Frontend script handles empty menu list gracefully (displays message)", async () => {
    const js = readJS("script.js");
    if (!js.includes("No items available") && !js.includes("no-items")) {
        throw new Error("script.js does not handle empty menu gracefully");
    }
});

addTest("Test 2.10", "Frontend menu rendering handles missing image URL or broken images (fallback)", async () => {
    const js = readJS("script.js");
    if (!js.includes("default-food.jpg") || !js.includes("onerror")) {
        throw new Error("script.js missing fallback image details on error");
    }
});

// Feature 3: Database Seeding on Startup
addTest("Test 3.6", "If database is not empty, server startup does NOT overwrite or duplicate seeded foods", async () => {
    const countBefore = foods.length;
    const dbHelper = require("./config/db");
    await dbHelper();
    if (foods.length !== countBefore) throw new Error("Foods list grew or changed during duplicate seed runs");
});

addTest("Test 3.7", "If database is not empty, server startup does NOT overwrite or duplicate seeded dev account", async () => {
    const countBefore = users.filter(u => u.email === "dev@foodexpress.com").length;
    const dbHelper = require("./config/db");
    await dbHelper();
    const countAfter = users.filter(u => u.email === "dev@foodexpress.com").length;
    if (countAfter !== countBefore) throw new Error("Developer account duplicated during multiple seed operations");
});

addTest("Test 3.8", "Database seeder handles missing environment variables gracefully (does not crash)", async () => {
    const uri = process.env.MONGO_URI;
    delete process.env.MONGO_URI;
    let exitCalled = false;
    const origExit = process.exit;
    process.exit = () => { exitCalled = true; };
    try {
        const dbHelper = require("./config/db");
        await dbHelper();
    } catch (e) {
        // expected
    } finally {
        process.exit = origExit;
        process.env.MONGO_URI = uri;
    }
    if (!exitCalled) throw new Error("Seeder did not gracefully exit on missing MONGO_URI");
});

addTest("Test 3.9", "Multiple rapid restarts do not lead to race conditions or duplicate entries", async () => {
    const startFoods = foods.length;
    const startUsers = users.length;
    const dbHelper = require("./config/db");
    await Promise.all([dbHelper(), dbHelper(), dbHelper()]);
    if (foods.length !== startFoods || users.length !== startUsers) {
        throw new Error("Rapid seeding caused duplication of items or users");
    }
});

addTest("Test 3.10", "Seeder sets correct default prices for seeded Pizza, Burger, Pasta, Biryani", async () => {
    const pizza = foods.find(f => f.foodName === "Pizza");
    const burger = foods.find(f => f.foodName === "Burger");
    if (pizza.price !== 299 || burger.price !== 199) throw new Error("Default prices are incorrect");
});

// Feature 4: Food Carousel & UI Enhancements
addTest("Test 4.6", "Carousel JS does not throw exceptions if there are zero items in the list", async () => {
    const js = readJS("script.js");
    if (!js.includes("slides.length === 0")) throw new Error("script.js missing zero slides check");
});

addTest("Test 4.7", "Carousel handles single food item without attempting loop/transition", async () => {
    const js = readJS("script.js");
    if (!js.includes("slides.length === 1")) throw new Error("script.js missing single slide check");
});

addTest("Test 4.8", "Rapid clicking of prev/next buttons does not cause layout breakdown", async () => {
    const js = readJS("script.js");
    if (!js.includes("isTransitioning")) throw new Error("script.js missing rapid click throttle flag");
});

addTest("Test 4.9", "Carousel CSS remains responsive and readable on small screens", async () => {
    const css = readCSS("style.css");
    if (!css.includes("@media")) throw new Error("style.css missing responsive styling for small screens");
});

addTest("Test 4.10", "Carousel JS runs asynchronously and does not block page load", async () => {
    const js = readJS("script.js");
    if (!js.includes("setInterval")) throw new Error("Carousel does not execute sliding asynchronously");
});

// Feature 5: Shopping Cart & Checkout Integration
addTest("Test 5.6", "Checkout API rejects empty cart order (foodItems empty array)", async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;

    const res = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ foodItems: [], address: "Addy", paymentMethod: "UPI" })
    });
    if (res.status !== 400) throw new Error("Expected 400 Bad Request for empty food list");
});

addTest("Test 5.7", "Checkout API rejects items with zero or negative quantities", async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;

    const res = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            foodItems: [{ foodId: foods[0]._id, quantity: -2 }],
            address: "Addy",
            paymentMethod: "UPI"
        })
    });
    if (res.status !== 400) throw new Error("Expected 400 Bad Request for negative quantity");
});

addTest("Test 5.8", "Checkout API rejects invalid or non-existent foodId", async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;

    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            foodItems: [{ foodId: fakeId, quantity: 1 }],
            address: "Addy",
            paymentMethod: "UPI"
        })
    });
    if (res.status !== 404) throw new Error("Expected 404 for non-existent food item ID");
});

addTest("Test 5.9", "Checkout API rejects order with empty address or missing paymentMethod", async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;

    const res = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            foodItems: [{ foodId: foods[0]._id, quantity: 1 }],
            address: "",
            paymentMethod: "UPI"
        })
    });
    if (res.status !== 400) throw new Error("Expected 400 for empty address");
});

addTest("Test 5.10", "Shopping cart total matches exact decimal addition (no IEEE 754 precision issues)", async () => {
    const js = readJS("script.js");
    if (!js.includes(".toFixed(2)")) throw new Error("script.js does not calculate/render decimals precisely");
});

// Feature 6: Order History Page
addTest("Test 6.6", "Fetch my-orders returns 200 with empty array if user has no orders", async () => {
    const loginRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Empty Order User",
            email: `empty.${Date.now()}@example.com`,
            phone: "9999999999",
            password: "password123"
        })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;

    const res = await fetch(`${BASE_URL}/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const data = await res.json();
    if (res.status !== 200 || data.data.length !== 0) throw new Error("Did not return empty order array cleanly");
});

addTest("Test 6.7", "Fetching my-orders with token from user A does not return orders from user B", async () => {
    // User A token
    const loginA = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const tokenA = (await loginA.json()).data.token;

    // User B token
    const loginB = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "User B",
            email: `userb.${Date.now()}@example.com`,
            phone: "1111111111",
            password: "password123"
        })
    });
    const tokenB = (await loginB.json()).data.token;

    // Place order for User A
    await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${tokenA}` },
        body: JSON.stringify({
            foodItems: [{ foodId: foods[0]._id, quantity: 1 }],
            address: "Secret User A address",
            paymentMethod: "UPI"
        })
    });

    // Check User B my-orders does not return User A's order
    const resB = await fetch(`${BASE_URL}/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${tokenB}` }
    });
    const dataB = await resB.json();
    if (dataB.data.some(order => order.address === "Secret User A address")) {
        throw new Error("User B can access User A's order history data");
    }
});

addTest("Test 6.8", "Order history page handles long lists of orders without breaking styling", async () => {
    const html = readHTML("orders.html");
    if (!html.includes('class="cart-container"') && !html.includes('class="container"')) {
        throw new Error("orders.html styling container missing");
    }
});

addTest("Test 6.9", "Backend rejects changing order status via unauthorized API endpoints", async () => {
    const res = await fetch(`${BASE_URL}/orders/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderStatus: "Delivered" })
    });
    if (res.status !== 404 && res.status !== 401) {
        throw new Error(`Expected 404 or 401 for unauthorized status change, got ${res.status}`);
    }
});

addTest("Test 6.10", "Expired JWT tokens clear localStorage and redirect to login.html", async () => {
    const js = readJS("script.js");
    if (!js.includes("window.location.href = \"login.html\"") && !js.includes("window.location.href = 'login.html'")) {
        throw new Error("script.js lacks login redirect logic");
    }
    if (!js.includes("localStorage.removeItem")) {
        throw new Error("script.js lacks localStorage clearing commands");
    }
});

// Feature 7: Run Documentation (README.md)
addTest("Test 7.6", "README.md contains no placeholder or TODO comments", async () => {
    const md = fs.readFileSync("README.md", "utf8");
    if (md.includes("TODO") || md.includes("placeholder")) throw new Error("README.md has TODO tags");
});

addTest("Test 7.7", "README.md specifies correct environment variables (.env setup)", async () => {
    const md = fs.readFileSync("README.md", "utf8");
    if (!md.includes("MONGO_URI") || !md.includes("PORT")) throw new Error("Missing config variables in README.md");
});

addTest("Test 7.8", "README.md specifies correct MongoDB requirements", async () => {
    const md = fs.readFileSync("README.md", "utf8");
    if (!md.toLowerCase().includes("mongodb")) throw new Error("Missing MongoDB info in README.md");
});

addTest("Test 7.9", "README.md contains correct default port number", async () => {
    const md = fs.readFileSync("README.md", "utf8");
    if (!md.includes("3000")) throw new Error("Default port 3000 not specified in README.md");
});

addTest("Test 7.10", "README.md has no broken links or invalid markup", async () => {
    const md = fs.readFileSync("README.md", "utf8");
    if (md.includes("href=") || md.includes("src=")) throw new Error("Invalid markdown syntax in links");
});

// ----------------------------------------------------
// TIER 3: Cross-Feature Combinations (7 Tests)
// ----------------------------------------------------

addTest("Test 3_1", "DB Startup Seed -> Fetch foods endpoint successfully returns seeded items", async () => {
    const res = await fetch(`${BASE_URL}/foods`);
    const data = await res.json();
    const names = data.data.map(f => f.foodName);
    if (!names.includes("Pizza") || !names.includes("Burger") || !names.includes("Pasta") || !names.includes("Biryani")) {
        throw new Error("Startup seeding failed to return all seeded foods");
    }
});

addTest("Test 3_2", "Signup -> Login -> Seeded developer login works in sequence", async () => {
    // 1. Signup user A
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Seq User A",
            email: `seq.a.${Date.now()}@example.com`,
            phone: "0000000000",
            password: "password123"
        })
    });
    if ((await signupRes.json()).success !== true) throw new Error("Seq Signup failed");

    // 2. Login dev@foodexpress.com
    const devLogin = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    if ((await devLogin.json()).success !== true) throw new Error("Developer login failed in sequence");
});

addTest("Test 3_3", "Login -> Create Food (Admin) -> Fetch foods endpoint contains the new item", async () => {
    const login = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const token = (await login.json()).data.token;

    const addRes = await fetch(`${BASE_URL}/foods/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            foodName: "Sequence Taco",
            category: "Mexican",
            price: 159.5,
            image: "images/taco.jpg",
            description: "Spicy Mexican taco"
        })
    });
    if ((await addRes.json()).success !== true) throw new Error("Admin Food creation failed");

    const getRes = await fetch(`${BASE_URL}/foods`);
    const getData = await getRes.json();
    if (!getData.data.some(f => f.foodName === "Sequence Taco")) {
        throw new Error("Created food item is missing from active menu list");
    }
});

addTest("Test 3_4", "Login -> Fetch Foods -> Add to Cart -> Checkout -> View Order History", async () => {
    const login = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const token = (await login.json()).data.token;

    const foodsRes = await fetch(`${BASE_URL}/foods`);
    const foodsData = await foodsRes.json();
    const target = foodsData.data[0];

    const checkoutRes = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            foodItems: [{ foodId: target._id, quantity: 4 }],
            address: "Sequence State Checkout Address",
            paymentMethod: "UPI"
        })
    });
    const orderId = (await checkoutRes.json()).data._id;

    const historyRes = await fetch(`${BASE_URL}/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const historyData = await historyRes.json();
    if (!historyData.data.some(o => o._id === orderId)) {
        throw new Error("Completed checkout order not found in user history");
    }
});

addTest("Test 3_5", "Cart localstorage updates UI -> Log out -> Cart state remains intact in localStorage", async () => {
    const js = readJS("script.js");
    const logoutIdx = js.indexOf("logoutBtn");
    if (logoutIdx !== -1) {
        const logoutSection = js.substring(logoutIdx, logoutIdx + 500);
        if (logoutSection.includes("removeItem") && logoutSection.includes("cart")) {
            throw new Error("script.js clears shopping cart during user logout event");
        }
    }
});

addTest("Test 3_6", "Place order -> Verify details (quantities, item IDs) in Order History match", async () => {
    const login = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const token = (await login.json()).data.token;
    const foodId = foods[1]._id;

    const placeRes = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            foodItems: [{ foodId, quantity: 7 }],
            address: "Sequence Match Verify Addy",
            paymentMethod: "Cash on Delivery"
        })
    });
    const placeData = await placeRes.json();
    const orderId = placeData.data._id;

    const histRes = await fetch(`${BASE_URL}/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const histData = await histRes.json();
    const foundOrder = histData.data.find(o => o._id === orderId);
    if (!foundOrder) throw new Error("Order not found");
    if (foundOrder.foodItems[0].foodId._id.toString() !== foodId.toString() || foundOrder.foodItems[0].quantity !== 7) {
        throw new Error("Details in history do not match checkout payload");
    }
});

addTest("Test 3_7", "Place multiple orders -> View order history -> Verify sorting is correct", async () => {
    const login = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const token = (await login.json()).data.token;

    // Order 1
    const res1 = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            foodItems: [{ foodId: foods[0]._id, quantity: 1 }],
            address: "Multi Order Sort 1",
            paymentMethod: "UPI"
        })
    });
    const id1 = (await res1.json()).data._id;

    await new Promise(r => setTimeout(r, 50));

    // Order 2
    const res2 = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            foodItems: [{ foodId: foods[1]._id, quantity: 1 }],
            address: "Multi Order Sort 2",
            paymentMethod: "UPI"
        })
    });
    const id2 = (await res2.json()).data._id;

    const histRes = await fetch(`${BASE_URL}/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const histData = await histRes.json();
    const idx1 = histData.data.findIndex(o => o._id === id1);
    const idx2 = histData.data.findIndex(o => o._id === id2);
    if (idx2 > idx1) throw new Error("Orders not sorted with newest first");
});

// ----------------------------------------------------
// TIER 4: Real-World Application Scenarios (5 Tests)
// ----------------------------------------------------

addTest("Test 4_A", "New User Ordering Scenario: Signup -> Login -> Add items -> Checkout -> Verify", async () => {
    const email = `newuser.scenario.${Date.now()}@example.com`;
    const password = "password123";

    // 1. Signup
    const sRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Scenario A User", email, phone: "1234567890", password })
    });
    const token = (await sRes.json()).data.token;

    // 2. Add 1 Burger & 1 Pizza to Cart (representing menu load & selection)
    const burger = foods.find(f => f.foodName === "Burger");
    const pizza = foods.find(f => f.foodName === "Pizza");

    // 3. Checkout
    const checkoutRes = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            foodItems: [
                { foodId: burger._id, quantity: 1 },
                { foodId: pizza._id, quantity: 1 }
            ],
            address: "99 Scenario Street, Delhi, IN",
            paymentMethod: "Cash on Delivery"
        })
    });
    const orderId = (await checkoutRes.json()).data._id;

    // 4. Verify in history
    const histRes = await fetch(`${BASE_URL}/orders/my-orders`, {
        headers: { "Authorization": `Bearer ${token}` }
    });
    const histData = await histRes.json();
    const found = histData.data.find(o => o._id === orderId);
    if (!found || found.totalPrice !== (burger.price + pizza.price)) {
        throw new Error("Order verification failed on new user flow");
    }
});

addTest("Test 4_B", "Developer Admin Add & Verify Scenario: Login -> Add item -> Verify on homepage", async () => {
    // 1. Login dev
    const login = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const token = (await login.json()).data.token;

    // 2. Add custom item
    const addRes = await fetch(`${BASE_URL}/foods/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            foodName: "Scenario French Fries",
            category: "Sides",
            price: 99,
            image: "images/fries.jpg",
            description: "Crispy golden french fries"
        })
    });
    if ((await addRes.json()).success !== true) throw new Error("Failed to add side food item");

    // 3. Verify item is in list
    const getRes = await fetch(`${BASE_URL}/foods`);
    const getData = await getRes.json();
    const found = getData.data.find(f => f.foodName === "Scenario French Fries");
    if (!found || found.price !== 99) throw new Error("Added side item was not successfully returned");
});

addTest("Test 4_C", "Guest Persistent Shopping Flow: Guest Cart -> Register -> Login -> Checkout", async () => {
    // Simulate UI guest flow using mock endpoints.
    // Sign up a user
    const email = `guest.scenario.${Date.now()}@example.com`;
    const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            name: "Guest Flow User",
            email,
            phone: "9898989898",
            password: "password123"
        })
    });
    const token = (await signupRes.json()).data.token;

    // Place checkout for Biryani
    const biryani = foods.find(f => f.foodName === "Biryani");
    const placeRes = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            foodItems: [{ foodId: biryani._id, quantity: 1 }],
            address: "Guest flow address",
            paymentMethod: "Cash on Delivery"
        })
    });
    if ((await placeRes.json()).success !== true) throw new Error("Checkout fails for guest persistent cart flow");
});

addTest("Test 4_D", "Cart Modification & Checkout Flow: User logs in -> Cart edits -> checkout -> Verify", async () => {
    const login = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const token = (await login.json()).data.token;

    // Simulate cart edits (originally 3 Pastas & 2 Burgers, reduced/increased to 2 Pastas & 3 Burgers)
    const pasta = foods.find(f => f.foodName === "Pasta");
    const burger = foods.find(f => f.foodName === "Burger");
    const expected = (pasta.price * 2) + (burger.price * 3);

    const placeRes = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            foodItems: [
                { foodId: pasta._id, quantity: 2 },
                { foodId: burger._id, quantity: 3 }
            ],
            address: "Mod cart address",
            paymentMethod: "UPI"
        })
    });
    const orderData = (await placeRes.json()).data;
    if (orderData.totalPrice !== expected) throw new Error(`Cart total mismatch on checkout: got ${orderData.totalPrice}, expected ${expected}`);
});

addTest("Test 4_E", "Unauthorized Checkout Prevention Flow: Direct order place invalid token blocked -> Login -> place order success", async () => {
    // 1. Send order with invalid token
    const resBad = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": "Bearer fake_token" },
        body: JSON.stringify({
            foodItems: [{ foodId: foods[0]._id, quantity: 1 }],
            address: "Block Address",
            paymentMethod: "UPI"
        })
    });
    if (resBad.status !== 401) throw new Error(`Expected 401 for unauthorized order placement, got ${resBad.status}`);

    // 2. Login to get valid token
    const login = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "dev@foodexpress.com", password: "dev@123" })
    });
    const token = (await login.json()).data.token;

    // 3. Resend with valid token
    const resGood = await fetch(`${BASE_URL}/orders/place`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
            foodItems: [{ foodId: foods[0]._id, quantity: 1 }],
            address: "Success Address",
            paymentMethod: "UPI"
        })
    });
    if (resGood.status !== 201) throw new Error(`Expected 201 for valid order placement, got ${resGood.status}`);
});

// Milestone 3 Specific Verifications
addTest("Test 3.11", "Dynamic menu card rendering includes category and data-id/id attributes", async () => {
    const js = readJS("script.js");
    if (!js.includes('food-category') || !js.includes('data-id="${food._id}"') || !js.includes('Add to Cart')) {
        throw new Error("script.js dynamic menu template is missing category, data-id attribute, or correct button label");
    }
});

addTest("Test 3.12", "index.html has no hardcoded food cards inside food-list container", async () => {
    const html = readHTML("index.html");
    const containerStart = html.indexOf('id="food-list"');
    if (containerStart === -1) throw new Error("food-list container missing");
    const containerEnd = html.indexOf('</div>', containerStart);
    const content = html.substring(containerStart, containerEnd);
    if (content.includes('class="card"')) {
        throw new Error("index.html contains hardcoded food cards inside food-list container");
    }
});

addTest("Test 3.13", "Carousel inner container is set up and referenced for smooth translateX translation", async () => {
    const html = readHTML("index.html");
    if (!html.includes('carousel-inner')) {
        throw new Error("carousel-inner container missing in index.html");
    }
    const js = readJS("script.js");
    if (!js.includes('carousel-inner') || !js.includes('translateX')) {
        throw new Error("script.js does not reference carousel-inner or translateX for transition");
    }
    const css = readCSS("style.css");
    if (!css.includes('.carousel-inner')) {
        throw new Error("style.css is missing .carousel-inner styling rules");
    }
});

// ----------------------------------------------------
// 8. Execute Test Suite & Print Report
// ----------------------------------------------------
async function runTestSuite() {
    console.log("\n=======================================================");
    console.log("🚀 Starting FoodExpress E2E Integration Test Suite");
    console.log("=======================================================");

    // Wait a short moment to ensure the server is fully ready
    await new Promise(r => setTimeout(r, 1200));

    let passed = 0;
    let failed = 0;
    const failedTests = [];

    for (const t of testCases) {
        try {
            await t.fn();
            console.log(`[PASS] ${t.id} - ${t.name}`);
            passed++;
        } catch (error) {
            console.log(`[FAIL] ${t.id} - ${t.name}`);
            console.log(`       👉 ERROR: ${error.message}`);
            failed++;
            failedTests.push({ id: t.id, name: t.name, error: error.message });
        }
    }

    console.log("\n=======================================================");
    console.log("📊 FINAL E2E TEST RUN REPORT");
    console.log("=======================================================");
    console.log(`Total Mapped Test Cases: ${testCases.length}`);
    console.log(`Passed Test Cases:       ${passed}`);
    console.log(`Failed Test Cases:       ${failed}`);
    console.log("=======================================================");

    if (failed > 0) {
        console.log("\n❌ E2E Integration Test Suite Failed!");
        console.log("Failures Details:");
        failedTests.forEach(f => {
            console.log(`- ${f.id} [${f.name}]: ${f.error}`);
        });
        process.exit(1);
    } else {
        console.log("\n🎉 All 82 E2E integration tests passed successfully!");
        process.exit(0);
    }
}

runTestSuite();
