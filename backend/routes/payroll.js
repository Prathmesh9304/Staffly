const express = require("express");
const router = express.Router();
const payrollController = require("../controllers/payrollController");
const authenticateToken = require("../middleware/authMiddleware");

// Admin routes (with role check in controller)
router.get("/", authenticateToken, payrollController.getAllPayrolls);
router.post(
  "/generate",
  authenticateToken,
  payrollController.generateMonthlyPayroll
);
router.put(
  "/:payrollId/status",
  authenticateToken,
  payrollController.updatePayrollStatus
);

// Employee routes
router.get("/my-payrolls", authenticateToken, payrollController.getMyPayrolls);

// Salary management route
router.put(
  "/employees/:employee_id/salary",
  authenticateToken,
  payrollController.updateEmployeeSalary
);

// Payroll management routes
router.delete(
  "/:payrollId",
  authenticateToken,
  payrollController.deletePayroll
);

// Add this new route
router.get(
  "/status-counts",
  authenticateToken,
  payrollController.getPayrollStatusCounts
);

module.exports = router;
