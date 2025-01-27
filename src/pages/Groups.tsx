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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">Gruplar</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Yeni Grup
        </Button>
      </Box>

      {groups.length === 0 ? (
        <Typography variant="body1" color="text.secondary" align="center">
          Henüz hiç grup yok
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {groups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar 
                      src={group.image}
                      sx={{ width: 40, height: 40, mr: 2 }}
                    >
                      {group.name[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        {group.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
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
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  )}

                  <Typography variant="body2" color="text.secondary">
                    {group.memberCount} üye
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/groups/${group.id}`)}
                  >
                    Detaylar
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

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
    </Container>
  );
};

export default Groups; 