import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Paper,
  ListItemButton
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Circle as CircleIcon,
  Group as GroupIcon,
  Message as MessageIcon,
  Favorite as LikeIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserNotifications, markNotificationAsRead, Notification } from '../backend/services/notificationService';

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
  const navigate = useNavigate();
  
  const getIcon = () => {
    switch (notification.type) {
      case 'group_invite':
      case 'group_join':
        return <GroupIcon color="primary" />;
      case 'message':
        return <MessageIcon color="info" />;
      case 'like':
        return <LikeIcon color="error" />;
      case 'comment':
        return <CommentIcon color="success" />;
      default:
        return <NotificationsIcon />;
    }
  };

  const handleClick = async () => {
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  return (
    <>
      <ListItemButton
        onClick={handleClick}
        sx={{
          bgcolor: notification.isRead ? 'transparent' : 'action.hover',
          '&:hover': {
            bgcolor: 'action.selected'
          }
        }}
      >
        <ListItemAvatar>
          <Avatar>
            {getIcon()}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle1">
                {notification.title}
              </Typography>
              {!notification.isRead && (
                <CircleIcon sx={{ fontSize: 12, color: 'primary.main' }} />
              )}
            </Box>
          }
          secondary={notification.message}
        />
      </ListItemButton>
      <Divider variant="inset" component="li" />
    </>
  );
};

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!currentUser) return;
      
      try {
        const fetchedNotifications = await getUserNotifications(currentUser.id);
        setNotifications(fetchedNotifications);
      } catch (error) {
        console.error('Bildirimler alınamadı:', error);
      }
    };

    fetchNotifications();
  }, [currentUser]);

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
      <Container maxWidth="md" sx={{ my: 4 }}>
        <Paper 
          elevation={3}
          sx={{ 
            p: 4,
            borderRadius: 2,
            bgcolor: 'background.paper',
            width: '100%'
          }}
        >
          <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
            Bildirimler
          </Typography>
          
          <List sx={{ width: '100%' }}>
            {notifications.length === 0 ? (
              <ListItem>
                <ListItemText
                  primary={
                    <Typography variant="h6" align="center">
                      Henüz bildiriminiz yok
                    </Typography>
                  }
                  secondary={
                    <Typography variant="body2" align="center" color="text.secondary">
                      Yeni bildirimler burada görünecek
                    </Typography>
                  }
                />
              </ListItem>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                />
              ))
            )}
          </List>
        </Paper>
      </Container>
    </Box>
  );
};

export default Notifications; 