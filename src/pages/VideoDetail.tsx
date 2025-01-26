import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Avatar,
  Button,
  TextField,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Grid,
  Paper,
  CircularProgress
} from '@mui/material';
import { ThumbUp, ThumbDown, Share } from '@mui/icons-material';
import { getVideoById } from '../backend/services/videoService';

const VideoDetail = () => {
  const { videoId } = useParams();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const fetchVideo = async () => {
      if (!videoId) return;
      
      try {
        const videoData = await getVideoById(videoId);
        setVideo(videoData);
      } catch (error) {
        setError('Video yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [videoId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !video) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error || 'Video bulunamadı'}</Typography>
      </Box>
    );
  }

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Yorum gönderme işlemi burada yapılacak
    setComment('');
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ position: 'relative', paddingTop: '56.25%', mb: 2 }}>
              <Box
                component="video"
                src={video.url}
                controls
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%'
                }}
              />
            </Box>
            <Typography variant="h4" gutterBottom>
              {video.title}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Avatar src={video.creator.avatar} sx={{ mr: 1 }} />
              <Typography variant="subtitle1">
                {video.creator.name}
              </Typography>
            </Box>
            <Typography variant="body1" paragraph>
              {video.description}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {video.views} görüntülenme • {new Date(video.createdAt).toLocaleDateString()}
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button startIcon={<ThumbUp />}>
              {video.likes}
            </Button>
            <Button startIcon={<ThumbDown />}>
              {video.dislikes}
            </Button>
            <Button startIcon={<Share />}>
              Paylaş
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Comments */}
        <Typography variant="h6" gutterBottom>
          Yorumlar
        </Typography>

        <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Yorum yaz..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            rows={2}
            sx={{ mb: 2 }}
          />
          <Button
            variant="contained"
            type="submit"
            disabled={!comment.trim()}
          >
            Yorum Yap
          </Button>
        </Box>

        <List>
          {video.comments.map((comment: any) => (
            <ListItem key={comment.id} alignItems="flex-start">
              <ListItemAvatar>
                <Avatar alt={comment.author} src={comment.avatar} />
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Typography component="span" fontWeight="bold">
                      {comment.author}
                    </Typography>
                    <Typography component="span" color="text.secondary">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Typography>
                  </Box>
                }
                secondary={comment.content}
              />
            </ListItem>
          ))}
        </List>
      </Box>
    </Container>
  );
};

export default VideoDetail; 