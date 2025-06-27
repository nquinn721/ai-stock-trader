import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/autonomous-trading", label: "Autonomous Trading", icon: "🧠" },
    { path: "/automated-trading", label: "Automated Trading", icon: "⚙️" },
    { path: "/analytics", label: "Analytics", icon: "📈" },
    { path: "/market-scanner", label: "Market Scanner", icon: "🔍" },
    { path: "/ai-assistant", label: "AI Assistant", icon: "🎯" },
  ];

  return (
    <header className="app-header">
      <div className="header-brand">
        <h1>Stock Trading Platform</h1>
      </div>
      <nav className="header-nav">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${
              location.pathname === item.path ? "active" : ""
            }`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </header>
  );
};

export default Header;
