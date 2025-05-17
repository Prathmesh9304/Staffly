const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./routes/auth");
const employeeRoutes = require("./routes/employee");
const departmentRoutes = require("./routes/department");
const leaveRoutes = require("./routes/leaves");
const payrollRoutes = require("./routes/payroll");

// Remove any database checks from here if they exist
const db = require("./config/db");

dotenv.config();

const app = express();

// Disable ETag
app.disable("etag");

// Configure CORS
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payrolls", payrollRoutes);

// Home Route
app.get("/", (req, res) => {
  res.send("Backend is running");
});

// Remove the catch-all route in development
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
