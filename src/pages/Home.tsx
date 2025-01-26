import { useState } from 'react';
import { Box, Container, Typography, Grid, Paper, Button, useTheme, useMediaQuery } from '@mui/material';
import { VideoLibrary, Message, Group, Slideshow } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const features = [
    {
      icon: <VideoLibrary sx={{ fontSize: 40 }} />,
      title: 'Video Paylaşımı',
      description: 'Dilediğiniz videoları yükleyin ve dünya ile paylaşın.',
      path: '/videos',
    },
    {
      icon: <Slideshow sx={{ fontSize: 40 }} />,
      title: 'Reels',
      description: 'Kısa ve eğlenceli videolar ile anı yakalayın.',
      path: '/reels',
    },
    {
      icon: <Message sx={{ fontSize: 40 }} />,
      title: 'Mesajlaşma',
      description: 'Arkadaşlarınızla anlık mesajlaşın ve görüntülü konuşun.',
      path: '/messages',
    },
    {
      icon: <Group sx={{ fontSize: 40 }} />,
      title: 'Gruplar',
      description: 'İlgi alanlarınıza göre gruplara katılın ve tartışın.',
      path: '/groups',
    },
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: 'auto',
      backgroundColor: 'white',
    }}>
      <Container maxWidth="lg" sx={{ my: { xs: 0, sm: 4 } }}>
        <Paper sx={{ 
          p: { xs: 3, sm: 6 }, 
          width: '100%',
          borderRadius: { xs: isMobile ? 0 : 2, sm: 2 },
          boxShadow: isMobile ? 'none' : theme => `0 8px 24px ${theme.palette.primary.light}25`,
          ...(isMobile && {
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
          }),
        }}>
          <Typography 
            variant="h4" 
            gutterBottom 
            align="center"
            sx={{ mb: 4, pt: 14}}
          >
            Ana Sayfa
          </Typography>
          {/* Hero Section */}
          <Box sx={{ 
            py: 8,
            textAlign: 'center',
            mb: 6,
          }}>
            <Typography 
              variant="h1" 
              component="h1" 
              gutterBottom
              sx={{
                background: 'linear-gradient(45deg, #00b8a9 30%, #48e5c2 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 3,
              }}
            >
              SaSaYe
            </Typography>
            <Typography variant="h5" color="text.secondary" sx={{ mb: 4 }}>
              Video paylaşın, mesajlaşın, gruplara katılın ve daha fazlası...
            </Typography>
            <Button 
              variant="contained" 
              size="large"
              onClick={() => navigate('/videos')}
              sx={{ px: 4, py: 1.5 }}
            >
              Hemen Başla
            </Button>
          </Box>

          {/* Features */}
          <Grid container spacing={4} sx={{ mb: 8 }}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Paper
                  sx={{
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 4,
                    },
                  }}
                  onClick={() => navigate(feature.path)}
                >
                  <Box sx={{ 
                    color: 'primary.main',
                    mb: 2,
                  }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default Home; 