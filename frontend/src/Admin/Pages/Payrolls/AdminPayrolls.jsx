import React from "react";
import { AdminNavbar, AdminSidebar } from "../../Components/Navbar";
import AdminPayrollsContent from "./AdminPayrollsContent";

const AdminPayrolls = () => {
  return (
    <div>
      <AdminNavbar />
      <div className="relative flex">
        <div className="absolute left-0 top-0 h-full z-50">
          <AdminSidebar />
        </div>
        <div className="ml-16 p-6 w-full">
          <AdminPayrollsContent />
        </div>
      </div>
    </div>
  );
};

export default AdminPayrolls;
