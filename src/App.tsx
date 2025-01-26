import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material';
import theme from './theme';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Messages from './pages/Messages';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import Videos from './pages/Videos';
import Explore from './pages/Explore';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
              <Route path="messages" element={<Messages />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:id" element={<GroupDetail />} />
              <Route path="videos" element={<Videos />} />
              <Route path="explore" element={<Explore />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
