const bcrypt = require("bcryptjs");
const db = require("../config/db");

// Assuming you have already created users using createUsers.js
// Fetch user IDs to link with employees

const mysql = require("mysql2");
const util = require("util");

// Promisify db.query for easier async/await usage
const query = util.promisify(db.query).bind(db);

async function createEmployees() {
  try {
    // Fetch all users
    const users = await query("SELECT * FROM Users");

    const employees = users.map((user, index) => ({
      user_id: user.user_id,
      first_name: `FirstName${index + 1}`,
      last_name: `LastName${index + 1}`,
      email: `user${user.user_id}@example.com`,
      phone: `123-456-789${index}`,
      department: index % 2 === 0 ? "HR" : "Engineering",
      position: index % 2 === 0 ? "Manager" : "Developer",
    }));

    for (const emp of employees) {
      const insertQuery =
        "INSERT INTO Employees (user_id, first_name, last_name, email, phone, department, position) VALUES (?, ?, ?, ?, ?, ?, ?)";

      // Handle duplicate entries
      try {
        await query(insertQuery, [
          emp.user_id,
          emp.first_name,
          emp.last_name,
          emp.email,
          emp.phone,
          emp.department,
          emp.position,
        ]);
        console.log(
          `Employee for user_id ${emp.user_id} created successfully.`
        );
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          console.log(`Employee for user_id ${emp.user_id} already exists.`);
        } else {
          console.error(err);
        }
      }
    }

    console.log("Employee creation script completed.");
    process.exit();
  } catch (err) {
    console.error("Error creating employees:", err);
    process.exit(1);
  }
}

createEmployees();
