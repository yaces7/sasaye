import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#00b8a9',
      light: '#48e5c2',
      dark: '#008c8c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#48e5c2',
      light: '#7cffff',
      dark: '#00b392',
      contrastText: '#000000',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #00b8a9 30%, #48e5c2 90%)',
          border: 0,
          borderRadius: 3,
          boxShadow: '0 3px 5px 2px rgba(0, 184, 169, .3)',
          color: 'white',
          height: 48,
          padding: '0 30px',
          '&:hover': {
            background: 'linear-gradient(45deg, #008c8c 30%, #00b392 90%)',
          },
        },
        outlined: {
          background: 'transparent',
          border: '1px solid #00b8a9',
          color: '#00b8a9',
          '&:hover': {
            background: 'rgba(0, 184, 169, 0.1)',
          },
        },
        text: {
          background: 'none',
          boxShadow: 'none',
          '&:hover': {
            background: 'rgba(0, 184, 169, 0.1)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(45deg, #00b8a9 30%, #48e5c2 90%)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
});

export default theme; 