const User = require("../models/User");
const Food = require("../models/Food");

/**
 * Seed the database on startup if collections are empty.
 */
const seedDatabase = async () => {
    try {
        // 1. Check if User collection is empty
        const userCount = await User.countDocuments();
        if (userCount === 0) {
            console.log("🌱 Seeding developer user...");
            await User.create({
                name: "Developer",
                email: "dev@foodexpress.com",
                phone: "1234567890",
                password: "dev@123",
            });
            console.log("✅ Developer user seeded successfully!");
        }

        // 2. Check if Food collection is empty
        const foodCount = await Food.countDocuments();
        if (foodCount === 0) {
            console.log("🌱 Seeding default food items...");
            const defaultFoods = [
                {
                    foodName: "Pizza",
                    price: 299,
                    image: "images/pizza.jpg",
                    description: "Cheesy Veg Pizza",
                    category: "Pizza",
                },
                {
                    foodName: "Burger",
                    price: 199,
                    image: "images/burger.jpg",
                    description: "Double Cheese Burger",
                    category: "Burger",
                },
                {
                    foodName: "Pasta",
                    price: 249,
                    image: "images/pasta.jpg",
                    description: "White Sauce Pasta",
                    category: "Pasta",
                },
                {
                    foodName: "Biryani",
                    price: 349,
                    image: "images/biryani.jpg",
                    description: "Chicken Biryani",
                    category: "Biryani",
                },
            ];

            // Insert default food items
            for (const food of defaultFoods) {
                await Food.create(food);
            }
            console.log("✅ Default food items seeded successfully!");
        }
    } catch (error) {
        console.error(`❌ Seeding failed: ${error.message}`);
    }
};

module.exports = seedDatabase;
