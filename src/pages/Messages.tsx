import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Badge,
  InputAdornment
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  createChat,
  sendMessage,
  subscribeToMessages,
  subscribeToChats,
  markMessagesAsRead,
  Message,
  Chat
} from '../backend/services/messageService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const Messages = () => {
  const { currentUser } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sohbetleri dinle
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToChats(currentUser.uid, (updatedChats) => {
      setChats(updatedChats.sort((a, b) => {
        return (b.lastMessageTime?.toMillis() || 0) - (a.lastMessageTime?.toMillis() || 0);
      }));
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Mesajları dinle
  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    const unsubscribe = subscribeToMessages(selectedChat.id, (updatedMessages) => {
      setMessages(updatedMessages);
      scrollToBottom();
    });

    // Mesajları okundu olarak işaretle
    markMessagesAsRead(selectedChat.id, currentUser.uid);

    return () => unsubscribe();
  }, [selectedChat, currentUser]);

  // Otomatik kaydırma
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mesaj gönder
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !currentUser || !selectedChat) return;

    setLoading(true);
    try {
      const receiverId = selectedChat.participants.find(id => id !== currentUser.uid);
      if (!receiverId) return;

      await sendMessage(selectedChat.id, currentUser.uid, receiverId, messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sohbet seç
  const handleSelectChat = async (chat: Chat) => {
    setSelectedChat(chat);
    if (currentUser) {
      await markMessagesAsRead(chat.id, currentUser.uid);
    }
  };

  // Mesaj zamanını formatla
  const formatMessageTime = (timestamp: any) => {
    if (!timestamp) return '';
    return format(timestamp.toDate(), 'HH:mm', { locale: tr });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflowY: 'auto'
      }}
    >
      <Container maxWidth="lg" sx={{ my: 4 }}>
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            height: '80vh',
            borderRadius: 2,
            overflow: 'hidden'
          }}
        >
          {/* Sol Panel - Sohbet Listesi */}
          <Box
            sx={{
              width: 320,
              borderRight: 1,
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <Box sx={{ p: 2 }}>
              <TextField
                fullWidth
                placeholder="Sohbet ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Box>

            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {chats
                .filter(chat => {
                  if (!searchQuery) return true;
                  // Burada sohbet araması yapılabilir
                  return true;
                })
                .map((chat) => (
                  <React.Fragment key={chat.id}>
                    <ListItemButton
                      selected={selectedChat?.id === chat.id}
                      onClick={() => handleSelectChat(chat)}
                    >
                      <ListItemAvatar>
                        <Badge
                          badgeContent={chat.unreadCount[currentUser?.uid || ''] || 0}
                          color="primary"
                        >
                          <Avatar>
                            {chat.participants.find(id => id !== currentUser?.uid)?.[0]}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={chat.participants.find(id => id !== currentUser?.uid)}
                        secondary={
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                          >
                            {chat.lastMessage || 'Yeni sohbet'}
                            {chat.lastMessageTime && (
                              <span style={{ float: 'right' }}>
                                {formatMessageTime(chat.lastMessageTime)}
                              </span>
                            )}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                    <Divider />
                  </React.Fragment>
                ))}
            </List>
          </Box>

          {/* Sağ Panel - Mesajlaşma Alanı */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedChat ? (
              <>
                {/* Mesaj Listesi */}
                <Box
                  sx={{
                    flexGrow: 1,
                    overflow: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        display: 'flex',
                        justifyContent: message.senderId === currentUser?.uid ? 'flex-end' : 'flex-start',
                        mb: 1
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1,
                          maxWidth: '70%',
                          bgcolor: message.senderId === currentUser?.uid ? 'primary.main' : 'background.paper',
                          color: message.senderId === currentUser?.uid ? 'white' : 'text.primary'
                        }}
                      >
                        <Typography variant="body1">
                          {message.text}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            textAlign: 'right',
                            mt: 0.5
                          }}
                        >
                          {formatMessageTime(message.timestamp)}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Mesaj Gönderme Formu */}
                <Box
                  component="form"
                  onSubmit={handleSendMessage}
                  sx={{
                    p: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    gap: 1
                  }}
                >
                  <TextField
                    fullWidth
                    placeholder="Mesajınızı yazın..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={loading}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(e);
                      }
                    }}
                  />
                  <IconButton
                    type="submit"
                    color="primary"
                    disabled={loading || !messageText.trim()}
                  >
                    {loading ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%'
                }}
              >
                <Typography variant="h6" color="text.secondary">
                  Sohbet seçin veya yeni bir sohbet başlatın
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Messages; 