import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    emailOrMobile: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    // Clear error when user types
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/login",
        formData,
      );

      // Save user metrics to localStorage
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("email", response.data.email);

      // ─── CRITICAL KEY SYNC FIX ─────────────────────────────────
      // Saved explicitly using snake_case ("user_id") to match Aptitude.js
      localStorage.setItem("user_id", response.data.user_id);
      // ───────────────────────────────────────────────────────────

      console.log("User ID saved successfully:", response.data.user_id);
      console.log("Username saved:", response.data.username);
      console.log("Email saved:", response.data.email);

      alert("Login Successful!");

      // Redirect straight to your dashboard layout
      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      if (error.response) {
        setError("Invalid Credentials");
      } else {
        setError("Server Error. Please try again later.");
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Sign In</h2>

        {/* Display Error Message */}
        {error && <p style={{ color: "red", marginBottom: "10px" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="emailOrMobile"
            placeholder="Email or Mobile Number"
            value={formData.emailOrMobile}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
