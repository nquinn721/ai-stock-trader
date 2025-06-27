import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

const Header: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/autonomous-trading", label: "Autonomous Trading", icon: "�" },
    { path: "/analytics", label: "Analytics", icon: "📈" },
    { path: "/market-scanner", label: "Market Scanner", icon: "🔍" },
    { path: "/ai-assistant", label: "AI Assistant", icon: "🎯" },
  ];

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo">
            <span className="logo-icon">🚀</span>
            <div className="brand-text">
              <h1>TradeHub</h1>
              <span className="brand-subtitle">Pro Trading Platform</span>
            </div>
          </div>
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
              {location.pathname === item.path && (
                <span className="nav-indicator"></span>
              )}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <div className="market-status">
            <span className="market-indicator live"></span>
            <span className="market-text">Market Open</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
