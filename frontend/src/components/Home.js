import "./Home.css";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="home">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">Interview Preparation Portal</div>

        <ul className="nav-links">
          <li>
            <Link to="/login">Sign In</Link>
          </li>

          <li>
            <Link to="/register">Sign Up</Link>
          </li>
        </ul>
      </nav>

      <section id="about" className="about">
        <br></br>

        <p>
          Welcome to <strong>Interview Preparation Portal!</strong>
        </p>
        <br></br>

        <p>
          Our platform is designed to help students and job seekers prepare for
          placements and interviews with confidence.
        </p>

        <br></br>
        <br></br>

        <h3>We Provide:</h3>

        <div className="about-content">
          <div className="about-item">
            <h4>✔ Technical Interview Questions</h4>
            <p>
              Practice questions on Java, Python, SQL, DBMS, Operating Systems,
              and Networks.
            </p>
          </div>

          <div className="about-item">
            <h4>✔ Aptitude Practice Tests</h4>
            <p>
              Improve your Quantitative Aptitude, Logical Reasoning, and Verbal
              Ability skills.
            </p>
          </div>

          <div className="about-item">
            <h4>✔ Mock Interview Sessions</h4>
            <p>
              Experience real interview scenarios and build confidence before
              actual interviews.
            </p>
          </div>

          <div className="about-item">
            <h4>✔ Performance Analysis</h4>
            <p>
              Track your progress, identify strengths, and improve weak areas.
            </p>
          </div>

          <div className="about-item">
            <h4>✔ Progress Tracking</h4>
            <p>
              Monitor your learning journey and achieve your career goals
              efficiently.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>© 2026 Interview Preparation Portal. All Rights Reserved.</p>
      </footer>
    </div>
  );
}

export default Home;
