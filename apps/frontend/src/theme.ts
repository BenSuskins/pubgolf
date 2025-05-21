import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#389e5c' },
    secondary: { main: '#ffd700' },
    background: {
      default: '#2b363b',
      paper: '#3b454a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#bbbbbb',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 700,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 700,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 700,
    },
    body1: {
      fontSize: '1rem',
    },
    body2: {
      fontSize: '0.875rem',
    },
    button: {
      fontSize: '0.875rem',
      textTransform: 'none',
    },
  },
  components: {
      MuiAlert: {
          styleOverrides: {
              filledSuccess: {
                  backgroundColor: '#389e5c',
                  color: '#fff'
              },
          },
      },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(135deg, #2b363b 10%, #303b3e 75%, #2b363b 100%)',
          margin: 0,
          fontFamily: 'Roboto, Arial, sans-serif',
        },
      },
    },
  },
});

export default theme;
