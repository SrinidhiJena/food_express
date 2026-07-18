const User = require("../models/User");
const jwt = require("jsonwebtoken");

/**
 * Generate JWT token for an authenticated user
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/signup
 * @access  Public
 */
const registerUser = async (req, res) => {
    try {
        const { name, email, phone, password } = req.body;

        // 1. Validate inputs
        if (!name || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide all required fields: name, email, phone, password",
            });
        }

        // Basic email formatting validation helper
        const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: "Please enter a valid email address",
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long",
            });
        }

        // 2. Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this email address",
            });
        }

        // 3. Create user
        const user = await User.create({
            name,
            email,
            phone,
            password,
        });

        if (user) {
            return res.status(201).json({
                success: true,
                message: "User registered successfully",
                data: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    phone: user.phone,
                    token: generateToken(user._id),
                },
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Invalid user data received",
            });
        }
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error occurred during signup",
            error: error.message,
        });
    }
};

/**
 * @desc    Authenticate user & get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Validate inputs
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Please provide both email and password",
            });
        }

        // 2. Check for user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // 3. Check if password matches
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password",
            });
        }

        // 4. Return user and token
        return res.json({
            success: true,
            message: "Logged in successfully",
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                token: generateToken(user._id),
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Server error occurred during login",
            error: error.message,
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
};
