import { useState } from 'react';
import { Box, Container, Grid, Typography, Button } from '@mui/material';
import { VideoCall } from '@mui/icons-material';
import VideoCard from '../components/video/VideoCard';
import VideoUploadModal from '../components/video/VideoUploadModal';

const Videos = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [videos, setVideos] = useState([
    {
      id: 1,
      title: 'React ile Modern Web Geliştirme',
      author: 'Ahmet Yılmaz',
      views: 1200,
      thumbnail: 'https://source.unsplash.com/random/800x450?programming',
    },
    {
      id: 2,
      title: 'TypeScript Temelleri',
      author: 'Ayşe Demir',
      views: 850,
      thumbnail: 'https://source.unsplash.com/random/800x450?coding',
    },
  ]);

  const handleVideoUpload = (videoData: { title: string; description: string; file: File }) => {
    // Simüle edilmiş video yükleme
    const newVideo = {
      id: videos.length + 1,
      title: videoData.title,
      author: 'Ben',
      views: 0,
      thumbnail: URL.createObjectURL(videoData.file),
    };

    setVideos([newVideo, ...videos]);
  };

  return (
    <Container maxWidth="lg">
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
    </Container>
  );
};

export default Videos; 