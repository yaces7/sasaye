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
  CircularProgress
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../backend/firebase';
import { getUserById } from '../backend/services/userService';

const Login = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Firebase ile giriş yap
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Email doğrulaması kontrolü
      if (!firebaseUser.emailVerified) {
        setError('Lütfen email adresinizi doğrulayın.');
        return;
      }

      // Firestore'dan kullanıcı bilgilerini al
      const userData = await getUserById(firebaseUser.uid);
      if (!userData) {
        setError('Kullanıcı bilgileri alınamadı.');
        return;
      }

      // Local storage'a kullanıcı bilgilerini kaydet
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('user', JSON.stringify(userData));

      // Ana sayfaya yönlendir
      navigate('/');
    } catch (error: any) {
      if (error.code === 'auth/invalid-email') {
        setError('Geçersiz email adresi.');
      } else if (error.code === 'auth/user-disabled') {
        setError('Bu hesap devre dışı bırakılmış.');
      } else if (error.code === 'auth/user-not-found') {
        setError('Bu email adresi ile kayıtlı kullanıcı bulunamadı.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Hatalı şifre.');
      } else {
        setError('Giriş yapılırken bir hata oluştu: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Sayfa yüklendiğinde scroll'u sıfırla
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 0,
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
            disabled={loading}
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
            disabled={loading}
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
            disabled={loading}
            sx={{
              mt: 2,
              py: { xs: 1.5, sm: 2 },
              borderRadius: 1.5,
              textTransform: 'none',
              fontSize: { xs: '1rem', sm: '1.1rem' },
              fontWeight: 600,
              minHeight: 48,
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Giriş Yap'}
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