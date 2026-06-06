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
    <section className="mx-auto max-w-md space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase text-moss">Login</p>
        <h1 className="mt-2 text-3xl font-bold text-graphite">
          Acesso administrativo
        </h1>
        <p className="mt-3 text-stone-700">
          Entre para acessar a área administrativa da marmoraria.
        </p>
      </div>

      {!hasSupabaseConfig && (
        <div className="rounded-md border border-copper/30 bg-orange-50 p-4 text-sm text-stone-800">
          Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente antes
          de usar o login.
        </div>
      )}

      <form
        className="space-y-4 rounded-lg border border-stoneLine bg-white p-6 shadow-sm"
        onSubmit={handleSubmit}
      >
        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">E-mail</span>
          <input
            className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
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
            className="w-full rounded-md border border-stoneLine px-3 py-3 text-graphite outline-none transition focus:border-moss"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        {errorMessage && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </p>
        )}

        <button
          className="w-full rounded-md bg-graphite px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
          type="submit"
          disabled={submitting || loading}
        >
          {submitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </section>
  );
}
