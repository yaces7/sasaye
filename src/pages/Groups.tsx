import { useState } from 'react';
import { Box, Container, Grid, Typography, Button, Divider } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import GroupCard from '../components/groups/GroupCard';
import CreateGroupModal from '../components/groups/CreateGroupModal';

interface Group {
  id: number;
  name: string;
  description: string;
  memberCount: number;
  image: string;
  isJoined: boolean;
  isOwner?: boolean;
  tags: string[];
}

const Groups = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [myGroups, setMyGroups] = useState<Group[]>([]);

  const [availableGroups, setAvailableGroups] = useState<Group[]>([
    {
      id: 1,
      name: 'React Developers',
      description: 'React geliştiricileri için topluluk',
      memberCount: 1250,
      image: 'https://source.unsplash.com/random/400x300?coding',
      isJoined: false,
      tags: ['React', 'JavaScript', 'Web Development'],
    },
    {
      id: 2,
      name: 'TypeScript Türkiye',
      description: 'TypeScript öğrenenler ve kullananlar için grup',
      memberCount: 850,
      image: 'https://source.unsplash.com/random/400x300?typescript',
      isJoined: false,
      tags: ['TypeScript', 'JavaScript', 'Programming'],
    },
    {
      id: 3,
      name: 'UI/UX Tasarımcıları',
      description: 'Kullanıcı arayüzü ve deneyimi tasarımcıları',
      memberCount: 2100,
      image: 'https://source.unsplash.com/random/400x300?design',
      isJoined: false,
      tags: ['UI', 'UX', 'Design'],
    },
    {
      id: 4,
      name: 'Frontend Geliştiricileri',
      description: 'Frontend teknolojileri ve en iyi pratikler',
      memberCount: 1800,
      image: 'https://source.unsplash.com/random/400x300?frontend',
      isJoined: false,
      tags: ['Frontend', 'Web', 'Development'],
    },
  ]);

  const handleCreateGroup = (groupData: { name: string; description: string; tags: string[] }) => {
    const newGroup: Group = {
      id: Date.now(),
      ...groupData,
      memberCount: 1,
      image: `https://source.unsplash.com/random/400x300?${groupData.tags[0] || 'group'}`,
      isJoined: true,
      isOwner: true,
    };

    setMyGroups([newGroup, ...myGroups]);
  };

  const handleJoinGroup = (groupId: number) => {
    const group = availableGroups.find(g => g.id === groupId);
    if (group) {
      const updatedGroup: Group = { ...group, isJoined: true, isOwner: false };
      setMyGroups([...myGroups, updatedGroup]);
      setAvailableGroups(availableGroups.filter(g => g.id !== groupId));
    }
  };

  const handleLeaveGroup = (groupId: number) => {
    const group = myGroups.find(g => g.id === groupId && !g.isOwner);
    if (group) {
      const updatedGroup: Group = { ...group, isJoined: false, isOwner: false };
      setAvailableGroups([...availableGroups, updatedGroup]);
      setMyGroups(myGroups.filter(g => g.id !== groupId));
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Gruplar
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Yeni Grup Oluştur
        </Button>
      </Box>

      {/* Katıldığın Gruplar */}
      <Typography variant="h5" gutterBottom>
        Katıldığın Gruplar
      </Typography>
      {myGroups.length === 0 ? (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 6 }}>
          Henüz hiçbir gruba katılmadınız.
        </Typography>
      ) : (
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {myGroups.map((group) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
              <GroupCard
                group={group}
                onLeave={handleLeaveGroup}
              />
            </Grid>
          ))}
        </Grid>
      )}

      <Divider sx={{ my: 4 }} />

      {/* Keşfet */}
      <Typography variant="h5" gutterBottom>
        Keşfet
      </Typography>
      <Grid container spacing={3}>
        {availableGroups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <GroupCard
              group={group}
              onJoin={handleJoinGroup}
            />
          </Grid>
        ))}
      </Grid>

      <CreateGroupModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </Container>
  );
};

export default Groups; 