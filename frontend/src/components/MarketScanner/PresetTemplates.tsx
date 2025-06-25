import { Box, Typography } from "@mui/material";
import React from "react";
import { ScreenerTemplate } from "../../types/marketScanner";

interface PresetTemplatesProps {
  onTemplateSelect: (template: ScreenerTemplate | null) => void;
  onQuickScan: (template: ScreenerTemplate) => void;
  selectedTemplate: ScreenerTemplate | null;
}

export const PresetTemplates: React.FC<PresetTemplatesProps> = ({
  onTemplateSelect,
  onQuickScan,
  selectedTemplate,
}) => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Preset Templates
      </Typography>
      <Typography color="textSecondary">
        Preset templates component implementation pending.
      </Typography>
    </Box>
  );
};
