import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { T } from '../../constants';
interface Member {
  id:           number;
  points:       number;
  tier:         'Bronze' | 'Gold' | 'Diamond';
  joined_at:    string;
  full_name:    string;
  email:        string;
  total_earned: number;
}
const TIER_THEME: Record<Member['tier'], { grad: string; color: string; border: string; perks: string[] }> = {
  Bronze: {
    grad:   'linear-gradient(135deg, #CD7F32 0%, #8C5A22 100%)',
    color:  '#CD7F32',
    border: 'rgba(205,127,50,0.35)',
    perks:  ['Early access to sales', 'Birthday bonus (50 pts)', 'Member-only newsletter'],
  },
  Gold: {
    grad:   'linear-gradient(135deg, #E8C64A 0%, #B8960C 100%)',
    color:  '#B8960C',
    border: 'rgba(184,150,12,0.35)',
    perks:  ['All Bronze perks', 'Free shipping over KSh 3,000', '10% discount code monthly', 'Priority support'],
  },
  Diamond: {
    grad:   'linear-gradient(135deg, #9BB0DE 0%, #6A7FA8 100%)',
    color:  '#6A7FA8',
    border: 'rgba(106,127,168,0.35)',
    perks:  ['All Gold perks', 'Free shipping every order', 'Exclusive early drops', '10% off after 10 orders', 'Personal stylist access', 'VIP event invites'],
  },
};
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' });
export function AdminMembers() {
  const [members, setMembers]   = useState<Member[] | null>(null);
  const [totalRewarded, setTotalRewarded] = useState<number | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [tierFilter, setTierFilter] = useState<'' | Member['tier']>('');
  const [search, setSearch]     = useState('');
  useEffect(() => {
    setLoading(true);
    setError(false);
    Promise.all([
      axios.get('/api/members/admin/all'),
      axios.get('/api/members/admin/total-points-rewarded'),
    ])
      .then(([membersRes, rewardedRes]) => {
        setMembers(membersRes.data);
        setTotalRewarded(rewardedRes.data.total_points_rewarded);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);
  const filtered = useMemo(() => {
    if (!members) return [];
    let list = members;
    if (tierFilter) list = list.filter(m => m.tier === tierFilter);
    const q = search.toLowerCase();
    if (q) list = list.filter(m => m.full_name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q));
    return list;
  }, [members, tierFilter, search]);
  const tierCounts = useMemo(() => {
    const c: Record<string, number> = { Bronze: 0, Gold: 0, Diamond: 0 };
    members?.forEach(m => { c[m.tier] = (c[m.tier] || 0) + 1; });
    return c;
  }, [members]);
  return (
    <div className="fade-up">
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, letterSpacing: '2.5px', textTransform: 'uppercase', marginBottom: 6 }}>Loyalty Program</div>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 32, color: T.black, lineHeight: 1 }}>Members</h1>
      </div>
      {/* Stat cards */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 24 }}>
        <div className="pf-card" style={{ flex: '1 1 200px', padding: '18px 20px' }}>
          <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.grey1, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
            Total Subscribers
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 28, color: T.black }}>
            {loading ? '—' : (members?.length ?? 0)}
          </p>
        </div>
        <div className="pf-card" style={{ flex: '1 1 200px', padding: '18px 20px' }}>
          <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: T.grey1, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
            Total Points Rewarded
          </p>
          <p style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 28, color: T.black }}>
            {loading ? '—' : (totalRewarded ?? 0).toLocaleString()}
          </p>
        </div>
        {(['Bronze', 'Gold', 'Diamond'] as const).map(t => (
          <div key={t} className="pf-card" style={{ flex: '1 1 140px', padding: '18px 20px', borderLeft: `3px solid ${TIER_THEME[t].color}` }}>
            <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700, color: TIER_THEME[t].color, textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: 8 }}>
              {t}
            </p>
            <p style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 28, color: T.black }}>
              {loading ? '—' : tierCounts[t]}
            </p>
          </div>
        ))}
      </div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
        <select
          value={tierFilter}
          onChange={e => setTierFilter(e.target.value as '' | Member['tier'])}
          style={{ padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif', fontSize: 12, background: T.white }}
        >
          <option value="">All tiers</option>
          <option value="Bronze">Bronze</option>
          <option value="Gold">Gold</option>
          <option value="Diamond">Diamond</option>
        </select>
        <input
          type="text"
          placeholder="Search name or email"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ flex: '1 1 220px', padding: '8px 12px', borderRadius: 7, border: `1px solid ${T.grey3}`, fontFamily: 'Jost,sans-serif', fontSize: 12 }}
        />
      </div>
      {loading && <div className="pf-card" style={{ padding: 20 }}>Loading…</div>}
      {!loading && error && (
        <div className="pf-card" style={{ padding: 20 }}>
          <div className="pf-empty">
            <p className="pf-empty-title">Couldn't load members</p>
            <p className="pf-empty-sub">Try refreshing the page.</p>
          </div>
        </div>
      )}
      {!loading && !error && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: T.grey1, fontFamily: 'Jost,sans-serif' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>👑</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: T.black, marginBottom: 6 }}>No members found</div>
          <div style={{ fontSize: 13 }}>Try a different tier filter or clear the search.</div>
        </div>
      )}
      {!loading && !error && filtered.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(m => {
            const theme = TIER_THEME[m.tier];
            return (
              <div key={m.id} className="pf-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ background: theme.grad, padding: '16px 18px', color: T.white }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 15, fontWeight: 700, marginBottom: 2 }}>{m.full_name}</p>
                      <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, opacity: 0.9 }}>{m.email}</p>
                    </div>
                    <span style={{
                      fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700,
                      letterSpacing: '1.5px', textTransform: 'uppercase',
                      background: 'rgba(255,255,255,0.25)', padding: '4px 10px', borderRadius: 20,
                    }}>{m.tier}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 16 }}>
                    <div>
                      <p style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 30, lineHeight: 1 }}>
                        {m.points.toLocaleString()}
                      </p>
                      <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, opacity: 0.85, marginTop: 2 }}>current points</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, fontWeight: 700 }}>{m.total_earned.toLocaleString()}</p>
                      <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, opacity: 0.85 }}>lifetime earned</p>
                    </div>
                  </div>
                </div>
                <div style={{ padding: '14px 18px' }}>
                  <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 10, fontWeight: 700, color: T.grey1, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 8 }}>
                    Tier perks
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12 }}>
                    {theme.perks.map((perk, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <span style={{ color: theme.color, fontSize: 11, flexShrink: 0, marginTop: 1 }}>✦</span>
                        <span style={{ fontFamily: 'Jost,sans-serif', fontSize: 12, color: T.black }}>{perk}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontFamily: 'Jost,sans-serif', fontSize: 11, color: T.grey1, borderTop: `1px solid ${T.grey3}`, paddingTop: 10 }}>
                    Member since {fmtDate(m.joined_at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}