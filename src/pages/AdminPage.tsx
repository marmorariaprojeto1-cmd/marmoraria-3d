import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { AdminLayout } from '../components/admin/AdminLayout';

export function ProtectedAdminPage() {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="rounded-lg border border-stoneLine bg-white p-6 text-stone-700 shadow-sm">
        Verificando sessão...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <AdminLayout />;
}
