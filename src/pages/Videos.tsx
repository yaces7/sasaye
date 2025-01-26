import { useState } from 'react';
import { Box, Container, Typography, Button, Paper, Grid, useTheme, useMediaQuery } from '@mui/material';
import { VideoCall } from '@mui/icons-material';
import VideoCard from '../components/video/VideoCard';
import VideoUploadModal from '../components/video/VideoUploadModal';

interface Video {
  id: string;
  title: string;
  author: string;
  views: number;
  thumbnail: string;
  userId: string;
  userName: string;
  description: string;
  videoUrl: string;
  uploadDate: Date;
  duration: number;
  cloudinaryPublicId: string;
  createdAt: Date;
  likes: number;
  isReel: boolean;
}

const Videos = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([
    {
      id: "1",
      title: 'React ile Modern Web Geliştirme',
      author: 'Ahmet Yılmaz',
      views: 1200,
      thumbnail: 'https://source.unsplash.com/random/800x450?programming',
      userId: '',
      userName: '',
      description: '',
      videoUrl: '',
      uploadDate: new Date(),
      duration: 0,
      cloudinaryPublicId: '',
      createdAt: new Date(),
      likes: 0,
      isReel: false,
    },
    {
      id: "2",
      title: 'TypeScript Temelleri',
      author: 'Ayşe Demir',
      views: 850,
      thumbnail: 'https://source.unsplash.com/random/800x450?coding',
      userId: '',
      userName: '',
      description: '',
      videoUrl: '',
      uploadDate: new Date(),
      duration: 0,
      cloudinaryPublicId: '',
      createdAt: new Date(),
      likes: 0,
      isReel: false,
    },
  ]);

  const handleVideoUpload = (videoData: { title: string; description: string; file: File }) => {
    const newVideo: Video = {
      id: (videos.length + 1).toString(),
      title: videoData.title,
      author: 'Ben',
      views: 0,
      thumbnail: URL.createObjectURL(videoData.file),
      userId: '',
      userName: '',
      description: videoData.description,
      videoUrl: '',
      uploadDate: new Date(),
      duration: 0,
      cloudinaryPublicId: '',
      createdAt: new Date(),
      likes: 0,
      isReel: false,
    };

    setVideos([newVideo, ...videos]);
  };

  return (
    <Box sx={{
      minHeight: 'calc(100vh - 64px)',
      width: '100vw',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      position: 'fixed',
      top: 64,
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: 'auto',
      backgroundColor: 'white',
    }}>
      <Container maxWidth="lg" sx={{ my: { xs: 2, sm: 4 } }}>
        <Paper sx={{ 
          p: { xs: 2, sm: 4 }, 
          width: '100%',
          borderRadius: { xs: isMobile ? 0 : 2, sm: 2 },
          boxShadow: isMobile ? 'none' : theme => `0 8px 24px ${theme.palette.primary.light}25`,
        }}>
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4" component="h1">
              Videolar
            </Typography>
            <Button
              variant="contained"
              startIcon={<VideoCall />}
              size="large"
              onClick={() => setIsUploadModalOpen(true)}
            >
              Video Yükle
            </Button>
          </Box>

          <Grid container spacing={3}>
            {videos.map((video) => (
              <Grid item xs={12} sm={6} md={4} key={video.id}>
                <VideoCard video={video} />
              </Grid>
            ))}
          </Grid>

          <VideoUploadModal
            open={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            onUpload={handleVideoUpload}
          />
        </Paper>
      </Container>
    </Box>
  );
};

export default Videos; 