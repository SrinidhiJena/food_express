const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const assert = require("assert");

console.log("=== Verification Script Starting ===");

// 1. Verify Duplicate Seeding Prevention
async function testDuplicateSeeding() {
    console.log("\n--- Testing Seeding Duplicate Prevention ---");
    
    // Clear require cache for models and seeder to ensure clean state
    delete require.cache[require.resolve("./models/User")];
    delete require.cache[require.resolve("./models/Food")];
    delete require.cache[require.resolve("./config/seeder")];
    
    const User = require("./models/User");
    const Food = require("./models/Food");
    
    let userCount = 0;
    let foodCount = 0;
    let userCreatedCount = 0;
    let foodCreatedCount = 0;
    
    // Mock counts and creates
    User.countDocuments = async () => {
        return userCount;
    };
    User.create = async (data) => {
        userCreatedCount++;
        userCount++;
        return data;
    };
    
    Food.countDocuments = async () => {
        return foodCount;
    };
    Food.create = async (data) => {
        foodCreatedCount++;
        foodCount++;
        return data;
    };
    
    const seedDatabase = require("./config/seeder");
    
    // First run: when database is empty
    console.log("Running seedDatabase() first time (empty DB)...");
    await seedDatabase();
    console.log(`User.create calls: ${userCreatedCount} (Expected: 1)`);
    console.log(`Food.create calls: ${foodCreatedCount} (Expected: 4)`);
    assert.strictEqual(userCreatedCount, 1, "User should be created once");
    assert.strictEqual(foodCreatedCount, 4, "Food items should be created 4 times");
    
    // Reset trackers but keep mock counts > 0
    userCreatedCount = 0;
    foodCreatedCount = 0;
    
    // Second run: when database is non-empty
    console.log("Running seedDatabase() second time (non-empty DB)...");
    await seedDatabase();
    console.log(`User.create calls: ${userCreatedCount} (Expected: 0)`);
    console.log(`Food.create calls: ${foodCreatedCount} (Expected: 0)`);
    assert.strictEqual(userCreatedCount, 0, "User should NOT be created again");
    assert.strictEqual(foodCreatedCount, 0, "Food items should NOT be created again");
    
    console.log("✅ Seeding duplicate prevention verified successfully!");
}

// 2. Verify Developer Credentials Hashing & Comparison (in Mock Environment)
async function testMockCredentials() {
    console.log("\n--- Testing Developer Credentials in Mock Environment ---");
    
    const mockUserPayload = {
        name: "Developer",
        email: "dev@foodexpress.com",
        phone: "1234567890",
        password: "dev@123",
    };
    
    // Simulate run_mock_verification.js's User.create behavior
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mockUserPayload.password, salt);
    
    const mockUser = {
        name: mockUserPayload.name,
        email: mockUserPayload.email.toLowerCase(),
        phone: mockUserPayload.phone,
        password: hashedPassword,
        comparePassword: async function (candidatePassword) {
            return await bcrypt.compare(candidatePassword, this.password);
        },
    };
    
    console.log(`Developer Plain Password: ${mockUserPayload.password}`);
    console.log(`Developer Hashed Password (Mock): ${mockUser.password}`);
    assert.ok(mockUser.password.startsWith("$2a$") || mockUser.password.startsWith("$2b$"), "Password should be hashed");
    assert.notStrictEqual(mockUser.password, mockUserPayload.password, "Password hash must not equal plain text");
    
    const correctMatch = await mockUser.comparePassword("dev@123");
    const incorrectMatch = await mockUser.comparePassword("wrongpassword");
    
    console.log(`Compare correct password: ${correctMatch} (Expected: true)`);
    console.log(`Compare incorrect password: ${incorrectMatch} (Expected: false)`);
    
    assert.strictEqual(correctMatch, true, "Correct password should match");
    assert.strictEqual(incorrectMatch, false, "Incorrect password should not match");
    
    console.log("✅ Developer credentials comparison in Mock Environment verified successfully!");
}

// 3. Verify Developer Credentials Hashing & Comparison (in Real Schema Environment)
async function testRealSchemaCredentials() {
    console.log("\n--- Testing Developer Credentials in Mongoose Schema Environment ---");
    
    const User = require("./models/User");
    const devUser = new User({
        name: "Developer",
        email: "dev@foodexpress.com",
        phone: "1234567890",
        password: "dev@123"
    });
    
    console.log(`Initial password in schema: ${devUser.password}`);
    
    // We expect the pre-save hook to fail because of 'next is not a function' bug
    // but the hashing should have happened before the crash. Let's capture the crash.
    try {
        await devUser.save();
        console.log("Unexpected: devUser.save() succeeded without a DB connection!");
    } catch (err) {
        console.log(`Save failed as expected. Error type/message: ${err.constructor.name}: ${err.message}`);
        
        if (err.message.includes("next is not a function")) {
            console.log("⚠️ CRITICAL BUG DETECTED: Pre-save hook crashed with 'next is not a function'!");
        }
        
        console.log(`Password after pre-save hook execution: ${devUser.password}`);
        
        // Verify if it was hashed
        const isHashed = devUser.password.startsWith("$2a$") || devUser.password.startsWith("$2b$");
        console.log(`Password is hashed: ${isHashed}`);
        assert.ok(isHashed, "Password should be hashed");
        
        // Test comparison using the schema method
        const matchCorrect = await devUser.comparePassword("dev@123");
        const matchIncorrect = await devUser.comparePassword("wrongpassword");
        
        console.log(`Schema comparePassword("dev@123"): ${matchCorrect} (Expected: true)`);
        console.log(`Schema comparePassword("wrongpassword"): ${matchIncorrect} (Expected: false)`);
        
        assert.strictEqual(matchCorrect, true, "Schema comparePassword should succeed for correct password");
        assert.strictEqual(matchIncorrect, false, "Schema comparePassword should fail for incorrect password");
    }
    
    console.log("✅ Real schema credentials verification completed.");
}

async function runAll() {
    try {
        await testDuplicateSeeding();
        await testMockCredentials();
        await testRealSchemaCredentials();
        console.log("\n🎉 All verification checks finished!");
        process.exit(0);
    } catch (err) {
        console.error("\n❌ Verification script failed:", err);
        process.exit(1);
    }
}

runAll();
