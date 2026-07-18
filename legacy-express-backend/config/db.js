const mongoose = require("mongoose");
const seedDatabase = require("./seeder");

const connectDB = async () => {
    try {
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI environment variable is missing.");
        }

        const conn = await mongoose.connect(uri);
        console.log(`🔌 MongoDB Connected: ${conn.connection.host}`);

        // Run database seeding on startup
        await seedDatabase();
    } catch (error) {
        console.error(`❌ Database connection failed: ${error.message}`);
        console.error(`⚠️  Server will continue running. Fix your MongoDB connection and restart.`);
        // Do NOT exit — let Express keep serving static files
    }
};

module.exports = connectDB;
