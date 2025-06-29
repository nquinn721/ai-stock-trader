import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";

const Header: React.FC = () => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle body scroll lock when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.classList.add('mobile-menu-open');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('mobile-menu-open');
      document.body.style.overflow = '';
    }

    // Cleanup function
    return () => {
      document.body.classList.remove('mobile-menu-open');
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMobileMenuOpen && !target.closest('.header-nav') && !target.closest('.mobile-menu-toggle')) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    { path: "/", label: "Dashboard", icon: "📊" },
    { path: "/autonomous-trading", label: "Autonomous Trading", icon: "🤖" },
    { path: "/analytics", label: "Analytics", icon: "📈" },
    { path: "/market-scanner", label: "Market Scanner", icon: "🔍" },
    { path: "/ai-assistant", label: "AI Assistant", icon: "🎯" },
    { path: "/market-making", label: "Market Making", icon: "💰" },
    { path: "/behavioral-finance", label: "Behavioral Finance", icon: "🧠" },
    {
      path: "/enterprise-intelligence",
      label: "Enterprise Intelligence",
      icon: "⚡",
    },
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

        <nav className={`header-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${
                location.pathname === item.path ? "active" : ""
              }`}
              onClick={closeMobileMenu}
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
          {isMobile && (
            <button 
              className="mobile-menu-toggle"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
            >
              <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
                <span></span>
                <span></span>
                <span></span>
              </span>
            </button>
          )}
          
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
