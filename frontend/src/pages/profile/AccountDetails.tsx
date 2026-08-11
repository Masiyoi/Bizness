// src/pages/profile/AccountDetails.tsx
//
// Uses the same new GET/PATCH /api/users/me as Settings.tsx (see
// usersController.js). phone/address/city/country need new columns:
//   ALTER TABLE users ADD COLUMN phone TEXT, ADD COLUMN address TEXT,
//                      ADD COLUMN city TEXT, ADD COLUMN country TEXT;
import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import type { User } from '../../constants/theme';
import { performLogout } from './ProfileLayout';

interface OutletCtx { user: User; setUser: (u: User) => void; }

interface AccountForm {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
}

export default function AccountDetails() {
  const { user, setUser } = useOutletContext<OutletCtx>();
  const navigate = useNavigate();

  const [form, setForm] = useState<AccountForm>({
    full_name: user.full_name ?? '',
    email: user.email ?? '',
    phone: '',
    address: '',
    city: '',
    country: '',
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast]   = useState<string | null>(null);

  useEffect(() => {
    axios.get('/api/users/me')
      .then(r => setForm(f => ({ ...f, ...r.data })))
      .catch(() => {});
  }, [user.id]);

  const update = (key: keyof AccountForm) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await axios.patch('/api/users/me', form);
      const updated = { ...user, full_name: data.full_name ?? form.full_name };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setToast('Details saved');
    } catch {
      setToast('Could not save — try again');
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 2200);
    }
  };

  const handleLogout = async () => {
    await performLogout();
    navigate('/');
  };

  return (
    <div>
      <p className="pf-eyebrow">Your Info</p>
      <h1 className="pf-title">Account <em>Details</em></h1>
      <p className="pf-sub">Keep your contact information current so orders and offers reach you.</p>

      <div className="pf-card">
        <form onSubmit={save}>
          <div className="pf-field">
            <label className="pf-label">Full Name</label>
            <input className="pf-input" value={form.full_name} onChange={update('full_name')} required />
          </div>
          <div className="pf-field">
            <label className="pf-label">Email</label>
            <input className="pf-input" type="email" value={form.email} disabled title="Contact support to change your email" />
          </div>
          <div className="pf-field">
            <label className="pf-label">Phone</label>
            <input className="pf-input" type="tel" placeholder="07xx xxx xxx" value={form.phone} onChange={update('phone')} />
          </div>
          <div className="pf-field">
            <label className="pf-label">Delivery Address</label>
            <input className="pf-input" placeholder="Street, building, apt" value={form.address} onChange={update('address')} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="pf-field">
              <label className="pf-label">City</label>
              <input className="pf-input" value={form.city} onChange={update('city')} />
            </div>
            <div className="pf-field">
              <label className="pf-label">Country</label>
              <input className="pf-input" value={form.country} onChange={update('country')} />
            </div>
          </div>
          <button className="pf-btn-primary" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="pf-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="pf-row-label">Sign out of this device</p>
          <p className="pf-row-desc">You'll need to log in again to access your account.</p>
        </div>
        <button className="pf-btn-ghost" style={{ borderColor: 'var(--pf-danger)', color: 'var(--pf-danger)' }} onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      {toast && <div className="pf-toast">{toast}</div>}
    </div>
  );
}