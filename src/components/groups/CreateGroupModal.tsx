import { useState } from 'react';
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Chip,
} from '@mui/material';
import { Close } from '@mui/icons-material';

interface CreateGroupModalProps {
  open: boolean;
  onClose: () => void;
  onCreateGroup: (groupData: {
    name: string;
    description: string;
    tags: string[];
  }) => void;
}

const CreateGroupModal = ({ open, onClose, onCreateGroup }: CreateGroupModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  const handleAddTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = () => {
    if (name.trim() && description.trim()) {
      onCreateGroup({
        name,
        description,
        tags,
      });
      setName('');
      setDescription('');
      setTags([]);
      onClose();
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && tag.trim()) {
      event.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '90%', sm: 500 },
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}
      >
        <IconButton
          sx={{ position: 'absolute', right: 8, top: 8 }}
          onClick={onClose}
        >
          <Close />
        </IconButton>

        <Typography variant="h6" component="h2" gutterBottom>
          Yeni Grup Oluştur
        </Typography>

        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Grup Adı"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Grup Açıklaması"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Etiketler"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            onKeyPress={handleKeyPress}
            helperText="Enter tuşu ile etiket ekleyebilirsiniz"
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {tags.map((t) => (
              <Chip
                key={t}
                label={t}
                onDelete={() => handleRemoveTag(t)}
                color="primary"
                variant="outlined"
              />
            ))}
          </Box>

          <Button
            fullWidth
            variant="contained"
            onClick={handleSubmit}
            disabled={!name.trim() || !description.trim()}
          >
            Grup Oluştur
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default CreateGroupModal; 