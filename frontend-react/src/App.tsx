import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import Maintenance from './pages/Maintenance';
import Users from './pages/Users';
import Profile from './pages/Profile';
import ActivityLogs from './pages/ActivityLogs';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
      
      <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/assets" element={<Assets />} />
        <Route path="/maintenance" element={<Maintenance />} />
        <Route path="/users" element={<ProtectedRoute roles={['Admin']}><Users /></ProtectedRoute>} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/activity-logs" element={<ProtectedRoute roles={['Admin', 'Asset Manager']}><ActivityLogs /></ProtectedRoute>} />
      </Route>

      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
