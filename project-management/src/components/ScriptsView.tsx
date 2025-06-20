import {
  ContentCopy as CopyIcon,
  Description as DocumentIcon,
  PlayArrow as RunIcon,
  Code as ScriptIcon,
} from "@mui/icons-material";
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import React from "react";
import { scripts } from "../data/scripts";
import { Script } from "../data/types";

const ScriptsView: React.FC = () => {
  const handleCopyUsage = (usage: string) => {
    navigator.clipboard.writeText(usage);
  };

  if (!scripts.length) {
    return (
      <Box sx={{ mt: 6, textAlign: "center" }}>
        <Typography variant="h5" color="textSecondary">
          No automation scripts found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Automation Scripts
      </Typography>
      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        PowerShell scripts converted to React components for project management
        automation.
      </Typography>

      <Grid container spacing={3}>
        {scripts.map((script: Script, index: number) => {
          const scriptType = script.name.includes("generate")
            ? "Generator"
            : script.name.includes("create")
            ? "Creator"
            : script.name.includes("start")
            ? "Initializer"
            : "Utility";

          const getScriptColor = (type: string) => {
            switch (type) {
              case "Generator":
                return "#4caf50";
              case "Creator":
                return "#2196f3";
              case "Initializer":
                return "#ff9800";
              default:
                return "#9c27b0";
            }
          };

          const color = getScriptColor(scriptType);

          return (
            <Grid item xs={12} md={6} lg={4} key={index}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 3,
                  height: "100%",
                  borderLeft: `4px solid ${color}`,
                  transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: 6,
                  },
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                    <ScriptIcon sx={{ color, fontSize: 28 }} />
                    <Typography variant="h6" sx={{ flexGrow: 1 }}>
                      {script.name}
                    </Typography>
                    <Chip
                      label={scriptType}
                      size="small"
                      sx={{ backgroundColor: `${color}20`, color }}
                    />
                  </Stack>

                  <Typography variant="body2" sx={{ mb: 3, minHeight: 40 }}>
                    {script.description}
                  </Typography>

                  <Box
                    sx={{
                      backgroundColor: "#f5f5f5",
                      borderRadius: 2,
                      p: 2,
                      mb: 2,
                      border: "1px solid #e0e0e0",
                    }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1}
                      mb={1}
                    >
                      <DocumentIcon sx={{ fontSize: 16, color: "#666" }} />
                      <Typography
                        variant="caption"
                        color="textSecondary"
                        sx={{ fontWeight: "bold" }}
                      >
                        USAGE:
                      </Typography>
                      <Box sx={{ flexGrow: 1 }} />
                      <Tooltip title="Copy command">
                        <IconButton
                          size="small"
                          onClick={() => handleCopyUsage(script.usage)}
                          sx={{ padding: 0.5 }}
                        >
                          <CopyIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "monospace",
                        fontSize: "0.8rem",
                        backgroundColor: "#fff",
                        padding: 1,
                        borderRadius: 1,
                        border: "1px solid #ddd",
                        wordBreak: "break-all",
                      }}
                    >
                      {script.usage}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Chip
                      label="PowerShell"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                    <Chip
                      label="Automation"
                      size="small"
                      variant="outlined"
                      sx={{ fontSize: "0.7rem" }}
                    />
                    <Tooltip title="Run script (simulated)">
                      <IconButton
                        size="small"
                        sx={{
                          backgroundColor: `${color}20`,
                          color,
                          "&:hover": { backgroundColor: `${color}30` },
                        }}
                      >
                        <RunIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Additional Information */}
      <Box sx={{ mt: 4, p: 3, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Script Integration Notes
        </Typography>
        <Typography variant="body2" color="textSecondary">
          • These PowerShell scripts have been converted to React components for
          visualization
          <br />
          • Click the copy icon to copy the script usage command
          <br />
          • The "Run" button simulates script execution (actual PowerShell
          integration would require backend support)
          <br />• Scripts are categorized by their primary function: Generator,
          Creator, Initializer, or Utility
        </Typography>
      </Box>
    </Box>
  );
};

export default ScriptsView;
