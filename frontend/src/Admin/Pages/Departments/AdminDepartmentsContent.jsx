import React, { useEffect, useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import axiosInstance from "../../../axiosInstance";

const AdminDepartmentsContent = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });
  const [formError, setFormError] = useState("");
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] = useState(null);

  useEffect(() => {
    // Fetch departments from backend API
    const fetchDepartments = async () => {
      try {
        const response = await axiosInstance.get("/departments");
        if (response.status === 200) {
          setDepartments(response.data.departments);
          setLoading(false);
        } else {
          setError("Failed to fetch departments.");
          setLoading(false);
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching departments.");
        setLoading(false);
        console.error("Fetch Departments Error:", err);
      }
    };

    fetchDepartments();
  }, []);

  // Function to generate unique ID
  const generateUniqueId = (prefix = "DEP") => {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 6);
    const uniqueId = `${prefix}${timestamp}${randomStr}`.toUpperCase();
    return uniqueId.slice(0, 10); // Ensure it's exactly 10 characters
  };

  // Handler to open Add Department card
  const handleAddDepartment = () => {
    setFormData({
      name: "",
      description: "",
    });
    setFormError("");
    setIsAddCardOpen(true);
  };

  // Handler to close the card
  const handleCloseCard = () => {
    setIsAddCardOpen(false);
    setIsEditCardOpen(false);
    setFormError("");
    setFormData({
      name: "",
      description: "",
    });
  };

  // Handler for form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handler for edit button click
  const handleEditDepartment = (department) => {
    setFormData({
      department_id: department.department_id,
      name: department.name,
      description: department.description,
    });
    setFormError("");
    setIsEditCardOpen(true);
  };

  // Handler for delete button click
  const handleDeleteClick = (department) => {
    setDepartmentToDelete(department);
    setIsDeleteConfirmOpen(true);
  };

  // Handler for delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      const response = await axiosInstance.delete(
        `/departments/${departmentToDelete.department_id}`
      );
      if (response.status === 200) {
        toast.success("Department deleted successfully!");
        // Refresh departments list
        const refreshedResponse = await axiosInstance.get("/departments");
        setDepartments(refreshedResponse.data.departments);
      }
    } catch (err) {
      console.error("Delete Error:", err);
      toast.error(err.response?.data?.error || "Failed to delete department");
    } finally {
      setIsDeleteConfirmOpen(false);
      setDepartmentToDelete(null);
    }
  };

  // Handler for delete cancellation
  const handleDeleteCancel = () => {
    setIsDeleteConfirmOpen(false);
    setDepartmentToDelete(null);
  };

  // Modified submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      let response;
      if (isAddCardOpen) {
        // Validation for new department
        if (!formData.name || !formData.description) {
          setFormError("Please fill in all required fields.");
          toast.error("Please fill in all required fields.");
          return;
        }

        // Generate unique ID for new department
        const uniqueId = generateUniqueId();
        response = await axiosInstance.post("/departments", {
          department_id: uniqueId,
          name: formData.name,
          description: formData.description,
        });

        if (response.status === 201) {
          toast.success("Department added successfully!");
        }
      } else if (isEditCardOpen) {
        // For edit, only send fields that have values
        const updateData = {};
        if (formData.name.trim()) updateData.name = formData.name;
        if (formData.description.trim())
          updateData.description = formData.description;

        if (Object.keys(updateData).length === 0) {
          setFormError("Please modify at least one field.");
          toast.error("Please modify at least one field.");
          return;
        }

        response = await axiosInstance.put(
          `/departments/${formData.department_id}`,
          updateData
        );

        if (response.status === 200) {
          toast.success("Department updated successfully!");
        }
      }

      // Refresh departments list
      const refreshedResponse = await axiosInstance.get("/departments");
      setDepartments(refreshedResponse.data.departments);
      handleCloseCard();
    } catch (err) {
      console.error("Submit Error:", err);
      const errorMessage =
        err.response?.data?.error || "An unexpected error occurred.";
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  return (
    <div className="p-8 min-h-screen relative w-full">
      <ToastContainer />
      {/* Header Section */}
      <div className="mb-12 w-full">
        <h1 className="text-5xl font-extrabold text-blue-600">Departments</h1>
        <h2 className="text-2xl font-semibold text-black">
          List of all Departments
        </h2>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[90%] mx-auto">
        {/* Departments Table Card */}
        <div className="bg-white shadow-2xl rounded-3xl p-10 mb-12 transition-transform transform hover:scale-105 hover:shadow-3xl w-[90%] mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-semibold text-gray-800">
              Department List
            </h3>
            <button
              onClick={handleAddDepartment}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-white hover:text-blue-600 hover:border-2 hover:border-blue-600 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center space-x-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Add New Department</span>
            </button>
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
          ) : null}

          {/* Departments Table */}
          <div className="overflow-hidden">
            <table className="min-w-full table-auto">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departments.length > 0 ? (
                  departments.map((department) => (
                    <tr
                      key={department.department_id}
                      className="hover:bg-gray-50 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">
                        {department.name}
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">
                        {department.description}
                      </td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-center">
                        <div className="flex items-center justify-center space-x-4">
                          <button
                            onClick={() => handleEditDepartment(department)}
                            className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteClick(department)}
                            className="text-red-600 hover:text-red-900 transition-colors duration-200"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-4 whitespace-normal text-sm text-gray-500 text-center"
                    >
                      No departments found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Department Card */}
      {isEditCardOpen && (
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
              className="absolute top-4 right-4 bg-gray-200 rounded-full p-2 hover:bg-red-500 hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <svg
                className="h-6 w-6"
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
            <h2 className="text-2xl font-semibold mb-6 text-blue-600 text-center">
              Edit Department
            </h2>

            {/* Department Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Department Name */}
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Department Name (leave blank to keep unchanged)"
                />
              </div>

              {/* Description */}
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Description (leave blank to keep unchanged)"
                ></textarea>
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
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 ${
                    formError ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Update Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Card */}
      {isAddCardOpen && (
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
              className="absolute top-4 right-4 bg-gray-200 rounded-full p-2 hover:bg-red-500 hover:text-white transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <svg
                className="h-6 w-6"
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
            <h2 className="text-2xl font-semibold mb-6 text-blue-600 text-center">
              Add New Department
            </h2>

            {/* Department Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Department Name */}
              <div className="relative">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Enter department name"
                />
              </div>

              {/* Description */}
              <div className="relative">
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500 resize-none"
                  placeholder="Enter department description"
                ></textarea>
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
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 ${
                    formError ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Add Department
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
          onClick={handleDeleteCancel}
        >
          <div
            className="bg-white rounded-lg p-8 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the department "
              {departmentToDelete?.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={handleDeleteCancel}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDepartmentsContent;
