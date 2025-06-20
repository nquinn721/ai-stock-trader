import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import React from "react";
import "./App.css";
import ProjectManagementDashboard from "./components/ProjectManagementDashboard";

// Dark theme configuration for the trading app
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
      fontSize: "1rem",
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
          backdropFilter: "blur(10px)",
          background:
            "linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(26, 31, 53, 0.9) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backdropFilter: "blur(10px)",
          background:
            "linear-gradient(135deg, rgba(26, 31, 53, 0.8) 0%, rgba(26, 31, 53, 0.9) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      },
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <ProjectManagementDashboard />
    </ThemeProvider>
  );
};

export default App;
