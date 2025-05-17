const express = require("express");
const router = express.Router();
const departmentController = require("../controllers/departmentController");
const authenticateToken = require("../middleware/authMiddleware");

router.get("/", authenticateToken, departmentController.getAllDepartments);
router.post("/", authenticateToken, departmentController.createDepartment);
router.put("/:id", authenticateToken, departmentController.updateDepartment);
router.delete("/:id", authenticateToken, departmentController.deleteDepartment);

// New route for total departments
router.get(
  "/total",
  authenticateToken,
  departmentController.getTotalDepartments
);

module.exports = router;
