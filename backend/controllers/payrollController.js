const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// Generate unique payroll ID
const generatePayrollId = () => {
  return "PAY" + uuidv4().replace(/-/g, "").slice(0, 7);
};

// Get all payrolls (Admin)
exports.getAllPayrolls = async (req, res) => {
  try {
    const { month, year } = req.query;
    console.log("Received query params:", { month, year }); // Debug log

    let query = `
      SELECT 
        p.*,
        e.first_name,
        e.last_name,
        e.basic_salary,
        e.allowance,
        e.deduction
      FROM payrolls p
      JOIN employees e ON p.employee_id = e.employee_id
      WHERE 1=1
    `;

    const params = [];

    // Add month filter if specified
    if (month && month !== "all") {
      query += ` AND p.month = ?`;
      params.push(parseInt(month));
    }

    // Add year filter if specified
    if (year && year !== "all") {
      query += ` AND p.year = ?`;
      params.push(parseInt(year));
    }

    query += ` ORDER BY p.created_at DESC`;

    console.log("Final query:", query); // Debug log
    console.log("Query params:", params); // Debug log

    db.all(query, params, (err, payrolls) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch payrolls" });
      }
      console.log(`Found ${payrolls.length} payrolls`); // Debug log
      res.json({ payrolls });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get user's payrolls (Employee)
exports.getUserPayrolls = (req, res) => {
  const { month, year } = req.query;
  const employeeId = req.user.employee_id;

  const query = `
    SELECT * FROM payrolls 
    WHERE employee_id = ? AND month = ? AND year = ?
  `;

  db.all(query, [employeeId, month, year], (err, payrolls) => {
    if (err) {
      console.error("Error fetching user payrolls:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ payrolls });
  });
};

// Generate monthly payroll
exports.generateMonthlyPayroll = async (req, res) => {
  const { month, year } = req.body;

  // Input validation
  if (!month || !year) {
    return res.status(400).json({
      error: "Month and year are required",
      details: { month, year },
    });
  }

  // Validate month and year
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();

  if (month < 1 || month > 12) {
    return res.status(400).json({ error: "Invalid month" });
  }

  if (year < 2000 || year > currentYear) {
    return res.status(400).json({ error: "Invalid year" });
  }

  // Begin transaction
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    try {
      // Get employees without payroll for the month
      const checkQuery = `
        SELECT e.* 
        FROM employees e 
        LEFT JOIN payrolls p ON e.employee_id = p.employee_id 
          AND p.month = ? 
          AND p.year = ?
        WHERE p.payroll_id IS NULL
      `;

      db.all(checkQuery, [month, year], (err, employees) => {
        if (err) {
          console.error("Error checking employees:", err);
          db.run("ROLLBACK");
          return res.status(500).json({ error: "Database error" });
        }

        if (!employees || employees.length === 0) {
          db.run("ROLLBACK");
          return res.status(400).json({
            error: "Payroll already generated for all employees this month",
          });
        }

        console.log(`Found ${employees.length} employees without payroll`);

        // Insert payroll records
        const insertQuery = `
          INSERT INTO payrolls (
            payroll_id,
            employee_id,
            net_salary,
            month,
            year,
            payment_status,
            created_at
          ) VALUES (?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
        `;

        let successCount = 0;
        let errorCount = 0;

        employees.forEach((employee) => {
          const payrollId = generatePayrollId();
          const netSalary =
            (parseFloat(employee.basic_salary) || 0) +
            (parseFloat(employee.allowance) || 0) -
            (parseFloat(employee.deduction) || 0);

          db.run(
            insertQuery,
            [payrollId, employee.employee_id, netSalary, month, year],
            function (err) {
              if (err) {
                console.error("Error inserting payroll:", err);
                errorCount++;
              } else {
                successCount++;
              }

              // Check if all operations are complete
              if (successCount + errorCount === employees.length) {
                if (errorCount > 0) {
                  db.run("ROLLBACK");
                  res.status(500).json({
                    error: `Failed to generate ${errorCount} payroll records`,
                  });
                } else {
                  db.run("COMMIT");
                  res.json({
                    message: `Successfully generated ${successCount} payroll records`,
                  });
                }
              }
            }
          );
        });
      });
    } catch (error) {
      console.error("Transaction error:", error);
      db.run("ROLLBACK");
      res.status(500).json({ error: "Transaction failed" });
    }
  });
};

// Update payroll status
exports.updatePayrollStatus = (req, res) => {
  // Check if user is admin
  if (req.user.role !== "Admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }

  const { payrollId } = req.params;
  const { status } = req.body;

  const query = `
    UPDATE payrolls 
    SET payment_status = ?, 
        payment_date = CASE 
          WHEN ? = 'paid' THEN CURRENT_TIMESTAMP 
          ELSE NULL 
        END
    WHERE payroll_id = ?
  `;

  db.run(query, [status, status, payrollId], function (err) {
    if (err) {
      console.error("Error updating payroll status:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ message: "Payroll status updated successfully" });
  });
};

// Add this new method to handle managing individual payrolls
exports.managePayroll = (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const {
    employee_id,
    month,
    year,
    basic_salary,
    allowance,
    deduction,
    net_salary,
  } = req.body;

  // Log incoming request
  console.log("Manage payroll request:", {
    employee_id,
    month,
    year,
    basic_salary,
    allowance,
    deduction,
    net_salary,
    user: req.user,
  });

  // Validate input
  if (!employee_id) {
    return res.status(400).json({ error: "Employee ID is required" });
  }

  if (!month || !year) {
    return res.status(400).json({ error: "Month and year are required" });
  }

  // First verify employee exists
  const checkEmployeeQuery = `SELECT employee_id FROM employees WHERE employee_id = ?`;

  db.get(checkEmployeeQuery, [employee_id], (err, employee) => {
    if (err) {
      console.error("Error checking employee:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Update employee salary details
    const updateEmployeeQuery = `
      UPDATE employees 
      SET 
        basic_salary = ?,
        allowance = ?,
        deduction = ?
      WHERE employee_id = ?
    `;

    const employeeParams = [
      basic_salary || 0,
      allowance || 0,
      deduction || 0,
      employee_id,
    ];

    console.log("Updating employee:", {
      query: updateEmployeeQuery,
      params: employeeParams,
    });

    db.run(updateEmployeeQuery, employeeParams, function (err) {
      if (err) {
        console.error("Error updating employee salary:", err);
        return res
          .status(500)
          .json({ error: "Database error", details: err.message });
      }

      console.log("Employee update successful. Changes:", this.changes);

      // Check for existing payroll
      const checkPayrollQuery = `
        SELECT payroll_id, payment_status 
        FROM payrolls 
        WHERE employee_id = ? 
        AND month = ? 
        AND year = ?
      `;

      db.get(
        checkPayrollQuery,
        [employee_id, month, year],
        (err, existingPayroll) => {
          if (err) {
            console.error("Error checking payroll:", err);
            return res
              .status(500)
              .json({ error: "Database error", details: err.message });
          }

          console.log("Existing payroll:", existingPayroll);

          if (existingPayroll) {
            if (existingPayroll.payment_status === "paid") {
              return res
                .status(400)
                .json({ error: "Cannot modify paid payroll" });
            }

            const updatePayrollQuery = `
            UPDATE payrolls 
            SET net_salary = ?
            WHERE payroll_id = ?
          `;

            console.log("Updating payroll:", {
              query: updatePayrollQuery,
              params: [net_salary, existingPayroll.payroll_id],
            });

            db.run(
              updatePayrollQuery,
              [net_salary, existingPayroll.payroll_id],
              function (err) {
                if (err) {
                  console.error("Error updating payroll:", err);
                  return res
                    .status(500)
                    .json({ error: "Database error", details: err.message });
                }
                console.log(
                  "Payroll update successful. Changes:",
                  this.changes
                );
                res.json({
                  message: "Salary details updated successfully",
                  changes: this.changes,
                });
              }
            );
          } else {
            const payrollId = generatePayrollId();
            const insertQuery = `
            INSERT INTO payrolls (
              payroll_id,
              employee_id,
              net_salary,
              month,
              year,
              payment_status
            ) VALUES (?, ?, ?, ?, ?, 'pending')
          `;

            const insertParams = [
              payrollId,
              employee_id,
              net_salary,
              month,
              year,
            ];

            console.log("Inserting payroll:", {
              query: insertQuery,
              params: insertParams,
            });

            db.run(insertQuery, insertParams, function (err) {
              if (err) {
                console.error("Error creating payroll:", err);
                return res
                  .status(500)
                  .json({ error: "Database error", details: err.message });
              }
              console.log("Payroll insert successful. Changes:", this.changes);
              res.json({
                message: "Salary details created successfully",
                changes: this.changes,
              });
            });
          }
        }
      );
    });
  });
};

// Add delete payroll method
exports.deletePayroll = (req, res) => {
  // Check if user is admin
  if (req.user.role !== "Admin") {
    return res
      .status(403)
      .json({ error: "Access denied. Admin privileges required." });
  }

  const { payrollId } = req.params;

  // First check if payroll exists and is not paid
  const checkQuery = `
    SELECT payment_status 
    FROM payrolls 
    WHERE payroll_id = ?
  `;

  db.get(checkQuery, [payrollId], (err, payroll) => {
    if (err) {
      console.error("Error checking payroll:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!payroll) {
      return res.status(404).json({ error: "Payroll not found" });
    }

    if (payroll.payment_status === "paid") {
      return res.status(400).json({ error: "Cannot delete paid payroll" });
    }

    // If payroll exists and is not paid, proceed with deletion
    const deleteQuery = `DELETE FROM payrolls WHERE payroll_id = ?`;

    db.run(deleteQuery, [payrollId], function (err) {
      if (err) {
        console.error("Error deleting payroll:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.json({ message: "Payroll deleted successfully" });
    });
  });
};

exports.getMyPayrolls = async (req, res) => {
  try {
    const employeeId = req.user.employee_id;
    const { month, year } = req.query;

    console.log("Received query params:", { month, year, employeeId }); // Debug log

    let query = `
      SELECT * FROM payrolls 
      WHERE employee_id = ?
    `;

    const params = [employeeId];

    // Only add date filters if they're specified and not 'all'
    if (month && month !== "all") {
      query += ` AND strftime('%m', payment_date) = ?`;
      // Ensure month is two digits
      params.push(month.toString().padStart(2, "0"));
    }

    if (year && year !== "all") {
      query += ` AND strftime('%Y', payment_date) = ?`;
      params.push(year.toString());
    }

    // Always order by payment date
    query += ` ORDER BY payment_date DESC`;

    console.log("Executing query:", query); // Debug log
    console.log("With params:", params); // Debug log

    db.all(query, params, (err, payrolls) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch payrolls" });
      }

      console.log("Found payrolls:", payrolls); // Debug log

      res.json({ payrolls: payrolls || [] });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.updateEmployeeSalary = (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { employee_id } = req.params;
  const { basic_salary, allowance, deduction } = req.body;

  // Input validation
  if (
    basic_salary === undefined ||
    allowance === undefined ||
    deduction === undefined
  ) {
    return res.status(400).json({ error: "Missing required salary details" });
  }

  // First verify employee exists
  const checkEmployeeQuery = `
    SELECT employee_id, first_name, last_name 
    FROM employees 
    WHERE employee_id = ?
  `;

  db.get(checkEmployeeQuery, [employee_id], (err, employee) => {
    if (err) {
      console.error("Error checking employee:", err);
      return res.status(500).json({
        error: "Database error",
        details: "Error verifying employee",
      });
    }

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Update employee salary details
    const updateEmployeeQuery = `
      UPDATE employees 
      SET 
        basic_salary = CAST(? AS DECIMAL(10,2)),
        allowance = CAST(? AS DECIMAL(10,2)),
        deduction = CAST(? AS DECIMAL(10,2))
      WHERE employee_id = ?
    `;

    const params = [basic_salary, allowance, deduction, employee_id];

    db.run(updateEmployeeQuery, params, function (err) {
      if (err) {
        console.error("Error updating employee salary:", err);
        return res.status(500).json({
          error: "Database error",
          details: err.message,
        });
      }

      res.json({
        message: "Salary details updated successfully",
        employee: {
          employee_id,
          name: `${employee.first_name} ${employee.last_name}`,
          basic_salary: parseFloat(basic_salary),
          allowance: parseFloat(allowance),
          deduction: parseFloat(deduction),
        },
      });
    });
  });
};

// Add this new method for payroll status counts
exports.getPayrollStatusCounts = (req, res) => {
  const query = `
    SELECT 
      SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paidCount,
      SUM(CASE WHEN payment_status = 'unpaid' THEN 1 ELSE 0 END) as unpaidCount
    FROM payrolls
  `;

  db.get(query, [], (err, result) => {
    if (err) {
      console.error("Error fetching payroll status counts:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({
      paidPayrolls: result.paidCount || 0,
      unpaidPayrolls: result.unpaidCount || 0,
    });
  });
};
