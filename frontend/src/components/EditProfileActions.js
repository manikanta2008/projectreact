// EditProfileActions.jsx
import React from "react";
import axios from "axios";

function EditProfileActions({
  isEditing,
  setIsEditing,
  user,
  fetchProfile,
  email,
}) {
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");

      await axios.put(
        `http://127.0.0.1:8000/profile/${email}`,
        {
          name: user.name,
          mobile: user.mobile,
          dob: user.dob,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      alert("Profile Updated in Database Successfully!");
      setIsEditing(false); // Lock fields back up
    } catch (error) {
      console.error("Update Error:", error);
      alert("Failed to update profile in database");
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfile(); // Reverts changes back to DB values
  };

  return (
    <div className="profile-actions-container">
      {!isEditing ? (
        <button type="button" onClick={handleEdit} className="edit-btn">
          ✏ Edit
        </button>
      ) : (
        <div
          className="action-buttons"
          style={{ display: "flex", gap: "10px" }}
        >
          <button type="button" onClick={handleSave} className="save-btn">
            💾 Save
          </button>
          <button type="button" onClick={handleCancel} className="cancel-btn">
            ❌ Cancel
          </button>
        </div>
      )}
    </div>
  );
}

export default EditProfileActions;
