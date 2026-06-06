import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';

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

  return <AdminPage />;
}

export function AdminPage() {
  const { user } = useAuth();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Admin</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">
          Placeholder administrativo
        </h1>
      </div>
      <div className="rounded-lg border border-stoneLine bg-white p-6 shadow-sm">
        <p className="text-stone-700">
          Você está autenticado como {user?.email}. Esta rota está protegida e
          reserva o espaço para o painel administrativo futuro.
        </p>
        <p className="mt-3 text-stone-700">
          Catálogo, preços, CRUD, dados reais e configurações da empresa ficam
          para fases posteriores.
        </p>
      </div>
    </section>
  );
}
