import React, { useState, useEffect, useRef } from "react";
import "./InterviewPage.css";

function InterviewPage() {
  const [resume, setResume] = useState(null);
  const [sessionId, setSessionId] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [answer, setAnswer] = useState("");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const chatEndRef = useRef(null);

  // Auto-scrolls the chat window down when a new message arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  const startInterview = async () => {
    if (!resume) {
      alert("Please select a resume file first.");
      return;
    }

    setLoading(true);
    setReport(null);
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);

    const formData = new FormData();
    formData.append("file", resume);
    formData.append("session_id", newSessionId);

    try {
      const res = await fetch("http://localhost:8000/upload-resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();

      setChatHistory([{ role: "assistant", content: data.question }]);
      setInterviewStarted(true);
    } catch (error) {
      alert("Error starting interview: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;

    const currentAnswer = answer;
    setAnswer("");
    setLoading(true);

    setChatHistory((prev) => [
      ...prev,
      { role: "user", content: currentAnswer },
    ]);

    const formData = new FormData();
    formData.append("session_id", sessionId);
    formData.append("user_answer", currentAnswer);

    try {
      const res = await fetch("http://localhost:8000/interview-chat", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Chat delivery error");
      const data = await res.json();

      setChatHistory((prev) => [
        ...prev,
        { role: "assistant", content: data.reply },
      ]);
    } catch (error) {
      alert("Error processing answer: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const stopInterview = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("session_id", sessionId);

    try {
      const res = await fetch("http://localhost:8000/stop-interview", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to pull report matrices");
      const data = await res.json();

      setReport(data);
      setInterviewStarted(false);
      setChatHistory([]);
      setSessionId("");
    } catch (error) {
      alert("Error stopping interview: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to cleanly format the AI text if it contains "---"
  const renderAssistantContent = (content) => {
    if (content.includes("---")) {
      const parts = content.split("---");
      return (
        <>
          <div className="ai-feedback-block">
            <strong>Assessment:</strong> {parts[0].trim()}
          </div>
          <div className="ai-question-block">{parts[1].trim()}</div>
        </>
      );
    }
    return <p>{content}</p>;
  };

  return (
    <div className="interview-container">
      <header className="interview-header">
        <h1>AI Interview Simulator</h1>
        <p>Real-time technical assessment tailored to your profile.</p>
      </header>

      {/* 1. UPLOAD SCREEN */}
      {!interviewStarted && !report && (
        <div className="upload-card">
          <h3>Upload your Resume to Begin</h3>
          <p>Supported formats: PDF, DOCX</p>
          <div className="file-input-wrapper">
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResume(e.target.files[0])}
            />
          </div>
          <button
            className="primary-btn"
            onClick={startInterview}
            disabled={loading}
          >
            {loading ? "Parsing Profile..." : "Initialize Interview"}
          </button>
        </div>
      )}

      {/* 2. ACTIVE CHAT LOOP */}
      {interviewStarted && (
        <div className="interview-window">
          <div className="chat-viewport">
            {chatHistory.map((msg, index) => (
              <div key={index} className={`chat-row ${msg.role}`}>
                <div className="avatar">
                  {msg.role === "user" ? "You" : "AI"}
                </div>
                <div className="bubble">
                  {msg.role === "user" ? (
                    <p>{msg.content}</p>
                  ) : (
                    renderAssistantContent(msg.content)
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-row assistant loading">
                <div className="avatar">AI</div>
                <div className="bubble typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="input-dock">
            <textarea
              placeholder="Type your response here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitAnswer();
                }
              }}
              disabled={loading}
            />
            <div className="dock-actions">
              <button className="stop-action-btn" onClick={stopInterview}>
                Stop Interview
              </button>
              <button
                className="send-action-btn"
                onClick={submitAnswer}
                disabled={loading || !answer.trim()}
              >
                Submit Answer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. REPORT CARD DISPLAY */}
      {report && (
        <div className="report-card">
          <div className="report-header">
            <h2>Performance Overview</h2>
            <div className="score-circle">
              <span className="score-num">{report.resume_rating}</span>
            </div>
          </div>

          <div className="report-grid">
            <div className="grid-col positive">
              <h4>Key Strengths</h4>
              <ul>
                {report.strengths?.map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>
            <div className="grid-col negative">
              <h4>Growth Opportunities</h4>
              <ul>
                {report.skills_to_develop?.map((skl, i) => (
                  <li key={i}>{skl}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="report-summary">
            <h4>Executive Evaluation</h4>
            <p>{report.summary}</p>
          </div>

          <button className="primary-btn" onClick={() => setReport(null)}>
            Reset & Retry
          </button>
        </div>
      )}
    </div>
  );
}

export default InterviewPage;
