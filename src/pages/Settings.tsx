import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import {
  getUserSettings,
  updateUserSettings,
  updateUserEmail,
  updateUserPassword,
  sendPasswordReset,
  UserSettings
} from '../backend/services/userService';

const Settings = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings>({
    emailNotifications: true,
    privateProfile: false,
    theme: 'light',
    language: 'tr'
  });

  // Email ve şifre değişikliği için state
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      if (!currentUser) return;
      
      try {
        const userSettings = await getUserSettings(currentUser.id);
        setSettings(userSettings);
      } catch (err: any) {
        setError(err.message);
      }
    };

    loadSettings();
  }, [currentUser]);

  const handleSettingChange = (setting: keyof UserSettings) => 
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.type === 'checkbox' 
        ? event.target.checked 
        : event.target.value;
      
      setSettings(prev => ({
        ...prev,
        [setting]: value
      }));
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await updateUserSettings(currentUser.id, settings);
      setSuccess('Ayarlar başarıyla güncellendi');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;
    
    setLoading(true);
    try {
      await updateUserEmail(newEmail);
      setSuccess('Email değişikliği için doğrulama emaili gönderildi');
      setNewEmail('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) return;
    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }
    
    setLoading(true);
    try {
      await updateUserPassword(newPassword);
      setSuccess('Şifreniz başarıyla güncellendi');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!currentUser?.email) return;
    
    try {
      await sendPasswordReset(currentUser.email);
      setSuccess('Şifre sıfırlama emaili gönderildi');
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
        <Typography variant="h4" gutterBottom>
          Ayarlar
        </Typography>

        {/* Genel Ayarlar */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Genel Ayarlar
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.emailNotifications}
                onChange={handleSettingChange('emailNotifications')}
              />
            }
            label="Email Bildirimleri"
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={settings.privateProfile}
                onChange={handleSettingChange('privateProfile')}
              />
            }
            label="Gizli Profil"
          />

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Tema</InputLabel>
            <Select
              value={settings.theme}
              label="Tema"
              onChange={(e) => handleSettingChange('theme')({ 
                target: { value: e.target.value } 
              } as any)}
            >
              <MenuItem value="light">Açık</MenuItem>
              <MenuItem value="dark">Koyu</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Dil</InputLabel>
            <Select
              value={settings.language}
              label="Dil"
              onChange={(e) => handleSettingChange('language')({ 
                target: { value: e.target.value } 
              } as any)}
            >
              <MenuItem value="tr">Türkçe</MenuItem>
              <MenuItem value="en">English</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            onClick={handleSaveSettings}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Ayarları Kaydet'}
          </Button>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Email Değiştirme */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Email Değiştir
          </Typography>
          
          <TextField
            fullWidth
            label="Yeni Email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="contained"
            onClick={handleEmailChange}
            disabled={loading || !newEmail}
          >
            Email Değiştir
          </Button>
        </Box>

        <Divider sx={{ my: 4 }} />

        {/* Şifre Değiştirme */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Şifre Değiştir
          </Typography>
          
          <TextField
            fullWidth
            label="Yeni Şifre"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <TextField
            fullWidth
            label="Şifre Tekrar"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="contained"
            onClick={handlePasswordChange}
            disabled={loading || !newPassword || !confirmPassword}
            sx={{ mr: 2 }}
          >
            Şifre Değiştir
          </Button>

          <Button
            variant="outlined"
            onClick={handlePasswordReset}
            disabled={loading}
          >
            Şifremi Unuttum
          </Button>
        </Box>

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

export default Settings; 