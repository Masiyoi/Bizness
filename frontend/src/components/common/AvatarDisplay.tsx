// src/components/common/AvatarDisplay.tsx
import type { User } from '../../constants/theme';
import { getInitials } from '../../constants/theme';

interface AvatarDisplayProps {
  user: User | null;
  size?: number;
  style?: React.CSSProperties;
}

export default function AvatarDisplay({ user, size = 32, style }: AvatarDisplayProps) {
  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
    fontFamily: "'Jost', sans-serif", fontWeight: 600, letterSpacing: '1px',
    fontSize: Math.max(10, size * 0.34),
    color: '#fff',
    background: '#0A0A0A',
    ...style,
  };

  if (!user) return <div style={base}>?</div>;

  if (user.avatar_type === 'image' && user.profile_picture) {
    return (
      <div style={{ ...base, background: '#eee' }}>
        <img
          src={user.profile_picture}
          alt={user.full_name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  if (user.avatar_type === 'color' && user.avatar_color) {
    return <div style={{ ...base, background: user.avatar_color }}>{getInitials(user.full_name)}</div>;
  }

  return <div style={base}>{getInitials(user.full_name)}</div>;
}
