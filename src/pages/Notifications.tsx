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
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ px: 2, pt: 2 }}>
          Bildirimler
        </Typography>
        
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {notifications.length === 0 ? (
            <ListItem>
              <ListItemText
                primary="Henüz bildiriminiz yok"
                secondary="Yeni bildirimler burada görünecek"
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
  );
};

export default Notifications; 