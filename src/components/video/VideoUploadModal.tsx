import { useState, useRef } from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  LinearProgress,
} from '@mui/material';
import { Close, CloudUpload } from '@mui/icons-material';

interface VideoUploadModalProps {
  open: boolean;
  onClose: () => void;
  onUpload: (videoData: { title: string; description: string; file: File }) => void;
}

const VideoUploadModal = ({ open, onClose, onUpload }: VideoUploadModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setSelectedFile(file);
    } else {
      alert('Lütfen geçerli bir video dosyası seçin.');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) return;

    setUploading(true);
    
    // Simüle edilmiş yükleme işlemi
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(i);
    }

    onUpload({
      title,
      description,
      file: selectedFile,
    });

    // Formu temizle
    setTitle('');
    setDescription('');
    setSelectedFile(null);
    setUploading(false);
    setProgress(0);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: { xs: '90%', sm: 500 },
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 24,
        p: 4,
      }}>
        <IconButton
          sx={{ position: 'absolute', right: 8, top: 8 }}
          onClick={onClose}
        >
          <Close />
        </IconButton>

        <Typography variant="h6" component="h2" gutterBottom>
          Video Yükle
        </Typography>

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Video Başlığı"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Açıklama"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <input
            type="file"
            accept="video/*"
            hidden
            ref={fileInputRef}
            onChange={handleFileSelect}
          />

          <Button
            fullWidth
            variant="outlined"
            startIcon={<CloudUpload />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ mb: 2 }}
          >
            {selectedFile ? selectedFile.name : 'Video Seç'}
          </Button>

          {uploading && (
            <Box sx={{ width: '100%', mb: 2 }}>
              <LinearProgress variant="determinate" value={progress} />
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                %{progress}
              </Typography>
            </Box>
          )}

          <Button
            fullWidth
            variant="contained"
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || uploading}
          >
            {uploading ? 'Yükleniyor...' : 'Yükle'}
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default VideoUploadModal; 