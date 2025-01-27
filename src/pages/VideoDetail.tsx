import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Avatar,
  IconButton,
  Button
} from '@mui/material';
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Share as ShareIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { getVideoById } from '../backend/services/videoService';
import toast from 'react-hot-toast';

const VideoDetail = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        setLoading(true);
        const videoData = await getVideoById(videoId!);
        if (!videoData) {
          setError('Video bulunamadı');
          return;
        }
        setVideo(videoData);
      } catch (err) {
        setError('Video yüklenirken bir hata oluştu');
        console.error('Video yükleme hatası:', err);
      } finally {
        setLoading(false);
      }
    };

    if (videoId) {
      loadVideo();
    }
  }, [videoId]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error || !video) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh'
        }}
      >
        <Typography color="error">{error || 'Video bulunamadı'}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ bgcolor: 'black', mb: 2 }}>
        <Box
          component="video"
          src={video.videoUrl}
          controls
          sx={{
            width: '100%',
            maxHeight: '70vh',
            objectFit: 'contain'
          }}
        />
      </Paper>

      <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
        <Typography variant="h5" gutterBottom>
          {video.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar src={video.userAvatar} sx={{ mr: 1 }}>
            {video.username?.[0]}
          </Avatar>
          <Typography variant="subtitle1">
            {video.username}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button
            startIcon={<ThumbUpIcon />}
            onClick={() => toast.success('Beğeni kaydedildi')}
          >
            {video.likes || 0}
          </Button>
          <Button
            startIcon={<ThumbDownIcon />}
            onClick={() => toast.success('Beğenmeme kaydedildi')}
          >
            {video.dislikes || 0}
          </Button>
          <Button
            startIcon={<ShareIcon />}
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success('Video linki kopyalandı!');
            }}
          >
            Paylaş
          </Button>
        </Box>

        <Typography variant="body1" sx={{ mb: 2 }}>
          {video.description}
        </Typography>

        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            {video.comments || 0} Yorum
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default VideoDetail; 