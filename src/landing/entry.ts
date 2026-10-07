import { ROUTES } from '../router';

export function hasStoredSession() {
  try {
    return Object.keys(localStorage).some((key) => /^sb-.+-auth-token$/.test(key) && !!localStorage.getItem(key));
  } catch {
    return false;
  }
}

export function isAuthRedirect() {
  return /(access_token|refresh_token|error_description)=/.test(window.location.hash) || /[?&]code=/.test(window.location.search);
}

export function shouldShowLanding() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return path === '/' && !hasStoredSession() && !isAuthRedirect();
}

export async function signInWithGoogle() {
  const { supabase } = await import('../supabase/supabaseClient');
  localStorage.setItem('tt_last_auth_provider', 'google');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

const KNOWN_PATHS = new Set<string>([...Object.values(ROUTES), '/login']);

export function isKnownRoute() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  return KNOWN_PATHS.has(path);
}
