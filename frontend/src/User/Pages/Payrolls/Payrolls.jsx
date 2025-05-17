import React from "react";
import { Navbar, Sidebar } from "../../Components/Navbar";
import PayrollsContent from "./PayrollsContent";

const Payrolls = () => {
  return (
    <div>
      <Navbar />
      <div className="relative flex">
        <div className="absolute left-0 top-0 h-full z-50">
          <Sidebar />
        </div>
        <div className="ml-16 p-6 w-full">
          <PayrollsContent />
        </div>
      </div>
    </div>
  );
};

export default Payrolls;
