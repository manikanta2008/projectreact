import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./components/Home";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import InterviewPage from "./components/InterviewPage";
import Profile from "./components/Profile";
import Layout from "./components/Layout";
import CodingPractice from "./components/CodingPractice";
import Aptitude from "./components/Aptitude"; // Import the Aptitude component

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Dashboard Route */}
        <Route path="/" element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/interview" element={<InterviewPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/coding-practice" element={<CodingPractice />} />{" "}
          <Route path="/aptitude" element={<Aptitude />} />{" "}
          {/* Add the CodingPractice route */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
