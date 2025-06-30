import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  actions?: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
}

/**
 * Card - Reusable card component with consistent styling
 */
const Card: React.FC<CardProps> = ({
  children,
  className = "",
  title,
  actions,
  hover = false,
  onClick,
}) => {
  const cardClasses = [
    "dashboard-card",
    hover && "hover-enabled",
    onClick && "clickable",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} onClick={onClick}>
      {title && (
        <div className="card-header">
          <div className="card-title">{title}</div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  );
};

export default Card;
