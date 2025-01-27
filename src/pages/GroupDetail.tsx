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
  IconButton,
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
  Settings as SettingsIcon,
  Send as SendIcon,
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
      toast.success('Davet gönderildi');
      setInviteDialogOpen(false);
      setInviteUserId('');
    } catch (error) {
      console.error('Davet gönderilirken hata:', error);
      toast.error('Davet gönderilemedi');
    } finally {
      setInviting(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUser || !groupId) return;

    try {
      await leaveGroup(groupId, currentUser.uid);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!group) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Grup bulunamadı</Typography>
      </Box>
    );
  }

  const isOwner = currentUser?.uid === group.ownerId;
  const isMember = group.members?.includes(currentUser?.uid || '');

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: 'background.default',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: 'auto'
    }}>
      <Container maxWidth="md" sx={{ my: { xs: 2, sm: 4 } }}>
        <Paper
          elevation={3}
          sx={{
            p: { xs: 2, sm: 4 },
            borderRadius: { xs: isMobile ? 0 : 2, sm: 2 },
            boxShadow: theme => `0 8px 24px ${theme.palette.primary.light}25`
          }}
        >
          {/* Grup Başlığı */}
          <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={group.avatar}
              sx={{ width: 80, height: 80 }}
            >
              {group.name[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h4" gutterBottom>
                {group.name}
              </Typography>
              <Typography color="text.secondary">
                {group.description}
              </Typography>
              <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
                {group.tags?.map((tag) => (
                  <Chip key={tag} label={tag} size="small" />
                ))}
              </Box>
            </Box>
          </Box>

          {/* Eylem Butonları */}
          <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
            {isOwner ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={() => setInviteDialogOpen(true)}
                >
                  Üye Davet Et
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

          {/* Üye Listesi */}
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
                    secondary={`Katılma: ${new Date(member.joinedAt).toLocaleDateString()}`}
                  />
                </ListItem>
                <Divider />
              </React.Fragment>
            ))}
          </List>
        </Paper>
      </Container>

      {/* Davet Dialog */}
      <Dialog
        open={inviteDialogOpen}
        onClose={() => {
          setInviteDialogOpen(false);
          setInviteUserId('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Üye Davet Et</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Kullanıcı ID"
            value={inviteUserId}
            onChange={(e) => setInviteUserId(e.target.value)}
            margin="dense"
            helperText="Davet etmek istediğiniz kullanıcının ID'sini girin"
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setInviteDialogOpen(false);
              setInviteUserId('');
            }}
          >
            İptal
          </Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={!inviteUserId.trim() || inviting}
          >
            {inviting ? <CircularProgress size={24} /> : 'Davet Gönder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GroupDetail; 