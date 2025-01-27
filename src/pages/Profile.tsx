import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Avatar,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Edit as EditIcon, PhotoCamera } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfile } from '../backend/services/userService';
import { uploadFile } from '../backend/services/uploadService';
import { toast } from 'react-hot-toast';

const Profile = () => {
  const { currentUser } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: currentUser?.name || '',
    username: currentUser?.username || '',
    bio: currentUser?.bio || '',
    customId: currentUser?.customId || ''
  });

  const handleEditSubmit = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      await updateUserProfile(currentUser.uid, editData);
      toast.success('Profil güncellendi');
      setIsEditing(false);
    } catch (error) {
      toast.error('Profil güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files?.[0] || !currentUser) return;

    try {
      setLoading(true);
      const file = event.target.files[0];
      
      // Resim yükleme kontrolü
      if (!file.type.startsWith('image/')) {
        toast.error('Lütfen geçerli bir resim dosyası seçin');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error('Resim boyutu 5MB\'dan küçük olmalıdır');
        return;
      }

      // Resmi yükle
      const uploadResult = await uploadFile(file, 'avatars');
      
      // Profili güncelle
      await updateUserProfile(currentUser.uid, {
        avatar: uploadResult.url
      });

      toast.success('Profil fotoğrafı güncellendi');
    } catch (error) {
      toast.error('Profil fotoğrafı güncellenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Lütfen giriş yapın</Typography>
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
      bgcolor: 'background.default'
    }}>
      <Container maxWidth="md">
        <Paper sx={{ 
          p: { xs: 2, sm: 4 },
          borderRadius: { xs: isMobile ? 0 : 2, sm: 2 },
          boxShadow: theme => `0 8px 24px ${theme.palette.primary.light}25`
        }}>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* Profil Fotoğrafı */}
            <Box sx={{ position: 'relative' }}>
              <Avatar
                src={currentUser.avatar}
                sx={{
                  width: 150,
                  height: 150,
                  mb: 2,
                  border: 3,
                  borderColor: 'primary.main'
                }}
              >
                {currentUser.name?.[0]}
              </Avatar>
              <input
                type="file"
                accept="image/*"
                id="avatar-upload"
                style={{ display: 'none' }}
                onChange={handleAvatarChange}
              />
              <label htmlFor="avatar-upload">
                <IconButton
                  component="span"
                  sx={{
                    position: 'absolute',
                    bottom: 20,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  <PhotoCamera />
                </IconButton>
              </label>
            </Box>

            {/* Kullanıcı Bilgileri */}
            <Typography variant="h4" gutterBottom>
              {currentUser.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              @{currentUser.username}
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              ID: {currentUser.customId}
            </Typography>
            {currentUser.bio && (
              <Typography variant="body1" align="center" sx={{ mt: 2 }}>
                {currentUser.bio}
              </Typography>
            )}

            {/* Düzenle Butonu */}
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              sx={{ mt: 3 }}
            >
              Profili Düzenle
            </Button>
          </Box>
        </Paper>
      </Container>

      {/* Düzenleme Dialog'u */}
      <Dialog 
        open={isEditing} 
        onClose={() => setIsEditing(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Profili Düzenle</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="İsim"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Kullanıcı Adı"
              value={editData.username}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
            />
            <TextField
              fullWidth
              label="Biyografi"
              value={editData.bio}
              onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditing(false)}>İptal</Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Kaydet'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile; 