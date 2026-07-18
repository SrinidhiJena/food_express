const Order = require("../models/Order");
const Food = require("../models/Food");

/**
 * @desc    Place a new order
 * @route   POST /api/orders/place
 * @access  Private
 */
const placeOrder = async (req, res) => {
    try {
        const { foodItems, address, paymentMethod } = req.body;

        // 1. Validate basic inputs
        if (!foodItems || !Array.isArray(foodItems) || foodItems.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid list of foodItems containing foodId and quantity",
            });
        }

        if (!address) {
            return res.status(400).json({
                success: false,
                message: "Delivery address is required",
            });
        }

        // 2. Fetch food items from DB and calculate total price securely
        let calculatedTotalPrice = 0;
        const verifiedFoodItems = [];

        for (const item of foodItems) {
            const { foodId, quantity } = item;

            if (!foodId || !foodId.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid food item ID format: ${foodId}`,
                });
            }

            const parsedQuantity = parseInt(quantity, 10);
            if (isNaN(parsedQuantity) || parsedQuantity < 1) {
                return res.status(400).json({
                    success: false,
                    message: `Quantity must be a positive integer for food item: ${foodId}`,
                });
            }

            const food = await Food.findById(foodId);
            if (!food) {
                return res.status(404).json({
                    success: false,
                    message: `Food item not found with ID: ${foodId}`,
                });
            }

            calculatedTotalPrice += food.price * parsedQuantity;
            
            verifiedFoodItems.push({
                foodId: food._id,
                quantity: parsedQuantity,
            });
        }

        // 3. Create the order
        const order = await Order.create({
            userId: req.user._id,
            foodItems: verifiedFoodItems,
            totalPrice: calculatedTotalPrice,
            address,
            paymentMethod: paymentMethod || "Cash on Delivery",
        });

        // Populate details for the response
        const populatedOrder = await Order.findById(order._id)
            .populate("userId", "name email phone")
            .populate("foodItems.foodId", "foodName price category");

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: populatedOrder,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error occurred while placing the order",
            error: error.message,
        });
    }
};

/**
 * @desc    Get orders for the logged-in user
 * @route   GET /api/orders/my-orders
 * @access  Private
 */
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user._id })
            .populate("foodItems.foodId", "foodName price category image")
            .sort({ createdAt: -1 }); // Newest orders first

        return res.json({
            success: true,
            count: orders.length,
            data: orders,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error occurred while fetching your orders",
            error: error.message,
        });
    }
};

module.exports = {
    placeOrder,
    getUserOrders,
};
