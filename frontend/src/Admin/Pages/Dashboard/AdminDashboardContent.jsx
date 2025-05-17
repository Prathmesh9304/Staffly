import React, { useEffect, useState } from "react";
import { useAuth } from "../../../contexts/AuthContext";
import axiosInstance from "../../../axiosInstance"; // Import the configured axios instance
import { toast } from "react-toastify";

const AdminDashboardContent = () => {
  const { user, isAuthenticated } = useAuth();
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [approvedLeaves, setApprovedLeaves] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [employee, setEmployee] = useState(null);
  const [totalPendingLeaves, setTotalPendingLeaves] = useState(0);
  const [totalPaidPayrolls, setTotalPaidPayrolls] = useState(0);
  const [totalUnpaidPayrolls, setTotalUnpaidPayrolls] = useState(0);

  useEffect(() => {
    if (!isAuthenticated || !user) {
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
        setError("Failed to load employee data.");
      }
    };

    const fetchDashboardData = async () => {
      try {
        // Keep existing API calls
        const [
          countResponse,
          departmentsResponse,
          leavesResponse,
          pendingLeavesResponse,
          payrollStatusResponse,
        ] = await Promise.all([
          axiosInstance.get("/employees/count"),
          axiosInstance.get("/departments/total"),
          axiosInstance.get("/leaves/approved"),
          axiosInstance.get("/leaves/pending"),
          axiosInstance.get("/payrolls/status-counts"),
        ]);

        // Set existing states
        if (countResponse.data?.totalEmployees) {
          setTotalEmployees(countResponse.data.totalEmployees);
        }
        if (departmentsResponse.data?.totalDepartments) {
          setTotalDepartments(departmentsResponse.data.totalDepartments);
        }
        if (leavesResponse.data?.approvedLeaves) {
          setApprovedLeaves(leavesResponse.data.approvedLeaves);
        }

        // Set new states from dedicated endpoints
        setTotalPendingLeaves(pendingLeavesResponse.data.pendingLeaves || 0);
        setTotalPaidPayrolls(payrollStatusResponse.data.paidPayrolls || 0);
        setTotalUnpaidPayrolls(payrollStatusResponse.data.unpaidPayrolls || 0);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data.");
        toast.error("Failed to fetch dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeData();
    fetchDashboardData();
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-lg">Loading dashboard...</div>
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

  if (!employee) {
    return (
      <div className="p-8">
        <div
          className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative"
          role="alert"
        >
          <strong className="font-bold">Authentication Error: </strong>
          <span className="block sm:inline">
            Employee details are missing. Please log in again.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="">
        <div className="mb-8">
          <h1 className="text-5xl font-extrabold text-blue-600">
            Welcome Admin,
          </h1>
          <h2 className="text-2xl font-semibold text-black">
            {employee.first_name} {employee.last_name}
          </h2>
        </div>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Total Employees Card */}
          <div className="transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white rounded-xl shadow-lg p-6 border-b-4 border-blue-500">
              <div className="flex flex-col">
                <div className="text-gray-500 text-sm uppercase tracking-wider mb-2">
                  Total Employees
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-gray-800">
                    {totalEmployees}
                  </span>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-blue-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Departments Card */}
          <div className="transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white rounded-xl shadow-lg p-6 border-b-4 border-purple-500">
              <div className="flex flex-col">
                <div className="text-gray-500 text-sm uppercase tracking-wider mb-2">
                  Total Departments
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-gray-800">
                    {totalDepartments}
                  </span>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-purple-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Leaves Approved Card */}
          <div className="transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white rounded-xl shadow-lg p-6 border-b-4 border-green-500">
              <div className="flex flex-col">
                <div className="text-gray-500 text-sm uppercase tracking-wider mb-2">
                  Leaves Approved
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-gray-800">
                    {approvedLeaves}
                  </span>
                  <div className="p-3 bg-green-100 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-green-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* New Stats Grid - Additional Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {/* Pending Leaves Card */}
          <div className="transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white rounded-xl shadow-lg p-6 border-b-4 border-yellow-500 h-32 flex flex-col justify-center">
              <div className="flex flex-col">
                <div className="text-gray-500 text-sm uppercase tracking-wider mb-2">
                  Pending Leaves
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-4xl font-bold text-gray-800">
                    {totalPendingLeaves}
                  </span>
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <div className="w-8 h-8 rounded-full bg-yellow-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payroll Status Card */}
          <div className="transform hover:scale-105 transition-transform duration-300">
            <div className="bg-white rounded-xl shadow-lg p-6 border-b-4 border-indigo-500 h-32 flex flex-col justify-center">
              <div className="flex flex-col">
                <div className="text-gray-500 text-sm uppercase tracking-wider mb-2">
                  Payroll Status
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">Paid</span>
                    <span className="text-2xl font-bold text-green-600 ml-2">
                      {totalPaidPayrolls}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Unpaid</span>
                    <span className="text-2xl font-bold text-red-600 ml-2">
                      {totalUnpaidPayrolls}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardContent;
