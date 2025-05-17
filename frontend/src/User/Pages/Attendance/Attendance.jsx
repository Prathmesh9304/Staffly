import React from "react";
import { Navbar, Sidebar } from "../../Components/Navbar";
import AttendanceContent from "./AttendanceContent";

const Attendance = () => {
  return (
    <div>
      <Navbar />
      <div className="relative flex">
        <div className="absolute left-0 top-0 h-full">
          <Sidebar />
        </div>
        <div className="ml-16 p-6">
          <AttendanceContent />
        </div>
      </div>
    </div>
  );
};

export default Attendance;
