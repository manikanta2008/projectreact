import React, { useEffect, useState, useCallback } from "react";
import "./Aptitude.css";

function Aptitude() {
  const [topics, setTopics] = useState([]);
  const [completedTopics, setCompletedTopics] = useState([]);

  const userId = localStorage.getItem("user_id");

  // Backend API URL
  const API_URL =
    process.env.REACT_APP_API_URL || "http://localhost:8000";

  // Load aptitude topics
  const loadTopics = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/aptitude-topics`);

      if (!response.ok) {
        throw new Error(`Failed to fetch topics: ${response.status}`);
      }

      const data = await response.json();
      setTopics(data.topics || []);

    } catch (error) {
      console.error("Error loading topics:", error);
    }
  }, [API_URL]);

  // Load user progress
  const loadProgress = useCallback(async () => {
    try {
      const targetUserId = parseInt(userId, 10);

      if (isNaN(targetUserId)) return;

      const response = await fetch(
        `${API_URL}/aptitude-progress/${targetUserId}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch progress metrics: ${response.status}`
        );
      }

      const data = await response.json();

      const completed = data.map((item) => item.topic_id);

      setCompletedTopics(completed);

    } catch (error) {
      console.error("Error loading progress:", error);
    }
  }, [userId, API_URL]);

  // useEffect with correct dependencies
  useEffect(() => {
    loadTopics();

    if (userId) {
      loadProgress();
    } else {
      console.warn("No valid user_id found. Please log in.");
    }
  }, [userId, loadTopics, loadProgress]);

  // Save completed topic
  const handleCheckbox = async (topicId) => {
    try {
      const targetUserId = parseInt(userId, 10);

      if (isNaN(targetUserId)) {
        alert("Session expired. Please log in again.");
        return;
      }

      if (completedTopics.includes(topicId)) {
        return;
      }

      const response = await fetch(
        `${API_URL}/aptitude-progress/save`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: targetUserId,
            topic_id: parseInt(topicId, 10),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || `Server error: ${response.status}`
        );
      }

      setCompletedTopics((prev) => [...prev, topicId]);

    } catch (error) {
      console.error("Error saving progress:", error.message);
      alert(`Could not save progress: ${error.message}`);
    }
  };

  const completedCount = completedTopics.length;

  const percentage =
    topics.length > 0
      ? Math.round((completedCount / topics.length) * 100)
      : 0;

  const startPractice = (topic) => {
    console.log("Starting practice for topic:", topic.title);
  };

  return (
    <div className="aptitude-container">

      <h1 className="page-title">Aptitude Practice</h1>

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
            style={{ width: `${percentage}%` }}
          >
            {percentage}%
          </div>
        </div>
      </div>

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
