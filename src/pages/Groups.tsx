import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Chip
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { createGroup, getAllGroups, getUserGroups, Group } from '../backend/services/groupService';
import toast from 'react-hot-toast';

const Groups = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const loadGroups = async () => {
      try {
        setLoading(true);
        const allGroups = await getAllGroups();
        setGroups(allGroups);
      } catch (error) {
        console.error('Gruplar yüklenirken hata:', error);
        toast.error('Gruplar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, []);

  const handleCreateGroup = async () => {
    if (!currentUser) return;

    try {
      setCreating(true);
      const groupId = await createGroup({
        name: newGroupName,
        description: newGroupDescription
      });
      
      toast.success('Grup oluşturuldu');
      setCreateDialogOpen(false);
      setNewGroupName('');
      setNewGroupDescription('');
      
      // Yeni grubu listeye ekle
      const newGroup = await getAllGroups();
      setGroups(newGroup);
      
      // Grup detay sayfasına yönlendir
      navigate(`/groups/${groupId}`);
    } catch (error) {
      console.error('Grup oluşturulurken hata:', error);
      toast.error('Grup oluşturulamadı');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        bgcolor: 'background.default'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      pt: 4,
      pb: 6
    }}>
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 4,
          borderBottom: 1,
          borderColor: 'divider',
          pb: 2
        }}>
          <Typography 
            variant="h4" 
            sx={{ 
              background: (theme) => theme.palette.gradient.primary,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}
          >
            Gruplar
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              background: (theme) => theme.palette.gradient.secondary,
              '&:hover': {
                background: (theme) => theme.palette.gradient.mixed
              }
            }}
          >
            Yeni Grup
          </Button>
        </Box>

        {groups.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            gap: 2
          }}>
            <Typography variant="h6" color="text.secondary">
              Henüz hiç grup yok
            </Typography>
            <Button 
              variant="contained"
              onClick={() => setCreateDialogOpen(true)}
              sx={{
                background: (theme) => theme.palette.gradient.primary,
                '&:hover': {
                  background: (theme) => theme.palette.gradient.mixed
                }
              }}
            >
              İlk Grubu Oluştur
            </Button>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {groups.map((group) => (
              <Grid item xs={12} sm={6} md={4} key={group.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: (theme) => theme.palette.mode === 'light' 
                        ? '0 8px 24px rgba(33, 150, 243, 0.2)'
                        : '0 8px 24px rgba(0, 0, 0, 0.3)'
                    },
                    cursor: 'pointer'
                  }}
                  onClick={() => navigate(`/groups/${group.id}`)}
                >
                  <CardContent sx={{ flex: 1, p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Avatar 
                        src={group.image}
                        sx={{ 
                          width: 64, 
                          height: 64, 
                          mr: 2,
                          background: (theme) => theme.palette.gradient.primary
                        }}
                      >
                        {group.name[0]}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" gutterBottom>
                          {group.name}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          color="text.secondary"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            mb: 1
                          }}
                        >
                          {group.description}
                        </Typography>
                      </Box>
                    </Box>

                    {group.tags && group.tags.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        {group.tags.map((tag, index) => (
                          <Chip
                            key={index}
                            label={tag}
                            size="small"
                            sx={{ 
                              mr: 1, 
                              mb: 1,
                              background: (theme) => theme.palette.gradient.primary,
                              color: 'white'
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <Typography 
                        variant="body2"
                        sx={{ 
                          color: 'primary.main',
                          fontWeight: 'medium'
                        }}
                      >
                        {group.memberCount} üye
                      </Typography>
                      <Button 
                        size="small"
                        sx={{
                          background: (theme) => theme.palette.gradient.secondary,
                          color: 'white',
                          '&:hover': {
                            background: (theme) => theme.palette.gradient.mixed
                          }
                        }}
                      >
                        Detaylar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Container>

      <Dialog
        open={createDialogOpen}
        onClose={() => !creating && setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Yeni Grup Oluştur</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Grup Adı"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            disabled={creating}
          />
          <TextField
            margin="dense"
            label="Açıklama"
            fullWidth
            multiline
            rows={3}
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
            disabled={creating}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCreateDialogOpen(false)}
            disabled={creating}
          >
            İptal
          </Button>
          <Button
            onClick={handleCreateGroup}
            variant="contained"
            disabled={!newGroupName.trim() || creating}
          >
            {creating ? 'Oluşturuluyor...' : 'Oluştur'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Groups; 