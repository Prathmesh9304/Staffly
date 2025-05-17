import React, { useState } from "react";
import { BiMenuAltLeft } from "react-icons/bi";
import { GoHome, GoPeople, GoStack } from "react-icons/go";
import { BsCalendar3, BsCalendar, BsCashCoin } from "react-icons/bs";
import { Link } from "react-router-dom";
const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  // New function to handle clicks outside the sidebar
  const handleClickOutside = (event) => {
    const sidebar = document.getElementById("admin-sidebar");
    if (sidebar && !sidebar.contains(event.target)) {
      setIsExpanded(false);
    }
  };

  // Add event listener on mount and clean up on unmount
  React.useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div
      id="admin-sidebar"
      className={`admin-sidebar bg-white shadow-lg rounded-lg p-4 ml-4 transition-all duration-300 ${
        isExpanded ? "w-48" : "w-14"
      }`}
    >
      <ul className="space-y-4">
        <li className="flex items-center mb-8 w-full" onClick={toggleSidebar}>
          <BiMenuAltLeft
            className="text-2xl"
            style={{ width: "28px", height: "28px", flexShrink: 0 }}
          />
        </li>
        <li
          className={`flex items-center transition-all duration-300 ${
            isExpanded
              ? "hover:bg-gray-100 p-2 rounded transition-colors duration-200"
              : ""
          }`}
        >
          <Link to="/dashboard" className="flex items-center w-full">
            <GoHome
              className="text-xl"
              style={{ width: "24px", height: "24px", flexShrink: 0 }}
            />
            <span className={`ml-2 ${isExpanded ? "block" : "hidden"}`}>
              Dashboard
            </span>
          </Link>
        </li>
        {/* <li
          className={`flex items-center transition-all duration-300 ${
            isExpanded
              ? "hover:bg-gray-100 p-2 rounded transition-colors duration-200"
              : ""
          }`}
        >
          <Link to="/employees" className="flex items-center w-full">
            <GoPeople
              className="text-xl"
              style={{ width: "24px", height: "24px", flexShrink: 0 }}
            />
            <span className={`ml-2 ${isExpanded ? "block" : "hidden"}`}>
              Employees
            </span>
          </Link>
        </li> */}
        {/* <li
          className={`flex items-center transition-all duration-300 ${
            isExpanded
              ? "hover:bg-gray-100 p-2 rounded transition-colors duration-200"
              : ""
          }`}
        >
          <Link to="/attendance" className="flex items-center w-full">
            <BsCalendar3
              className="text-xl"
              style={{ width: "24px", height: "24px", flexShrink: 0 }}
            />
            <span className={`ml-2 ${isExpanded ? "block" : "hidden"}`}>
              Attendance
            </span>
          </Link>
        </li> */}
        <li
          className={`flex items-center transition-all duration-300 ${
            isExpanded
              ? "hover:bg-gray-100 p-2 rounded transition-colors duration-200"
              : ""
          }`}
        >
          <Link to="/leaves" className="flex items-center w-full">
            <BsCalendar
              className="text-xl"
              style={{ width: "24px", height: "24px", flexShrink: 0 }}
            />
            <span className={`ml-2 ${isExpanded ? "block" : "hidden"}`}>
              Leaves
            </span>
          </Link>
        </li>
        <li
          className={`flex items-center transition-all duration-300 ${
            isExpanded
              ? "hover:bg-gray-100 p-2 rounded transition-colors duration-200"
              : ""
          }`}
        >
          <Link to="/payrolls" className="flex items-center w-full">
            <BsCashCoin
              className="text-xl"
              style={{ width: "24px", height: "24px", flexShrink: 0 }}
            />
            <span className={`ml-2 ${isExpanded ? "block" : "hidden"}`}>
              Payroll
            </span>
          </Link>
        </li>
        {/* <li
          className={`flex items-center transition-all duration-300 ${
            isExpanded
              ? "hover:bg-gray-100 p-2 rounded transition-colors duration-200"
              : ""
          }`}
        >
          <Link to="/departments" className="flex items-center w-full">
            <GoStack
              className="text-xl"
              style={{ width: "24px", height: "24px", flexShrink: 0 }}
            />
            <span className={`ml-2 ${isExpanded ? "block" : "hidden"}`}>
              Departments
            </span>
          </Link>
        </li> */}
      </ul>
    </div>
  );
};

export default Sidebar;
