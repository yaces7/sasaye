import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  TextField,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import { Send, Group as GroupIcon } from '@mui/icons-material';

const GroupDetail = () => {
  const { id } = useParams();
  const [message, setMessage] = useState('');

  // Örnek grup verisi
  const group = {
    id: 1,
    name: 'React Developers',
    description: 'React geliştiricileri için topluluk',
    memberCount: 1250,
    image: 'https://source.unsplash.com/random/400x300?coding',
    tags: ['React', 'JavaScript', 'Web Development'],
    isOwner: true,
  };

  // Örnek mesajlar
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Ahmet Yılmaz',
      avatar: 'https://source.unsplash.com/random/40x40?face-1',
      message: 'Merhaba, yeni bir React projesi başlattım. Yardımcı olabilecek var mı?',
      time: '10:30',
    },
    {
      id: 2,
      sender: 'Ayşe Demir',
      avatar: 'https://source.unsplash.com/random/40x40?face-2',
      message: 'Ben yardımcı olabilirim. Ne tür bir proje?',
      time: '10:32',
    },
  ]);

  const handleSendMessage = () => {
    if (message.trim()) {
      const newMessage = {
        id: messages.length + 1,
        sender: 'Ben',
        avatar: 'https://source.unsplash.com/random/40x40?face-3',
        message: message.trim(),
        time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages([...messages, newMessage]);
      setMessage('');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ 
      height: 'calc(100vh - 64px)',
      width: '100%',
      position: 'fixed',
      top: 64,
      left: 0,
      right: 0,
      bottom: 0,
      bgcolor: 'background.default',
    }}>
      <Grid container sx={{ height: '100%' }}>
        {/* Grup Bilgileri */}
        <Grid item xs={12} md={3} lg={2.5} sx={{ height: '100%', borderRight: 1, borderColor: 'divider' }}>
          <Box sx={{ p: 2 }}>
            <Box sx={{ mb: 2, textAlign: 'center' }}>
              <Avatar
                src={group.image}
                sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
              />
              <Typography variant="h6">
                {group.name} {group.isOwner && '👑'}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 1 }}>
                <GroupIcon sx={{ fontSize: 16, mr: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  {group.memberCount} üye
                </Typography>
              </Box>
            </Box>
            
            <Typography variant="body2" color="text.secondary" paragraph>
              {group.description}
            </Typography>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {group.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.75rem' }}
                />
              ))}
            </Box>
          </Box>
        </Grid>

        {/* Sohbet Alanı */}
        <Grid item xs={12} md={9} lg={9.5} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Mesajlar */}
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
            <List>
              {messages.map((msg) => (
                <ListItem key={msg.id} alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar alt={msg.sender} src={msg.avatar} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography component="span" variant="subtitle2">
                          {msg.sender}
                        </Typography>
                        <Typography component="span" variant="caption" color="text.secondary">
                          {msg.time}
                        </Typography>
                      </Box>
                    }
                    secondary={msg.message}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          {/* Mesaj Gönderme */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Mesajınızı yazın..."
                variant="outlined"
                size="small"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                multiline
                maxRows={4}
              />
              <IconButton 
                color="primary"
                onClick={handleSendMessage}
                disabled={!message.trim()}
              >
                <Send />
              </IconButton>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GroupDetail; 