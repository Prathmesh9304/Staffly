const db = require("../config/db");
const bcrypt = require("bcryptjs");

// Get all employees
exports.getAllEmployees = (req, res) => {
  const query = `
    SELECT 
      e.*,
      d.name as department_name,
      u.username,
      u.role
    FROM Employees e
    LEFT JOIN Departments d ON e.department_id = d.department_id
    LEFT JOIN Users u ON e.user_id = u.user_id
  `;

  db.all(query, [], (err, employees) => {
    if (err) {
      console.error("Error fetching employees:", err);
      return res
        .status(500)
        .json({ error: "Database error", details: err.message });
    }

    // Remove sensitive information
    const sanitizedEmployees = employees.map((emp) => {
      const { password, ...employee } = emp;
      return employee;
    });

    res.json({ employees: sanitizedEmployees });
  });
};

// Get employee count
exports.getEmployeeCount = (req, res) => {
  const query = "SELECT COUNT(*) as totalEmployees FROM Employees";

  db.get(query, [], (err, result) => {
    if (err) {
      console.error("Error counting employees:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ totalEmployees: result.totalEmployees });
  });
};

// Create new employee
exports.createEmployee = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    phone,
    department_id,
    username,
    password,
    role,
  } = req.body;

  console.log("Received create employee request:", {
    first_name,
    last_name,
    email,
    phone,
    department_id,
    username,
    role,
  }); // Don't log password

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate unique IDs
    const uniqueId = generateUniqueId("EMP");
    const userUniqueId = "UR" + uniqueId.slice(3);

    console.log("Generated IDs:", { uniqueId, userUniqueId });

    // Check for existing username/email
    const checkQuery = `
      SELECT u.username, e.email 
      FROM users u 
      LEFT JOIN employees e ON u.user_id = e.user_id 
      WHERE u.username = ? OR e.email = ?
    `;

    db.get(checkQuery, [username, email], (err, existing) => {
      if (err) {
        console.error("Check query error:", err);
        return res.status(500).json({ error: "Database error during check" });
      }

      if (existing) {
        if (existing.username === username) {
          return res.status(400).json({ error: "Username already exists" });
        }
        if (existing.email === email) {
          return res.status(400).json({ error: "Email already exists" });
        }
      }

      // Begin transaction
      db.serialize(() => {
        db.run("BEGIN TRANSACTION");

        // Insert user
        const insertUserQuery = `
          INSERT INTO users (user_id, username, password, role)
          VALUES (?, ?, ?, ?)
        `;

        console.log("Inserting user with query:", insertUserQuery);
        console.log("User values:", [
          userUniqueId,
          username,
          hashedPassword,
          role,
        ]);

        db.run(
          insertUserQuery,
          [userUniqueId, username, hashedPassword, role],
          function (err) {
            if (err) {
              console.error("User insertion error:", err);
              db.run("ROLLBACK");
              return res
                .status(500)
                .json({ error: "Failed to create user: " + err.message });
            }

            // Insert employee
            const insertEmployeeQuery = `
            INSERT INTO employees (
              employee_id,
              user_id,
              first_name,
              last_name,
              email,
              phone,
              department_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

            console.log("Inserting employee with query:", insertEmployeeQuery);
            console.log("Employee values:", [
              uniqueId,
              userUniqueId,
              first_name,
              last_name,
              email,
              phone,
              department_id,
            ]);

            db.run(
              insertEmployeeQuery,
              [
                uniqueId,
                userUniqueId,
                first_name,
                last_name,
                email,
                phone,
                department_id,
              ],
              function (err) {
                if (err) {
                  console.error("Employee insertion error:", err);
                  db.run("ROLLBACK");
                  return res.status(500).json({
                    error: "Failed to create employee: " + err.message,
                  });
                }

                db.run("COMMIT");
                console.log("Successfully created employee and user");
                res.status(201).json({
                  message: "Employee created successfully",
                  employee_id: uniqueId,
                  user_id: userUniqueId,
                });
              }
            );
          }
        );
      });
    });
  } catch (err) {
    console.error("General error:", err);
    return res
      .status(500)
      .json({ error: "Error processing request: " + err.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  const { id } = req.params;
  const {
    first_name,
    last_name,
    email,
    phone,
    department_id,
    username,
    password,
    role,
  } = req.body;

  try {
    // Begin transaction
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      // First get the current employee and user data
      const getEmployeeQuery = `
        SELECT e.*, u.username as current_username
        FROM employees e
        JOIN users u ON e.user_id = u.user_id
        WHERE e.employee_id = ?
      `;

      db.get(getEmployeeQuery, [id], async (err, employee) => {
        if (err) {
          db.run("ROLLBACK");
          console.error("Error fetching employee:", err);
          return res.status(500).json({ error: "Database error" });
        }

        if (!employee) {
          db.run("ROLLBACK");
          return res.status(404).json({ error: "Employee not found" });
        }

        // Check if username is being changed and if it's already taken
        if (username && username !== employee.current_username) {
          db.get(
            "SELECT username FROM users WHERE username = ?",
            [username],
            (err, existingUser) => {
              if (err) {
                db.run("ROLLBACK");
                return res.status(500).json({ error: "Database error" });
              }
              if (existingUser) {
                db.run("ROLLBACK");
                return res
                  .status(400)
                  .json({ error: "Username already exists" });
              }
            }
          );
        }

        // Update users table if necessary
        if (username || password || role) {
          let updateUserQuery = "UPDATE users SET";
          const userParams = [];
          const updates = [];

          if (username) {
            updates.push(" username = ?");
            userParams.push(username);
          }
          if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updates.push(" password = ?");
            userParams.push(hashedPassword);
          }
          if (role) {
            updates.push(" role = ?");
            userParams.push(role);
          }

          if (updates.length > 0) {
            updateUserQuery += updates.join(",") + " WHERE user_id = ?";
            userParams.push(employee.user_id);

            db.run(updateUserQuery, userParams, (err) => {
              if (err) {
                db.run("ROLLBACK");
                console.error("Error updating user:", err);
                return res.status(500).json({ error: "Failed to update user" });
              }
            });
          }
        }

        // Update employees table
        const updateEmployeeQuery = `
          UPDATE employees 
          SET first_name = ?, 
              last_name = ?, 
              email = ?, 
              phone = ?, 
              department_id = ?
          WHERE employee_id = ?
        `;

        db.run(
          updateEmployeeQuery,
          [first_name, last_name, email, phone, department_id, id],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              console.error("Error updating employee:", err);
              return res
                .status(500)
                .json({ error: "Failed to update employee" });
            }

            db.run("COMMIT");
            res.json({ message: "Employee updated successfully" });
          }
        );
      });
    });
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: "An unexpected error occurred" });
  }
};

// Delete employee
exports.deleteEmployee = (req, res) => {
  const { id } = req.params;

  // Begin transaction
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    // First get the user_id from employees table
    const getUserQuery = "SELECT user_id FROM employees WHERE employee_id = ?";

    db.get(getUserQuery, [id], (err, employee) => {
      if (err) {
        db.run("ROLLBACK");
        console.error("Error fetching user_id:", err);
        return res.status(500).json({ error: "Database error" });
      }

      if (!employee) {
        db.run("ROLLBACK");
        return res.status(404).json({ error: "Employee not found" });
      }

      // Delete from employees table
      const deleteEmployeeQuery = "DELETE FROM employees WHERE employee_id = ?";

      db.run(deleteEmployeeQuery, [id], function (err) {
        if (err) {
          db.run("ROLLBACK");
          console.error("Error deleting employee:", err);
          return res.status(500).json({ error: "Database error" });
        }

        // Delete from users table
        const deleteUserQuery = "DELETE FROM users WHERE user_id = ?";

        db.run(deleteUserQuery, [employee.user_id], function (err) {
          if (err) {
            db.run("ROLLBACK");
            console.error("Error deleting user:", err);
            return res.status(500).json({ error: "Database error" });
          }

          db.run("COMMIT");
          res.json({ message: "Employee deleted successfully" });
        });
      });
    });
  });
};

// Helper function to generate unique IDs
function generateUniqueId(prefix) {
  const timestamp = Date.now().toString(36); // Convert timestamp to base36
  const randomStr = Math.random().toString(36).substring(2, 6); // Get 4 random chars
  const paddedId = (prefix + timestamp + randomStr)
    .padEnd(10, "0")
    .slice(0, 10);
  return paddedId.toUpperCase();
}

// Get employee by ID
exports.getEmployeeById = (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT 
      e.*,
      d.name as department_name
    FROM Employees e
    LEFT JOIN Departments d ON e.department_id = d.department_id
    WHERE e.employee_id = ?
  `;

  db.get(query, [id], (err, employee) => {
    if (err) {
      console.error("Error fetching employee:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(employee);
  });
};

// Get current employee details
exports.getCurrentEmployee = (req, res) => {
  console.log("getCurrentEmployee called", req.user); // Debug log

  const employeeId = req.user?.employee_id;

  if (!employeeId) {
    console.error("No employee_id in token");
    return res.status(401).json({ error: "Unauthorized" });
  }

  const query = `
    SELECT 
      e.*,
      d.name as department_name
    FROM Employees e
    LEFT JOIN Departments d ON e.department_id = d.department_id
    WHERE e.employee_id = ?
  `;

  db.get(query, [employeeId], (err, employee) => {
    if (err) {
      console.error("Error fetching current employee:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    // Remove sensitive information
    delete employee.password;

    console.log("Sending employee data:", employee); // Debug log
    res.json(employee);
  });
};

// Add new endpoint to update employee salary details
exports.updateEmployeeSalary = (req, res) => {
  if (req.user.role !== "Admin") {
    return res.status(403).json({ error: "Access denied" });
  }

  const { id } = req.params;
  const { basic_salary, allowance, deduction } = req.body;

  console.log("Received salary update:", {
    basic_salary,
    allowance,
    deduction,
  });

  // Input validation
  if (
    basic_salary === undefined ||
    allowance === undefined ||
    deduction === undefined
  ) {
    return res.status(400).json({ error: "Missing required salary details" });
  }

  // Verify the employee exists first
  const checkEmployeeQuery =
    "SELECT employee_id FROM employees WHERE employee_id = ?";

  db.get(checkEmployeeQuery, [id], (err, employee) => {
    if (err) {
      console.error("Error checking employee:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const updateEmployeeQuery = `
      UPDATE employees 
      SET basic_salary = ?,
          allowance = ?,
          deduction = ?
      WHERE employee_id = ?
    `;

    const params = [
      parseFloat(basic_salary) || 0,
      parseFloat(allowance) || 0,
      parseFloat(deduction) || 0,
      id,
    ];

    db.run(updateEmployeeQuery, params, function (err) {
      if (err) {
        console.error("Error updating employee salary:", err);
        return res.status(500).json({
          error: "Database error",
          details: err.message,
        });
      }

      if (this.changes === 0) {
        return res
          .status(404)
          .json({ error: "No changes made to employee salary" });
      }

      res.json({
        message: "Salary details updated successfully",
        changes: this.changes,
        updated: {
          basic_salary: parseFloat(basic_salary),
          allowance: parseFloat(allowance),
          deduction: parseFloat(deduction),
        },
      });
    });
  });
};
