import React from "react";
import { AdminNavbar, AdminSidebar } from "../../Components/Navbar";
import AdminAttendanceContent from "./AdminAttendanceContent";

const AdminAttendance = () => {
  return (
    <div>
      <AdminNavbar />
      <div className="relative flex">
        <div className="absolute left-0 top-0 h-full">
          <AdminSidebar />
        </div>
        <div className="ml-16 p-6">
          <AdminAttendanceContent />
        </div>
      </div>
    </div>
  );
};

export default AdminAttendance;
