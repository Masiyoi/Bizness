import React from 'react';
import { T } from '../constants';

type Tab = 'overview' | 'products' | 'orders' | 'customers';

interface AdminMobileNavProps {
  tab: Tab;
  setTab: (t: Tab) => void;
}

const ITEMS: { id: Tab; icon: string; label: string; badge?: string | null }[] = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'products', icon: '📦', label: 'Products' },
  { id: 'orders',   icon: '🧾', label: 'Orders'   },
  { id: 'customers', icon: '👥', label: 'Customers', badge: null }
];

export function AdminMobileNav({ tab, setTab }: AdminMobileNavProps) {
  return (
    <nav className="mob-nav">
      {ITEMS.map(t => (
        <button
          key={t.id}
          className={`mob-nav-btn ${tab === t.id ? 'on' : 'off'}`}
          onClick={() => setTab(t.id)}
        >
          <span className="nav-icon">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}