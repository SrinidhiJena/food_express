const Food = require("../models/Food");

/**
 * @desc    Add a new food item
 * @route   POST /api/foods/add
 * @access  Private (or Public, but protected for admin/managers in real app)
 */
const addFood = async (req, res) => {
    try {
        const { foodName, category, price, image, description } = req.body;

        // 1. Validate inputs
        if (!foodName || !category || price === undefined || !image || !description) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields: foodName, category, price, image, description",
            });
        }

        const numericPrice = Number(price);
        if (isNaN(numericPrice) || numericPrice < 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid positive number",
            });
        }

        // 2. Create food item
        const food = await Food.create({
            foodName,
            category,
            price: numericPrice,
            image,
            description,
        });

        return res.status(201).json({
            success: true,
            message: "Food item added successfully",
            data: food,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error occurred while adding food item",
            error: error.message,
        });
    }
};

/**
 * @desc    Get all food items
 * @route   GET /api/foods
 * @access  Public
 */
const getFoods = async (req, res) => {
    try {
        const foods = await Food.find({});
        return res.json({
            success: true,
            count: foods.length,
            data: foods,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error occurred while fetching food items",
            error: error.message,
        });
    }
};

/**
 * @desc    Get food item by ID
 * @route   GET /api/foods/:id
 * @access  Public
 */
const getFoodById = async (req, res) => {
    try {
        const foodId = req.params.id;

        // Check if ID is a valid MongoDB ObjectId
        if (!foodId.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({
                success: false,
                message: "Invalid food item ID format",
            });
        }

        const food = await Food.findById(foodId);
        if (!food) {
            return res.status(404).json({
                success: false,
                message: "Food item not found",
            });
        }

        return res.json({
            success: true,
            data: food,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error occurred while retrieving the food item",
            error: error.message,
        });
    }
};

module.exports = {
    addFood,
    getFoods,
    getFoodById,
};
