import { Box, Typography, TextField, IconButton, Paper } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useState } from 'react';

const ChatWindow = () => {
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'Ahmet Yılmaz',
      message: 'Merhaba, nasılsın?',
      time: '10:30',
      isSent: false,
    },
    {
      id: 2,
      sender: 'Ben',
      message: 'İyiyim, teşekkürler. Sen nasılsın?',
      time: '10:31',
      isSent: true,
    },
    {
      id: 3,
      sender: 'Ahmet Yılmaz',
      message: 'Ben de iyiyim. Projeyle ilgili konuşabilir miyiz?',
      time: '10:32',
      isSent: false,
    },
  ]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const currentTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      setMessages([...messages, {
        id: messages.length + 1,
        sender: 'Ben',
        message: newMessage,
        time: currentTime,
        isSent: true,
      }]);
      
      setNewMessage('');

      // Simüle edilmiş otomatik cevap
      setTimeout(() => {
        const autoReply = {
          id: messages.length + 2,
          sender: 'Ahmet Yılmaz',
          message: 'Tamam, birazdan cevap yazacağım.',
          time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          isSent: false,
        };
        setMessages(prev => [...prev, autoReply]);
      }, 1000);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Chat Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">Ahmet Yılmaz</Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.isSent ? 'flex-end' : 'flex-start',
              mb: 2,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: message.isSent ? 'primary.main' : 'grey.100',
                color: message.isSent ? 'white' : 'text.primary',
                borderRadius: 2,
              }}
            >
              <Typography variant="body1">{message.message}</Typography>
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>
                {message.time}
              </Typography>
            </Paper>
          </Box>
        ))}
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            placeholder="Mesajınızı yazın..."
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={4}
          />
          <IconButton 
            color="primary" 
            sx={{ p: '10px' }}
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Send />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatWindow; 