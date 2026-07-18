const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema({
    foodId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Food",
        required: [true, "Food item ID is required"],
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"],
        default: 1,
    },
});

const OrderSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User ID is required"],
        },
        foodItems: {
            type: [OrderItemSchema],
            validate: {
                validator: function (items) {
                    return items && items.length > 0;
                },
                message: "Order must contain at least one food item",
            },
        },
        totalPrice: {
            type: Number,
            required: [true, "Total price is required"],
            min: [0, "Total price cannot be negative"],
        },
        address: {
            type: String,
            required: [true, "Delivery address is required"],
            trim: true,
        },
        paymentMethod: {
            type: String,
            required: [true, "Payment method is required"],
            enum: ["Cash on Delivery", "Card", "UPI", "Net Banking"],
            default: "Cash on Delivery",
        },
        orderStatus: {
            type: String,
            required: true,
            enum: ["Pending", "Preparing", "Out for Delivery", "Delivered", "Cancelled"],
            default: "Pending",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Order", OrderSchema);
