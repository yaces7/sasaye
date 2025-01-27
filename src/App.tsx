import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import Notifications from './pages/Notifications';
import { Route } from 'react-router-dom';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

const App = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Layout />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
