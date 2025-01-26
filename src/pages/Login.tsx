import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'test@test.com' && password === 'test123') {
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify({
        name: 'Test Kullanıcı',
        email: email,
        avatar: 'https://source.unsplash.com/random/100x100?face'
      }));
      navigate('/');
    } else {
      setError('E-posta veya şifre hatalı!');
    }
  };

  // Sayfa yüklendiğinde scroll'u sıfırla
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 64, // Navbar yüksekliği
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        backgroundColor: theme => theme.palette.background.default,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: {
            xs: '100%',
            sm: '450px',
            md: '500px'
          },
          mx: 'auto',
          my: { xs: 0, sm: 4 },
          p: { xs: 3, sm: 4 },
          borderRadius: { xs: isMobile ? 0 : 2, sm: 2 },
          boxShadow: isMobile ? 'none' : theme => `0 8px 24px ${theme.palette.primary.light}25`,
          ...(isMobile && {
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }),
        }}
      >
        <Typography
          variant={isMobile ? "h5" : "h4"}
          component="h1"
          align="center"
          sx={{
            color: 'primary.main',
            fontWeight: 600,
            mb: 4,
          }}
        >
          Giriş Yap
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3,
              borderRadius: 1,
            }}
          >
            {error}
          </Alert>
        )}

        <Box 
          component="form" 
          onSubmit={handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2.5,
            width: '100%',
          }}
        >
          <TextField
            fullWidth
            label="E-posta"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            variant="outlined"
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              },
            }}
          />

          <TextField
            fullWidth
            label="Şifre"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            variant="outlined"
            size="medium"
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1.5,
              },
            }}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{
              mt: 2,
              py: { xs: 1.5, sm: 2 },
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 600,
            }}
          >
            Giriş Yap
          </Button>

          <Typography 
            align="center" 
            sx={{ 
              mt: 2,
              color: 'text.secondary',
              fontSize: { xs: '0.9rem', sm: '1rem' },
            }}
          >
            Hesabınız yok mu?{' '}
            <Link
              component={RouterLink}
              to="/register"
              sx={{
                color: 'primary.main',
                textDecoration: 'none',
                fontWeight: 600,
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Kayıt Ol
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Login; 