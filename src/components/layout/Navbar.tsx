import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Divider,
  Typography,
  ListItemButton,
  useTheme
} from '@mui/material';
import {
  Home as HomeIcon,
  Explore as ExploreIcon,
  VideoLibrary as VideoIcon,
  Group as GroupIcon,
  Message as MessageIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  MovieCreation as ReelsIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme as useAppTheme } from '../../contexts/ThemeContext';

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { mode, toggleTheme } = useAppTheme();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo veya Uygulama Adı */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
          Sosyal Medya
        </Typography>
      </Box>

      <Divider />

      {/* Ana Menü */}
      <List sx={{ flexGrow: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              sx={{
                borderRadius: 2,
                m: 1,
                '&.active': {
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  '& .MuiListItemIcon-root': {
                    color: 'inherit',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      {/* Alt Menü */}
      <List>
        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/profile"
            sx={{ borderRadius: 2, m: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <Avatar
                src={currentUser?.avatar}
                sx={{ width: 32, height: 32 }}
              >
                {currentUser?.username?.[0]?.toUpperCase()}
              </Avatar>
            </ListItemIcon>
            <ListItemText 
              primary={currentUser?.username}
              secondary={currentUser?.email}
              secondaryTypographyProps={{ noWrap: true }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            component={RouterLink}
            to="/settings"
            sx={{ borderRadius: 2, m: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <SettingsIcon />
            </ListItemIcon>
            <ListItemText primary="Ayarlar" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={toggleTheme}
            sx={{ borderRadius: 2, m: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </ListItemIcon>
            <ListItemText primary={mode === 'dark' ? 'Açık Tema' : 'Koyu Tema'} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={handleLogout}
            sx={{ borderRadius: 2, m: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Çıkış Yap" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );
};

export default Navbar; 