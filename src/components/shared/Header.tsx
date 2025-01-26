import { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Button, IconButton, Box, Avatar, Menu, MenuItem } from '@mui/material';
import { Home as HomeIcon, VideoCall, Message, Group, Notifications, ExitToApp as LogoutIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface User {
  name: string;
  email: string;
  avatar: string;
}

const Header = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
  }, []);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    handleClose();
    navigate('/login');
  };

  return (
    <AppBar position="fixed">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            cursor: 'pointer' 
          }}
          onClick={() => navigate('/')}
        >
          SosyalMedya
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <IconButton color="inherit" onClick={() => navigate('/')}>
            <HomeIcon />
          </IconButton>
          
          <IconButton color="inherit" onClick={() => navigate('/videos')}>
            <VideoCall />
          </IconButton>
          
          <IconButton color="inherit" onClick={() => navigate('/messages')}>
            <Message />
          </IconButton>
          
          <IconButton color="inherit" onClick={() => navigate('/groups')}>
            <Group />
          </IconButton>
          
          {isLoggedIn && (
            <IconButton color="inherit">
              <Notifications />
            </IconButton>
          )}
          
          {isLoggedIn && user ? (
            <>
              <Avatar
                src={user.avatar}
                alt={user.name}
                sx={{ 
                  width: 40, 
                  height: 40, 
                  cursor: 'pointer',
                  bgcolor: 'primary.light',
                  border: 2,
                  borderColor: 'primary.light',
                }}
                onClick={handleProfileClick}
              />
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
              >
                <MenuItem onClick={handleClose}>Profilim</MenuItem>
                <MenuItem onClick={handleClose}>Ayarlar</MenuItem>
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Çıkış Yap
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                sx={{ borderRadius: 2 }}
              >
                Giriş Yap
              </Button>
              <Button 
                variant="outlined" 
                color="inherit"
                onClick={() => navigate('/register')}
                sx={{ borderRadius: 2 }}
              >
                Kayıt Ol
              </Button>
            </Box>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header; 