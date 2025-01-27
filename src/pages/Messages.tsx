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
  createOrGetChat,
  sendMessage,
  subscribeToMessages,
  getUserChats,
  markMessagesAsRead,
  Message,
  Chat
} from '../backend/services/chatService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
  selected: boolean;
  onClick: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, currentUserId, selected, onClick }) => {
  const otherUserId = chat.participants.find(id => id !== currentUserId) || '';
  const lastMessage = chat.lastMessage?.text || 'Yeni sohbet';

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
        <Avatar>{otherUserId[0]}</Avatar>
      </ListItemAvatar>
      <ListItemText 
        primary={otherUserId}
        secondary={lastMessage}
      />
    </ListItemButton>
  );
};

const Messages: React.FC = () => {
  const { currentUser } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [newChatUserId, setNewChatUserId] = useState('');
  const [isNewChatDialogOpen, setIsNewChatDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    if (!currentUser) return;

    const loadChats = async () => {
      try {
        const userChats = await getUserChats(currentUser.uid);
        setChats(userChats);
        if (userChats.length > 0 && !selectedChat) {
          setSelectedChat(userChats[0]);
        }
        setLoading(false);
      } catch (error) {
        console.error('Sohbetler yüklenirken hata:', error);
        setLoading(false);
      }
    };

    loadChats();
  }, [currentUser, selectedChat]);

  useEffect(() => {
    if (!currentUser || !selectedChat) return;

    const unsubscribe = subscribeToMessages(
      currentUser.uid,
      selectedChat.participants.find(id => id !== currentUser.uid) || '',
      (newMessages) => {
        setMessages(newMessages);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    );

    return () => unsubscribe();
  }, [selectedChat, currentUser]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedChat || !currentUser) return;

    try {
      const otherUserId = selectedChat.participants.find(id => id !== currentUser.uid);
      if (!otherUserId) return;

      await sendMessage(otherUserId, currentUser.uid, messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
    }
  };

  const handleCreateNewChat = async () => {
    if (!currentUser || !newChatUserId.trim()) return;

    try {
      const chatId = await createOrGetChat(currentUser.uid, newChatUserId.trim());
      const newChat = chats.find(chat => chat.id === chatId) || {
        id: chatId,
        participants: [currentUser.uid, newChatUserId.trim()],
        createdAt: new Date()
      };
      
      setSelectedChat(newChat as Chat);
      setIsNewChatDialogOpen(false);
      setNewChatUserId('');
    } catch (error) {
      console.error('Yeni sohbet oluşturma hatası:', error);
    }
  };

  if (!currentUser) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Typography>Lütfen giriş yapın</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      pt: 2
    }}>
      <Container maxWidth="lg">
        <Paper sx={{ 
          display: 'flex',
          height: 'calc(100vh - 100px)',
          overflow: 'hidden',
          borderRadius: 2
        }}>
          {/* Sol panel - Sohbet listesi */}
          <Box sx={{ 
            width: 300,
            borderRight: 1,
            borderColor: 'divider',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Box sx={{ 
              p: 2,
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6">Mesajlar</Typography>
              <IconButton onClick={() => setIsNewChatDialogOpen(true)}>
                <AddIcon />
              </IconButton>
            </Box>
            <List sx={{ flex: 1, overflow: 'auto' }}>
              {chats.map((chat) => (
                <ChatListItem
                  key={chat.id}
                  chat={chat}
                  currentUserId={currentUser.uid}
                  selected={selectedChat?.id === chat.id}
                  onClick={() => setSelectedChat(chat)}
                />
              ))}
            </List>
          </Box>

          {/* Sağ panel - Mesajlaşma alanı */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedChat ? (
              <>
                <Box sx={{ 
                  p: 2,
                  borderBottom: 1,
                  borderColor: 'divider',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Avatar sx={{ mr: 2 }}>
                    {selectedChat.participants.find(id => id !== currentUser.uid)?.[0]}
                  </Avatar>
                  <Typography>
                    {selectedChat.participants.find(id => id !== currentUser.uid)}
                  </Typography>
                </Box>
                <Box sx={{ 
                  flex: 1,
                  overflow: 'auto',
                  p: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  {messages.map((message) => (
                    <Box
                      key={message.id}
                      sx={{
                        alignSelf: message.senderId === currentUser.uid ? 'flex-end' : 'flex-start',
                        maxWidth: '70%',
                        bgcolor: message.senderId === currentUser.uid ? 'primary.main' : 'grey.100',
                        color: message.senderId === currentUser.uid ? 'white' : 'text.primary',
                        p: 2,
                        borderRadius: 2
                      }}
                    >
                      <Typography>{message.text}</Typography>
                      <Typography variant="caption" sx={{ opacity: 0.7 }}>
                        {message.timestamp && format(message.timestamp.toDate(), 'HH:mm', { locale: tr })}
                      </Typography>
                    </Box>
                  ))}
                  <div ref={messagesEndRef} />
                </Box>
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
                    placeholder="Mesajınızı yazın..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    size="small"
                  />
                  <IconButton type="submit" color="primary" disabled={!messageText.trim()}>
                    <SendIcon />
                  </IconButton>
                </Paper>
              </>
            ) : (
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Typography color="text.secondary">
                  Sohbet seçin veya yeni bir sohbet başlatın
                </Typography>
              </Box>
            )}
          </Box>
        </Paper>
      </Container>

      {/* Yeni sohbet başlatma dialogu */}
      <Dialog 
        open={isNewChatDialogOpen} 
        onClose={() => setIsNewChatDialogOpen(false)}
      >
        <DialogTitle>Yeni Sohbet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Kullanıcı ID"
            fullWidth
            value={newChatUserId}
            onChange={(e) => setNewChatUserId(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsNewChatDialogOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleCreateNewChat} variant="contained">
            Başlat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Messages; 