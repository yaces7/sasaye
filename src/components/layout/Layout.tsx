import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';

// Pages
import Home from '../../pages/Home';
import Login from '../../pages/Login';
import Register from '../../pages/Register';
import Profile from '../../pages/Profile';
import Settings from '../../pages/Settings';
import Messages from '../../pages/Messages';
import Groups from '../../pages/Groups';
import GroupDetail from '../../pages/GroupDetail';
import Videos from '../../pages/Videos';
import Explore from '../../pages/Explore';
import Reels from '../../pages/Reels';

// Protected Route Component
const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  return children;
};

// Public Only Route Component
const PublicOnlyRoute = ({ children }: { children: JSX.Element }) => {
  const { currentUser } = useAuth();
  if (currentUser) return <Navigate to="/" />;
  return children;
};

const Layout = () => {
  const { currentUser } = useAuth();

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Ana İçerik */}
      <Box component="main" sx={{ 
        flexGrow: 1, 
        p: 3,
        marginRight: currentUser ? '280px' : 0, // Navbar genişliği kadar sağ margin
        transition: 'margin 0.3s ease'
      }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicOnlyRoute>
                <Register />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <Messages />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups"
            element={
              <ProtectedRoute>
                <Groups />
              </ProtectedRoute>
            }
          />
          <Route
            path="/groups/:id"
            element={
              <ProtectedRoute>
                <GroupDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/videos"
            element={
              <ProtectedRoute>
                <Videos />
              </ProtectedRoute>
            }
          />
          <Route path="/explore" element={<Explore />} />
          <Route
            path="/reels"
            element={
              <ProtectedRoute>
                <Reels />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Box>

      {/* Sağ Kenar Çubuğu - Navbar */}
      {currentUser && (
        <Box
          component="nav"
          sx={{
            width: 280,
            flexShrink: 0,
            position: 'fixed',
            right: 0,
            top: 0,
            height: '100vh',
            borderLeft: '1px solid',
            borderColor: 'divider',
            bgcolor: 'background.paper',
            zIndex: 1200,
            overflowY: 'auto'
          }}
        >
          <Navbar />
        </Box>
      )}
    </Box>
  );
};

export default Layout; 