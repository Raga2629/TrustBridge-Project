import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from './ui/Cards';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner size="lg" />;

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    const paths = {
      newcomer: '/dashboard/newcomer',
      resident: '/dashboard/resident',
      provider: '/dashboard/provider',
      admin: '/dashboard/admin',
    };
    return <Navigate to={paths[user.role] || '/'} replace />;
  }

  return children;
}
