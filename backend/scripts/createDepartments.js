const db = require("../config/db");
const util = require("util");

// Promisify db.query for easier async/await usage
const query = util.promisify(db.query).bind(db);

const departments = [
  {
    name: "Human Resources",
    description: "Handles recruitment, employee relations, and benefits.",
  },
  {
    name: "Engineering",
    description: "Responsible for product development and maintenance.",
  },
  {
    name: "Sales",
    description: "Manages client relationships and sales strategies.",
  },
  {
    name: "Marketing",
    description: "Handles advertising, branding, and market research.",
  },
];

async function createDepartments() {
  try {
    for (const dept of departments) {
      const insertQuery =
        "INSERT INTO Departments (name, description) VALUES (?, ?)";

      try {
        await query(insertQuery, [dept.name, dept.description]);
        console.log(`Department '${dept.name}' created successfully.`);
      } catch (err) {
        if (err.code === "ER_DUP_ENTRY") {
          console.log(`Department '${dept.name}' already exists.`);
        } else {
          console.error(`Error creating department '${dept.name}':`, err);
        }
      }
    }

    console.log("Departments creation script completed.");
    process.exit();
  } catch (err) {
    console.error("Error creating departments:", err);
    process.exit(1);
  }
}

createDepartments();
