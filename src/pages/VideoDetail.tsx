import { useState } from 'react';
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
} from '@mui/material';
import { ThumbUp, ThumbDown, Share } from '@mui/icons-material';

const VideoDetail = () => {
  const { id } = useParams();
  const [comment, setComment] = useState('');

  // Örnek video verisi
  const video = {
    id: 1,
    title: 'React ile Modern Web Geliştirme',
    author: 'Ahmet Yılmaz',
    views: 1200,
    likes: 156,
    dislikes: 4,
    description: 'Bu videoda React ile modern web uygulamaları geliştirmeyi öğreneceksiniz.',
    videoUrl: 'https://www.example.com/video.mp4', // Örnek URL
    publishDate: '2024-01-15',
  };

  // Örnek yorumlar
  const comments = [
    {
      id: 1,
      author: 'Mehmet Kaya',
      avatar: 'https://source.unsplash.com/random/40x40?face-1',
      content: 'Harika bir video olmuş, teşekkürler!',
      date: '3 gün önce',
    },
    {
      id: 2,
      author: 'Ayşe Demir',
      avatar: 'https://source.unsplash.com/random/40x40?face-2',
      content: 'Çok faydalı bilgiler var, devamını bekliyoruz.',
      date: '1 hafta önce',
    },
  ];

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Yorum gönderme işlemi burada yapılacak
    setComment('');
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4 }}>
        {/* Video Player */}
        <Box
          sx={{
            width: '100%',
            height: 0,
            paddingBottom: '56.25%', // 16:9 aspect ratio
            position: 'relative',
            bgcolor: 'black',
            mb: 3,
          }}
        >
          <video
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}
            controls
            src={video.videoUrl}
          />
        </Box>

        {/* Video Info */}
        <Typography variant="h4" gutterBottom>
          {video.title}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {video.views} görüntülenme • {video.publishDate}
            </Typography>
          </Box>
          
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

        {/* Author Info */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            src="https://source.unsplash.com/random/40x40?face"
            sx={{ width: 50, height: 50 }}
          />
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">
              {video.author}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              1.2K abone
            </Typography>
          </Box>
          <Button variant="contained" sx={{ ml: 'auto' }}>
            Abone Ol
          </Button>
        </Box>

        {/* Description */}
        <Typography variant="body1" paragraph>
          {video.description}
        </Typography>

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
          {comments.map((comment) => (
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
                      {comment.date}
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