import { createTheme } from '@mui/material'

const theme = createTheme({
  palette: {
    primary: {
      main: '#b41a12',
      light: '#c94440',
      dark: '#7d120d'
    },
    secondary: {
      main: '#9c27b0',
      light: '#ba68c8',
      dark: '#7b1fa2'
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff'
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 500
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5
    }
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.05)',
          border: '1px solid rgba(0, 0, 0, 0.1)'
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          textTransform: 'none',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }
      }
    }
  }
})

export default theme