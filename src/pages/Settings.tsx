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
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  useTheme as useMuiTheme,
  useMediaQuery,
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
import { useTheme } from '../contexts/ThemeContext';
import { DarkMode, LightMode } from '@mui/icons-material';
import { toast } from 'react-hot-toast';

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

  const { mode, toggleTheme } = useTheme();
  const theme = useMuiTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Ayarları yükle
  useEffect(() => {
    const loadSettings = async () => {
      if (currentUser) {
        try {
          const userSettings = await getUserSettings(currentUser.uid);
          setSettings(userSettings);
        } catch (error) {
          toast.error('Ayarlar yüklenirken bir hata oluştu');
        }
      }
    };
    loadSettings();
  }, [currentUser]);

  const handleSettingChange = async (key: string, value: any) => {
    try {
      setLoading(true);
      const updatedSettings = { ...settings, [key]: value };
      await updateUserSettings(currentUser!.uid, { [key]: value });
      setSettings(updatedSettings);
      toast.success('Ayarlar güncellendi');
    } catch (error) {
      toast.error('Ayarlar güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      await updateUserSettings(currentUser.uid, settings);
      setSuccess('Ayarlar başarıyla güncellendi');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail) return;

    try {
      setLoading(true);
      await updateUserEmail(newEmail);
      toast.success('Email güncellendi ve doğrulama emaili gönderildi');
      setNewEmail('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır');
      return;
    }

    try {
      setLoading(true);
      await updateUserPassword(newPassword);
      toast.success('Şifre güncellendi');
      setNewPassword('');
    } catch (error: any) {
      toast.error(error.message);
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
      <Box sx={{ 
        height: '100vh',
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Alert severity="error">
          Bu sayfayı görüntülemek için giriş yapmalısınız.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 3,
      bgcolor: 'background.default'
    }}>
      <Container maxWidth="lg">
        <Paper sx={{ 
          p: { xs: 2, sm: 4 }, 
          borderRadius: 2,
          boxShadow: theme => `0 8px 24px ${theme.palette.primary.light}25`
        }}>
          <Typography variant="h4" gutterBottom>
            Ayarlar
          </Typography>

          <List>
            <ListItem>
              <ListItemText 
                primary="Tema" 
                secondary={mode === 'light' ? 'Açık tema' : 'Koyu tema'} 
              />
              <ListItemSecondaryAction>
                <Switch
                  edge="end"
                  checked={mode === 'dark'}
                  onChange={toggleTheme}
                  icon={<LightMode />}
                  checkedIcon={<DarkMode />}
                />
              </ListItemSecondaryAction>
            </ListItem>
            <Divider />
          </List>

          {/* Genel Ayarlar */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Genel Ayarlar
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.emailNotifications}
                  onChange={(e) => handleSettingChange('emailNotifications', e.target.checked)}
                />
              }
              label="Email Bildirimleri"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={settings.privateProfile}
                  onChange={(e) => handleSettingChange('privateProfile', e.target.checked)}
                />
              }
              label="Gizli Profil"
            />

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Tema</InputLabel>
              <Select
                value={settings.theme}
                label="Tema"
                onChange={(e) => handleSettingChange('theme', e.target.value)}
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
                onChange={(e) => handleSettingChange('language', e.target.value)}
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
            
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <input
                type="email"
                placeholder="Yeni Email"
                className="w-full p-2 border rounded"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={loading || !newEmail}
              >
                Email Güncelle
              </button>
            </form>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Şifre Değiştirme */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Şifre Değiştir
            </Typography>
            
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <input
                type="password"
                placeholder="Yeni Şifre"
                className="w-full p-2 border rounded"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={loading || !newPassword || newPassword.length < 6}
              >
                Şifre Güncelle
              </button>
            </form>

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
    </Box>
  );
};

export default Settings; 