import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Avatar,
  Chip,
  Stack,
  IconButton
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Visibility as ViewsIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Video } from '../../backend/services/videoService';

interface VideoCardProps {
  video: Video;
}

const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const navigate = useNavigate();

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          transform: 'translateY(-4px)',
          transition: 'transform 0.2s ease-in-out',
          boxShadow: 4,
        },
      }}
      onClick={() => navigate(`/videos/${video.id}`)}
    >
      <CardMedia
        component="img"
        height="140"
        image={video.thumbnailUrl || 'https://via.placeholder.com/400x300?text=Video'}
        alt={video.title}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            src={video.userAvatar}
            sx={{ width: 32, height: 32, mr: 1 }}
          >
            {video.username?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle2">
              {video.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {video.username}
            </Typography>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {video.description}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {video.tags?.map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Stack>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton size="small">
              <FavoriteIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ mr: 2 }}>
              {typeof video.likes === 'number' ? video.likes : 0}
            </Typography>
            <IconButton size="small">
              <CommentIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption" sx={{ mr: 2 }}>
              {video.comments}
            </Typography>
            <IconButton size="small">
              <ViewsIcon fontSize="small" />
            </IconButton>
            <Typography variant="caption">
              {video.views}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VideoCard; 