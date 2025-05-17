import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import {
  AdminDashboard,
  AdminEmployees,
  AdminAttendance,
  AdminLeaves,
  AdminPayrolls,
  AdminDepartments,
  AdminSettings,
} from "./Admin/Pages";
import {
  Dashboard,
  Employees,
  Attendance,
  Leaves,
  Payrolls,
  Departments,
  Settings,
} from "./User/Pages";
import { Login } from "./Pages";

function AppRoutes() {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route
        path="/admin-dashboard"
        element={
          isAuthenticated && user?.role === "Admin" ? (
            <AdminDashboard />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      <Route
        path="/dashboard"
        element={
          isAuthenticated && user?.role === "User" ? (
            <Dashboard />
          ) : (
            <Navigate to="/" />
          )
        }
      />
      {/* <Route path="/admin-dashboard" element={<AdminDashboard />} /> */}
      <Route path="/admin-employees" element={<AdminEmployees />} />
      <Route path="/admin-attendance" element={<AdminAttendance />} />
      <Route path="/admin-leaves" element={<AdminLeaves />} />
      <Route path="/admin-payrolls" element={<AdminPayrolls />} />
      <Route path="/admin-departments" element={<AdminDepartments />} />
      <Route path="/admin-settings" element={<AdminSettings />} />
      {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      <Route path="/employees" element={<Employees />} />
      <Route path="/attendance" element={<Attendance />} />
      <Route path="/leaves" element={<Leaves />} />
      <Route path="/payrolls" element={<Payrolls />} />
      <Route path="/departments" element={<Departments />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
}

export default AppRoutes;
