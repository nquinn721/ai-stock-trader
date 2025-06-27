import { createTheme } from "@mui/material/styles";

// Color palette based on our CSS variables
const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8',
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
  },
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  success: {
    50: '#f0fdf4',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  error: {
    50: '#fef2f2',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
  },
  warning: {
    50: '#fffbeb',
    500: '#f59e0b',
    600: '#d97706',
  },
};

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: colors.primary[500],
      light: colors.primary[400],
      dark: colors.primary[600],
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    background: {
      default: colors.gray[900],
      paper: 'rgba(31, 41, 55, 0.8)',
    },
    text: {
      primary: colors.gray[50],
      secondary: colors.gray[300],
    },
    divider: 'rgba(148, 163, 184, 0.12)',
    error: {
      main: colors.error[500],
      light: '#f87171',
      dark: colors.error[600],
    },
    warning: {
      main: colors.warning[500],
      light: '#fbbf24',
      dark: colors.warning[600],
    },
    success: {
      main: colors.success[500],
      light: '#34d399',
      dark: colors.success[600],
    },
    info: {
      main: '#06b6d4',
      light: '#22d3ee',
      dark: '#0891b2',
    },
  },
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.25rem',
      lineHeight: 1.2,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: 1.3,
      letterSpacing: '-0.025em',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.4,
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: 1.5,
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.4,
      color: colors.gray[400],
    },
  },
  shape: {
    borderRadius: 12,
  },
  spacing: 8,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #1f2937 100%)',
          backgroundAttachment: 'fixed',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(31, 41, 55, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.1)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(31, 41, 55, 0.8)',
          backdropFilter: 'blur(10px)',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.1)',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 20px rgba(14, 165, 233, 0.15)',
            borderColor: 'rgba(14, 165, 233, 0.3)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
          fontWeight: 500,
          fontSize: '0.875rem',
          transition: 'all 0.2s ease',
        },
        contained: {
          background: 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05), 0 0 20px rgba(14, 165, 233, 0.3)',
          },
        },
        outlined: {
          borderColor: 'rgba(226, 232, 240, 0.2)',
          color: colors.gray[50],
          backgroundColor: 'transparent',
          '&:hover': {
            borderColor: 'rgba(14, 165, 233, 0.3)',
            backgroundColor: 'rgba(31, 41, 55, 0.5)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: colors.gray[400],
          },
          '& .MuiOutlinedInput-root': {
            color: colors.gray[50],
            backgroundColor: 'rgba(31, 41, 55, 0.5)',
            '& fieldset': {
              borderColor: 'rgba(226, 232, 240, 0.2)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(226, 232, 240, 0.3)',
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.primary[500],
              boxShadow: '0 0 0 3px rgba(14, 165, 233, 0.1)',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          color: colors.gray[50],
          backgroundColor: 'rgba(31, 41, 55, 0.5)',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(226, 232, 240, 0.2)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(226, 232, 240, 0.3)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: colors.primary[500],
          },
          '& .MuiSvgIcon-root': {
            color: colors.gray[400],
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(31, 41, 55, 0.8)',
          color: colors.gray[200],
          border: '1px solid rgba(226, 232, 240, 0.1)',
          '&:hover': {
            backgroundColor: 'rgba(51, 65, 85, 0.8)',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: colors.gray[200],
          backgroundColor: 'transparent',
          '&:hover': {
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(14, 165, 233, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(14, 165, 233, 0.3)',
            },
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(20px)',
          borderColor: 'rgba(226, 232, 240, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(226, 232, 240, 0.1)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          '& .MuiTabs-indicator': {
            backgroundColor: colors.primary[500],
            height: 3,
            borderRadius: '2px 2px 0 0',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.875rem',
          color: colors.gray[400],
          '&.Mui-selected': {
            color: colors.primary[400],
          },
          '&:hover': {
            color: colors.gray[200],
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(31, 41, 55, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(226, 232, 240, 0.1)',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: 'rgba(31, 41, 55, 0.95)',
          color: colors.gray[100],
          fontSize: '0.75rem',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(226, 232, 240, 0.1)',
        },
      },
    },
  },
});

export { colors };
