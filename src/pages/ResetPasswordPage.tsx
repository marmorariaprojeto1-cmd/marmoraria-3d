import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (password.length < 8) {
      setErrorMessage('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas não conferem.');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setSuccessMessage('Senha atualizada com sucesso.');
      window.setTimeout(() => navigate('/login', { replace: true }), 1200);
    } catch {
      setErrorMessage(
        'Não foi possível atualizar a senha. Abra novamente o link enviado por e-mail.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-xl">
      <form className="surface-card space-y-5 p-6" onSubmit={handleSubmit}>
        <div>
          <p className="page-kicker">Senha</p>
          <h1 className="text-3xl font-bold text-graphite">Redefinir senha</h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Informe sua nova senha para acessar o painel administrativo.
          </p>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">Nova senha</span>
          <input
            className="field-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-stone-700">
            Confirmar nova senha
          </span>
          <input
            className="field-input"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
          />
        </label>

        {errorMessage && <p className="message-error">{errorMessage}</p>}

        {successMessage && (
          <p className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">
            {successMessage}
          </p>
        )}

        <button className="primary-button w-full" type="submit" disabled={submitting}>
          {submitting ? 'Salvando...' : 'Salvar nova senha'}
        </button>

        <Link
          className="block text-center text-sm font-semibold text-moss underline-offset-4 hover:underline"
          to="/login"
        >
          Voltar para o login
        </Link>
      </form>
    </section>
  );
}
