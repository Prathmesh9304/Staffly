import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../../../axiosInstance";
import { toast } from "react-toastify";

const AdminEmployeesContent = () => {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [error, setError] = useState(null);
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditCardOpen, setIsEditCardOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    department_id: "",
    username: "",
    password: "",
    role: "User",
  });
  const [formError, setFormError] = useState("");
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const textareaRef = useRef(null);

  useEffect(() => {
    // Fetch departments from backend API
    const fetchDepartments = async () => {
      try {
        const response = await axiosInstance.get("/departments");
        const data = response.data;
        if (response.status === 200) {
          setDepartments(data.departments);
          setLoadingDepartments(false);
        } else {
          setError(data.error || "Failed to fetch departments.");
          setLoadingDepartments(false);
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching departments.");
        setLoadingDepartments(false);
        console.error("Fetch Departments Error:", err);
      }
    };

    // Fetch employees from backend API
    const fetchEmployees = async () => {
      try {
        const response = await axiosInstance.get("/employees");
        const data = response.data;
        if (response.status === 200) {
          setEmployees(data.employees);
          setLoadingEmployees(false);
        } else {
          setError(data.error || "Failed to fetch employees.");
          setLoadingEmployees(false);
        }
      } catch (err) {
        setError("An unexpected error occurred while fetching employees.");
        setLoadingEmployees(false);
        console.error("Fetch Employees Error:", err);
      }
    };

    fetchDepartments();
    fetchEmployees();
  }, []);

  // Add useEffect to get current user info
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await axiosInstance.get("/employees/current");
        setCurrentUser(response.data);
      } catch (err) {
        console.error("Error fetching current user:", err);
      }
    };

    fetchCurrentUser();
  }, []);

  // Handler to open Add Employee card
  const handleAddEmployee = () => {
    setFormData({
      employee_id: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      department_id: "",
      username: "",
      password: "",
      role: "User",
    });
    setFormError("");
    setIsAddCardOpen(true);
  };

  // Handler to open Edit Employee card
  const handleEditEmployee = (employee) => {
    setFormData({
      employee_id: employee.employee_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      email: employee.email,
      phone: employee.phone,
      department_id: employee.department_id,
      username: employee.username,
      password: "",
      role: employee.role || "User",
    });
    setFormError("");
    setIsEditCardOpen(true);
  };

  // Handler to close Add/Edit Employee cards
  const handleCloseCard = () => {
    setIsAddCardOpen(false);
    setIsEditCardOpen(false);
    setFormError("");
    setShowPassword(false);
    setFormData({
      employee_id: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      department_id: "",
      username: "",
      password: "",
      role: "User",
    });
  };

  // Handler for form input changes with real-time validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Additional validation can be added here if necessary
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        setFormError("Please enter a valid email address.");
      } else {
        setFormError("");
      }
    }
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^\d{10}$/; // Exactly 10 digits
    return phoneRegex.test(phone);
  };

  // Handler for form submission (Add/Edit)
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number
    if (formData.phone && !validatePhone(formData.phone)) {
      setFormError("Phone number must be exactly 10 digits");
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    // Basic validation - Modified to exclude username and password check for edit mode
    if (
      !formData.first_name ||
      !formData.last_name ||
      !formData.email ||
      !formData.phone ||
      !formData.department_id ||
      (!formData.username && isAddCardOpen) || // Only require username for new employees
      (!formData.password && isAddCardOpen) || // Only require password for new employees
      !formData.role
    ) {
      setFormError("Please fill in all required fields.");
      toast.error("Please fill in all required fields.");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }

    try {
      let response;
      if (isAddCardOpen) {
        // Create new employee
        response = await axiosInstance.post("/employees", formData);

        if (response.status === 201) {
          toast.success("Employee added successfully!");
          handleCloseCard();
          const refreshedResponse = await axiosInstance.get("/employees");
          setEmployees(refreshedResponse.data.employees);
        }
      } else if (isEditCardOpen) {
        // Edit Employee - Only send fields that have values
        const updateData = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone,
          department_id: formData.department_id,
          role: formData.role,
        };

        // Only include password if it was changed
        if (formData.password) {
          updateData.password = formData.password;
        }

        // Only include username if it was changed
        if (formData.username) {
          updateData.username = formData.username;
        }

        response = await axiosInstance.put(
          `/employees/${formData.employee_id}`,
          updateData
        );

        if (response.status === 200) {
          toast.success("Employee updated successfully!");
          handleCloseCard();
          const refreshedResponse = await axiosInstance.get("/employees");
          setEmployees(refreshedResponse.data.employees);
        }
      }
    } catch (err) {
      console.error("Submit Error:", err);
      const errorMessage =
        err.response?.data?.error || "An unexpected error occurred.";
      setFormError(errorMessage);
      toast.error(errorMessage);
    }
  };

  // Modify handleDeleteClick to check current user before showing popup
  const handleDeleteClick = (employee) => {
    if (currentUser?.employee_id === employee.employee_id) {
      toast.error("You cannot delete your own account!");
      return;
    }
    setEmployeeToDelete(employee);
    setIsDeleteConfirmOpen(true);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    try {
      const response = await axiosInstance.delete(
        `/employees/${employeeToDelete.employee_id}`
      );

      if (response.status === 200) {
        toast.success("Employee deleted successfully!");
        // Refresh employees list
        const refreshedResponse = await axiosInstance.get("/employees");
        if (refreshedResponse.status === 200) {
          setEmployees(refreshedResponse.data.employees);
        }
      }
    } catch (err) {
      console.error("Delete Error:", err);
      const errorMessage =
        err.response?.data?.error || "Failed to delete employee.";
      toast.error(errorMessage);
    } finally {
      setIsDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    }
  };

  // Handle delete cancellation
  const handleDeleteCancel = () => {
    setIsDeleteConfirmOpen(false);
    setEmployeeToDelete(null);
  };

  return (
    <div className="p-8 min-h-screen relative w-full">
      {/* Header Section */}
      <div className="mb-12 w-full">
        <h1 className="text-5xl font-extrabold text-blue-600">Employees</h1>
        <h2 className="text-2xl font-semibold text-black">
          List of all Employees
        </h2>
      </div>

      {/* Main Content */}
      <div className="w-full max-w-[90%] mx-auto">
        {/* Employees Table Card */}
        <div className="bg-white shadow-2xl rounded-3xl p-10 mb-12 transition-transform transform hover:scale-105 hover:shadow-3xl w-[90%] mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-3xl font-semibold text-gray-800">
              Employee List
            </h3>
            {/* Add New Employee Button */}
            <button
              onClick={handleAddEmployee}
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
              Add New Employee
            </button>
          </div>

          {/* Loading State */}
          {loadingEmployees ? (
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

          {/* Employees Table */}
          <div className="overflow-hidden">
            <table className="min-w-full table-auto">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    First Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Last Name
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-medium uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-4 text-center text-sm font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr
                    key={employee.employee_id}
                    className="hover:bg-gray-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">
                      {employee.first_name}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">
                      {employee.last_name}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">
                      {employee.email}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">
                      {employee.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">
                      {departments.find(
                        (d) => d.department_id === employee.department_id
                      )?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 whitespace-normal text-sm text-center">
                      <div className="flex items-center justify-center space-x-4">
                        <button
                          onClick={() => handleEditEmployee(employee)}
                          className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(employee)}
                          className="text-red-600 hover:text-red-900 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Additional Cards or Content */}
        {/* Example: You can add more stunning cards here as needed */}
      </div>

      {/* Add Employee Card */}
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
              Add New Employee
            </h2>

            {/* Employee Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* First Name */}
              <div className="relative">
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="First Name *"
                />
              </div>

              {/* Last Name */}
              <div className="relative">
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Last Name *"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none ${
                    formError === "Please enter a valid email address."
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                  placeholder="Email *"
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Phone *"
                />
              </div>

              {/* Department */}
              <div className="relative">
                {loadingDepartments ? (
                  <div className="flex items-center justify-center">
                    <span className="text-gray-600">
                      Loading departments...
                    </span>
                  </div>
                ) : (
                  <select
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Department *</option>
                    {departments.map((dept) => (
                      <option
                        key={dept.department_id}
                        value={dept.department_id}
                      >
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Username */}
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Username *"
                />
              </div>

              {/* Password Input with Toggle */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 py-2 pr-10 bg-transparent border-2 rounded-md focus:outline-none ${
                    isAddCardOpen && !formData.password
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                  placeholder="Password *"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-blue-500 focus:outline-none"
                >
                  {showPassword ? (
                    // Hide password icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    // Show password icon
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-5 h-5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Role */}
              <div className="relative flex items-center">
                <span className="mr-4 text-gray-700">Role:</span>
                <label className="flex items-center mr-4">
                  <input
                    type="radio"
                    name="role"
                    value="Admin"
                    checked={formData.role === "Admin"}
                    onChange={handleInputChange}
                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Admin</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="User"
                    checked={formData.role === "User"}
                    onChange={handleInputChange}
                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">User</span>
                </label>
              </div>

              {/* Display Form Error if any */}
              {formError && (
                <div className="text-red-600 text-sm text-center mt-2 mb-2">
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
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Card */}
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
              Edit Employee
            </h2>

            {/* Employee Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Form fields with blue accent */}
              <div className="relative">
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="First Name *"
                />
              </div>

              {/* Last Name */}
              <div className="relative">
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Last Name *"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className={`block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none ${
                    formError === "Please enter a valid email address."
                      ? "border-red-500"
                      : "border-gray-300 focus:border-blue-500"
                  }`}
                  placeholder="Email *"
                />
              </div>

              {/* Phone */}
              <div className="relative">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Phone *"
                />
              </div>

              {/* Department Dropdown */}
              <div className="relative">
                {loadingDepartments ? (
                  <div className="flex items-center justify-center">
                    <span className="text-gray-600">
                      Loading departments...
                    </span>
                  </div>
                ) : (
                  <select
                    id="department_id"
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleInputChange}
                    required
                    className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Department *</option>
                    {departments.map((dept) => (
                      <option
                        key={dept.department_id}
                        value={dept.department_id}
                      >
                        {dept.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Username */}
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Username (leave blank to keep unchanged)"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="block w-full px-4 py-2 bg-transparent border-2 rounded-md focus:outline-none focus:border-blue-500"
                  placeholder="Password (leave blank to keep unchanged)"
                />
              </div>

              {/* Role */}
              <div className="relative flex items-center">
                <span className="mr-4">Role:</span>
                <label className="flex items-center mr-4">
                  <input
                    type="radio"
                    name="role"
                    value="Admin"
                    checked={formData.role === "Admin"}
                    onChange={handleInputChange}
                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Admin</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="User"
                    checked={formData.role === "User"}
                    onChange={handleInputChange}
                    className="form-radio h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">User</span>
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
                  className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 ${
                    formError ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Only shows for non-current users */}
      {isDeleteConfirmOpen && employeeToDelete && (
        <div
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
          onClick={handleDeleteCancel}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
              Confirm Delete
            </h2>

            <p className="text-gray-600 mb-8 text-center">
              Are you sure you want to delete employee{" "}
              <span className="font-semibold text-gray-800">
                {employeeToDelete?.first_name} {employeeToDelete?.last_name}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex justify-center space-x-4">
              <button
                onClick={handleDeleteCancel}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
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

export default AdminEmployeesContent;
