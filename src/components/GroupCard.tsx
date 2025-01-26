import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  Avatar,
  AvatarGroup
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Group } from '../backend/services/groupService';
import { useAuth } from '../contexts/AuthContext';

interface GroupCardProps {
  group: Group;
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const isMember = currentUser && group.members.includes(currentUser.id);
  const isOwner = currentUser && group.ownerId === currentUser.id;

  const handleClick = () => {
    if (isMember || isOwner || !group.isPrivate) {
      navigate(`/groups/${group.id}`);
    }
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: isMember || isOwner || !group.isPrivate ? 'pointer' : 'default',
        '&:hover': {
          transform: isMember || isOwner || !group.isPrivate ? 'scale(1.02)' : 'none',
          transition: 'transform 0.2s ease-in-out'
        }
      }}
      onClick={handleClick}
    >
      <CardMedia
        component="img"
        height="140"
        image={group.image || 'https://via.placeholder.com/300x140'}
        alt={group.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography gutterBottom variant="h6" component="div" noWrap>
            {group.name}
          </Typography>
          {group.isPrivate && (
            <Chip
              label="Özel"
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            mb: 2,
            height: '40px'
          }}
        >
          {group.description}
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
          {group.tags.map((tag, index) => (
            <Chip
              key={index}
              label={tag}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24 } }}>
            {group.members.map((memberId, index) => (
              <Avatar
                key={index}
                alt={`Üye ${index + 1}`}
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${memberId}`}
              />
            ))}
          </AvatarGroup>
          <Typography variant="body2" color="text.secondary">
            {group.members.length} üye
          </Typography>
        </Box>

        {!isMember && !isOwner && !group.isPrivate && (
          <Button
            variant="outlined"
            fullWidth
            sx={{ mt: 2 }}
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/groups/${group.id}`);
            }}
          >
            Gruba Katıl
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default GroupCard; 