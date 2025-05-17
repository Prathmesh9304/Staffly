import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 5000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Enhanced request interceptor with better error handling
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Enhanced response interceptor with better error handling
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }

    if (error.response?.status === 403) {
      const originalRequest = error.config;
      if (!originalRequest._retry) {
        originalRequest._retry = true;
        try {
          // Attempt to refresh token or handle 403 error
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem("token");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
