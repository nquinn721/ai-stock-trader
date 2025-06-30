import { Box } from "@mui/material";
import React from "react";
import ContentCard from "./ContentCard";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  headerActions?: React.ReactNode;
  variant?: "glass" | "gradient" | "default" | "minimal";
  className?: string;
}

export type { SectionHeaderProps };

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  children,
  headerActions,
  variant = "gradient",
  className = "",
}) => {
  return (
    <ContentCard
      title={title}
      subtitle={subtitle}
      variant={variant}
      padding="lg"
      className={`section-header ${className}`}
      headerActions={headerActions}
    >
      {children && <Box sx={{ mt: 2 }}>{children}</Box>}
    </ContentCard>
  );
};

export default SectionHeader;
