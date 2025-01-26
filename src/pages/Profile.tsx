import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  TextField,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  updateUserProfile,
  checkEmailVerification,
  resendVerificationEmail,
  User
} from '../backend/services/userService';

const Profile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    bio: currentUser?.bio || '',
    website: currentUser?.website || '',
    phoneNumber: currentUser?.phoneNumber || ''
  });

  // Email doğrulama durumunu kontrol et
  useEffect(() => {
    const checkVerification = async () => {
      if (currentUser && !currentUser.isEmailVerified) {
        const isVerified = await checkEmailVerification();
        if (isVerified) {
          setSuccess('Email adresiniz başarıyla doğrulandı!');
        }
      }
    };
    checkVerification();
  }, [currentUser]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!currentUser) throw new Error('Kullanıcı oturumu bulunamadı');
      
      await updateUserProfile(currentUser.id, formData);
      setSuccess('Profil başarıyla güncellendi');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      setSuccess('Doğrulama emaili tekrar gönderildi');
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!currentUser) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Bu sayfayı görüntülemek için giriş yapmalısınız.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 4 }}>
        {/* Profil Başlığı */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <Avatar
            src={currentUser.avatar}
            alt={currentUser.name}
            sx={{ width: 100, height: 100, mr: 3 }}
          />
          <Box>
            <Typography variant="h4" gutterBottom>
              {currentUser.name}
            </Typography>
            <Typography color="textSecondary" gutterBottom>
              ID: {currentUser.customId}
            </Typography>
            {!currentUser.isEmailVerified && (
              <Alert
                severity="warning"
                action={
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleResendVerification}
                  >
                    Tekrar Gönder
                  </Button>
                }
              >
                Email adresiniz doğrulanmamış
              </Alert>
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Profil Formu */}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ad Soyad"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hakkımda"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefon"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                disabled={!isEditing}
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Kaydet'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => setIsEditing(false)}
                  disabled={loading}
                >
                  İptal
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                onClick={() => setIsEditing(true)}
              >
                Düzenle
              </Button>
            )}
          </Box>
        </form>

        {/* Bildirimler */}
        <Snackbar
          open={!!error}
          autoHideDuration={6000}
          onClose={() => setError(null)}
        >
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Snackbar>

        <Snackbar
          open={!!success}
          autoHideDuration={6000}
          onClose={() => setSuccess(null)}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>
      </Paper>
    </Container>
  );
};

export default Profile; 