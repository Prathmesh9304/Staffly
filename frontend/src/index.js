import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css"; // Your main CSS file
import { AuthProvider } from "./contexts/AuthContext"; // Import AuthProvider

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      {" "}
      {/* Wrap App with AuthProvider */}
      <App />
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
