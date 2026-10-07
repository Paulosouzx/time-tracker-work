import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';

function googlePhoto(user: User | null): string {
  const metadata = user?.user_metadata;
  const identity = user?.identities?.find((item) => item.provider === 'google')?.identity_data;
  const url: string = metadata?.avatar_url || metadata?.picture || identity?.avatar_url || identity?.picture || '';
  return url.includes('googleusercontent.com') ? url.replace(/=s\d+-c$/, '=s256-c') : url;
}

export function getUserDisplay(user: User | null) {
  const metadata = user?.user_metadata;
  const name: string = metadata?.full_name || metadata?.name || user?.email || 'Utilizador';
  const initials = name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase() || '?';
  return { name, initials, avatarUrl: googlePhoto(user), email: user?.email || '' };
}

export default function UserAvatar({ user, size = 36 }: { user: User | null; size?: number }) {
  const { name, initials, avatarUrl } = getUserDisplay(user);
  const [failed, setFailed] = useState(false);
  const style = { width: size, height: size, fontSize: Math.round(size * 0.38) };

  useEffect(() => setFailed(false), [avatarUrl]);

  if (avatarUrl && !failed) {
    return (
      <img
        src={avatarUrl}
        className="user-avatar"
        alt=""
        style={style}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return <span className="user-avatar user-avatar-initials" style={style} aria-hidden="true" title={name}>{initials}</span>;
}
