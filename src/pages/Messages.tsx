import { useState, useEffect } from 'react';
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
  Container,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Send as SendIcon, Add as AddIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getUserByCustomId, getUserByName, AppUser } from '../backend/services/userService';
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
  user: AppUser;
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
  const [searchResults, setSearchResults] = useState<AppUser[]>([]);
  const [searching, setSearching] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Sohbetleri yükle
  useEffect(() => {
    const loadChats = async () => {
      if (!currentUser) return;
      
      try {
        setLoading(true);
        const chatIds = await getUserChats(currentUser.uid);
        
        const loadedChats = await Promise.all(
          chatIds.map(async (chatId) => {
            const [user1Id, user2Id] = chatId.split('_');
            const otherUserId = user1Id === currentUser.uid ? user2Id : user1Id;
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
      currentUser.uid,
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
        currentUser.uid,
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
        const users = await getUserByName(searchQuery);
        setSearchResults(users.map(user => ({
          ...user,
          createdAt: new Date(),
          isEmailVerified: false
        })));
      } else {
        setSearchResults([{
          ...user,
          createdAt: new Date(),
          isEmailVerified: false
        }]);
      }

      if (searchResults.length === 0) {
        setError('Kullanıcı bulunamadı');
      }
    } catch (err) {
      setError('Arama sırasında bir hata oluştu');
    } finally {
      setSearching(false);
    }
  };

  const handleStartChat = async () => {
    if (searchResults.length === 0 || !currentUser) return;

    // Eğer zaten varsa, mevcut sohbeti aç
    const existingChat = chats.find(chat => chat.userId === searchResults[0].id);
    if (existingChat) {
      setSelectedChat(existingChat);
    } else {
      // Yeni sohbet oluştur
      const newChat: Chat = {
        userId: searchResults[0].id,
        user: searchResults[0],
        timestamp: new Date(),
        unreadCount: 0
      };
      setChats(prev => [...prev, newChat]);
      setSelectedChat(newChat);
    }

    setIsNewChatOpen(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflowY: 'auto',
      bgcolor: 'background.default'
    }}>
      <Container maxWidth={false} sx={{ 
        my: { xs: 0, sm: 4 },
        maxWidth: '1600px',
        mx: 'auto',
        px: { xs: 0, sm: 3 }
      }}>
        <Paper sx={{ 
          width: '100%',
          height: '80vh',
          display: 'flex',
          borderRadius: { xs: isMobile ? 0 : 2, sm: 2 },
          boxShadow: isMobile ? 'none' : theme => `0 8px 24px ${theme.palette.primary.light}25`,
          overflow: 'hidden'
        }}>
          {/* Sol Panel - Sohbet Listesi */}
          <Box sx={{ 
            width: 400, 
            borderRight: 1, 
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper'
          }}>
            {/* Başlık ve Yeni Sohbet Butonu */}
            <Box sx={{ 
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <Typography variant="h6">Mesajlar</Typography>
              <IconButton onClick={() => setIsNewChatOpen(true)}>
                <AddIcon />
              </IconButton>
            </Box>

            {/* Sohbet Listesi */}
            <List sx={{ 
              flexGrow: 1, 
              overflow: 'auto',
              '& .MuiListItem-root': {
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }
            }}>
              {chats.map((chat) => (
                <ListItem
                  key={chat.userId}
                  component="div"
                  sx={{
                    cursor: 'pointer',
                    bgcolor: selectedChat?.userId === chat.userId ? 'action.selected' : 'transparent',
                    '&:hover': {
                      bgcolor: 'action.hover'
                    }
                  }}
                  onClick={() => setSelectedChat(chat)}
                >
                  <ListItemAvatar>
                    <Avatar src={chat.user.avatar}>
                      {chat.user.name?.[0]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={chat.user.name}
                    secondary={chat.lastMessage || 'Yeni sohbet'}
                    primaryTypographyProps={{
                      fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal'
                    }}
                    secondaryTypographyProps={{
                      noWrap: true,
                      style: {
                        fontWeight: chat.unreadCount > 0 ? 'bold' : 'normal'
                      }
                    }}
                  />
                  {chat.unreadCount > 0 && (
                    <Box
                      sx={{
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 20,
                        height: 20,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem'
                      }}
                    >
                      {chat.unreadCount}
                    </Box>
                  )}
                </ListItem>
              ))}
              {chats.length === 0 && (
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    Henüz hiç sohbetiniz yok
                  </Typography>
                </Box>
              )}
            </List>
          </Box>

          {/* Sağ Panel - Mesajlaşma Alanı */}
          <Box sx={{ 
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default'
          }}>
            {selectedChat ? (
              <>
                {/* Seçili Sohbet Başlığı */}
                <Box sx={{ 
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Avatar 
                    src={selectedChat.user.avatar}
                    sx={{ width: 40, height: 40, mr: 2 }}
                  >
                    {selectedChat.user.name?.[0]}
                  </Avatar>
                  <Typography variant="subtitle1">
                    {selectedChat.user.name}
                  </Typography>
                </Box>

                {/* Mesajlar */}
                <Box sx={{ 
                  flexGrow: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        alignSelf: message.senderId === currentUser?.uid ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        mb: 1
                      }}
                    >
                      <Paper
                        sx={{
                          p: 1.5,
                          bgcolor: message.senderId === currentUser?.uid ? 'primary.main' : 'grey.100',
                          color: message.senderId === currentUser?.uid ? 'white' : 'text.primary',
                          borderRadius: 2
                        }}
                      >
                        <Typography variant="body1">
                          {message.content}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            display: 'block',
                            textAlign: 'right',
                            mt: 0.5,
                            opacity: 0.8
                          }}
                        >
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </Paper>
                    </Box>
                  ))}
                </Box>

                {/* Mesaj Yazma Alanı */}
                <Box sx={{ 
                  p: 2,
                  borderTop: 1,
                  borderColor: 'divider',
                  bgcolor: 'background.paper',
                  display: 'flex',
                  gap: 1
                }}>
                  <TextField
                    fullWidth
                    placeholder="Mesaj yazın..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    multiline
                    maxRows={4}
                    size="small"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: 2
                      }
                    }}
                  />
                  <IconButton 
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    sx={{ 
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      },
                      '&.Mui-disabled': {
                        bgcolor: 'action.disabledBackground'
                      }
                    }}
                  >
                    <SendIcon />
                  </IconButton>
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                p: 3,
                textAlign: 'center'
              }}>
                <Typography variant="h6" gutterBottom>
                  Mesajlarınız
                </Typography>
                <Typography color="text.secondary">
                  Sohbet başlatmak için sol menüden bir kişi seçin veya yeni sohbet oluşturun
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsNewChatOpen(true)}
                  sx={{ mt: 2 }}
                >
                  Yeni Sohbet
                </Button>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      {/* Yeni Sohbet Dialog'u */}
      <Dialog 
        open={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)}
        maxWidth="xs"
        fullWidth
      >
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

            {searchResults.length > 0 && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <Avatar
                  src={searchResults[0].avatar}
                  sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }}
                >
                  {searchResults[0].name?.[0]}
                </Avatar>
                <Typography variant="h6">{searchResults[0].name}</Typography>
                <Typography color="text.secondary">
                  ID: {searchResults[0].customId}
                </Typography>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewChatOpen(false)}>İptal</Button>
          <Button
            onClick={handleStartChat}
            disabled={searchResults.length === 0}
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