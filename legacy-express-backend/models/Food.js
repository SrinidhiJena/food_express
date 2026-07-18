const mongoose = require("mongoose");

const FoodSchema = new mongoose.Schema(
    {
        foodName: {
            type: String,
            required: [true, "Food name is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Category is required"],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Price is required"],
            min: [0, "Price must be a positive number"],
        },
        image: {
            type: String,
            required: [true, "Image URL/path is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Food", FoodSchema);
