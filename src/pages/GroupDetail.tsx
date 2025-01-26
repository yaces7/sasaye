import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Grid,
  Chip,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getGroupById, joinGroup, leaveGroup } from '../backend/services/groupService';

const GroupDetail = () => {
  const { groupId } = useParams();
  const { currentUser } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    const fetchGroup = async () => {
      if (!groupId) return;
      
      try {
        const groupData = await getGroupById(groupId);
        setGroup(groupData);
        setIsMember(groupData.members.includes(currentUser?.id));
      } catch (error) {
        setError('Grup bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchGroup();
  }, [groupId, currentUser]);

  const handleJoinGroup = async () => {
    if (!currentUser || !groupId) return;
    
    try {
      await joinGroup(groupId, currentUser.id);
      setIsMember(true);
    } catch (error) {
      setError('Gruba katılırken bir hata oluştu');
    }
  };

  const handleLeaveGroup = async () => {
    if (!currentUser || !groupId) return;
    
    try {
      await leaveGroup(groupId, currentUser.id);
      setIsMember(false);
    } catch (error) {
      setError('Gruptan ayrılırken bir hata oluştu');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !group) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Grup bulunamadı'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Avatar
              src={group.image}
              sx={{ width: 200, height: 200, mx: 'auto', mb: 2 }}
            />
            <Typography variant="h4" gutterBottom>
              {group.name}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              {group.description}
            </Typography>
            <Box sx={{ mb: 2 }}>
              {group.tags.map((tag: string) => (
                <Chip
                  key={tag}
                  label={tag}
                  sx={{ m: 0.5 }}
                />
              ))}
            </Box>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {group.memberCount} üye
            </Typography>
            {currentUser && (
              <Button
                variant="contained"
                color={isMember ? "error" : "primary"}
                onClick={isMember ? handleLeaveGroup : handleJoinGroup}
                sx={{ mt: 2 }}
              >
                {isMember ? 'Gruptan Ayrıl' : 'Gruba Katıl'}
              </Button>
            )}
          </Grid>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GroupDetail; 