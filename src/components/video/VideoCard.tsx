import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface VideoProps {
  video: {
    id: number;
    title: string;
    author: string;
    views: number;
    thumbnail: string;
  };
}

const VideoCard = ({ video }: VideoProps) => {
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
        image={video.thumbnail}
        alt={video.title}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {video.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {video.author}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
          <Visibility sx={{ fontSize: 16, mr: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            {video.views} görüntülenme
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default VideoCard; 