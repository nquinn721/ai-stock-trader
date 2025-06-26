import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#3b82f6',
      light: '#60a5fa',
      dark: '#2563eb',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#8b5cf6',
      light: '#a78bfa',
      dark: '#7c3aed',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0f172a',
      paper: 'rgba(30, 41, 59, 0.9)',
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#94a3b8',
    },
    divider: 'rgba(148, 163, 184, 0.2)',
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    warning: {
      main: '#f59e0b',
      light: '#fbbf24',
      dark: '#d97706',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    info: {
      main: '#06b6d4',
      light: '#22d3ee',
      dark: '#0891b2',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          borderRadius: '12px',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '8px',
        },
        outlined: {
          borderColor: 'rgba(148, 163, 184, 0.3)',
          color: '#f1f5f9',
          '&:hover': {
            borderColor: 'rgba(148, 163, 184, 0.5)',
            backgroundColor: 'rgba(148, 163, 184, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: '#94a3b8',
          },
          '& .MuiOutlinedInput-root': {
            color: '#f1f5f9',
            '& fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.3)',
            },
            '&:hover fieldset': {
              borderColor: 'rgba(148, 163, 184, 0.5)',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6',
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          color: '#f1f5f9',
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148, 163, 184, 0.3)',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: 'rgba(148, 163, 184, 0.5)',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#3b82f6',
          },
          '& .MuiSvgIcon-root': {
            color: '#94a3b8',
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '& .MuiInputLabel-root': {
            color: '#94a3b8',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          color: '#f1f5f9',
          '&:hover': {
            backgroundColor: 'rgba(51, 65, 85, 0.9)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            '&:hover': {
              backgroundColor: 'rgba(59, 130, 246, 0.3)',
            },
          },
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: 'rgba(30, 41, 59, 0.9)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(148, 163, 184, 0.2)',
          color: '#f1f5f9',
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: '#f1f5f9',
        },
      },
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 13, // Reduced from default 14
    h1: {
      fontSize: '1.75rem', // Reduced from 2.125rem
      fontWeight: 600,
    },
    h2: {
      fontSize: '1.5rem', // Reduced from 1.875rem
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.25rem', // Reduced from 1.5rem
      fontWeight: 600,
    },
    h4: {
      fontSize: '1.125rem', // Reduced from 1.25rem
      fontWeight: 600,
    },
    h5: {
      fontSize: '1rem', // Reduced from 1.125rem
      fontWeight: 600,
    },
    h6: {
      fontSize: '0.875rem', // Reduced from 1rem
      fontWeight: 600,
    },
    body1: {
      fontSize: '0.875rem', // Reduced from 1rem
    },
    body2: {
      fontSize: '0.75rem', // Reduced from 0.875rem
    },
    button: {
      fontSize: '0.8125rem', // Reduced from 0.875rem
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.6875rem', // Reduced from 0.75rem
    },
    overline: {
      fontSize: '0.6875rem', // Reduced from 0.75rem
    },
  },
});
