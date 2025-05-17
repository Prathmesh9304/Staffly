const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeeController");
const authenticateToken = require("../middleware/authMiddleware");

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get current employee must come before /:id route to avoid conflict
router.get("/current", employeeController.getCurrentEmployee);

// Other routes
router.get("/", employeeController.getAllEmployees);
router.get("/count", employeeController.getEmployeeCount);
router.post("/", employeeController.createEmployee);
router.get("/:id", employeeController.getEmployeeById);
router.put("/:id", employeeController.updateEmployee);
router.delete("/:id", employeeController.deleteEmployee);
router.put(
  "/:employeeId/salary",
  authenticateToken,
  employeeController.updateEmployeeSalary
);

module.exports = router;
