import React, { useEffect, useState, useRef, useCallback } from "react";
import axiosInstance from "../../../axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import jsPDF from "jspdf";

const LeavesContent = () => {
  const [leaveApplications, setLeaveApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [greeting, setGreeting] = useState("");
  const [isCardOpen, setIsCardOpen] = useState(false);
  const [formData, setFormData] = useState({
    reason: "",
    start_date: "",
    end_date: "",
    type: "Annual",
  });
  const [formError, setFormError] = useState("");
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isReviewCardOpen, setIsReviewCardOpen] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);

  const textareaRef = useRef(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting("Good Morning");
    } else if (hour < 18) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  const fetchLeaveApplications = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/leaves/my-leaves");
      if (response.data && response.data.leaves) {
        setLeaveApplications(response.data.leaves);
        setLoading(false);
      } else {
        setLeaveApplications([]);
        setLoading(false);
        toast.info("No leave applications found");
      }
    } catch (err) {
      console.error("Error fetching leaves:", err);
      setError("Failed to fetch leave applications");
      setLoading(false);
      toast.error("Failed to fetch leave applications");
    }
  }, []);

  useEffect(() => {
    fetchLeaveApplications();
  }, [fetchLeaveApplications]);

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

  // Handler for "New Leave" button click
  const handleNewLeave = () => {
    setIsCardOpen(true);
  };

  // Handler to close the card
  const handleCloseCard = () => {
    setIsCardOpen(false);
    // Reset form data if needed
    setFormData({
      reason: "",
      start_date: "",
      end_date: "",
      type: "Annual",
    });
    setFormError("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  // Handler for form input changes with real-time validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Auto-resize textarea
    if (name === "reason" && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }

    // Real-time validation for dates
    if (name === "start_date" || name === "end_date") {
      const { start_date, end_date } = {
        ...formData,
        [name]: value,
      };

      if (start_date && end_date) {
        if (new Date(start_date) >= new Date(end_date)) {
          setFormError("Start Date must be earlier than End Date.");
        } else {
          setFormError("");
        }
      } else {
        setFormError("");
      }
    }
  };

  // Handler for form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post("/leaves", formData);
      toast.success("Leave application submitted successfully");
      setIsCardOpen(false);
      setFormData({
        reason: "",
        start_date: "",
        end_date: "",
        type: "Annual",
      });
      fetchLeaveApplications();
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to submit leave application"
      );
      console.error("Submit Error:", err);
    }
  };

  const handleEditClick = (leave) => {
    setSelectedLeave(leave);
    setFormData({
      reason: leave.reason,
      start_date: leave.start_date,
      end_date: leave.end_date,
      type: leave.type,
    });
    setIsEditCardOpen(true);
  };

  const handleDeleteClick = (leave) => {
    setSelectedLeave(leave);
    setIsDeleteConfirmOpen(true);
  };

  const handleReviewClick = (leave) => {
    setSelectedLeave(leave);
    setIsReviewCardOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axiosInstance.delete(`/leaves/${selectedLeave.leave_id}`);
      toast.success("Leave application deleted successfully");
      setIsDeleteConfirmOpen(false);
      setSelectedLeave(null);
      fetchLeaveApplications();
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to delete leave application"
      );
      console.error("Delete Error:", err);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Validate dates
    if (new Date(formData.start_date) >= new Date(formData.end_date)) {
      setFormError("Start Date must be earlier than End Date.");
      toast.error("Start Date must be earlier than End Date");
      return;
    }

    try {
      await axiosInstance.put(`/leaves/${selectedLeave.leave_id}`, formData);
      toast.success("Leave application updated successfully");
      setIsEditCardOpen(false);
      setSelectedLeave(null);
      setFormData({
        reason: "",
        start_date: "",
        end_date: "",
        type: "Annual",
      });
      fetchLeaveApplications();
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to update leave application"
      );
      console.error("Update Error:", err);
    }
  };

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

  return (
    <div className="p-8 min-h-screen relative w-full">
      {/* Greeting Section */}
      <div className="mb-12">
        <h1 className="text-5xl font-extrabold mb-2 text-blue-600 animate-fade-in">
          {greeting},
        </h1>
        <h2 className="text-3xl font-bold text-gray-800 animate-fade-in delay-200">
          Here are your Leave Applications
        </h2>
      </div>

      {/* Main Content Container */}
      <div className="w-full max-w-[90%] mx-auto">
        {/* Leave Applications Card */}
        <div className="bg-white shadow-2xl rounded-3xl p-10 mb-12 transition-transform transform hover:scale-105 hover:shadow-3xl">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-semibold text-gray-800">
              Leave Applications
            </h3>
            {/* New Leave Button */}
            <button
              onClick={handleNewLeave}
              className="flex items-center px-5 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {/* Blue Plus Icon */}
              <svg
                className="h-6 w-6 mr-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Leave
            </button>
          </div>

          {/* Loading State */}
          {loading && (
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
          )}

          {/* Leave Applications Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    S.No
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Leave ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Reason
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
                {/* Error State */}
                {error && (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-4 whitespace-nowrap text-sm text-red-600 text-center w-full"
                    >
                      {error}
                    </td>
                  </tr>
                )}

                {/* Leave Applications Rows */}
                {!loading && !error && (
                  <>
                    {leaveApplications.length > 0 ? (
                      leaveApplications
                        .sort(
                          (a, b) =>
                            new Date(b.applied_at).getTime() -
                            new Date(a.applied_at).getTime()
                        )
                        .map((leave, index) => (
                          <tr
                            key={leave.leave_id}
                            className="hover:bg-gray-50 transition-colors duration-200"
                          >
                            {/* S.No */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {leave.leave_id}
                            </td>
                            {/* Reason */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                              {leave.reason}
                            </td>
                            {/* Status */}
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span
                                className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                  leave.status
                                )}`}
                              >
                                {leave.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                              <div className="flex items-center justify-center space-x-4">
                                {leave.status === "pending" ? (
                                  <>
                                    <button
                                      onClick={() => handleEditClick(leave)}
                                      className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClick(leave)}
                                      className="text-red-600 hover:text-red-900 transition-colors duration-200"
                                    >
                                      Delete
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => handleReviewClick(leave)}
                                    className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                                  >
                                    Review
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                        >
                          No leave applications found.
                        </td>
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Cards or Content */}
        {/* Example: You can add more stunning cards here as needed */}
      </div>

      {/* New Leave Card */}
      {isCardOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={handleCloseCard}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleCloseCard}
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

            {/* Form Title */}
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
              New Leave Application
            </h2>

            {/* Leave Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Leave Type */}
              <div className="relative">
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none transition-colors duration-300 ${
                    formError && formData.type
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Personal">Personal Leave</option>
                  <option value="Other">Other</option>
                </select>
                <label
                  htmlFor="type"
                  className="absolute top-0 left-4 text-gray-500 transition-all duration-300 transform -translate-y-4 scale-75 origin-top-left pointer-events-none"
                >
                  Leave Type *
                </label>
              </div>

              {/* Reason */}
              <div className="relative">
                <textarea
                  id="reason"
                  name="reason"
                  rows="4"
                  ref={textareaRef}
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 pt-4 pb-2 bg-transparent border-2 rounded-md focus:outline-none transition-colors duration-300 resize-none overflow-hidden ${
                    formError && (formData.start_date || formData.end_date)
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                  placeholder=" "
                ></textarea>
                <label
                  htmlFor="reason"
                  className="absolute top-0 left-4 text-gray-500 transition-all duration-300 transform -translate-y-4 scale-75 origin-top-left pointer-events-none"
                >
                  Reason *
                </label>
              </div>

              {/* Start Date */}
              <div className="relative">
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none transition-colors duration-300 ${
                    formError && formData.start_date
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
                <label
                  htmlFor="start_date"
                  className="absolute top-0 left-4 text-gray-500 transition-all duration-300 transform -translate-y-4 scale-75 origin-top-left pointer-events-none"
                >
                  Start Date *
                </label>
              </div>

              {/* End Date */}
              <div className="relative">
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none transition-colors duration-300 ${
                    formError && formData.end_date
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
                <label
                  htmlFor="end_date"
                  className="absolute top-0 left-4 text-gray-500 transition-all duration-300 transform -translate-y-4 scale-75 origin-top-left pointer-events-none"
                >
                  End Date *
                </label>
              </div>

              {/* Display Form Error if any */}
              {formError && (
                <div className="text-red-600 text-sm text-center">
                  {formError}
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={!!formError} // Disable button if there's an error
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                    formError
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-blue-600 hover:to-purple-600"
                  }`}
                >
                  Submit Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Leave Card */}
      {isEditCardOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setIsEditCardOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setIsEditCardOpen(false)}
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

            {/* Form Title */}
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
              Edit Leave Application
            </h2>

            {/* Leave Form */}
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Leave Type */}
              <div className="relative">
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none transition-colors duration-300 ${
                    formError && formData.type
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                >
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Personal">Personal Leave</option>
                  <option value="Other">Other</option>
                </select>
                <label
                  htmlFor="type"
                  className="absolute top-0 left-4 text-gray-500 transition-all duration-300 transform -translate-y-4 scale-75 origin-top-left pointer-events-none"
                >
                  Leave Type *
                </label>
              </div>

              {/* Reason */}
              <div className="relative">
                <textarea
                  id="reason"
                  name="reason"
                  rows="4"
                  ref={textareaRef}
                  value={formData.reason}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 pt-4 pb-2 bg-transparent border-2 rounded-md focus:outline-none transition-colors duration-300 resize-none overflow-hidden ${
                    formError && (formData.start_date || formData.end_date)
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                  placeholder=" "
                ></textarea>
                <label
                  htmlFor="reason"
                  className="absolute top-0 left-4 text-gray-500 transition-all duration-300 transform -translate-y-4 scale-75 origin-top-left pointer-events-none"
                >
                  Reason *
                </label>
              </div>

              {/* Start Date */}
              <div className="relative">
                <input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none transition-colors duration-300 ${
                    formError && formData.start_date
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
                <label
                  htmlFor="start_date"
                  className="absolute top-0 left-4 text-gray-500 transition-all duration-300 transform -translate-y-4 scale-75 origin-top-left pointer-events-none"
                >
                  Start Date *
                </label>
              </div>

              {/* End Date */}
              <div className="relative">
                <input
                  type="date"
                  id="end_date"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none transition-colors duration-300 ${
                    formError && formData.end_date
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                />
                <label
                  htmlFor="end_date"
                  className="absolute top-0 left-4 text-gray-500 transition-all duration-300 transform -translate-y-4 scale-75 origin-top-left pointer-events-none"
                >
                  End Date *
                </label>
              </div>

              {/* Display Form Error if any */}
              {formError && (
                <div className="text-red-600 text-sm text-center">
                  {formError}
                </div>
              )}

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={!!formError}
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-purple-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300 ${
                    formError
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:from-blue-600 hover:to-purple-600"
                  }`}
                >
                  Update Leave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={() => setIsDeleteConfirmOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">
              Confirm Delete
            </h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this leave application? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Leave Card */}
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
                <p className="text-gray-600 mb-2">Leave ID</p>
                <p className="text-gray-900 font-semibold">
                  {selectedLeave.leave_id}
                </p>
              </div>
              <div>
                <p className="text-gray-600 mb-2">Type</p>
                <p className="text-gray-900 font-semibold">
                  {selectedLeave.type}
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
                <p className="text-gray-600 mb-2">Applied On</p>
                <p className="text-gray-900 font-semibold">
                  {new Date(selectedLeave.applied_at).toLocaleDateString()}
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

export default LeavesContent;
