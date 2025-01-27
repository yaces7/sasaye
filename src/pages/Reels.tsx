import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  IconButton,
  Paper,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Fab,
  LinearProgress
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  ThumbDown as ThumbDownIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ThumbDownOutlined as ThumbDownOutlinedIcon,
  MoreVert as MoreVertIcon,
  Add as AddIcon,
  CloudUpload as CloudUploadIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getAllVideos, Video, uploadVideo } from '../backend/services/videoService';
import toast from 'react-hot-toast';

const Reels = () => {
  const { currentUser } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [liked, setLiked] = useState<{ [key: string]: boolean }>({});
  const [disliked, setDisliked] = useState<{ [key: string]: boolean }>({});
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        const fetchedVideos = await getAllVideos();
        const reelsVideos = fetchedVideos.filter(video => video.isReel);
        setVideos(reelsVideos);
      } catch (error) {
        console.error('Reels yüklenirken hata:', error);
        toast.error('Videolar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  const handleLike = (videoId: string) => {
    if (disliked[videoId]) {
      setDisliked(prev => ({ ...prev, [videoId]: false }));
    }
    setLiked(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
    toast.success(liked[videoId] ? 'Beğeni kaldırıldı' : 'Video beğenildi');
  };

  const handleDislike = (videoId: string) => {
    if (liked[videoId]) {
      setLiked(prev => ({ ...prev, [videoId]: false }));
    }
    setDisliked(prev => ({
      ...prev,
      [videoId]: !prev[videoId]
    }));
    toast.success(disliked[videoId] ? 'Beğenmeme kaldırıldı' : 'Video beğenilmedi');
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Video Paylaş',
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link kopyalandı!');
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleComment = () => {
    setCommentDialogOpen(true);
  };

  const handleCommentSubmit = () => {
    if (commentText.trim()) {
      toast.success('Yorum eklendi');
      setCommentText('');
    }
    setCommentDialogOpen(false);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setSelectedFile(file);
      } else {
        toast.error('Lütfen geçerli bir video dosyası seçin');
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !description.trim()) {
      toast.error('Lütfen bir video ve açıklama ekleyin');
      return;
    }

    try {
      setUploading(true);
      // Simüle edilmiş yükleme ilerlemesi
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      await uploadVideo(selectedFile, description);

      clearInterval(interval);
      setUploadProgress(100);
      toast.success('Video başarıyla yüklendi!');
      
      // Videoları yeniden yükle
      const fetchedVideos = await getAllVideos();
      const reelsVideos = fetchedVideos.filter(video => video.isReel);
      setVideos(reelsVideos);
      
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setDescription('');
    } catch (error) {
      console.error('Video yüklenirken hata:', error);
      toast.error('Video yüklenirken bir hata oluştu');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  if (videos.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <Typography variant="h6">Henüz reels videosu yok</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      bgcolor: theme.palette.mode === 'dark' ? 'background.default' : '#f5f5f5',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: 'auto'
    }}>
      {/* Oluştur Butonu */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1000
        }}
        onClick={() => setUploadDialogOpen(true)}
      >
        <AddIcon />
      </Fab>

      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        maxWidth: isMobile ? '100%' : '380px',
        margin: '0 auto'
      }}>
        <Paper
          elevation={3}
          sx={{
            width: '100%',
            height: '85vh',
            position: 'relative',
            overflow: 'hidden',
            bgcolor: 'black',
            borderRadius: '16px',
            boxShadow: theme => `0 8px 24px ${theme.palette.primary.light}25`
          }}
        >
          {videos.map((video, index) => (
            <Box
              key={video.id}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                display: index === currentVideoIndex ? 'block' : 'none'
              }}
            >
              <video
                src={video.videoUrl}
                autoPlay
                loop
                playsInline
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              
              {/* Video Bilgileri */}
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  p: 2,
                  background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
                }}
              >
                <Typography variant="subtitle1" color="white">
                  {video.userName}
                </Typography>
                <Typography variant="body2" color="white" sx={{ opacity: 0.8 }}>
                  {video.description}
                </Typography>
              </Box>

              {/* Etkileşim Butonları */}
              <Box
                sx={{
                  position: 'absolute',
                  right: 16,
                  bottom: 100,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  alignItems: 'center'
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <IconButton
                    onClick={() => handleLike(video.id)}
                    sx={{ color: 'white' }}
                  >
                    {liked[video.id] ? (
                      <FavoriteIcon sx={{ color: 'red', fontSize: 30 }} />
                    ) : (
                      <FavoriteBorderIcon sx={{ fontSize: 30 }} />
                    )}
                  </IconButton>
                  <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>
                    {video.likes || 0}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <IconButton
                    onClick={() => handleDislike(video.id)}
                    sx={{ color: 'white' }}
                  >
                    {disliked[video.id] ? (
                      <ThumbDownIcon sx={{ fontSize: 30 }} />
                    ) : (
                      <ThumbDownOutlinedIcon sx={{ fontSize: 30 }} />
                    )}
                  </IconButton>
                  <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>
                    Beğenme
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <IconButton onClick={handleComment} sx={{ color: 'white' }}>
                    <CommentIcon sx={{ fontSize: 30 }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>
                    {video.comments || 0}
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <IconButton onClick={handleShare} sx={{ color: 'white' }}>
                    <ShareIcon sx={{ fontSize: 30 }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>
                    Paylaş
                  </Typography>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <IconButton onClick={handleMenuClick} sx={{ color: 'white' }}>
                    <MoreVertIcon sx={{ fontSize: 30 }} />
                  </IconButton>
                  <Typography variant="caption" sx={{ color: 'white', display: 'block' }}>
                    Daha Fazla
                  </Typography>
                </Box>
              </Box>
            </Box>
          ))}
        </Paper>
      </Box>

      {/* Menü */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMenuClose}>Videoyu Bildir</MenuItem>
        <MenuItem onClick={handleMenuClose}>Videoyu İndir</MenuItem>
        <MenuItem onClick={handleMenuClose}>İlgimi Çekmiyor</MenuItem>
      </Menu>

      {/* Yorum Dialog */}
      <Dialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Yorum Yap</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Yorumunuz"
            fullWidth
            multiline
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>İptal</Button>
          <Button onClick={handleCommentSubmit} variant="contained">
            Gönder
          </Button>
        </DialogActions>
      </Dialog>

      {/* Video Yükleme Dialog */}
      <Dialog
        open={uploadDialogOpen}
        onClose={() => !uploading && setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Yeni Reels Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ my: 2 }}>
            <input
              accept="video/*"
              style={{ display: 'none' }}
              id="video-upload"
              type="file"
              onChange={handleFileSelect}
              disabled={uploading}
            />
            <label htmlFor="video-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={uploading}
                fullWidth
              >
                {selectedFile ? selectedFile.name : 'Video Seç'}
              </Button>
            </label>
          </Box>
          
          <TextField
            margin="dense"
            label="Açıklama"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={uploading}
          />

          {uploading && (
            <Box sx={{ mt: 2 }}>
              <LinearProgress variant="determinate" value={uploadProgress} />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                %{Math.round(uploadProgress)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setUploadDialogOpen(false)} 
            disabled={uploading}
          >
            İptal
          </Button>
          <Button 
            onClick={handleUpload} 
            variant="contained"
            disabled={!selectedFile || !description.trim() || uploading}
          >
            {uploading ? 'Yükleniyor...' : 'Yükle'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reels;