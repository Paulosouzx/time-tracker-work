import { User } from '@supabase/supabase-js';

export function getUserDisplay(user: User | null) {
  const metadata = user?.user_metadata;
  const name: string = metadata?.full_name || metadata?.name || user?.email || 'Utilizador';
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?';
  const avatarUrl: string = metadata?.avatar_url || metadata?.picture || '';
  return { name, initials, avatarUrl, email: user?.email || '' };
}

export default function UserAvatar({ user, size = 36 }: { user: User | null; size?: number }) {
  const { name, initials, avatarUrl } = getUserDisplay(user);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };

  if (avatarUrl) {
    return <img src={avatarUrl} className="user-avatar" alt="" style={style} referrerPolicy="no-referrer" />;
  }
  return <span className="user-avatar user-avatar-initials" style={style} aria-hidden="true" title={name}>{initials}</span>;
}
