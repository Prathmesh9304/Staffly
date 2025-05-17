import React from "react";
import { AdminNavbar, AdminSidebar } from "../../Components/Navbar";
import AdminDepartmentsContent from "./AdminDepartmentsContent";

const AdminDepartments = () => {
  return (
    <div>
      <AdminNavbar />
      <div className="relative flex">
        <div className="absolute left-0 top-0 h-full z-50">
          <AdminSidebar />
        </div>
        <div className="ml-16 p-6 w-full">
          <AdminDepartmentsContent />
        </div>
      </div>
    </div>
  );
};

export default AdminDepartments;
