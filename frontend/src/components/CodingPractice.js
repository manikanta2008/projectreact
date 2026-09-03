import React, { useEffect, useState } from "react";
import "./CodingPractice.css";

function CodingPractice() {
  const [categories, setCategories] = useState([]);
  const [completedQuestions, setCompletedQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUserId = localStorage.getItem("user_id");
    loadData(currentUserId);
  }, []);

  const loadData = async (userId) => {
    try {
      // 1. Load All Coding Questions
      const questionsRes = await fetch(
        "http://localhost:8000/coding-questions",
      );
      const questionsData = await questionsRes.json();
      setCategories(questionsData.categories || []);

      // 2. Load Progress for Specific User if they are logged in
      if (userId) {
        const userIdNum = Number(userId);

        const progressRes = await fetch(
          `http://localhost:8000/coding/progress/${userIdNum}`,
        );

        if (progressRes.ok) {
          const progressData = await progressRes.json();

          // Force conversion of question_id to Numbers for strict array comparison matching
          const mappedIds = progressData.map((item) =>
            Number(item.question_id),
          );
          setCompletedQuestions(mappedIds);
        }
      }
    } catch (error) {
      console.error("Error loading dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCompleted = async (questionId) => {
    // 👇 FIXED: Changed from "userId" to "user_id" here as well
    const currentUserId = localStorage.getItem("user_id");

    if (!currentUserId) {
      alert("User ID not found! Please log in.");
      return;
    }

    // Capture explicit Number representation
    const targetQuestionId = Number(questionId);

    try {
      const response = await fetch("http://localhost:8000/coding/progress", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: Number(currentUserId),
          question_id: targetQuestionId,
        }),
      });

      if (response.ok) {
        const result = await response.json();

        // Sync local component state instantly based on database return validation flag
        if (result.completed) {
          setCompletedQuestions((prev) =>
            prev.includes(targetQuestionId)
              ? prev
              : [...prev, targetQuestionId],
          );
        } else {
          setCompletedQuestions((prev) =>
            prev.filter((id) => id !== targetQuestionId),
          );
        }
      }
    } catch (error) {
      console.error("Progress Update Error:", error);
    }
  };

  // Safe Total Metrics Calculation
  const totalQuestions = 100;
  const completedCount = completedQuestions.length;
  const progress =
    totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0;

  if (loading) {
    return (
      <div className="coding-practice">
        <h2
          style={{ textAlign: "center", marginTop: "40px", color: "#64748b" }}
        >
          Loading Questions...
        </h2>
      </div>
    );
  }

  return (
    <div className="coding-practice">
      <h1 className="page-title">Top 100 MNC Coding Questions</h1>

      {/* Progress Section */}
      <div className="progress-section">
        <h3>
          Progress: {completedCount}/{totalQuestions}
        </h3>

        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${progress}%`,
            }}
          />
        </div>

        <p>{Math.round(progress)}% Completed</p>
      </div>

      {/* Categories Grid Container */}
      {categories.map((category) => (
        <div key={category.id} className="category-section">
          <h2 className="category-title">{category.name}</h2>

          <div className="questions-container">
            {category.questions.map((question) => {
              const isCompleted = completedQuestions.includes(
                Number(question.id),
              );

              return (
                <div
                  key={question.id}
                  className={`question-card ${isCompleted ? "completed-card" : ""}`}
                >
                  <div className="question-header">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={() => toggleCompleted(question.id)}
                    />

                    <span className="question-id">#{question.id}</span>

                    <span
                      className={`difficulty ${question.difficulty?.toLowerCase() || ""}`}
                    >
                      {question.difficulty}
                    </span>
                  </div>

                  <h3
                    className="question-title"
                    onClick={() => window.open(question.leetcode_url, "_blank")}
                  >
                    {question.title}
                  </h3>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export default CodingPractice;
