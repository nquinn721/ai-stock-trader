import React from "react";
import "./ContentCard.css";

export interface ContentCardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  className?: string;
  hover?: boolean;
  loading?: boolean;
  variant?: "default" | "gradient" | "glass" | "minimal";
  padding?: "sm" | "md" | "lg" | "xl";
  onClick?: () => void;
}

const ContentCard: React.FC<ContentCardProps> = ({
  children,
  title,
  subtitle,
  headerActions,
  className = "",
  hover = true,
  loading = false,
  variant = "default",
  padding = "lg",
  onClick,
}) => {
  const cardClasses = [
    "content-card",
    `content-card--${variant}`,
    `content-card--padding-${padding}`,
    hover ? "content-card--hover" : "",
    loading ? "content-card--loading" : "",
    onClick ? "content-card--clickable" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cardClasses} onClick={onClick} data-testid="content-card">
      {loading && <div className="content-card__loading-overlay" />}

      {(title || subtitle || headerActions) && (
        <div className="content-card__header">
          <div className="content-card__header-text">
            {title && <h3 className="content-card__title">{title}</h3>}
            {subtitle && <p className="content-card__subtitle">{subtitle}</p>}
          </div>
          {headerActions && (
            <div className="content-card__header-actions">{headerActions}</div>
          )}
        </div>
      )}

      <div className="content-card__content">{children}</div>
    </div>
  );
};

export default ContentCard;
