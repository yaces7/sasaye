import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Stack,
  Box
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface GroupCardProps {
  group: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    image: string;
    isJoined: boolean;
    isOwner: boolean;
    tags: string[];
  };
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        component="img"
        height="140"
        image={group.image}
        alt={group.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div">
          {group.name}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {group.description}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {group.tags.map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            {group.memberCount} üye
          </Typography>
          <Button
            variant={group.isJoined ? "outlined" : "contained"}
            size="small"
            onClick={() => navigate(`/groups/${group.id}`)}
          >
            {group.isJoined ? 'Gruba Git' : 'Katıl'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default GroupCard; 