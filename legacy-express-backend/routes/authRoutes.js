const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// @route   POST /api/auth/signup
// @desc    Register a new user
// @access  Public
router.post("/signup", registerUser);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post("/login", loginUser);

module.exports = router;
