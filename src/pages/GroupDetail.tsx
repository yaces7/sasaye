import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  TextField,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  useMediaQuery,
  Chip
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  ExitToApp as ExitIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  getGroupById,
  getGroupMembers,
  inviteUserByCustomId,
  leaveGroup,
  deleteGroup,
  Group,
  GroupMember
} from '../backend/services/groupService';
import toast from 'react-hot-toast';

const GroupDetail = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteUserId, setInviteUserId] = useState('');
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    const loadGroupData = async () => {
      if (!groupId) return;

      try {
        setLoading(true);
        const groupData = await getGroupById(groupId);
        if (!groupData) {
          toast.error('Grup bulunamadı');
          navigate('/groups');
          return;
        }
        setGroup(groupData);

        const memberData = await getGroupMembers(groupId);
        setMembers(memberData);
      } catch (error) {
        console.error('Grup bilgileri yüklenirken hata:', error);
        toast.error('Grup bilgileri yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    loadGroupData();
  }, [groupId, navigate]);

  const handleInvite = async () => {
    if (!currentUser || !groupId || !inviteUserId.trim()) return;

    try {
      setInviting(true);
      await inviteUserByCustomId(groupId, inviteUserId.trim(), currentUser.uid);
      toast.success('Kullanıcı gruba eklendi');
      setInviteDialogOpen(false);
      setInviteUserId('');
      
      // Grup verilerini yenile
      const groupData = await getGroupById(groupId);
      if (groupData) {
        setGroup(groupData);
        const memberData = await getGroupMembers(groupId);
        setMembers(memberData);
      }
    } catch (error) {
      console.error('Kullanıcı eklenirken hata:', error);
      toast.error('Kullanıcı eklenemedi');
    } finally {
      setInviting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUser || !groupId) return;
    try {
      await leaveGroup(groupId);
      toast.success('Gruptan ayrıldınız');
      navigate('/groups');
    } catch (error) {
      console.error('Gruptan ayrılırken hata:', error);
      toast.error('Gruptan ayrılınamadı');
    }
  };

  const handleDeleteGroup = async () => {
    if (!currentUser || !groupId) return;

    try {
      await deleteGroup(groupId, currentUser.uid);
      toast.success('Grup silindi');
      navigate('/groups');
    } catch (error) {
      console.error('Grup silinirken hata:', error);
      toast.error('Grup silinemedi');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!group) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Grup bulunamadı</Typography>
      </Box>
    );
  }

  const isOwner = currentUser?.uid === group.ownerId;
  const isMember = group.members.includes(currentUser?.uid || '');

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar 
            src={group.image} 
            sx={{ width: 56, height: 56, mr: 2 }}
          >
            {group.name[0]}
          </Avatar>
          <Box>
            <Typography variant="h5" gutterBottom>
              {group.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {group.description}
            </Typography>
          </Box>
        </Box>

        {group.tags && group.tags.length > 0 && (
          <Box sx={{ mb: 3 }}>
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

        <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
          {isOwner ? (
            <>
              <Button
                variant="contained"
                startIcon={<PersonAddIcon />}
                onClick={() => setInviteDialogOpen(true)}
              >
                Üye Ekle
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<ExitIcon />}
                onClick={handleDeleteGroup}
              >
                Grubu Sil
              </Button>
            </>
          ) : isMember ? (
            <Button
              variant="outlined"
              color="error"
              startIcon={<ExitIcon />}
              onClick={handleLeaveGroup}
            >
              Gruptan Ayrıl
            </Button>
          ) : null}
        </Box>

        <Typography variant="h6" gutterBottom>
          Üyeler ({group.memberCount})
        </Typography>
        <List>
          {members.map((member) => (
            <React.Fragment key={member.userId}>
              <ListItem
                secondaryAction={
                  member.role === 'owner' && (
                    <Chip
                      label="Grup Sahibi"
                      color="primary"
                      size="small"
                    />
                  )
                }
              >
                <ListItemAvatar>
                  <Avatar>{member.userId[0]}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={member.userId}
                  secondary={`Katılma: ${member.joinedAt.toDate().toLocaleDateString()}`}
                />
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>

      <Dialog
        open={inviteDialogOpen}
        onClose={() => !inviting && setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Üye Ekle</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Kullanıcı ID"
            fullWidth
            value={inviteUserId}
            onChange={(e) => setInviteUserId(e.target.value)}
            disabled={inviting}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setInviteDialogOpen(false)}
            disabled={inviting}
          >
            İptal
          </Button>
          <Button 
            onClick={handleInvite}
            variant="contained"
            disabled={!inviteUserId.trim() || inviting}
          >
            {inviting ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default GroupDetail; 