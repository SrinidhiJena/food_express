const express = require("express");
const router = express.Router();
const {
    placeOrder,
    getUserOrders,
} = require("../controllers/orderController");
const { protect } = require("../middleware/authMiddleware");

// @route   POST /api/orders/place
// @desc    Place a new order
// @access  Private (Protected via auth middleware)
router.post("/place", protect, placeOrder);

// @route   GET /api/orders/my-orders
// @desc    Get all orders for the logged-in user
// @access  Private (Protected via auth middleware)
router.get("/my-orders", protect, getUserOrders);

module.exports = router;
