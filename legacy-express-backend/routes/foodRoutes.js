const express = require("express");
const router = express.Router();
const {
    addFood,
    getFoods,
    getFoodById,
} = require("../controllers/foodController");
const { protect } = require("../middleware/authMiddleware");

// @route   POST /api/foods/add
// @desc    Add a new food item
// @access  Private (Protected via auth middleware)
router.post("/add", protect, addFood);

// @route   GET /api/foods
// @desc    Get all food items
// @access  Public
router.get("/", getFoods);

// @route   GET /api/foods/:id
// @desc    Get food item by ID
// @access  Public
router.get("/:id", getFoodById);

module.exports = router;
