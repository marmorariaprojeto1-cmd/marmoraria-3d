import { FormEvent, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { hasSupabaseConfig } from '../lib/supabase';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname || '/admin';

  if (!loading && user) {
    return <Navigate to={redirectTo} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      await signIn(email, password);
      navigate(redirectTo, { replace: true });
    } catch {
      setErrorMessage('Não foi possível entrar. Verifique e-mail e senha.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div className="space-y-5">
        <div>
          <p className="page-kicker">Login</p>
          <h1 className="page-title">Acesso administrativo</h1>
          <p className="page-description">
            Entre para acompanhar pedidos, configurar catálogos e manter os
            dados da marmoraria atualizados.
          </p>
        </div>
        <div className="soft-card p-4">
          <p className="text-sm font-semibold text-graphite">
            Painel multiempresa
          </p>
          <p className="mt-2 text-sm text-stone-600">
            Cada usuário acessa apenas os dados da empresa vinculada ao seu
            login.
          </p>
        </div>
      </div>

      {!hasSupabaseConfig && (
        <div className="message-warning lg:col-span-2">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente antes
          de usar o login.
        </div>
      )}

      <form
        className="surface-card space-y-5 p-6"
        onSubmit={handleSubmit}
      >
        <div>
          <h2 className="text-xl font-bold text-graphite">Entrar no painel</h2>
          <p className="mt-1 text-sm text-stone-600">
            Use as credenciais configuradas no Supabase.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">E-mail</span>
          <input
            className="field-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">Senha</span>
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {errorMessage && (
          <p className="message-error">
            {errorMessage}
          </p>
        )}

        <button
          className="primary-button w-full"
          type="submit"
          disabled={submitting || loading}
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </section>
  );
}
