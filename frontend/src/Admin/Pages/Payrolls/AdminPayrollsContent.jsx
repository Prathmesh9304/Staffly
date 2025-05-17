import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axiosInstance from "../../../axiosInstance";
import jsPDF from "jspdf";

const AdminPayrollsContent = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [isManageCardOpen, setIsManageCardOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollForm, setPayrollForm] = useState({
    basic_salary: "",
    allowance: "",
    deduction: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [payrollToDelete, setPayrollToDelete] = useState(null);
  const [showPayslipCard, setShowPayslipCard] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return "Not paid";
    return new Date(dateString).toLocaleDateString();
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();

      // Add company logo or name
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 255);
      doc.text("Staffly", 105, 20, { align: "center" });

      // Add payslip title
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      doc.text("PAYSLIP", 105, 30, { align: "center" });

      // Add payroll details
      doc.setFontSize(12);
      doc.text(
        `Employee: ${selectedPayroll.first_name} ${selectedPayroll.last_name}`,
        20,
        50
      );
      doc.text(`Payroll ID: ${selectedPayroll.payroll_id}`, 20, 60);
      doc.text(
        `Payment Date: ${formatDate(selectedPayroll.payment_date)}`,
        20,
        70
      );
      doc.text(
        `Net Salary: ${formatCurrency(selectedPayroll.net_salary)}`,
        20,
        80
      );
      doc.text(`Status: ${selectedPayroll.payment_status}`, 20, 90);

      // Add footer
      doc.setFontSize(10);
      doc.text(
        "This is a computer-generated document. No signature is required.",
        105,
        270,
        { align: "center" }
      );

      // Save the PDF
      doc.save(`Staffly_Payslip_${selectedPayroll.payroll_id}.pdf`);
      toast.success("Payslip downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate payslip");
    }
  };

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
    const fetchDepartments = async () => {
      try {
        const response = await axiosInstance.get("/departments");
        setDepartments(response.data.departments || []);
      } catch (err) {
        console.error("Error fetching departments:", err);
      }
    };
    fetchDepartments();
  }, [selectedMonth, selectedYear]);

  const fetchEmployees = async () => {
    try {
      const response = await axiosInstance.get("/employees");
      setEmployees(response.data.employees || []);
      console.log("Fetched employees:", response.data.employees);
    } catch (err) {
      console.error("Error fetching employees:", err);
      toast.error("Failed to load employees");
      setEmployees([]);
    }
  };

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      setError(null);

      let url = "/payrolls";
      const params = new URLSearchParams();

      if (selectedMonth !== "all") {
        // Convert month to number and ensure it's two digits
        const monthNum = parseInt(selectedMonth);
        const monthStr = monthNum.toString().padStart(2, "0");
        params.append("month", monthStr);
      }
      if (selectedYear !== "all") {
        params.append("year", selectedYear);
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await axiosInstance.get(url);

      // Sort payrolls by month and year if needed
      let sortedPayrolls = [...(response.data.payrolls || [])];

      if (selectedMonth !== "all" || selectedYear !== "all") {
        sortedPayrolls.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);

          if (
            selectedYear !== "all" &&
            dateA.getFullYear() !== dateB.getFullYear()
          ) {
            return dateB.getFullYear() - dateA.getFullYear();
          }

          if (
            selectedMonth !== "all" &&
            dateA.getMonth() !== dateB.getMonth()
          ) {
            return dateB.getMonth() - dateA.getMonth();
          }

          return new Date(b.created_at) - new Date(a.created_at);
        });
      }

      setPayrolls(sortedPayrolls);
    } catch (err) {
      console.error("Error fetching payrolls:", err);
      setError(err.response?.data?.error || "Failed to fetch payrolls");
      toast.error("Failed to fetch payrolls");
    } finally {
      setLoading(false);
    }
  };

  const handleManagePayroll = (employee) => {
    setSelectedEmployee(employee);
    // Set form values from employee data
    setPayrollForm({
      basic_salary: employee.basic_salary?.toString() || "0",
      allowance: employee.allowance?.toString() || "0",
      deduction: employee.deduction?.toString() || "0",
    });
    setIsManageCardOpen(true);
  };

  const handlePayrollFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Input validation
      const basic_salary = parseFloat(payrollForm.basic_salary);
      const allowance = parseFloat(payrollForm.allowance);
      const deduction = parseFloat(payrollForm.deduction);

      if (isNaN(basic_salary) || isNaN(allowance) || isNaN(deduction)) {
        toast.error("Please enter valid numbers for all salary fields");
        return;
      }

      const formData = {
        basic_salary,
        allowance,
        deduction,
      };

      console.log("Submitting salary update:", formData);

      const response = await axiosInstance.put(
        `/payrolls/employees/${selectedEmployee.employee_id}/salary`,
        formData
      );

      console.log("Server response:", response.data);

      if (response.data.message) {
        toast.success(response.data.message);
        setIsManageCardOpen(false);
        fetchPayrolls();
        fetchEmployees();
      }
    } catch (err) {
      console.error("Error updating salary:", err);
      const errorMessage =
        err.response?.data?.error ||
        err.response?.data?.details ||
        "Failed to update salary details";
      toast.error(errorMessage);
    }
  };

  const handleStatusUpdate = async (payrollId, newStatus) => {
    try {
      await axiosInstance.put(`/payrolls/${payrollId}/status`, {
        status: newStatus,
      });
      toast.success("Payment status updated successfully");
      fetchPayrolls();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update payment status");
    }
  };

  const generateMonthlyPayroll = async () => {
    try {
      // Ensure we have both month and year
      if (selectedMonth === "all" || selectedYear === "all") {
        toast.error("Please select both month and year");
        return;
      }

      const month = parseInt(selectedMonth);
      const year = parseInt(selectedYear);

      if (isNaN(month) || isNaN(year)) {
        toast.error("Invalid month or year");
        return;
      }

      console.log("Generating payroll for:", { month, year });

      const response = await axiosInstance.post("/payrolls/generate", {
        month,
        year,
      });

      if (response.data.message) {
        toast.success(response.data.message);
        fetchPayrolls();
      }
    } catch (err) {
      console.error("Error generating payroll:", err);
      const errorMessage =
        err.response?.data?.error || "Failed to generate monthly payroll";
      toast.error(errorMessage);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      searchQuery === "" ||
      `${employee.first_name} ${employee.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesDepartment =
      selectedDepartment === "all" ||
      employee.department_id === selectedDepartment;

    return matchesSearch && matchesDepartment;
  });

  const deletePayroll = async (payrollId) => {
    try {
      await axiosInstance.delete(`/payrolls/${payrollId}`);
      toast.success("Payroll deleted successfully");
      fetchPayrolls();
      setShowDeleteConfirm(false);
      setPayrollToDelete(null);
    } catch (err) {
      console.error("Error deleting payroll:", err);
      toast.error("Failed to delete payroll");
    }
  };

  // Add a helper function to safely format numbers
  const formatCurrency = (value) => {
    if (value === null || value === undefined) return "0.00";
    const number = Number(value);
    return isNaN(number) ? "0.00" : number.toFixed(2);
  };

  const calculateNetSalary = () => {
    const basic = parseFloat(payrollForm.basic_salary) || 0;
    const allowance = parseFloat(payrollForm.allowance) || 0;
    const deduction = parseFloat(payrollForm.deduction) || 0;
    return basic + allowance - deduction;
  };

  const handlePayslipPreview = (payroll) => {
    setSelectedPayroll(payroll);
    setShowPayslipCard(true);
  };

  const handleMonthChange = (e) => {
    const value = e.target.value;
    setSelectedMonth(value === "all" ? "all" : parseInt(value));
  };

  const handleYearChange = (e) => {
    const value = e.target.value;
    setSelectedYear(value === "all" ? "all" : parseInt(value));
  };

  const monthOptions = [
    { value: "all", label: "All Months" },
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];

  return (
    <div className="p-8 min-h-screen relative w-full">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      {/* Header Section */}
      <div className="mb-12 w-full">
        <h1 className="text-5xl font-extrabold text-blue-600">Payrolls</h1>
        <h2 className="text-2xl font-semibold text-black">
          Manage Employee Payrolls
        </h2>
      </div>

      {/* Controls Section with original button style */}
      <div className="bg-white shadow-2xl rounded-3xl p-6 mb-8 w-[90%] mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500"
            >
              {monthOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={handleYearChange}
              className="px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Years</option>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => setIsManageCardOpen(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Manage Payroll
            </button>
            <button
              onClick={generateMonthlyPayroll}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Generate Monthly Payroll
            </button>
          </div>
        </div>
      </div>

      {/* Updated Manage Payroll Card */}
      {isManageCardOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsManageCardOpen(false)}
        >
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-4xl mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Card Header with updated close button hover effect */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-green-600">
                Manage Payroll
              </h3>
              <button
                onClick={() => setIsManageCardOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 transition-colors group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500 group-hover:text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column - Employee Selection */}
              <div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Employee
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 border-b border-gray-300 focus:border-green-500 focus:outline-none"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Department
                  </label>
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((dept) => (
                      <option
                        key={dept.department_id}
                        value={dept.department_id}
                      >
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Employee List */}
                <div className="border rounded-md h-[300px] overflow-y-auto">
                  {filteredEmployees.length > 0 ? (
                    <div className="divide-y">
                      {filteredEmployees.map((employee) => (
                        <div
                          key={employee.employee_id}
                          onClick={() => handleManagePayroll(employee)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedEmployee?.employee_id ===
                            employee.employee_id
                              ? "bg-green-50 border-l-4 border-green-500"
                              : ""
                          }`}
                        >
                          <div className="font-medium">
                            {employee.first_name} {employee.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {departments.find(
                              (d) => d.department_id === employee.department_id
                            )?.name || "No Department"}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No employees found
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Payroll Form */}
              <div>
                {selectedEmployee ? (
                  <form
                    onSubmit={handlePayrollFormSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <h4 className="font-medium mb-4">
                        Payroll Details for {selectedEmployee.first_name}{" "}
                        {selectedEmployee.last_name}
                      </h4>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Basic Salary
                      </label>
                      <input
                        type="number"
                        value={payrollForm.basic_salary}
                        onChange={(e) =>
                          setPayrollForm({
                            ...payrollForm,
                            basic_salary: e.target.value,
                          })
                        }
                        className="mt-1 block w-full p-2 border-b border-gray-300 focus:border-green-500 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Allowance
                      </label>
                      <input
                        type="number"
                        value={payrollForm.allowance}
                        onChange={(e) =>
                          setPayrollForm({
                            ...payrollForm,
                            allowance: e.target.value,
                          })
                        }
                        className="mt-1 block w-full p-2 border-b border-gray-300 focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Deduction
                      </label>
                      <input
                        type="number"
                        value={payrollForm.deduction}
                        onChange={(e) =>
                          setPayrollForm({
                            ...payrollForm,
                            deduction: e.target.value,
                          })
                        }
                        className="mt-1 block w-full p-2 border-b border-gray-300 focus:border-green-500 focus:outline-none"
                      />
                    </div>
                    <div className="pt-4">
                      <button
                        type="submit"
                        className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Select an employee to manage payroll
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payroll Table */}
      <div className="bg-white shadow-2xl rounded-3xl p-10 mb-12 w-[90%] mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="text-red-600 text-center">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Employee
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Basic Salary
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Allowance
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Deduction
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrolls.map((payroll) => (
                  <tr key={payroll.payroll_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payroll.first_name} {payroll.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{formatCurrency(payroll.basic_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{formatCurrency(payroll.allowance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{formatCurrency(payroll.deduction)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{formatCurrency(payroll.net_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${
                          payroll.payment_status === "paid"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {payroll.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {payroll.payment_status === "pending" && (
                        <>
                          <button
                            onClick={() =>
                              handleStatusUpdate(payroll.payroll_id, "paid")
                            }
                            className="text-blue-600 hover:text-blue-900 mr-4"
                          >
                            Mark as Paid
                          </button>
                          <button
                            onClick={() => {
                              setPayrollToDelete(payroll.payroll_id);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </>
                      )}
                      {payroll.payment_status === "paid" && (
                        <button
                          onClick={() => handlePayslipPreview(payroll)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                            />
                          </svg>
                          Download Payslip
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Card */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => {
            setShowDeleteConfirm(false);
            setPayrollToDelete(null);
          }}
        >
          <div
            className="bg-white rounded-3xl p-8 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-red-600">
                Confirm Delete
              </h3>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPayrollToDelete(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-red-100 transition-colors group"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-500 group-hover:text-red-500"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this payroll? This action cannot
              be undone.
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setPayrollToDelete(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => deletePayroll(payrollToDelete)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payslip Preview Card */}
      {showPayslipCard && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowPayslipCard(false)}
              className="absolute top-4 right-4 bg-gray-200 rounded-full p-2 hover:bg-red-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500 group"
            >
              <svg
                className="h-6 w-6 text-gray-700 group-hover:text-white transition-colors duration-300"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Payslip Preview Content */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-center text-blue-600 mb-2">
                Staffly
              </h2>
              <h3 className="text-xl font-semibold text-center mb-6">
                PAYSLIP
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Employee:</span>
                  <span>{`${selectedPayroll.first_name} ${selectedPayroll.last_name}`}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Payroll ID:</span>
                  <span>{selectedPayroll.payroll_id}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Payment Date:</span>
                  <span>{formatDate(selectedPayroll.payment_date)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Net Salary:</span>
                  <span>{formatCurrency(selectedPayroll.net_salary)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Status:</span>
                  <span
                    className={`px-2 rounded-full ${
                      selectedPayroll.payment_status === "paid"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedPayroll.payment_status}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-6">
                This is a computer-generated document. No signature is required.
              </p>
            </div>

            {/* Download Button */}
            <div className="flex justify-center">
              <button
                onClick={generatePDF}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPayrollsContent;
