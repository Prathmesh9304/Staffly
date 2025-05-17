import React, { useEffect, useState } from "react";
import axiosInstance from "../../../axiosInstance";
import { toast } from "react-toastify";
import jsPDF from "jspdf";

const AdminLeavesContent = () => {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isReviewCardOpen, setIsReviewCardOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  useEffect(() => {
    fetchLeaveApplications();
  }, []);

  // Fetch leave applications from backend API
  const fetchLeaveApplications = async () => {
    try {
      const response = await axiosInstance.get("/leaves");
      if (response.data && response.data.leaves) {
        setLeaveApplications(response.data.leaves);
      } else {
        setLeaveApplications([]);
        toast.info("No leave applications found");
      }
      setLoading(false);
    } catch (err) {
      console.error("Fetch Error:", err);
      setError(
        "An unexpected error occurred while fetching leave applications."
      );
      toast.error("Failed to fetch leave applications");
      setLoading(false);
    }
  };

  // Function to handle status update
  const handleStatusUpdate = async (leaveId, newStatus) => {
    try {
      console.log(`Updating leave ${leaveId} to ${newStatus}`); // Debug log
      const response = await axiosInstance.put(`/leaves/${leaveId}/status`, {
        status: newStatus,
      });

      if (response.data && response.data.message) {
        toast.success(`Leave ${newStatus.toLowerCase()} successfully`);
        fetchLeaveApplications(); // Refresh the list
      } else {
        throw new Error("Unexpected response format");
      }
    } catch (err) {
      console.error("Update Error:", err);
      const errorMessage =
        err.response?.data?.error || "Failed to update leave status";
      toast.error(errorMessage);
    }
  };

  // Function to determine status color
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "text-green-700 bg-green-100";
      case "pending":
        return "text-yellow-700 bg-yellow-100";
      case "rejected":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  // Add this new function for PDF generation
  const generatePDF = () => {
    try {
      const doc = new jsPDF();

      // Add company header
      doc.setFontSize(20);
      doc.text("Staffly", 105, 20, { align: "center" });

      doc.setFontSize(16);
      doc.text("Leave Application", 105, 30, { align: "center" });

      doc.setFontSize(12);
      const content = [
        `Leave ID: ${selectedLeave.leave_id}`,
        `Employee: ${selectedLeave.first_name} ${selectedLeave.last_name}`,
        `Type: ${selectedLeave.type}`,
        `Status: ${selectedLeave.status}`,
        `Start Date: ${new Date(
          selectedLeave.start_date
        ).toLocaleDateString()}`,
        `End Date: ${new Date(selectedLeave.end_date).toLocaleDateString()}`,
        `Reason: ${selectedLeave.reason}`,
        `Applied On: ${new Date(
          selectedLeave.applied_at
        ).toLocaleDateString()}`,
      ];

      content.forEach((text, index) => {
        doc.text(text, 20, 50 + index * 10);
      });

      // Add footer
      doc.setFontSize(10);
      doc.text("This is an electronically generated document.", 105, 250, {
        align: "center",
      });
      doc.text("No signature required.", 105, 260, { align: "center" });

      doc.save(`leave_application_${selectedLeave.leave_id}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (err) {
      toast.error("Failed to generate PDF");
      console.error("PDF Error:", err);
    }
  };

  // Add this new function for handling review click
  const handleReviewClick = (leave) => {
    setSelectedLeave(leave);
    setIsReviewCardOpen(true);
  };

  return (
    <div className="p-8 min-h-screen relative w-full">
      {/* Header Section */}
      <div className="mb-12 w-full">
        <h1 className="text-5xl font-extrabold text-blue-600">Leaves</h1>
        <h2 className="text-2xl font-semibold text-black">List of Leaves</h2>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[90%] mx-auto">
        {/* Leave Applications Card */}
        <div className="bg-white shadow-2xl rounded-3xl p-10 mb-12 transition-transform transform hover:scale-105 hover:shadow-3xl w-[90%] mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-semibold text-gray-800">
              Leave Applications
            </h3>
          </div>

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <svg
                className="animate-spin h-10 w-10 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              <span className="ml-4 text-lg text-gray-600">Loading...</span>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center mb-4">{error}</div>
          ) : (
            /* Leave Applications Table */
            <div className="overflow-x-auto">
              <table className="min-w-full table-auto">
                <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                      Employee Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                      Reason
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                      Start Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                      End Date
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                      Applied At
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {leaveApplications.length > 0 ? (
                    leaveApplications.map((leave) => (
                      <tr
                        key={leave.leave_id}
                        className="hover:bg-gray-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {`${leave.first_name} ${leave.last_name}`}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className="font-bold">{leave.reason}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(leave.start_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(leave.end_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          {new Date(leave.applied_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                              leave.status
                            )}`}
                          >
                            {leave.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                          {leave.status === "pending" && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(leave.leave_id, "approved")
                                }
                                className="text-green-600 hover:text-green-900 mr-2"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusUpdate(leave.leave_id, "rejected")
                                }
                                className="text-red-600 hover:text-red-900"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {(leave.status === "approved" ||
                            leave.status === "rejected") && (
                            <button
                              onClick={() => handleReviewClick(leave)}
                              className="text-blue-600 hover:text-blue-900"
                            >
                              Review
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 text-center"
                        colSpan="7"
                      >
                        No leave applications available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Update the Review Card Modal */}
      {isReviewCardOpen && selectedLeave && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsReviewCardOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-4xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsReviewCardOpen(false)}
              className="absolute top-4 right-4 bg-gray-200 rounded-full p-2 hover:bg-red-500 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <svg
                className="h-6 w-6 text-gray-700 hover:text-white transition-colors duration-300"
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

            <h2 className="text-3xl font-bold text-gray-800 mb-6">
              Leave Application Details
            </h2>

            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-gray-600 mb-2">Employee Name</p>
                <p className="text-gray-900 font-semibold">
                  {`${selectedLeave.first_name} ${selectedLeave.last_name}`}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Leave ID</p>
                <p className="text-gray-900 font-semibold">
                  {selectedLeave.leave_id}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Start Date</p>
                <p className="text-gray-900 font-semibold">
                  {new Date(selectedLeave.start_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">End Date</p>
                <p className="text-gray-900 font-semibold">
                  {new Date(selectedLeave.end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Type</p>
                <p className="text-gray-900 font-semibold">
                  {selectedLeave.type}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Status</p>
                <span
                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    selectedLeave.status
                  )}`}
                >
                  {selectedLeave.status}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-600 mb-2">Reason</p>
              <p className="text-gray-900 font-bold">{selectedLeave.reason}</p>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                onClick={generatePDF}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Download Application
              </button>
              <button
                onClick={() => setIsReviewCardOpen(false)}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeavesContent;
