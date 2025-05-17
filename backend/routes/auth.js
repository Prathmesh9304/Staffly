const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authenticateToken = require("../middleware/authMiddleware");

// POST /api/login
router.post("/login", authController.login);

// Example of a protected route
// router.get("/me", authenticateToken, authController.getCurrentUser);

// Add more routes as needed (e.g., register)

module.exports = router;
