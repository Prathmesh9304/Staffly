import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import axiosInstance from "../../../axiosInstance";

const DashboardComponent = () => {
  const [employee, setEmployee] = useState(null);
  const [greeting, setGreeting] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setError("User is not authenticated.");
      setLoading(false);
      return;
    }

    const fetchEmployeeData = async () => {
      try {
        const response = await axiosInstance.get("/employees/current");
        setEmployee(response.data);
      } catch (error) {
        console.error("Error fetching employee data:", error);
        setError("Failed to load employee data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    // Set greeting
    const getGreeting = () => {
      const currentHour = new Date().getHours();
      if (currentHour >= 5 && currentHour < 12) {
        return "Good Morning";
      } else if (currentHour >= 12 && currentHour < 17) {
        return "Good Afternoon";
      } else if (currentHour >= 17 && currentHour < 21) {
        return "Good Evening";
      } else {
        return "Good Night";
      }
    };

    setGreeting(getGreeting());
    fetchEmployeeData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl text-gray-600">Loading employee details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">
      <h1 className="text-4xl font-extrabold mb-2 text-blue-500">
        {greeting},
      </h1>
      <h2 className="text-3xl font-bold mb-6 text-gray-700">
        {employee.first_name} {employee.last_name}
      </h2>
      <div className="max-w-5xl mx-auto">
        {/* User Details Card */}
        <div className="bg-white shadow-2xl rounded-3xl p-12 mb-8 transform hover:scale-105 transition-transform duration-300">
          <h3 className="text-2xl font-semibold mb-6 text-gray-800">
            Your Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* First Name */}
            <div className="flex items-center">
              <span className="text-blue-500 mr-6">
                {/* Icon: User */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-labelledby="userIconTitle"
                  role="img"
                >
                  <title id="userIconTitle">User Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </span>
              <div>
                <p className="text-lg font-medium text-gray-700">First Name</p>
                <p className="text-md text-gray-500">{employee.first_name}</p>
              </div>
            </div>

            {/* Last Name */}
            <div className="flex items-center">
              <span className="text-green-500 mr-6">
                {/* Icon: User */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-labelledby="userIconTitle"
                  role="img"
                >
                  <title id="userIconTitle">User Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </span>
              <div>
                <p className="text-lg font-medium text-gray-700">Last Name</p>
                <p className="text-md text-gray-500">{employee.last_name}</p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center">
              <span className="text-purple-500 mr-6">
                {/* Icon: Mail */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-labelledby="emailIconTitle"
                  role="img"
                >
                  <title id="emailIconTitle">Email Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </span>
              <div>
                <p className="text-lg font-medium text-gray-700">Email</p>
                <p className="text-md text-gray-500">{employee.email}</p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-center">
              <span className="text-red-500 mr-6">
                {/* Icon: Telephone Receiver */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-labelledby="phoneIconTitle"
                  role="img"
                >
                  <title id="phoneIconTitle">Phone Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 5a2 2 0 012-2h3.28a2 2 0 011.664.89l1.6 2.4a2 2 0 01-.334 2.732l-2 2a16 16 0 006.16 6.16l2-2a2 2 0 012.732-.334l2.4 1.6A2 2 0 0121 14.28V18a2 2 0 01-2 2h-1a16 16 0 01-6-6l-2-2a2 2 0 01-.334-2.732l1.6-2.4A2 2 0 0113.28 5H11a2 2 0 01-2-2z"
                  />
                </svg>
              </span>
              <div>
                <p className="text-lg font-medium text-gray-700">Phone</p>
                <p className="text-md text-gray-500">{employee.phone}</p>
              </div>
            </div>

            {/* Department */}
            <div className="flex items-center">
              <span className="text-yellow-500 mr-6">
                {/* Icon: Home */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-8 w-8"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-labelledby="departmentIconTitle"
                  role="img"
                >
                  <title id="departmentIconTitle">Department Icon</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M17 10v10m-7-7v7m-2-7h2m4 0h2"
                  />
                </svg>
              </span>
              <div>
                <p className="text-lg font-medium text-gray-700">Department</p>
                <p className="text-md text-gray-500">
                  {employee.department_name}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Cards or Content */}
        {/* Example: You can add more stunning cards here as needed */}
      </div>
    </div>
  );
};

export default DashboardComponent;
