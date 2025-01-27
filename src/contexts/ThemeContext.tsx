import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../backend/firebase';

declare module '@mui/material/styles' {
  interface Palette {
    gradient: {
      primary: string;
      secondary: string;
      mixed: string;
    }
  }
  interface PaletteOptions {
    gradient?: {
      primary: string;
      secondary: string;
      mixed: string;
    }
  }
}

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({ mode: 'light', toggleTheme: () => {} });

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('light');
  const { currentUser } = useAuth();

  useEffect(() => {
    // Kullanıcının tema tercihini localStorage'dan al
    const savedTheme = localStorage.getItem('theme') as ThemeMode;
    if (savedTheme) {
      setMode(savedTheme);
    }
  }, []);

  const toggleTheme = async () => {
    const newMode = mode === 'light' ? 'dark' : 'light';
    setMode(newMode);
    localStorage.setItem('theme', newMode);

    // Eğer kullanıcı giriş yapmışsa, tema tercihini Firestore'a kaydet
    if (currentUser?.uid) {
      try {
        await updateDoc(doc(db, 'users', currentUser.uid), {
          theme: newMode
        });
      } catch (error) {
        console.error('Tema tercihi kaydedilemedi:', error);
      }
    }
  };


  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: '#2196f3', // Mavi
            light: '#64b5f6',
            dark: '#1976d2',
          },
          secondary: {
            main: '#ff5722', // Turuncu
            light: '#ff8a65',
            dark: '#f4511e',
          },
          background: {
            default: mode === 'light' ? '#f5f5f5' : '#121212',
            paper: mode === 'light' ? '#ffffff' : '#1e1e1e',
          },
          text: {
            primary: mode === 'light' ? '#333333' : '#ffffff',
            secondary: mode === 'light' ? '#666666' : '#b3b3b3',
          },
          gradient: {
            primary: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
            secondary: 'linear-gradient(45deg, #ff5722 30%, #ff8a65 90%)',
            mixed: 'linear-gradient(45deg, #2196f3 30%, #ff5722 90%)',
          },
        },
        typography: {
          fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
          h1: {
            background: 'linear-gradient(45deg, #2196f3 30%, #ff5722 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
          },
          h4: {
            color: mode === 'light' ? '#2196f3' : '#64b5f6',
            fontWeight: 600,
          },
        },
        components: {
          MuiButton: {
            styleOverrides: {
              root: {
                borderRadius: 8,
                textTransform: 'none',
                fontWeight: 500,
              },
              containedPrimary: {
                background: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                },
              },
              containedSecondary: {
                background: 'linear-gradient(45deg, #ff5722 30%, #ff8a65 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #f4511e 30%, #ff7043 90%)',
                },
              },
            },
          },
          MuiPaper: {
            styleOverrides: {
              root: {
                borderRadius: 12,
                boxShadow: mode === 'light' 
                  ? '0 8px 24px rgba(33, 150, 243, 0.1)'
                  : '0 8px 24px rgba(0, 0, 0, 0.2)',
              },
            },
          },
          MuiFab: {
            styleOverrides: {
              root: {
                background: 'linear-gradient(45deg, #ff5722 30%, #ff8a65 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #f4511e 30%, #ff7043 90%)',
                },
              },
            },
          },
          MuiChip: {
            styleOverrides: {
              root: {
                borderRadius: 16,
              },
              colorPrimary: {
                background: 'linear-gradient(45deg, #2196f3 30%, #64b5f6 90%)',
              },
              colorSecondary: {
                background: 'linear-gradient(45deg, #ff5722 30%, #ff8a65 90%)',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ mode, toggleTheme }}>
      <MuiThemeProvider theme={theme}>
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider; 