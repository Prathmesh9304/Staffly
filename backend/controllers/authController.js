const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../config/db");

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  const query = `
    SELECT u.*, e.employee_id, e.first_name, e.last_name, e.email
    FROM users u
    LEFT JOIN employees e ON u.user_id = e.user_id
    WHERE u.username = ?
  `;

  db.get(query, [username], async (err, user) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    try {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          employee_id: user.employee_id,
          username: user.username,
          role: user.role,
        },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        token,
        user: {
          employee_id: user.employee_id,
          username: user.username,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
        },
      });
    } catch (bcryptErr) {
      console.error("Password verification error:", bcryptErr);
      return res.status(500).json({ error: "Error verifying credentials" });
    }
  });
};

// Test database connection and log table info
db.get(
  "SELECT name FROM sqlite_master WHERE type='table' AND name='Employee'",
  [],
  (err, result) => {
    if (err) {
      console.error("Database test failed:", err);
    } else {
      console.log("Employee table exists:", !!result);
      if (result) {
        db.get(
          "SELECT sql FROM sqlite_master WHERE type='table' AND name='Employee'",
          [],
          (err, res) => {
            if (!err) console.log("Table structure:", res.sql);
          }
        );
      }
    }
  }
);

exports.getCurrentEmployee = async (req, res) => {
  try {
    const query = `
      SELECT e.*, d.name as department_name 
      FROM employees e 
      LEFT JOIN departments d ON e.department_id = d.department_id 
      WHERE e.employee_id = ?
    `;

    db.get(query, [req.user.employee_id], (err, employee) => {
      if (err) {
        return res.status(500).json({ error: "Database error" });
      }
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};
