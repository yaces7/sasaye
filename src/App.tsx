import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import Notifications from './pages/Notifications';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Layout />
          <Routes>
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
