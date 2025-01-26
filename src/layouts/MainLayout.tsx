import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Badge,
} from '@mui/material';
import {
  Home as HomeIcon,
  VideoLibrary as VideoIcon,
  Message as MessageIcon,
  Group as GroupIcon,
  Notifications as NotificationIcon,
  ExploreOutlined as ExploreIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from '../backend/services/userService';

const MainLayout = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [unreadMessages, setUnreadMessages] = React.useState(0);
  const [notifications, setNotifications] = React.useState(0);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfileClick = () => {
    handleClose();
    navigate('/profile');
  };

  const handleLogout = async () => {
    handleClose();
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  // Public routes - herkes erişebilir
  const publicRoutes = ['/', '/login', '/register'];
  
  // Eğer kullanıcı giriş yapmamışsa ve protected route'a erişmeye çalışıyorsa
  if (!isAuthenticated && !publicRoutes.includes(location.pathname)) {
    navigate('/login');
    return null;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 0, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            SosyalMedya
          </Typography>

          <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, ml: 4 }}>
            <IconButton color="inherit" onClick={() => navigate('/')}>
              <HomeIcon />
            </IconButton>

            {isAuthenticated && (
              <>
                <IconButton color="inherit" onClick={() => navigate('/videos')}>
                  <VideoIcon />
                </IconButton>

                <IconButton color="inherit" onClick={() => navigate('/messages')}>
                  <Badge badgeContent={unreadMessages} color="error">
                    <MessageIcon />
                  </Badge>
                </IconButton>

                <IconButton color="inherit" onClick={() => navigate('/groups')}>
                  <GroupIcon />
                </IconButton>

                <IconButton color="inherit" onClick={() => navigate('/explore')}>
                  <ExploreIcon />
                </IconButton>

                <IconButton color="inherit">
                  <Badge badgeContent={notifications} color="error">
                    <NotificationIcon />
                  </Badge>
                </IconButton>
              </>
            )}
          </Box>

          <Box>
            {isAuthenticated ? (
              <>
                <IconButton
                  onClick={handleMenu}
                  sx={{
                    padding: 0,
                    '&:hover': {
                      backgroundColor: 'transparent',
                    },
                  }}
                >
                  <Avatar
                    alt={currentUser?.name}
                    src={currentUser?.avatar}
                    sx={{ width: 40, height: 40 }}
                  />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleClose}
                >
                  <MenuItem onClick={handleProfileClick}>Profilim</MenuItem>
                  <MenuItem onClick={handleLogout}>Çıkış Yap</MenuItem>
                </Menu>
              </>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  color="inherit"
                  onClick={() => navigate('/login')}
                >
                  Giriş Yap
                </Button>
                <Button
                  color="inherit"
                  onClick={() => navigate('/register')}
                >
                  Kayıt Ol
                </Button>
              </Box>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="main" sx={{ flexGrow: 1, mt: '64px' }}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default MainLayout; 