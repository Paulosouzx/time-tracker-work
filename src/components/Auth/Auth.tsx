import { useEffect, useState } from 'react';
import { supabase } from '../../supabase/supabaseClient';
import './Auth.css';

function translateAuthError(message: string): string {
  const translations: Record<string, string> = {
    'Invalid login credentials': 'Email ou palavra-passe incorretos.',
    'Email not confirmed': 'Verifica o teu email antes de entrar.',
    'User already registered': 'Este email já está registado.',
    'Password should be at least 6 characters': 'A palavra-passe deve ter pelo menos 6 caracteres.',
  };
  return translations[message] || message;
}

type Mode = 'login' | 'signup';

type Status = { type: 'success' | 'error'; message: string } | null;

export default function Auth() {
  const [previousGoogleLogin, setPreviousGoogleLogin] = useState(false);
  const [lastGoogleLabel, setLastGoogleLabel] = useState('Google');
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  useEffect(() => {
    const provider = localStorage.getItem('tt_last_auth_provider');
    const savedEmail = localStorage.getItem('tt_last_auth_email');
    if (provider === 'google') {
      setPreviousGoogleLogin(true);
      if (savedEmail) setLastGoogleLabel(savedEmail);
    }
  }, []);

  const isSignup = mode === 'signup';

  async function loginWithGoogle() {
    setLoading(true);
    localStorage.setItem('tt_last_auth_provider', 'google');
    const savedEmail = localStorage.getItem('tt_last_auth_email');
    if (savedEmail) setLastGoogleLabel(savedEmail);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setStatus({ type: 'error', message: error.message });
    setLoading(false);
  }

  async function submitEmail() {
    if (!email.trim() || !password.trim()) {
      setStatus({ type: 'error', message: 'Preenche email e palavra-passe.' });
      return;
    }

    setLoading(true);
    setStatus(null);

    if (isSignup) {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setStatus({ type: 'error', message: translateAuthError(error.message) });
      } else {
        setStatus({ type: 'success', message: '✓ Verifica o teu email para confirmar a conta.' });
        localStorage.setItem('tt_last_auth_provider', 'password');
        localStorage.setItem('tt_last_auth_email', email.trim());
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setStatus({ type: 'error', message: translateAuthError(error.message) });
      else {
        localStorage.setItem('tt_last_auth_provider', 'password');
        localStorage.setItem('tt_last_auth_email', email.trim());
      }
    }

    setLoading(false);
  }

  return (
    <div id="loginScreen">
      <div className="login-card">
        <div className="login-logo">
          <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 28, height: 28 }}>
            <circle cx="10" cy="10" r="7.5" stroke="white" strokeWidth="1.6" />
            <line x1="10" y1="10" x2="10" y2="4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="10" y1="10" x2="13.8" y2="12.2" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            <circle cx="10" cy="10" r="1" fill="white" />
          </svg>
        </div>

        <h1 className="login-title">Time Tracker</h1>
        <p className="login-subtitle">
          {isSignup ? 'Cria a tua conta gratuita' : 'Entra para aceder aos teus registos'}
        </p>

        <button className="login-btn-google" onClick={loginWithGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          {previousGoogleLogin ? `Continuar com ${lastGoogleLabel}` : 'Continuar com Google'}
        </button>
        {previousGoogleLogin ? (
          <div className="login-google-only-note">
            Já usaste esta conta Google antes. Usa o botão acima para continuar.
            <button
              className="login-switch-button"
              type="button"
              onClick={() => {
                localStorage.removeItem('tt_last_auth_provider');
                localStorage.removeItem('tt_last_auth_email');
                setPreviousGoogleLogin(false);
                setLastGoogleLabel('Google');
              }}
            >
              Usar outra conta
            </button>
          </div>
        ) : (
          <>
            <div className="login-divider">
              <div className="login-divider-line" />
              <span className="login-divider-text">ou</span>
              <div className="login-divider-line" />
            </div>

            <div className="login-field-group">
              <label className="login-field-label" htmlFor="loginEmail">Email</label>
              <input
                id="loginEmail"
                type="email"
                placeholder="teu@email.com"
                className="login-input"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && document.getElementById('loginPassword')?.focus()}
                disabled={loading}
              />
            </div>

            <div className="login-field-group">
              <label className="login-field-label" htmlFor="loginPassword">Palavra-passe</label>
              <input
                id="loginPassword"
                type="password"
                placeholder="A tua palavra-passe"
                className="login-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submitEmail()}
                disabled={loading}
              />
            </div>

            <button className="login-btn-primary" onClick={submitEmail} disabled={loading}>
              {isSignup ? 'Criar conta' : 'Entrar'}
            </button>

            <div className="login-switch-text">
              <span>{isSignup ? 'Já tens conta?' : 'Não tens conta?'}</span>
              <button className="login-switch-button" type="button" onClick={() => { setMode(isSignup ? 'login' : 'signup'); setStatus(null); }}>
                {isSignup ? 'Iniciar sessão' : 'Criar conta'}
              </button>
            </div>
          </>
        )}

        {status && (
          <div className={`login-status ${status.type}`}>{status.message}</div>
        )}

        {loading && (
          <div className="login-spinner-wrapper">
            <i className="ti ti-loader-2 login-spinner" />
          </div>
        )}
      </div>
    </div>
  );
}
