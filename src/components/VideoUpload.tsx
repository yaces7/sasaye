import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Switch,
  FormControlLabel,
} from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { uploadVideo, VideoUploadData } from '../backend/services/videoService';
import { useAuth } from '../contexts/AuthContext';

interface VideoUploadProps {
  onUploadComplete?: (videoId: string) => void;
  isReel?: boolean;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onUploadComplete, isReel = false }) => {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isReelVideo, setIsReelVideo] = useState(isReel);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const handleVideoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setVideoFile(event.target.files[0]);
    }
  };

  const handleThumbnailSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setThumbnailFile(event.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Lütfen önce giriş yapın');
      return;
    }

    if (!videoFile) {
      setError('Lütfen bir video seçin');
      return;
    }

    if (!title.trim()) {
      setError('Lütfen bir başlık girin');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const uploadData: VideoUploadData = {
        title: title.trim(),
        description: description.trim(),
        videoFile,
        thumbnailFile: thumbnailFile || undefined,
        isReel: isReelVideo
      };

      const video = await uploadVideo(currentUser.id, uploadData);
      
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setThumbnailFile(null);
      
      if (onUploadComplete) {
        onUploadComplete(video.id);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom align="center">
        Video Yükle
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
        />

        <TextField
          fullWidth
          label="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={3}
        />

        <Box sx={{ my: 2 }}>
          <input
            type="file"
            accept="video/mp4,video/quicktime"
            style={{ display: 'none' }}
            ref={videoInputRef}
            onChange={handleVideoSelect}
          />
          <Button
            variant="outlined"
            fullWidth
            onClick={() => videoInputRef.current?.click()}
            startIcon={<CloudUploadIcon />}
          >
            {videoFile ? videoFile.name : 'Video Seç'}
          </Button>
        </Box>

        <Box sx={{ my: 2 }}>
          <input
            type="file"
            accept="image/jpeg,image/png"
            style={{ display: 'none' }}
            ref={thumbnailInputRef}
            onChange={handleThumbnailSelect}
          />
          <Button
            variant="outlined"
            fullWidth
            onClick={() => thumbnailInputRef.current?.click()}
            startIcon={<CloudUploadIcon />}
          >
            {thumbnailFile ? thumbnailFile.name : 'Kapak Resmi Seç (Opsiyonel)'}
          </Button>
        </Box>

        <FormControlLabel
          control={
            <Switch
              checked={isReelVideo}
              onChange={(e) => setIsReelVideo(e.target.checked)}
            />
          }
          label="Reels Video"
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            'Videoyu Yükle'
          )}
        </Button>
      </Box>
    </Paper>
  );
};

export default VideoUpload; 