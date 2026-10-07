import { TabId } from './types';

export const ROUTES: Record<TabId, string> = {
  reg: '/',
  cal: '/calendario',
  dash: '/dashboard',
  hist: '/historico',
  notes: '/notas',
  profile: '/perfil',
};

export function tabFromPath(pathname: string): TabId {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const match = (Object.keys(ROUTES) as TabId[]).find((tab) => ROUTES[tab] === clean);
  return match ?? 'reg';
}

export function pushRoute(tab: TabId) {
  const path = ROUTES[tab];
  if (window.location.pathname !== path) {
    window.history.pushState({ tab }, '', path);
  }
}
