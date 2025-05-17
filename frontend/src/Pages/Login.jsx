import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "{}");

    if (token && user.role) {
      if (user.role === "Admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [navigate]);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      await login(data.user, data.token);

      if (data.user.role === "Admin") {
        navigate("/admin-dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-r from-blue-400 to-purple-500 animate-gradient">
      <div className="bg-white shadow-lg rounded-lg p-12 max-w-lg h-96 w-full transition-transform transform hover:scale-105 hover:shadow-xl">
        <h1
          className="text-5xl font-bold mb-2 text-center"
          style={{ color: "#3b82f6", fontFamily: "Poppins" }}
        >
          Staffly
        </h1>
        <p
          className="text-lg mb-6 text-center"
          style={{ fontFamily: "Poppins", color: "#4B5563" }}
        >
          Sign in to continue
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="mb-4 p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
            required
          />
          <div className="relative mb-4">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="p-3 border border-gray-300 rounded w-full focus:outline-none focus:ring-2 focus:ring-blue-400 transition duration-200"
              required
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <button
            type="submit"
            className="bg-blue-500 text-white p-3 rounded transition duration-300 ease-in-out transform w-full hover:bg-gradient-to-r hover:from-blue-400 hover:to-purple-500 hover:shadow-lg"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
