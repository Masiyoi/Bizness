// src/pages/profile/Settings.tsx
//
// Birthday month uses a new GET/PATCH /api/users/me (see usersController.js
// below — you don't have a users controller yet, so this needs the new file
// plus a `birthday_month` column: ALTER TABLE users ADD COLUMN birthday_month TEXT;).
//
// Password change posts to a new POST /api/auth/change-password, also in the
// usersController.js addition below. Your existing password-reset flow
// (forgotPassword/resetPassword) is email-link based and doesn't fit an
// in-session "change my password" form, so this is a separate, smaller
// endpoint that bcrypt-verifies the current password first — same pattern
// authController.loginUser already uses.
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import type { User } from '../../constants/theme';
import { useProfileTheme } from './ProfileThemeContext';

interface OutletCtx { user: User; }

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function Toast({ message }: { message: string }) {
  return <div className="pf-toast">{message}</div>;
}

export default function Settings() {
  const { user } = useOutletContext<OutletCtx>();
  const { theme, toggle } = useProfileTheme();

  const [birthdayMonth, setBirthdayMonth] = useState<string>('');
  const [savingMonth, setSavingMonth]     = useState(false);
  const [toast, setToast]                 = useState<string | null>(null);

  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw]         = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwError, setPwError]     = useState<string | null>(null);
  const [pwSaving, setPwSaving]   = useState(false);

  useEffect(() => {
    axios.get('/api/users/me')
      .then(r => setBirthdayMonth(r.data.birthday_month ?? ''))
      .catch(() => {});
  }, [user.id]);

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 2200); };

  const saveBirthdayMonth = (month: string) => {
    setBirthdayMonth(month);
    setSavingMonth(true);
    axios.patch('/api/users/me', { birthday_month: month })
      .then(() => flash('Birthday month saved'))
      .catch(() => flash('Could not save — try again'))
      .finally(() => setSavingMonth(false));
  };

  const submitPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);

    if (newPw.length < 8) return setPwError('New password must be at least 8 characters.');
    if (!/[A-Z]/.test(newPw)) return setPwError('New password must contain at least one uppercase letter.');
    if (!/[0-9]/.test(newPw)) return setPwError('New password must contain at least one number.');
    if (newPw !== confirmPw) return setPwError('New passwords don\u2019t match.');

    setPwSaving(true);
    try {
      await axios.post('/api/auth/change-password', {
        current_password: currentPw,
        new_password: newPw,
      });
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
      flash('Password updated');
    } catch (err: any) {
      setPwError(err.response?.data?.msg ?? 'Could not update password — check your current password.');
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <div>
      <p className="pf-eyebrow">Preferences</p>
      <h1 className="pf-title">Account <em>Settings</em></h1>
      <p className="pf-sub">Personalize your account and keep it secure.</p>

      {/* ── Birthday month ── */}
      <div className="pf-card">
        <p className="pf-section-title">Birthday Month</p>
        <p className="pf-row-desc" style={{ marginBottom: 14 }}>We'll send you a little something during your birthday month. No need for the exact date.</p>
        <select
          className="pf-select"
          value={birthdayMonth}
          disabled={savingMonth}
          onChange={e => saveBirthdayMonth(e.target.value)}
          style={{ maxWidth: 240 }}
        >
          <option value="">Not set</option>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* ── Theme ── */}
      <div className="pf-card">
        <div className="pf-row">
          <div>
            <p className="pf-row-label">Dark Mode</p>
            <p className="pf-row-desc">Switch between light and dark for your account pages.</p>
          </div>
          <button className={`pf-toggle ${theme === 'dark' ? 'on' : ''}`} onClick={toggle} aria-label="Toggle dark mode">
            <span className="pf-toggle-knob" />
          </button>
        </div>
      </div>

      {/* ── Change password ── */}
      <div className="pf-card">
        <p className="pf-section-title">Change Password</p>
        <form onSubmit={submitPasswordChange}>
          <div className="pf-field">
            <label className="pf-label">Current Password</label>
            <input className="pf-input" type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} required />
          </div>
          <div className="pf-field">
            <label className="pf-label">New Password</label>
            <input className="pf-input" type="password" value={newPw} onChange={e => setNewPw(e.target.value)} required minLength={8} />
          </div>
          <div className="pf-field">
            <label className="pf-label">Confirm New Password</label>
            <input className="pf-input" type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} required minLength={8} />
          </div>
          {pwError && <p style={{ color: 'var(--pf-danger)', fontFamily: "'Jost', sans-serif", fontSize: 12, marginBottom: 14 }}>{pwError}</p>}
          <button className="pf-btn-primary" type="submit" disabled={pwSaving}>
            {pwSaving ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>

      {toast && <Toast message={toast} />}
    </div>
  );
}