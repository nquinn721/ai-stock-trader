# UI Theme and Layout Standards

## Overview

This document establishes the mandatory UI theme and layout standards for all pages in the Stock Trading App. Every page must follow the dashboard layout structure and styling conventions to ensure consistency, maintainability, and optimal user experience.

## Core Principles

⚠️ **CRITICAL**: All pages must implement the standardized header and follow the dashboard theme structure.

### 1. Universal Page Structure

All pages must follow this exact structure:

```jsx
// Standard page structure template
<div className="page-container">
  <div className="page-header">{/* Standard header implementation */}</div>
  <div className="dashboard-content">{/* Page-specific content */}</div>
</div>
```

### 2. Required CSS Imports

Every page stylesheet must import the shared styles:

```css
@import "../shared-styles.css";
```

## Mandatory Header Structure

### Header Requirements

All pages **MUST** include a header similar to the dashboard header with these elements:

#### Required Header Components:

1. **Left Section (`header-left`)**:
   - Page title with gradient text treatment
   - Market time indicator (when relevant)
   - Live connection status

2. **Right Section (`header-info`)**:
   - Navigation buttons to other pages
   - Connection status indicator
   - Stats or summary information (when applicable)

#### Header Implementation Template:

```jsx
<div className="page-header">
  <div className="header-left">
    <h1>{pageTitle}</h1>
    {showMarketTime && (
      <div className="market-time">
        <Clock size={16} />
        <span>Market Open</span>
        <span className="date">{currentDate}</span>
      </div>
    )}
  </div>

  <div className="header-info">
    <div className="connection-status connected">
      <div className="status-dot"></div>
      <span>Live</span>
    </div>

    {/* Navigation buttons */}
    <button className="nav-btn">Dashboard</button>
    <button className="nav-btn">Analytics</button>
    {/* Additional page-specific buttons */}
  </div>
</div>
```

## CSS Theme Standards

### Base Page Styling

All pages must use this foundational CSS structure:

```css
.page-container {
  min-height: 100vh;
  background: var(--trading-bg-gradient-dark);
  background-attachment: fixed;
  padding: var(--trading-spacing-page);
  font-family: var(--trading-font-sans);
  color: var(--trading-text-primary);
  width: 100%;
  max-width: none;
  box-sizing: border-box;
}

.page-container::before {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background:
    radial-gradient(
      circle at 25% 25%,
      rgba(59, 130, 246, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      circle at 75% 75%,
      rgba(139, 92, 246, 0.1) 0%,
      transparent 50%
    );
  pointer-events: none;
  z-index: -1;
}
```

### Header Styling

```css
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px 24px;
  background: linear-gradient(
    135deg,
    rgba(13, 17, 23, 0.95) 0%,
    rgba(22, 27, 34, 0.9) 50%,
    rgba(30, 35, 42, 0.95) 100%
  );
  border: 1px solid rgba(48, 54, 61, 0.8);
  border-radius: 16px;
  backdrop-filter: blur(20px);
  position: relative;
  overflow: hidden;
  min-height: 80px;
  width: 100%;
  box-sizing: border-box;
}

.page-header::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(59, 130, 246, 0.6),
    rgba(139, 92, 246, 0.6),
    transparent
  );
  animation: pulse-glow 3s ease-in-out infinite;
}
```

### Typography Standards

#### Page Titles

```css
.page-header h1 {
  color: #f0f6fc;
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

#### Section Headers

```css
.section-header {
  color: #f1f5f9;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: linear-gradient(135deg, #f1f5f9, #e2e8f0);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

## Color System

### Primary Colors

Use these standardized color variables throughout all pages:

```css
/* Background System */
--trading-bg-gradient-dark: linear-gradient(
  135deg,
  #0a0a0a 0%,
  #1a1a1a 50%,
  #0f0f0f 100%
);
--trading-bg-primary: #0a0e1a;
--trading-bg-secondary: #111827;
--trading-bg-card: rgba(31, 41, 55, 0.8);

/* Text Colors */
--trading-text-primary: #f0f6fc;
--trading-text-secondary: #94a3b8;
--trading-text-muted: #64748b;

/* Accent Colors */
--trading-primary-500: #0ea5e9;
--trading-success-500: #22c55e;
--trading-error-500: #ef4444;
--trading-warning-500: #f59e0b;
```

## Component Styling Standards

### Cards and Containers

```css
.content-card {
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.95) 0%,
    rgba(30, 42, 64, 0.95) 50%,
    rgba(51, 65, 85, 0.95) 100%
  );
  border: 1px solid rgba(148, 163, 184, 0.1);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(10px);
  margin-bottom: 2rem;
}
```

### Buttons

```css
.nav-btn {
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.1) 0%,
    rgba(139, 92, 246, 0.1) 100%
  );
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 12px;
  padding: 12px 20px;
  color: #f0f6fc;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.nav-btn:hover {
  background: linear-gradient(
    135deg,
    rgba(59, 130, 246, 0.2) 0%,
    rgba(139, 92, 246, 0.2) 100%
  );
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(59, 130, 246, 0.2);
}
```

## Layout System

### Grid System

**⚠️ NEVER USE MUI GRID** - Use CSS Grid or Flexbox instead:

```css
.content-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.flex-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: stretch;
}
```

### Responsive Design

All pages must be responsive with these breakpoints:

```css
/* Desktop */
@media (min-width: 1200px) {
  .content-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Tablet */
@media (max-width: 1024px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
  }

  .content-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Mobile */
@media (max-width: 768px) {
  .page-header h1 {
    font-size: 1.5rem;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }

  .header-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}
```

## Animation Standards

### Required Animations

```css
@keyframes pulse-glow {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animated-card {
  animation: slideInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
}
```

## Page-Specific Customizations

### Allowed Customizations

While maintaining the core structure, pages may customize:

1. **Content area layout** - Grid patterns, component arrangement
2. **Page-specific components** - Charts, tables, forms
3. **Additional navigation** - Page-specific action buttons
4. **Color accents** - Subtle variations for different page types

### Prohibited Modifications

❌ **Never modify these core elements:**

1. Header structure and styling
2. Base page background and typography
3. Core color variables
4. Animation timing and easing
5. Border radius and spacing standards

## Implementation Checklist

For every new page, ensure:

- [ ] Imports `shared-styles.css`
- [ ] Uses `.page-container` wrapper
- [ ] Implements standardized `.page-header`
- [ ] Includes connection status indicator
- [ ] Uses approved color variables
- [ ] Implements responsive design
- [ ] Follows animation standards
- [ ] Uses CSS Grid/Flexbox (not MUI Grid)
- [ ] Includes proper navigation buttons
- [ ] Maintains accessibility standards

## Examples

### Trading Page Header

```jsx
<div className="page-header">
  <div className="header-left">
    <h1>Auto Trading Dashboard</h1>
    <div className="market-time">
      <TrendingUp size={16} />
      <span>Trading Active</span>
      <span className="date">June 27, 2025</span>
    </div>
  </div>

  <div className="header-info">
    <div className="connection-status connected">
      <div className="status-dot"></div>
      <span>Live</span>
    </div>
    <button className="nav-btn">
      <BarChart3 size={14} />
      Analytics
    </button>
    <button className="nav-btn">
      <Home size={14} />
      Dashboard
    </button>
  </div>
</div>
```

### Analytics Page Header

```jsx
<div className="page-header">
  <div className="header-left">
    <h1>Market Analytics</h1>
    <div className="market-time">
      <Activity size={16} />
      <span>Real-time Data</span>
      <span className="date">June 27, 2025</span>
    </div>
  </div>

  <div className="header-info">
    <div className="stats">
      <span title="Data Sources">12 Sources</span>
    </div>
    <div className="connection-status connected">
      <div className="status-dot"></div>
      <span>Streaming</span>
    </div>
    <button className="nav-btn ai-assistant-btn">
      <Brain size={14} />
      AI Assistant
    </button>
  </div>
</div>
```

## Maintenance

This documentation should be updated when:

- New design patterns are established
- Core styling variables change
- Responsive breakpoints are modified
- New animation standards are added

## Related Documentation

- [ADR-002: Code Style Standards](./adrs/002-code-style-standards.md)
- [ADR-004: AI Assistant Guidelines](./adrs/004-ai-assistant-guidelines.md)
- [Frontend Architecture Diagram](./FRONTEND-ARCHITECTURE-DIAGRAM.md)

---

**Last Updated**: June 27, 2025  
**Version**: 1.0  
**Next Review**: July 27, 2025
