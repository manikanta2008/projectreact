import React, { useEffect, useState } from "react";
import "./Aptitude.css";

function Aptitude() {
  const [topics, setTopics] = useState([]);
  const [completedTopics, setCompletedTopics] = useState([]);

  // Retrieve storage data safely inside the component lifestyle hooks
  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    loadTopics();
    if (userId) {
      loadProgress();
    } else {
      console.warn(
        "No valid user_id found in localStorage. Log in to track progress.",
      );
    }
  }, [userId]);

  const loadTopics = async () => {
    try {
      const response = await fetch("http://localhost:8000/aptitude-topics");
      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status}`);
      }
      const data = await response.json();
      setTopics(data.topics || []);
    } catch (error) {
      console.error("Error loading topics:", error);
    }
  };

  const loadProgress = async () => {
    try {
      const targetUserId = parseInt(userId, 10);
      if (isNaN(targetUserId)) return;

      const response = await fetch(
        `http://localhost:8000/aptitude-progress/${targetUserId}`,
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch progress metrics: ${response.status}`);
      }
      const data = await response.json();

      // Maps out the database fields safely
      const completed = data.map((item) => item.topic_id);
      setCompletedTopics(completed);
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const handleCheckbox = async (topicId) => {
    try {
      const targetUserId = parseInt(userId, 10);

      if (isNaN(targetUserId)) {
        alert("Session expired or invalid user profile. Please log in again.");
        return;
      }

      // If already complete, exit early
      if (completedTopics.includes(topicId)) {
        return;
      }

      const response = await fetch(
        "http://localhost:8000/aptitude-progress/save",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: targetUserId,
            topic_id: parseInt(topicId, 10),
          }),
        },
      );

      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok) {
        throw new Error(result.detail || `Server error: ${response.status}`);
      }

      // Append state update only on successful API execution
      setCompletedTopics((prev) => [...prev, topicId]);
    } catch (error) {
      console.error("Error saving progress:", error.message);
      alert(`Could not save progress: ${error.message}`);
    }
  };

  const completedCount = completedTopics.length;
  const percentage =
    topics.length > 0 ? Math.round((completedCount / topics.length) * 100) : 0;

  const startPractice = (topic) => {
    console.log("Starting practice for topic:", topic.title);
    // Add routing logic here if needed: navigate(`/aptitude/${topic.id}`)
  };

  return (
    <div className="aptitude-container">
      <h1 className="page-title">Aptitude Practice</h1>

      {/* Progress Section */}
      <div className="progress-section">
        <div className="progress-header">
          <h3>
            Completed {completedCount} of {topics.length} Topics
          </h3>
          <h3>{percentage}%</h3>
        </div>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${percentage}%`,
            }}
          >
            {percentage}%
          </div>
        </div>
      </div>

      {/* Topics List Rendering */}
      <div className="topics-list">
        {topics.map((topic) => (
          <div className="topic-row" key={topic.id}>
            <div className="checkbox-section">
              <input
                type="checkbox"
                checked={completedTopics.includes(topic.id)}
                onChange={() => handleCheckbox(topic.id)}
              />
            </div>

            <div className="topic-details">
              <h3>{topic.title}</h3>
              <p>
                <strong>Category:</strong> {topic.category}
              </p>
            </div>

            <div className="button-section">
              <button
                className="start-btn"
                onClick={() => startPractice(topic)}
              >
                Start Practice
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Aptitude;
