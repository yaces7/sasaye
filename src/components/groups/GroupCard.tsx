import { Card, CardContent, CardMedia, Typography, Button, Box, Chip } from '@mui/material';
import { Group as GroupIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface GroupProps {
  group: {
    id: number;
    name: string;
    description: string;
    memberCount: number;
    image: string;
    isJoined?: boolean;
    isOwner?: boolean;
    tags?: string[];
  };
  onJoin?: (groupId: number) => void;
  onLeave?: (groupId: number) => void;
}

const GroupCard = ({ group, onJoin, onLeave }: GroupProps) => {
  const navigate = useNavigate();

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation(); // Kartın tıklanma olayını engelle
    if (group.isJoined) {
      onLeave?.(group.id);
    } else {
      onJoin?.(group.id);
    }
  };

  const handleCardClick = () => {
    if (group.isJoined || group.isOwner) {
      navigate(`/groups/${group.id}`);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: (group.isJoined || group.isOwner) ? 'pointer' : 'default',
        '&:hover': (group.isJoined || group.isOwner) ? {
          transform: 'translateY(-4px)',
          transition: 'transform 0.2s ease-in-out',
          boxShadow: 4,
        } : {},
      }}
      onClick={handleCardClick}
    >
      <CardMedia
        component="img"
        height="140"
        image={group.image}
        alt={group.name}
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
            <Typography gutterBottom variant="h6" component="div">
              {group.name} {group.isOwner && '👑'}
            </Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {group.description}
          </Typography>
          {group.tags && group.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
              {group.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          )}
        </Box>
        <Box sx={{ mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <GroupIcon sx={{ fontSize: 16, mr: 0.5 }} />
            <Typography variant="body2" color="text.secondary">
              {group.memberCount} üye
            </Typography>
          </Box>
          <Button
            variant={group.isJoined ? "outlined" : "contained"}
            fullWidth
            onClick={handleAction}
          >
            {group.isJoined ? 'Gruptan Ayrıl' : 'Gruba Katıl'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GroupCard; 