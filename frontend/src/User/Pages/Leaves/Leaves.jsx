import React from "react";
import { Navbar, Sidebar } from "../../Components/Navbar";
import LeavesContent from "./LeavesContent";

const Leaves = () => {
  return (
    <div>
      <Navbar />
      <div className="relative flex">
        <div className="absolute left-0 top-0 h-full z-50">
          <Sidebar />
        </div>
        <div className="ml-16 p-6 w-full">
          <LeavesContent />
        </div>
      </div>
    </div>
  );
};

export default Leaves;
