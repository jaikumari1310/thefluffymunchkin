import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

const AdminGuard = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    // You can render a loading spinner here if you want
    return <div>Loading...</div>;
  }

  if (!user || user.role !== 'admin') {
    // Redirect them to the home page, or a more specific "access denied" page
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default AdminGuard;
