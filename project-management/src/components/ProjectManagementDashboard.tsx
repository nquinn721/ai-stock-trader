import { Container, CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import React from "react";
import DashboardOverview from "./DashboardOverview";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00d4aa",
      light: "#4dffd4",
      dark: "#00a37d",
    },
    secondary: {
      main: "#ff6b35",
      light: "#ff9e6b",
      dark: "#c73a0a",
    },
    background: {
      default: "#0a0e1a",
      paper: "#1a1f35",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0bec5",
    },
    success: {
      main: "#4caf50",
    },
    warning: {
      main: "#ff9800",
    },
    error: {
      main: "#f44336",
    },
    info: {
      main: "#2196f3",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: "2.5rem",
    },
    h2: {
      fontWeight: 600,
      fontSize: "2rem",
    },
    h3: {
      fontWeight: 600,
      fontSize: "1.75rem",
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.5rem",
    },
    h5: {
      fontWeight: 500,
      fontSize: "1.25rem",
    },
    h6: {
      fontWeight: 500,
      fontSize: "1.1rem",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage:
            "linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backdropFilter: "blur(10px)",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: "none",
          fontWeight: 500,
          fontSize: "1rem",
        },
      },
    },
  },
});

const ProjectManagementDashboard: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Container maxWidth="xl" sx={{ py: 4, minHeight: "100vh" }}>
        <DashboardOverview />
      </Container>
    </ThemeProvider>
  );
};

export default ProjectManagementDashboard;
