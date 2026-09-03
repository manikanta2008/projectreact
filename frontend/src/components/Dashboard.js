import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
// import Header from "./Header";  <-- Remove this if using Route Layouts

function Dashboard() {
  const navigate = useNavigate();
  const username = localStorage.getItem("username") || "User";

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h1>Welcome {username} 👋</h1>
        <p>Select a section to start practicing.</p>
      </div>
      {/* Feature Cards */}
      <div className="card-container">
        <div
          className="card"
          onClick={() => navigate("/interview")}
          style={{ cursor: "pointer" }}
        >
          <h3>Interview Practice</h3>
          <p>Prepare for HR and technical interviews.</p>
        </div>

        <div
          className="card"
          onClick={() => navigate("/aptitude")}
          style={{ cursor: "pointer" }}
        >
          <h3>Aptitude Practice</h3>
          <p>Practice quantitative and logical questions.</p>
        </div>

        <div
          className="card"
          onClick={() => navigate("/coding-practice")}
          style={{ cursor: "pointer" }}
        >
          <h3>Coding Practice</h3>
          <p>Top Coding Questions Asked in MNC Interview Rounds</p>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
