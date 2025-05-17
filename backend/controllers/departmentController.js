const db = require("../config/db");

// Get all departments
exports.getAllDepartments = (req, res) => {
  const query = "SELECT * FROM Departments";

  db.all(query, [], (err, departments) => {
    if (err) {
      console.error("Error fetching departments:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json({ departments });
  });
};

// Create new department
exports.createDepartment = (req, res) => {
  const { department_id, name, description } = req.body;
  const query =
    "INSERT INTO Departments (department_id, name, description) VALUES (?, ?, ?)";

  db.run(query, [department_id, name, description], function (err) {
    if (err) {
      console.error("Error creating department:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.status(201).json({
      message: "Department created successfully",
      department: { department_id, name, description },
    });
  });
};

// Update department
exports.updateDepartment = (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  let query = "UPDATE Departments SET";
  const params = [];

  if (name) {
    query += " name = ?";
    params.push(name);
  }
  if (description) {
    if (name) query += ",";
    query += " description = ?";
    params.push(description);
  }
  query += " WHERE department_id = ?";
  params.push(id);

  db.run(query, params, function (err) {
    if (err) {
      console.error("Error updating department:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.json({ message: "Department updated successfully" });
  });
};

// Delete department
exports.deleteDepartment = (req, res) => {
  const { id } = req.params;
  const query = "DELETE FROM Departments WHERE department_id = ?";

  db.run(query, [id], function (err) {
    if (err) {
      console.error("Error deleting department:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Department not found" });
    }
    res.json({ message: "Department deleted successfully" });
  });
};

// Get total number of departments
exports.getTotalDepartments = (req, res) => {
  const query = "SELECT COUNT(*) as totalDepartments FROM departments";

  db.get(query, [], (err, result) => {
    if (err) {
      console.error("Error fetching total departments:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ totalDepartments: result.totalDepartments });
  });
};
