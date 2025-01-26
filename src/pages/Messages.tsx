import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Paper,
  TextField,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Send as SendIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getUserByCustomId, getUserByName, User } from '../backend/services/userService';
import { 
  sendMessage, 
  subscribeToMessages, 
  Message,
  getUserChats
} from '../backend/services/messageService';

interface Chat {
  userId: string;
  lastMessage?: string;
  timestamp: Date;
  unreadCount: number;
  user: User;
}

const Messages = () => {
  const { currentUser } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Yeni sohbet oluşturma
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<User | null>(null);
  const [searching, setSearching] = useState(false);

  // Sohbetleri yükle
  useEffect(() => {
    const loadChats = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const chatIds = await getUserChats(currentUser.id);
        
        const loadedChats = await Promise.all(
          chatIds.map(async (chatId) => {
            const [user1Id, user2Id] = chatId.split('_');
            const otherUserId = user1Id === currentUser.id ? user2Id : user1Id;
            const otherUser = await getUserByCustomId(otherUserId);
            
            if (!otherUser) return null;

            return {
              userId: otherUserId,
              user: otherUser,
              timestamp: new Date(),
              unreadCount: 0
            };
          })
        );

        setChats(loadedChats.filter((chat): chat is Chat => chat !== null));
      } catch (err) {
        setError('Sohbetler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadChats();
  }, [currentUser]);

  // Seçili sohbetin mesajlarını dinle
  useEffect(() => {
    if (!currentUser || !selectedChat) return;

    const unsubscribe = subscribeToMessages(
      currentUser.id,
      selectedChat.userId,
      (newMessages) => {
        setMessages(newMessages);
      }
    );

    return () => unsubscribe();
  }, [currentUser, selectedChat]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    try {
      await sendMessage(
        selectedChat.userId,
        currentUser.id,
        newMessage.trim()
      );
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setSearching(true);
      setError(null);
      
      // Önce ID ile ara
      let user = await getUserByCustomId(searchQuery);
      
      // Bulunamazsa isim ile ara
      if (!user) {
        user = await getUserByName(searchQuery);
      }

      setSearchResult(user);
      if (!user) {
        setError('Kullanıcı bulunamadı');
      }
    } catch (err) {
      setError('Arama sırasında bir hata oluştu');
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async () => {
    if (!searchResult || !currentUser) return;

    // Eğer zaten varsa, mevcut sohbeti aç
    const existingChat = chats.find(chat => chat.userId === searchResult.id);
    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      // Yeni sohbet oluştur
      const newChat: Chat = {
        userId: searchResult.id,
        user: searchResult,
        timestamp: new Date(),
        unreadCount: 0
      };
      setChats(prev => [...prev, newChat]);
      setSelectedChat(newChat);
    }

    setIsNewChatOpen(false);
    setSearchQuery('');
    setSearchResult(null);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      {/* Sol panel - Sohbet listesi */}
      <Paper sx={{ width: 320, borderRadius: 0 }}>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setIsNewChatOpen(true)}
          >
            Yeni Sohbet
          </Button>
        </Box>
        
        <List sx={{ overflow: 'auto', height: 'calc(100% - 64px)' }}>
          {chats.length === 0 ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="text.secondary">
                Henüz hiç sohbetiniz yok
              </Typography>
            </Box>
          ) : (
            chats.map((chat) => (
              <ListItem
                key={chat.userId}
                sx={{
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: 'action.hover' },
                  backgroundColor: selectedChat?.userId === chat.userId ? 'action.selected' : 'inherit'
                }}
                onClick={() => setSelectedChat(chat)}
              >
                <ListItemAvatar>
                  <Avatar src={chat.user.avatar} alt={chat.user.name} />
                </ListItemAvatar>
                <ListItemText
                  primary={chat.user.name}
                  secondary={chat.lastMessage || 'Yeni sohbet'}
                />
              </ListItem>
            ))
          )}
        </List>
      </Paper>

      {/* Sağ panel - Mesajlaşma alanı */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <>
            {/* Sohbet başlığı */}
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">
                {selectedChat.user.name}
              </Typography>
            </Box>

            {/* Mesajlar */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {messages.map((message) => (
                <Box
                  key={message.id}
                  sx={{
                    display: 'flex',
                    justifyContent: message.senderId === currentUser?.id ? 'flex-end' : 'flex-start',
                    mb: 2,
                  }}
                >
                  <Paper
                    sx={{
                      p: 2,
                      maxWidth: '70%',
                      bgcolor: message.senderId === currentUser?.id ? 'primary.main' : 'grey.100',
                      color: message.senderId === currentUser?.id ? 'white' : 'text.primary',
                    }}
                  >
                    <Typography>{message.content}</Typography>
                  </Paper>
                </Box>
              ))}
            </Box>

            {/* Mesaj gönderme alanı */}
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Mesajınızı yazın..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <IconButton
                  color="primary"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <SendIcon />
                </IconButton>
              </Box>
            </Box>
          </>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            <Typography color="text.secondary">
              Sohbet başlatmak için sol menüden bir kişi seçin veya yeni sohbet oluşturun
            </Typography>
          </Box>
        )}
      </Box>

      {/* Yeni sohbet oluşturma dialog'u */}
      <Dialog open={isNewChatOpen} onClose={() => setIsNewChatOpen(false)}>
        <DialogTitle>Yeni Sohbet</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Kullanıcı ID veya İsim"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              margin="normal"
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              sx={{ mt: 1 }}
            >
              {searching ? <CircularProgress size={24} /> : 'Ara'}
            </Button>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            {searchResult && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Avatar
                  src={searchResult.avatar}
                  alt={searchResult.name}
                  sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }}
                />
                <Typography variant="h6">{searchResult.name}</Typography>
                <Typography color="text.secondary">
                  ID: {searchResult.customId}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewChatOpen(false)}>İptal</Button>
          <Button
            onClick={handleStartChat}
            disabled={!searchResult}
            variant="contained"
          >
            Sohbet Başlat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Messages; 