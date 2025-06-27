import { Chip, ChipProps } from "@mui/material";
import React from "react";
import "./StatusChip.css";

export interface StatusChipProps
  extends Omit<ChipProps, "variant" | "color" | "children" | "size"> {
  status:
    | "active"
    | "inactive"
    | "ready"
    | "loading"
    | "error"
    | "warning"
    | "success";
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  children?: React.ReactNode;
}

const StatusChip: React.FC<StatusChipProps> = ({
  status,
  size = "md",
  animated = false,
  children,
  className = "",
  label,
  ...props
}) => {
  const chipClasses = [
    "status-chip",
    `status-chip--${status}`,
    `status-chip--${size}`,
    animated ? "status-chip--animated" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Chip
      {...props}
      className={chipClasses}
      label={children || label}
      data-testid="status-chip"
    />
  );
};

export default StatusChip;
