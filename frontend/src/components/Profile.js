import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import EditProfileActions from "./EditProfileActions"; // Import here
import "./Profile.css";

function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState({
    name: "",
    email: "",
    mobile: "",
    dob: "",
  });
  const email = localStorage.getItem("email");

  const fetchProfile = useCallback(async () => {
    if (!email) return;
    try {
      const response = await axios.get(
        `http://127.0.0.1:8000/profile/${email}`,
      );
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  }, [email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div
          className="profile-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2>My Profile</h2>

          {/* Render the separate button component here and pass down the props */}
          <EditProfileActions
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            user={user}
            fetchProfile={fetchProfile}
            email={email}
          />
        </div>

        {/* Input Fields */}
        <div className="field">
          <label>Name</label>
          <input
            type="text"
            name="name"
            value={user.name || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input type="email" name="email" value={user.email || ""} disabled />
        </div>
        <div className="field">
          <label>Mobile Number</label>
          <input
            type="text"
            name="mobile"
            value={user.mobile || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
        <div className="field">
          <label>Date of Birth</label>
          <input
            type="date"
            name="dob"
            value={user.dob || ""}
            onChange={handleChange}
            disabled={!isEditing}
          />
        </div>
      </div>
    </div>
  );
}

export default Profile;
