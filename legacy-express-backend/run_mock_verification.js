// Set environment variables for testing
process.env.PORT = 3009;
process.env.JWT_SECRET = "test_jwt_secret_key_123456789";
process.env.MONGO_URI = "mongodb://localhost:27017/testdb";

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// ----------------------------------------------------
// 1. Mongoose Connection Mock
// ----------------------------------------------------
mongoose.connect = async () => {
    console.log("🔌 [MOCK] Database connection simulated successfully.");
    return { connection: { host: "mock-atlas-cluster" } };
};

// ----------------------------------------------------
// 2. In-Memory Database Stores
// ----------------------------------------------------
const users = [];
const foods = [];
const orders = [];

// ----------------------------------------------------
// 3. Mock User Model Methods
// ----------------------------------------------------
const User = require("./models/User");

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

User.countDocuments = async () => {
    return users.length;
};

// ----------------------------------------------------
// 4. Mock Food Model Methods
// ----------------------------------------------------
const Food = require("./models/Food");

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

Food.countDocuments = async () => {
    return foods.length;
};

// ----------------------------------------------------
// 5. Mock Order Model Methods
// ----------------------------------------------------
const Order = require("./models/Order");

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

// ----------------------------------------------------
// 6. Start the Server
// ----------------------------------------------------
console.log("🟢 Starting FoodExpress Server with Mocks...");
require("./server");

// ----------------------------------------------------
// 7. Run Test Script
// ----------------------------------------------------
const testUserPayload = {
    name: "John Doe",
    email: `john.doe.${Date.now()}@example.com`,
    phone: "1234567890",
    password: "securepassword123",
};

const testFoodPayload = {
    foodName: "Spicy Paneer Tikka Pizza",
    category: "Pizza",
    price: 349.99,
    image: "https://example.com/images/paneer-pizza.jpg",
    description: "Delectable paneer tikka toppings over fresh cheese burst pizza crust.",
};

const BASE_URL = `http://localhost:3009/api`;

async function runTests() {
    console.log("\n🚀 Starting FoodExpress API Integration Tests...");
    let token = "";
    let foodId = "";

    try {
        // Wait a short moment to ensure the server listener is bound
        await new Promise(r => setTimeout(r, 1000));

        // 1. Test Signup API
        console.log("\n1. Testing Signup API...");
        const signupRes = await fetch(`${BASE_URL}/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(testUserPayload),
        });
        const signupData = await signupRes.json();
        console.log(`Signup Status: ${signupRes.status}`);
        console.log("Signup Response:", JSON.stringify(signupData, null, 2));

        if (!signupData.success) {
            throw new Error(`Signup failed: ${signupData.message}`);
        }

        // 2. Test Login API
        console.log("\n2. Testing Login API...");
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testUserPayload.email,
                password: testUserPayload.password,
            }),
        });
        const loginData = await loginRes.json();
        console.log(`Login Status: ${loginRes.status}`);
        console.log("Login Response:", JSON.stringify(loginData, null, 2));

        if (!loginData.success || !loginData.data.token) {
            throw new Error(`Login failed: ${loginData.message}`);
        }
        token = loginData.data.token;

        // 2.1. Test Developer Login and verify user properties
        console.log("\n2.1. Testing Developer Login and Verifying Properties...");
        const devLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: "dev@foodexpress.com",
                password: "dev@123",
            }),
        });
        const devLoginData = await devLoginRes.json();
        console.log(`Developer Login Status: ${devLoginRes.status}`);
        console.log("Developer Login Response:", JSON.stringify(devLoginData, null, 2));

        if (!devLoginData.success) {
            throw new Error(`Developer Login failed: ${devLoginData.message}`);
        }

        const devUser = devLoginData.data;
        if (devUser.name !== "Developer") {
            throw new Error(`Incorrect developer user name: expected "Developer", got "${devUser.name}"`);
        }
        if (devUser.email !== "dev@foodexpress.com") {
            throw new Error(`Incorrect developer user email: expected "dev@foodexpress.com", got "${devUser.email}"`);
        }
        if (devUser.phone !== "1234567890") {
            throw new Error(`Incorrect developer user phone: expected "1234567890", got "${devUser.phone}"`);
        }
        if (!devUser.token) {
            throw new Error("Developer login response missing JWT token");
        }
        console.log("✅ Developer user properties verified successfully!");

        // 3. Test Add Food API (Protected)
        console.log("\n3. Testing Add Food API...");
        const addFoodRes = await fetch(`${BASE_URL}/foods/add`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(testFoodPayload),
        });
        const addFoodData = await addFoodRes.json();
        console.log(`Add Food Status: ${addFoodRes.status}`);
        console.log("Add Food Response:", JSON.stringify(addFoodData, null, 2));

        if (!addFoodData.success) {
            throw new Error(`Add Food failed: ${addFoodData.message}`);
        }
        foodId = addFoodData.data._id;

        // 4. Test Get All Foods API
        console.log("\n4. Testing Get All Foods API...");
        const getFoodsRes = await fetch(`${BASE_URL}/foods`);
        const getFoodsData = await getFoodsRes.json();
        console.log(`Get Foods Status: ${getFoodsRes.status}`);
        console.log("Foods found:", getFoodsData.data.length);
        console.log("First Food Item:", JSON.stringify(getFoodsData.data[0], null, 2));

        if (!getFoodsData.success) {
            throw new Error(`Get Foods failed: ${getFoodsData.message}`);
        }

        // 5. Test Get Food By ID API
        console.log(`\n5. Testing Get Food By ID API for ID: ${foodId}...`);
        const getFoodByIdRes = await fetch(`${BASE_URL}/foods/${foodId}`);
        const getFoodByIdData = await getFoodByIdRes.json();
        console.log(`Get Food By ID Status: ${getFoodByIdRes.status}`);
        console.log("Get Food By ID Response:", JSON.stringify(getFoodByIdData, null, 2));

        if (!getFoodByIdData.success) {
            throw new Error(`Get Food By ID failed: ${getFoodByIdData.message}`);
        }

        // 6. Test Place Order API (Protected)
        console.log("\n6. Testing Place Order API...");
        const orderPayload = {
            foodItems: [
                {
                    foodId: foodId,
                    quantity: 2,
                },
            ],
            address: "123, Food Street, Baker's Valley, CA",
            paymentMethod: "Cash on Delivery",
        };

        const placeOrderRes = await fetch(`${BASE_URL}/orders/place`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(orderPayload),
        });
        const placeOrderData = await placeOrderRes.json();
        console.log(`Place Order Status: ${placeOrderRes.status}`);
        console.log("Place Order Response:", JSON.stringify(placeOrderData, null, 2));

        if (!placeOrderData.success) {
            throw new Error(`Place Order failed: ${placeOrderData.message}`);
        }

        // 7. Test View Orders API (Protected)
        console.log("\n7. Testing View Orders API...");
        const viewOrdersRes = await fetch(`${BASE_URL}/orders/my-orders`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        const viewOrdersData = await viewOrdersRes.json();
        console.log(`View Orders Status: ${viewOrdersRes.status}`);
        console.log(`View Orders Response: Found ${viewOrdersData.count} orders for user.`);
        console.log("First Order Item:", JSON.stringify(viewOrdersData.data[0], null, 2));

        if (!viewOrdersData.success) {
            throw new Error(`View Orders failed: ${viewOrdersData.message}`);
        }

        console.log("\n🎉 All FoodExpress API Integration Tests Passed Successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\n❌ Test Suite Failed:", error.message);
        process.exit(1);
    }
}

runTests();
