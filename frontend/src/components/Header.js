import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Header() {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };
  return (
    <div>
      <nav className="navbar">
        <h2>Interview Preparation Portal</h2>

        <div className="nav-actions">
          <button
            className="profile-btn"
            onClick={() => navigate("/Dashboard")}
          >
            Home
          </button>

          <button className="profile-btn" onClick={() => navigate("/profile")}>
            Profile
          </button>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>
    </div>
  );
}

export default Header;
