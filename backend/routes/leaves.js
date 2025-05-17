const express = require("express");
const router = express.Router();
const leaveController = require("../controllers/leaveController");
const authenticateToken = require("../middleware/authMiddleware");

// Get all leaves (filtered by user role)
router.get("/", authenticateToken, leaveController.getAllLeaves);

// Get my leaves
router.get("/my-leaves", authenticateToken, leaveController.getMyLeaves);

// Get approved leaves
router.get("/approved", authenticateToken, leaveController.getApprovedLeaves);

// Get pending leaves
router.get("/pending", authenticateToken, leaveController.getPendingLeaves);

// Create new leave application
router.post("/", authenticateToken, leaveController.createLeave);

// Update leave status (Admin only)
router.put(
  "/:leave_id/status",
  authenticateToken,
  leaveController.updateLeaveStatus
);

// Update leave
router.put("/:leave_id", authenticateToken, leaveController.updateLeave);

// Delete leave
router.delete("/:leave_id", authenticateToken, leaveController.deleteLeave);

module.exports = router;
