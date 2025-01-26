import React, { useState, useEffect } from 'react';
import {
  Box,
  IconButton,
  Typography,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  Add as AddIcon,
  MusicNote as MusicNoteIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../backend/firebase';
import {
  collection,
  addDoc,
  query,
  orderBy,
  getDocs,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  doc,
} from 'firebase/firestore';
import { uploadVideo } from '../backend/services/uploadService';

interface Reel {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  videoUrl: string;
  description: string;
  music: string;
  likes: string[];
  comments: number;
  createdAt: any;
}

const Reels = () => {
  const { currentUser } = useAuth();
  const [reels, setReels] = useState<Reel[]>([]);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [newReel, setNewReel] = useState({
    videoFile: null as File | null,
    description: '',
    music: '',
  });
  const [uploadProgress, setUploadProgress] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Reels'leri getir
  const fetchReels = async () => {
    try {
      const reelsRef = collection(db, 'reels');
      const q = query(reelsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedReels = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Reel[];

      setReels(fetchedReels);
    } catch (error) {
      console.error('Reels yüklenirken hata:', error);
    }
  };

  useEffect(() => {
    fetchReels();
  }, []);

  // Yeni reel oluştur
  const handleCreateReel = async () => {
    if (!newReel.videoFile) {
      setUploadError('Lütfen bir video seçin');
      return;
    }

    try {
      setUploadProgress(true);
      setUploadError(null);

      const uploadResult = await uploadVideo(newReel.videoFile);

      await addDoc(collection(db, 'reels'), {
        userId: currentUser?.uid,
        username: currentUser?.username,
        userAvatar: currentUser?.avatar,
        videoUrl: uploadResult.url,
        description: newReel.description,
        music: newReel.music,
        likes: [],
        comments: 0,
        createdAt: serverTimestamp(),
      });

      setOpen(false);
      setNewReel({ videoFile: null, description: '', music: '' });
      fetchReels();
    } catch (error: any) {
      setUploadError(error.message);
      console.error('Reel oluşturulurken hata:', error);
    } finally {
      setUploadProgress(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewReel({ ...newReel, videoFile: file });
    }
  };

  // Reel'i beğen
  const handleLike = async (reelId: string) => {
    if (!currentUser) return;

    try {
      const reelRef = doc(db, 'reels', reelId);
      await updateDoc(reelRef, {
        likes: arrayUnion(currentUser.uid)
      });
      fetchReels();
    } catch (error) {
      console.error('Beğeni eklenirken hata:', error);
    }
  };

  // Sonraki/önceki reel'e geç
  const handleScroll = (e: React.WheelEvent) => {
    if (e.deltaY > 0 && currentReelIndex < reels.length - 1) {
      setCurrentReelIndex(prev => prev + 1);
    } else if (e.deltaY < 0 && currentReelIndex > 0) {
      setCurrentReelIndex(prev => prev - 1);
    }
  };

  const currentReel = reels[currentReelIndex];

  return (
    <Box
      sx={{
        height: 'calc(100vh - 64px)',
        width: '100%',
        bgcolor: 'black',
        position: 'relative',
        overflow: 'hidden',
      }}
      onWheel={handleScroll}
    >
      {/* Reel Oluşturma Butonu */}
      <IconButton
        sx={{
          position: 'absolute',
          top: 20,
          right: 20,
          zIndex: 2,
          bgcolor: 'primary.main',
          '&:hover': { bgcolor: 'primary.dark' },
        }}
        onClick={() => setOpen(true)}
      >
        <AddIcon />
      </IconButton>

      {currentReel && (
        <>
          {/* Video */}
          <video
            src={currentReel.videoUrl}
            autoPlay
            loop
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />

          {/* Sağ Kenar Çubuğu */}
          <Stack
            spacing={2}
            sx={{
              position: 'absolute',
              right: 20,
              bottom: 100,
              alignItems: 'center',
            }}
          >
            <IconButton onClick={() => handleLike(currentReel.id)}>
              <FavoriteIcon
                sx={{
                  color: currentReel.likes.includes(currentUser?.uid || '')
                    ? 'error.main'
                    : 'white',
                  fontSize: 30,
                }}
              />
              <Typography color="white" variant="caption" sx={{ ml: 1 }}>
                {currentReel.likes.length}
              </Typography>
            </IconButton>
            <IconButton>
              <CommentIcon sx={{ color: 'white', fontSize: 30 }} />
              <Typography color="white" variant="caption" sx={{ ml: 1 }}>
                {currentReel.comments}
              </Typography>
            </IconButton>
            <IconButton>
              <ShareIcon sx={{ color: 'white', fontSize: 30 }} />
            </IconButton>
          </Stack>

          {/* Alt Bilgi */}
          <Box
            sx={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              right: 80,
              color: 'white',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <Avatar src={currentReel.userAvatar}>
                {currentReel.username[0]}
              </Avatar>
              <Typography variant="subtitle1">{currentReel.username}</Typography>
            </Stack>
            <Typography variant="body1" sx={{ mb: 1 }}>
              {currentReel.description}
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <MusicNoteIcon />
              <Typography variant="body2">{currentReel.music}</Typography>
            </Stack>
          </Box>
        </>
      )}

      {/* Reel Oluşturma Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Yeni Reel Oluştur</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 2 }}>
            <input
              accept="video/*"
              style={{ display: 'none' }}
              id="reel-video-upload"
              type="file"
              onChange={handleFileSelect}
            />
            <label htmlFor="reel-video-upload">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                startIcon={<AddIcon />}
              >
                Video Seç
              </Button>
            </label>
            {newReel.videoFile && (
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                Seçilen video: {newReel.videoFile.name}
              </Typography>
            )}
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Açıklama"
            value={newReel.description}
            onChange={(e) => setNewReel({ ...newReel, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Müzik"
            value={newReel.music}
            onChange={(e) => setNewReel({ ...newReel, music: e.target.value })}
          />
          {uploadError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {uploadError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={uploadProgress}>
            İptal
          </Button>
          <Button 
            onClick={handleCreateReel} 
            variant="contained"
            disabled={uploadProgress}
          >
            {uploadProgress ? <CircularProgress size={24} /> : 'Paylaş'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reels; 