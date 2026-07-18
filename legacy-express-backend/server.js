require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./config/db");

// Import Routes
const authRoutes = require("./routes/authRoutes");
const foodRoutes = require("./routes/foodRoutes");
const orderRoutes = require("./routes/orderRoutes");

// Connect to Database
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware for parsing JSON and urlencoded requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (frontend)
app.use(express.static(__dirname));

// Mount API Routes
app.use("/api/auth", authRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);

// Existing home page route serving the static index.html
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Fallback Route for non-existent API endpoints
app.use("/api", (req, res) => {
    res.status(404).json({
        success: false,
        message: `API Route not found: ${req.originalUrl}`,
    });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
    console.error(`💥 Error: ${err.message}`);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "An unexpected server error occurred",
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
});