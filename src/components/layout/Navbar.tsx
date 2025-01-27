import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  IconButton,
  Avatar,
  Tooltip,
  ListItemButton,
  Typography,
  useTheme,
  keyframes
} from '@mui/material';
import {
  Home as HomeIcon,
  Explore as ExploreIcon,
  VideoLibrary as VideoIcon,
  Group as GroupIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  MovieCreation as ReelsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

// Logo animasyonu
const glowAnimation = keyframes`
  0% { text-shadow: 0 0 10px #00f5d4; }
  50% { text-shadow: 0 0 20px #00f5d4, 0 0 30px #00f5d4; }
  100% { text-shadow: 0 0 10px #00f5d4; }
`;

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const menuItems = [
    { text: 'Ana Sayfa', icon: <HomeIcon />, path: '/' },
    { text: 'Keşfet', icon: <ExploreIcon />, path: '/explore' },
    { text: 'Reels', icon: <ReelsIcon />, path: '/reels' },
    { text: 'Videolar', icon: <VideoIcon />, path: '/videos' },
    { text: 'Gruplar', icon: <GroupIcon />, path: '/groups' },
    { text: 'Mesajlar', icon: <MessageIcon />, path: '/messages' },
  ];

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      width: '56px',
      bgcolor: 'background.paper',
      borderLeft: '1px solid',
      borderColor: 'divider',
      position: 'fixed',
      right: 0,
      top: 0,
      zIndex: 1200,
      boxShadow: '0 0 10px rgba(0,0,0,0.1)'
    }}>
      {/* Logo */}
      <Box sx={{ 
        p: 1, 
        textAlign: 'center',
        borderBottom: '1px solid',
        borderColor: 'divider',
        bgcolor: 'background.paper'
      }}>
        <Tooltip title="Payte" placement="left">
          <Typography
            component={RouterLink}
            to="/"
            sx={{
              fontSize: '14px',
              fontWeight: 'bold',
              color: '#00f5d4',
              textDecoration: 'none',
              animation: `${glowAnimation} 2s ease-in-out infinite`,
              display: 'block',
              cursor: 'pointer',
              py: 0.5
            }}
          >
            Payte
          </Typography>
        </Tooltip>
      </Box>

      {/* Ana Menü */}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <Tooltip title={item.text} placement="left">
              <ListItemButton
                component={RouterLink}
                to={item.path}
                sx={{
                  minHeight: 40,
                  justifyContent: 'center',
                  px: 1,
                  '&.active': {
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiListItemIcon-root': {
                      color: 'inherit',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
                  {item.icon}
                </ListItemIcon>
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      {/* Alt Menü */}
      <List>
        <ListItem disablePadding>
          <Tooltip title={currentUser?.username || 'Profil'} placement="left">
            <ListItemButton
              component={RouterLink}
              to="/profile"
              sx={{
                minHeight: 40,
                justifyContent: 'center',
                px: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
                <Avatar
                  src={currentUser?.avatar}
                  sx={{ width: 24, height: 24 }}
                >
                  {currentUser?.username?.[0]?.toUpperCase()}
                </Avatar>
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>

        <ListItem disablePadding>
          <Tooltip title="Ayarlar" placement="left">
            <ListItemButton
              component={RouterLink}
              to="/settings"
              sx={{
                minHeight: 40,
                justifyContent: 'center',
                px: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>

        <ListItem disablePadding>
          <Tooltip title={mode === 'dark' ? 'Açık Tema' : 'Koyu Tema'} placement="left">
            <ListItemButton
              onClick={toggleTheme}
              sx={{
                minHeight: 40,
                justifyContent: 'center',
                px: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
                {mode === 'dark' ? <LightModeIcon fontSize="small" /> : <DarkModeIcon fontSize="small" />}
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>

        <ListItem disablePadding>
          <Tooltip title="Çıkış Yap" placement="left">
            <ListItemButton
              onClick={handleLogout}
              sx={{
                minHeight: 40,
                justifyContent: 'center',
                px: 1,
              }}
            >
              <ListItemIcon sx={{ minWidth: 0, justifyContent: 'center' }}>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
            </ListItemButton>
          </Tooltip>
        </ListItem>
      </List>
    </Box>
  );
};

export default Navbar; 