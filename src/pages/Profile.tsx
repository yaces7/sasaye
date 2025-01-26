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
  useMediaQuery
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

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} sm={4} sx={{ textAlign: 'center' }}>
            <Avatar
              src={currentUser?.photoURL || undefined}
              sx={{
                width: isMobile ? 120 : 200,
                height: isMobile ? 120 : 200,
                mx: 'auto',
                mb: 2
              }}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <Typography variant="h4" gutterBottom>
              {currentUser?.displayName || 'İsimsiz Kullanıcı'}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {currentUser?.email}
            </Typography>
            <Button
              variant="contained"
              color="error"
              onClick={handleLogout}
              disabled={loading}
            >
              {loading ? 'Çıkış Yapılıyor...' : 'Çıkış Yap'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Profile; 