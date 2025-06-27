import { Button, ButtonProps, CircularProgress } from "@mui/material";
import React from "react";
import "./TradingButton.css";

export interface TradingButtonProps
  extends Omit<ButtonProps, "variant" | "size"> {
  variant?:
    | "primary"
    | "secondary"
    | "success"
    | "danger"
    | "warning"
    | "ghost"
    | "nav";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const TradingButton: React.FC<TradingButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  disabled,
  className = "",
  ...props
}) => {
  const buttonClasses = [
    "trading-btn",
    `trading-btn--${variant}`,
    `trading-btn--${size}`,
    loading ? "trading-btn--loading" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Button
      {...props}
      className={buttonClasses}
      disabled={disabled || loading}
      startIcon={
        loading ? <CircularProgress size={16} color="inherit" /> : icon
      }
    >
      {children}
    </Button>
  );
};

export default TradingButton;
