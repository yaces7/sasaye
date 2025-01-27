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
  CircularProgress,
  Badge,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import {
  createChat,
  sendMessage,
  subscribeToMessages,
  subscribeToChats,
  markMessagesAsRead,
  Message,
  Chat,
  getUserByName,
  getChatById,
  getChatMessages
} from '../backend/services/messageService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
  selected: boolean;
  onClick: () => void;
}

// Sohbet listesi öğesi
const ChatListItem = ({ chat, currentUserId, selected, onClick }: ChatListItemProps) => {
  // Karşıdaki kullanıcının ismini al
  const otherUserName = chat.participantNames[currentUserId];
  const unreadCount = chat.unreadCounts[currentUserId] || 0;

  return (
    <ListItemButton 
      selected={selected} 
      onClick={onClick}
      sx={{ 
        display: 'flex', 
        alignItems: 'center',
        padding: 2,
        borderBottom: '1px solid',
        borderColor: 'divider'
      }}
    >
      <ListItemAvatar>
        <Avatar>{otherUserName[0]}</Avatar>
      </ListItemAvatar>
      <ListItemText 
        primary={otherUserName}
        secondary={chat.lastMessage || 'Yeni sohbet'}
        primaryTypographyProps={{ fontWeight: unreadCount > 0 ? 'bold' : 'normal' }}
        secondaryTypographyProps={{ 
          color: unreadCount > 0 ? 'text.primary' : 'text.secondary',
          fontWeight: unreadCount > 0 ? 'medium' : 'normal'
        }}
      />
      {unreadCount > 0 && (
        <Badge 
          badgeContent={unreadCount} 
          color="primary"
          sx={{ marginLeft: 1 }}
        />
      )}
    </ListItemButton>
  );
};

// Mesaj animasyonu için stil
const messageAnimation = `
@keyframes foldAndFly {
  0% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
  20% {
    transform: scale(0.8) rotate(15deg);
  }
  40% {
    transform: scale(0.6) rotate(-15deg) translateX(0);
  }
  60% {
    transform: scale(0.4) rotate(45deg) translateX(-100px) translateY(-50px);
  }
  80% {
    transform: scale(0.2) rotate(180deg) translateX(-200px) translateY(-100px);
  }
  100% {
    transform: scale(0) rotate(360deg) translateX(-300px) translateY(-150px);
    opacity: 0;
  }
}
`;

const Messages = () => {
  const { currentUser } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const [newChatUsername, setNewChatUsername] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sending, setSending] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Sohbetleri dinle
  useEffect(() => {
    if (!currentUser) return;
    let unsubscribeChats: () => void;
    let unsubscribeMessages: () => void;

    // Sohbetleri dinle
    unsubscribeChats = subscribeToChats(currentUser.uid, (updatedChats) => {
      setChats(updatedChats);
      
      // Eğer seçili sohbet yoksa ve sohbetler varsa ilk sohbeti seç
      if (!selectedChat && updatedChats.length > 0) {
        const firstChat = updatedChats[0];
        setSelectedChat(firstChat);
        
        // İlk sohbetin mesajlarını dinle
        unsubscribeMessages = subscribeToMessages(firstChat.id, (newMessages) => {
          setMessages(newMessages);
          scrollToBottom();
        });
      }
    });

    return () => {
      if (unsubscribeChats) unsubscribeChats();
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, [currentUser]);

  // Seçili sohbetin mesajlarını dinle
  useEffect(() => {
    if (!selectedChat || !currentUser) return;

    // Mesajları okundu olarak işaretle
    markMessagesAsRead(selectedChat.id, currentUser.uid);

    // Mesajları dinle
    const unsubscribe = subscribeToMessages(selectedChat.id, (newMessages) => {
      setMessages(newMessages);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedChat, currentUser]);

  // Otomatik kaydırma
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mesaj gönder
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat || !currentUser || sending) return;

    try {
      setSending(true);
      const receiverId = selectedChat.participants.find(id => id !== currentUser.uid);
      if (!receiverId) return;

      // Mesajı gönder
      await sendMessage(selectedChat.id, currentUser.uid, receiverId, messageText.trim());
      setMessageText('');
      
      // Mesajları yeniden yükle
      const updatedMessages = await getChatMessages(selectedChat.id);
      setMessages(updatedMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    } finally {
      setSending(false);
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

  // Kullanıcı ara
  const handleUserSearch = async (searchTerm: string) => {
    setNewChatUsername(searchTerm);
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await getUserByName(searchTerm);
      setSearchResults(results);
      setSearchError(results.length === 0 ? 'Kullanıcı bulunamadı' : null);
    } catch (error) {
      setSearchError('Arama sırasında bir hata oluştu');
      setSearchResults([]);
    }
  };

  // Yeni sohbet oluştur
  const handleCreateNewChat = async (receiverId: string) => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const chatId = await createChat(currentUser.uid, receiverId);
      const chat = await getChatById(chatId);
      if (chat) {
        setSelectedChat(chat);
      }
      setIsNewChatDialogOpen(false);
      setNewChatUsername('');
      setSearchResults([]);
    } catch (error) {
      console.error('Sohbet oluşturma hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Lütfen giriş yapın</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

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
      <Container maxWidth="lg" sx={{ my: { xs: 2, sm: 4 } }}>
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            height: '80vh',
            borderRadius: { xs: isMobile ? 0 : 2, sm: 2 },
            overflow: 'hidden',
            boxShadow: theme => `0 8px 24px ${theme.palette.primary.light}25`
          }}
        >
          {/* Sol Panel - Sohbet Listesi */}
          <Box
            sx={{
              width: 320,
              borderRight: 1,
              borderColor: 'divider',
              display: { xs: selectedChat ? 'none' : 'block', sm: 'block' }
            }}
          >
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <TextField
                size="small"
                fullWidth
                placeholder="Sohbet ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  )
                }}
                sx={{ flex: 1 }}
              />
              <Tooltip title="Yeni Sohbet">
                <IconButton
                  color="primary"
                  onClick={() => setIsNewChatDialogOpen(true)}
                  sx={{ 
                    width: 35,
                    height: 35,
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark'
                    }
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            <List sx={{ flexGrow: 1, overflow: 'auto' }}>
              {chats
                .filter(chat => {
                  if (!searchQuery) return true;
                  // Burada sohbet araması yapılabilir
                  return true;
                })
                .map((chat) => (
                  currentUser && (
                    <ChatListItem
                      key={chat.id}
                      chat={chat}
                      currentUserId={currentUser.uid}
                      selected={selectedChat?.id === chat.id}
                      onClick={() => handleSelectChat(chat)}
                    />
                  )
                ))}
            </List>
          </Box>

          {/* Sağ Panel - Mesajlaşma Alanı */}
          <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedChat ? (
              <>
                <style>{messageAnimation}</style>
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
                        mb: 1,
                        animation: message.id.startsWith('temp-') ? 'foldAndFly 1s forwards' : 'none'
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1,
                          maxWidth: '70%',
                          bgcolor: message.senderId === currentUser?.uid ? 'primary.main' : 'background.paper',
                          color: message.senderId === currentUser?.uid ? 'primary.contrastText' : 'text.primary',
                          transform: message.id.startsWith('temp-') ? 'perspective(1000px)' : 'none',
                          transformOrigin: 'right bottom'
                        }}
                      >
                        <Typography variant="body1">{message.text}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.7 }}>
                          {format(
                            typeof message.timestamp === 'object' && 'toDate' in message.timestamp
                              ? message.timestamp.toDate()
                              : message.timestamp,
                            'HH:mm'
                          )}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Mesaj Gönderme Formu */}
                <Paper
                  component="form"
                  onSubmit={handleSendMessage}
                  sx={{
                    p: 2,
                    display: 'flex',
                    gap: 1,
                    borderTop: 1,
                    borderColor: 'divider'
                  }}
                >
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Mesajınızı yazın..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    disabled={sending}
                  />
                  <IconButton 
                    type="submit" 
                    color="primary" 
                    disabled={!messageText.trim() || sending}
                  >
                    {sending ? <CircularProgress size={24} /> : <SendIcon />}
                  </IconButton>
                </Paper>
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

        {/* Yeni Sohbet Dialog */}
        <Dialog
          open={isNewChatDialogOpen}
          onClose={() => {
            setIsNewChatDialogOpen(false);
            setNewChatUsername('');
            setSearchResults([]);
            setSearchError(null);
          }}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Yeni Sohbet</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Kullanıcı Adı veya ID"
              value={newChatUsername}
              onChange={(e) => handleUserSearch(e.target.value)}
              margin="dense"
              autoFocus
              helperText={searchError}
              error={!!searchError}
              InputProps={{
                endAdornment: loading && (
                  <InputAdornment position="end">
                    <CircularProgress size={20} />
                  </InputAdornment>
                )
              }}
            />
            {searchResults.length > 0 && (
              <List sx={{ mt: 2 }}>
                {searchResults.map((user) => (
                  <ListItemButton
                    key={user.id}
                    onClick={() => handleCreateNewChat(user.id)}
                    disabled={loading}
                  >
                    <ListItemAvatar>
                      <Avatar src={user.avatar}>
                        {user.username?.[0]?.toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.username}
                      secondary={`ID: ${user.customId}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => {
                setIsNewChatDialogOpen(false);
                setNewChatUsername('');
                setSearchResults([]);
                setSearchError(null);
              }}
            >
              İptal
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default Messages; 