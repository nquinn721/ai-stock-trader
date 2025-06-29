import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "./Header.css";
import {
  Dashboard as DashboardIcon,
  AutoAwesome as AutoAwesomeIcon,
  Analytics as AnalyticsIcon,
  Search as SearchIcon,
  SmartToy as SmartToyIcon,
  MonetizationOn as MonetizationOnIcon,
  Psychology as PsychologyIcon,
  Business as BusinessIcon,
  RocketLaunch as RocketLaunchIcon,
} from "@mui/icons-material";

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
    { 
      path: "/", 
      label: "Dashboard", 
      description: "Main dashboard overview",
      icon: DashboardIcon 
    },
    { 
      path: "/autonomous-trading", 
      label: "Auto Trading", 
      description: "Automated trading strategies",
      icon: AutoAwesomeIcon 
    },
    { 
      path: "/analytics", 
      label: "Analytics", 
      description: "Market analysis and insights",
      icon: AnalyticsIcon 
    },
    { 
      path: "/market-scanner", 
      label: "Market Scanner", 
      description: "Scan markets for opportunities",
      icon: SearchIcon 
    },
    { 
      path: "/ai-assistant", 
      label: "AI Assistant", 
      description: "AI-powered trading assistant",
      icon: SmartToyIcon 
    },
    { 
      path: "/market-making", 
      label: "Market Making", 
      description: "Liquidity provision strategies",
      icon: MonetizationOnIcon 
    },
    { 
      path: "/behavioral-finance", 
      label: "Behavioral Finance", 
      description: "Behavioral analysis tools",
      icon: PsychologyIcon 
    },
    {
      path: "/enterprise-intelligence",
      label: "Enterprise Intelligence",
      description: "Advanced business intelligence",
      icon: BusinessIcon,
    },
  ];

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="header-brand">
          <div className="brand-logo">
            <RocketLaunchIcon className="logo-icon" />
            <div className="brand-text">
              <h1>TradeHub</h1>
              <span className="brand-subtitle">Pro Trading Platform</span>
            </div>
          </div>
        </div>

        <nav className={`header-nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${
                  location.pathname === item.path ? "active" : ""
                }`}
                onClick={closeMobileMenu}
                title={item.description}
              >
                <IconComponent className="nav-icon" fontSize="small" />
                <span className="nav-label">{item.label}</span>
                {location.pathname === item.path && (
                  <span className="nav-indicator"></span>
                )}
              </Link>
            );
          })}
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
        </div>
      </div>
    </header>
  );
};

export default Header;
