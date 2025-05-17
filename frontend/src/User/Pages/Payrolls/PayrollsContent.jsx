import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import axiosInstance from "../../../axiosInstance";
import jsPDF from "jspdf";

const PayrollsContent = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [showPayslipCard, setShowPayslipCard] = useState(false);

  const fetchPayrolls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Debug logs
      console.log("Selected filters:", { selectedMonth, selectedYear });

      // Build query parameters
      const params = new URLSearchParams();
      if (selectedMonth !== "all") {
        params.append("month", selectedMonth);
      }
      if (selectedYear !== "all") {
        params.append("year", selectedYear);
      }

      // Make the API call without any parameters when both filters are 'all'
      const url = "/payrolls/my-payrolls";
      const finalUrl = params.toString() ? `${url}?${params.toString()}` : url;

      console.log("Making API call to:", finalUrl);

      const response = await axiosInstance.get(finalUrl);
      console.log("API Response:", response.data);

      if (!response.data.payrolls) {
        console.warn("No payrolls array in response:", response.data);
      }

      setPayrolls(response.data.payrolls || []);
    } catch (err) {
      console.error("Error fetching payrolls:", err);
      setError(err.response?.data?.error || "Failed to fetch payrolls");
      toast.error("Failed to fetch payrolls");
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    fetchPayrolls();
  }, [fetchPayrolls]);

  const formatDate = (dateString) => {
    if (!dateString) return "Not paid";
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      currencyDisplay: "narrowSymbol",
    }).format(amount);
  };

  const handlePayslipPreview = (payroll) => {
    setSelectedPayroll(payroll);
    setShowPayslipCard(true);
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
      doc.text(`Payroll ID: ${selectedPayroll.payroll_id}`, 20, 50);
      doc.text(
        `Payment Date: ${formatDate(selectedPayroll.payment_date)}`,
        20,
        60
      );
      doc.text(
        `Net Salary: ${formatCurrency(selectedPayroll.net_salary)}`,
        20,
        70
      );
      doc.text(`Status: ${selectedPayroll.payment_status}`, 20, 80);

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

  return (
    <div className="p-8 min-h-screen relative w-full">
      {/* Header Section */}
      <div className="mb-12">
        <h1 className="text-5xl font-extrabold text-blue-600">My Payrolls</h1>
        <h2 className="text-2xl font-semibold text-black">
          View Your Salary Details
        </h2>
      </div>

      {/* Controls Section */}
      <div className="bg-white shadow-2xl rounded-3xl p-6 mb-8 w-[90%] mx-auto">
        <div className="flex gap-4">
          <select
            value={selectedMonth}
            onChange={(e) => {
              console.log("Month changed to:", e.target.value); // Debug log
              setSelectedMonth(e.target.value);
            }}
            className="px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Months</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => {
              console.log("Year changed to:", e.target.value); // Debug log
              setSelectedYear(e.target.value);
            }}
            className="px-4 py-2 border rounded-md focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Years</option>
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - i}>
                {new Date().getFullYear() - i}
              </option>
            ))}
          </select>
        </div>
      </div>

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
                    Payroll ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Net Salary
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payrolls.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                    >
                      No payroll records found for this period.
                    </td>
                  </tr>
                ) : (
                  payrolls.map((payroll) => (
                    <tr key={payroll.payroll_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payroll.payroll_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(payroll.net_salary)}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payroll.payment_date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payslip Preview Card */}
      {showPayslipCard && selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 relative">
            {/* Close Button */}
            <button
              onClick={() => setShowPayslipCard(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
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

export default PayrollsContent;
