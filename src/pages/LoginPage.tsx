import { FormEvent, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { hasSupabaseConfig, supabase } from '../lib/supabase';

type LocationState = {
  from?: {
    pathname?: string;
  };
};

export function LoginPage() {
  const { signIn, signOut, user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [resetMessage, setResetMessage] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname;

  async function resolvePostLoginPath() {
    if (redirectTo) {
      return redirectTo;
    }

    const { data, error } = await supabase.rpc('current_user_is_superadmin');

    if (error) {
      return '/admin';
    }

    return data === true ? '/superadmin' : '/admin';
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    try {
      await signIn(email, password);
      const destination = await resolvePostLoginPath();
      navigate(destination, { replace: true });
    } catch {
      setErrorMessage('Não foi possível entrar. Verifique e-mail e senha.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAuthenticatedSignOut() {
    await signOut();
    navigate('/login', { replace: true });
  }

  async function handleGoToPanel() {
    const destination = await resolvePostLoginPath();
    navigate(destination, { replace: true });
  }

  if (!loading && user) {
    return (
      <section className="mx-auto max-w-xl">
        <div className="surface-card space-y-5 p-6">
          <div>
            <p className="page-kicker">Login</p>
            <h1 className="text-3xl font-bold text-graphite">
              Você já está logado
            </h1>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Entre no painel vinculado ao seu usuário ou saia para trocar de
              conta.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              className="primary-button flex-1"
              type="button"
              onClick={handleGoToPanel}
            >
              Ir para o painel
            </button>
            <button
              className="secondary-button flex-1"
              type="button"
              onClick={handleAuthenticatedSignOut}
            >
              Sair
            </button>
          </div>
        </div>
      </section>
    );
  }

  async function handlePasswordReset() {
    setErrorMessage('');
    setResetMessage('');
    setResetSubmitting(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });

      if (error) {
        throw error;
      }

      setResetMessage(
        'Enviamos um link de redefinição para o e-mail informado.',
      );
    } catch {
      setErrorMessage('Não foi possível enviar o e-mail de redefinição.');
    } finally {
      setResetSubmitting(false);
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

      <form className="surface-card space-y-5 p-6" onSubmit={handleSubmit}>
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

        <button
          className="w-full text-center text-sm font-semibold text-moss underline-offset-4 hover:underline"
          type="button"
          onClick={() => {
            setShowResetForm((current) => !current);
            setErrorMessage('');
            setResetMessage('');
          }}
        >
          Esqueci minha senha
        </button>

        {showResetForm && (
          <div className="rounded-lg border border-stoneLine bg-stone-50 p-4">
            <p className="text-sm font-semibold text-graphite">
              Recuperação de senha
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Informe o e-mail acima e enviaremos um link para redefinir a
              senha.
            </p>
            <button
              className="secondary-button mt-4 w-full"
              type="button"
              disabled={resetSubmitting || !email}
              onClick={handlePasswordReset}
            >
              {resetSubmitting ? 'Enviando...' : 'Enviar link de redefinição'}
            </button>
            {resetMessage && (
              <p className="mt-3 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
                {resetMessage}
              </p>
            )}
          </div>
        )}
      </form>
    </section>
  );
}
