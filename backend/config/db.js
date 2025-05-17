const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../../database/StafflyDatabase.db");

// Create database connection with better error handling
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE, (err) => {
  if (err) {
    console.error("Error connecting to database:", err);
    process.exit(1); // Exit if database connection fails
  }
  console.log("Connected to SQLite database");
});

// Enable foreign keys and add error handling
db.run("PRAGMA foreign_keys = ON", (err) => {
  if (err) {
    console.error("Error enabling foreign keys:", err);
  }
});

// Export the database connection
module.exports = db;
