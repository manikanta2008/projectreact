import React from "react";
import Header from "./Header"; // Adjust path as needed
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div className="app-container">
      <Header />
      <main className="content">
        <Outlet />{" "}
        {/* This is where the page-specific components will render */}
      </main>
    </div>
  );
}

export default Layout;
