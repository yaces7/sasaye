import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  Paper,
  Grid,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { auth } from '../backend/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{
        minHeight: 'calc(100vh - 64px)',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        top: 64,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto',
        backgroundColor: 'white',
      }}>
        <Typography color="error">
          Bu sayfayı görüntülemek için giriş yapmalısınız.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
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
      backgroundColor: 'white',
    }}>
      <Container maxWidth="md" sx={{ my: { xs: 0, sm: 4 } }}>
        <Paper sx={{ 
          p: { xs: 3, sm: 6 }, 
          width: '100%', 
          textAlign: 'center',
          borderRadius: { xs: isMobile ? 0 : 2, sm: 2 },
          boxShadow: isMobile ? 'none' : theme => `0 8px 24px ${theme.palette.primary.light}25`,
          ...(isMobile && {
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }),
        }}>
          <Avatar
            src={currentUser.avatar}
            sx={{
              width: isMobile ? 80 : 150,
              height: isMobile ? 80 : 150,
              mb: 3,
              mx: 'auto',
              border: `2px solid ${theme.palette.primary.main}`
            }}
          />
          <Typography variant="h3" gutterBottom>
            {currentUser.username}
          </Typography>
          <Typography variant="h5" color="text.secondary">
            {currentUser.email}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            ID: {currentUser.customId}
          </Typography>
          <Divider sx={{ my: 3 }} />
          {currentUser.bio && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom fontWeight="medium">
                Hakkımda
              </Typography>
              <Typography variant="body1">
                {currentUser.bio}
              </Typography>
            </Box>
          )}
          <Button
            variant="contained"
            color="error"
            onClick={handleLogout}
            disabled={loading}
            size="large"
            sx={{ mt: 4 }}
          >
            {loading ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
          </Button>
        </Paper>
      </Container>
    </Box>
  );
};

export default Profile; 