const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

// Helper function to generate unique leave ID
const generateLeaveId = () => {
  return "LEA" + uuidv4().replace(/-/g, "").slice(0, 7);
};

// Get All Leave Applications
exports.getAllLeaves = (req, res) => {
  const employeeId = req.user.employee_id;
  const isAdmin = req.user.role === "Admin";

  let query = `
    SELECT l.*, e.first_name, e.last_name 
    FROM leaves l 
    JOIN employees e ON l.employee_id = e.employee_id
  `;
  const params = [];

  if (!isAdmin) {
    query += " WHERE l.employee_id = ?";
    params.push(employeeId);
  }

  db.all(query, params, (err, results) => {
    if (err) {
      console.error("Error fetching leave applications:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ leaves: results });
  });
};

// Get Approved Leaves
exports.getApprovedLeaves = (req, res) => {
  const query = `
    SELECT COUNT(*) as approvedLeaves
    FROM Leaves 
    WHERE status = 'approved'
  `;

  db.get(query, [], (err, result) => {
    if (err) {
      console.error("Error fetching approved leaves count:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ approvedLeaves: result.approvedLeaves });
  });
};

// Create new leave application
exports.createLeave = (req, res) => {
  const { reason, start_date, end_date, type } = req.body;
  const employee_id = req.user.employee_id;
  const leave_id = generateLeaveId();

  const query = `
    INSERT INTO leaves (
      leave_id,
      employee_id,
      reason,
      type,
      start_date,
      end_date
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.run(
    query,
    [leave_id, employee_id, reason, type, start_date, end_date],
    function (err) {
      if (err) {
        console.error("Error creating leave:", err);
        return res
          .status(500)
          .json({ error: "Failed to create leave application" });
      }
      res.status(201).json({
        message: "Leave application created successfully",
        leave_id: leave_id,
      });
    }
  );
};

// Update Leave Status (Admin only)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { leave_id } = req.params;
    const { status } = req.body;
    const isAdmin = req.user.role === "Admin";

    // Check if user is admin
    if (!isAdmin) {
      return res
        .status(403)
        .json({ error: "Only admins can update leave status" });
    }

    // Validate status
    const validStatuses = ["approved", "rejected", "pending"];
    if (!validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const query = `
      UPDATE leaves 
      SET status = ?, 
          updated_at = DATETIME('now')
      WHERE leave_id = ?
    `;

    db.run(query, [status.toLowerCase(), leave_id], function (err) {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to update leave status" });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: "Leave not found" });
      }

      res.json({ message: "Leave status updated successfully" });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get leaves for the current user
exports.getMyLeaves = (req, res) => {
  const employeeId = req.user.employee_id;

  const query = `
    SELECT l.*, e.first_name, e.last_name 
    FROM leaves l 
    JOIN employees e ON l.employee_id = e.employee_id 
    WHERE l.employee_id = ?
    ORDER BY l.applied_at DESC
  `;

  db.all(query, [employeeId], (err, leaves) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Failed to fetch leaves" });
    }
    res.json({ leaves });
  });
};

// Update leave
exports.updateLeave = async (req, res) => {
  try {
    const { leave_id } = req.params;
    const { reason, start_date, end_date, type } = req.body;
    const employeeId = req.user.employee_id;

    // First check if the leave belongs to the user
    const checkQuery =
      "SELECT * FROM leaves WHERE leave_id = ? AND employee_id = ?";

    db.get(checkQuery, [leave_id, employeeId], (err, leave) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Failed to check leave ownership" });
      }

      if (!leave) {
        return res
          .status(404)
          .json({ error: "Leave not found or unauthorized" });
      }

      // Only allow editing pending leaves
      if (leave.status !== "pending") {
        return res.status(400).json({ error: "Can only edit pending leaves" });
      }

      const updateQuery = `
        UPDATE leaves 
        SET reason = ?, 
            start_date = ?, 
            end_date = ?, 
            type = ?,
            Updated_at = CURRENT_TIMESTAMP
        WHERE leave_id = ? AND employee_id = ?
      `;

      db.run(
        updateQuery,
        [reason, start_date, end_date, type, leave_id, employeeId],
        function (err) {
          if (err) {
            console.error("Database error:", err);
            return res.status(500).json({ error: "Failed to update leave" });
          }
          res.json({ message: "Leave updated successfully" });
        }
      );
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Delete leave
exports.deleteLeave = async (req, res) => {
  try {
    const { leave_id } = req.params;
    const employeeId = req.user.employee_id;

    // First check if the leave belongs to the user and is pending
    const checkQuery =
      "SELECT * FROM leaves WHERE leave_id = ? AND employee_id = ?";

    db.get(checkQuery, [leave_id, employeeId], (err, leave) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to check leave" });
      }

      if (!leave) {
        return res
          .status(404)
          .json({ error: "Leave not found or unauthorized" });
      }

      // Only allow deleting pending leaves
      if (leave.status !== "pending") {
        return res
          .status(400)
          .json({ error: "Can only delete pending leaves" });
      }

      const deleteQuery =
        "DELETE FROM leaves WHERE leave_id = ? AND employee_id = ?";

      db.run(deleteQuery, [leave_id, employeeId], function (err) {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Failed to delete leave" });
        }
        res.json({ message: "Leave deleted successfully" });
      });
    });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Add this new method for pending leaves count
exports.getPendingLeaves = (req, res) => {
  const query = `
    SELECT COUNT(*) as pendingLeaves
    FROM leaves 
    WHERE status = 'pending'
  `;

  db.get(query, [], (err, result) => {
    if (err) {
      console.error("Error fetching pending leaves count:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ pendingLeaves: result.pendingLeaves });
  });
};
