// src/components/common/AvatarPicker.tsx
import { useRef, useState } from 'react';
import axios from 'axios';
import type { User } from '../../constants/theme';
import { AVATAR_COLORS } from '../../constants/theme';
import AvatarDisplay from './AvatarDisplay';

interface AvatarPickerProps {
  user: User;
  size?: number;
  onUpdate: (user: User) => void;
}

// Persists the change, updates localStorage (so Navbar / other tabs pick it
// up), and fires a same-tab custom event since the native 'storage' event
// only fires in OTHER tabs.
function persistUser(updated: User, onUpdate: (u: User) => void) {
  const stored = localStorage.getItem('user');
  const merged = stored ? { ...JSON.parse(stored), ...updated } : updated;
  localStorage.setItem('user', JSON.stringify(merged));
  window.dispatchEvent(new Event('user-updated'));
  onUpdate(merged);
}

export default function AvatarPicker({ user, size = 64, onUpdate }: AvatarPickerProps) {
  const [open, setOpen]   = useState(false);
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    if (file.size > 5 * 1024 * 1024)      { setError('Image must be under 5MB.');     return; }

    setBusy(true); setError('');
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const { data } = await axios.put('/api/users/avatar/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      persistUser(data.user, onUpdate);
      setOpen(false);
    } catch {
      setError('Upload failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleColorPick = async (color: string) => {
    setBusy(true); setError('');
    try {
      const { data } = await axios.put('/api/users/avatar/color', { color });
      persistUser(data.user, onUpdate);
      setOpen(false);
    } catch {
      setError('Could not save color. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async () => {
    setBusy(true); setError('');
    try {
      const { data } = await axios.delete('/api/users/avatar');
      persistUser(data.user, onUpdate);
      setOpen(false);
    } catch {
      setError('Could not reset avatar.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Change profile picture"
        style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', position: 'relative', borderRadius: '50%' }}
      >
        <AvatarDisplay user={user} size={size} />
        <div style={{
          position: 'absolute', bottom: -2, right: -2,
          width: Math.max(18, size * 0.3), height: Math.max(18, size * 0.3),
          borderRadius: '50%', background: '#0A0A0A', border: '2px solid #fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
          </svg>
        </div>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 10px)', left: 0, zIndex: 200,
            background: '#fff', border: '1px solid rgba(0,0,0,0.09)', borderRadius: 12,
            padding: 14, minWidth: 220, boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
          }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase', color: '#111', marginBottom: 10 }}>
              Profile Picture
            </p>

            <button
              disabled={busy}
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', textAlign: 'left', fontFamily: "'Jost', sans-serif", fontSize: 12, fontWeight: 500, color: '#111', background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: 8, padding: '10px 12px', cursor: busy ? 'not-allowed' : 'pointer', marginBottom: 12 }}
            >
              Upload from device…
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChosen} style={{ display: 'none' }} />

            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 9.5, fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)', marginBottom: 8 }}>
              Or pick a color
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
              {AVATAR_COLORS.map(c => (
                <button
                  key={c}
                  disabled={busy}
                  onClick={() => handleColorPick(c)}
                  title={c}
                  style={{
                    width: 32, height: 32, borderRadius: '50%', background: c, cursor: busy ? 'not-allowed' : 'pointer',
                    border: user.avatar_type === 'color' && user.avatar_color === c ? '2px solid #111' : '2px solid transparent',
                    outline: '1px solid rgba(0,0,0,0.08)', outlineOffset: 1,
                  }}
                />
              ))}
            </div>

            {user.avatar_type !== 'initials' && (
              <button
                disabled={busy}
                onClick={handleReset}
                style={{ width: '100%', textAlign: 'left', fontFamily: "'Jost', sans-serif", fontSize: 11.5, fontWeight: 500, color: '#dc2626', background: 'none', border: 'none', padding: '4px 2px', cursor: busy ? 'not-allowed' : 'pointer' }}
              >
                Remove & use initials
              </button>
            )}

            {error && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: 10.5, color: '#dc2626', marginTop: 8 }}>{error}</p>}
          </div>
        </>
      )}
    </div>
  );
}
