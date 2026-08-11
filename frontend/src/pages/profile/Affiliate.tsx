// src/pages/profile/Affiliate.tsx
//
// Uses your real membersController endpoints:
//   GET /api/members/referral-link  -> { referral_code, referral_url }
//   GET /api/members/profile        -> { ..., activities: [{ description, points, created_at }] }
//
// There's no click-tracking anywhere in your backend, so that stat is
// dropped rather than faked. "Referrals rewarded" and "points earned from
// referrals" are derived client-side by filtering the activities feed for
// the exact description awardReferralBonus() logs: 'Referred a friend - bonus reward'.
// If you ever rename that string server-side, update REFERRAL_ACTIVITY_LABEL below.
import { useEffect, useState } from 'react';
import axios from 'axios';

const REFERRAL_ACTIVITY_LABEL = 'Referred a friend - bonus reward';

interface Activity { id: number; description: string; points: number; created_at: string; }
interface MemberProfile { club_joined: boolean; activities: Activity[]; }

export default function Affiliate() {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referralUrl, setReferralUrl]   = useState<string | null>(null);
  const [clubJoined, setClubJoined]     = useState<boolean | null>(null);
  const [referralActivities, setReferralActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    axios.get('/api/members/profile')
      .then(r => {
        const profile: MemberProfile = r.data;
        setClubJoined(profile.club_joined);
        setReferralActivities((profile.activities ?? []).filter(a => a.description === REFERRAL_ACTIVITY_LABEL));
      })
      .catch(() => setClubJoined(null));

    axios.get('/api/members/referral-link')
      .then(r => { setReferralCode(r.data.referral_code); setReferralUrl(r.data.referral_url); })
      .catch(() => { setReferralCode(null); setReferralUrl(null); })
      .finally(() => setLoading(false));
  }, []);

  const copyLink = () => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const totalEarned = referralActivities.reduce((sum, a) => sum + a.points, 0);

  return (
    <div>
      <p className="pf-eyebrow">Earn With Us</p>
      <h1 className="pf-title">Affiliate <em>Marketing</em></h1>
      <p className="pf-sub">Share your link. When someone signs up and completes their first order through it, you earn points.</p>

      {loading && <div className="pf-card">Loading…</div>}

      {!loading && !referralCode && (
        <div className="pf-card">
          <div className="pf-empty">
            <p className="pf-empty-title">Couldn't load your referral link</p>
            <p className="pf-empty-sub">Try refreshing the page in a moment.</p>
          </div>
        </div>
      )}

      {!loading && referralCode && (
        <>
          <div className="pf-card" style={{ marginBottom: 16 }}>
            <p className="pf-section-title">Your Referral Link</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="pf-input" style={{ flex: 1, minWidth: 220 }} readOnly value={referralUrl ?? ''} onFocus={e => e.target.select()} />
              <button className="pf-btn-primary" onClick={copyLink}>{copied ? 'Copied ✓' : 'Copy Link'}</button>
            </div>
            <p className="pf-row-desc" style={{ marginTop: 10 }}>Your code: <strong style={{ color: 'var(--pf-ink)' }}>{referralCode}</strong></p>
          </div>

          {clubJoined === false && (
            <div className="pf-card" style={{ marginBottom: 16 }}>
              <p className="pf-row-label" style={{ marginBottom: 4 }}>Join the Members Club to actually earn the referral bonus</p>
              <p className="pf-row-desc">Your link still works for anyone right now, but referral points only pay out once you've joined the club.</p>
            </div>
          )}

          <div className="pf-stats-grid">
            <div className="pf-stat">
              <div className="pf-stat-value">{referralActivities.length}</div>
              <div className="pf-stat-label">Referrals Rewarded</div>
            </div>
            <div className="pf-stat">
              <div className="pf-stat-value">{totalEarned}</div>
              <div className="pf-stat-label">Points Earned</div>
            </div>
          </div>

          <div className="pf-card">
            <p className="pf-section-title">How it works</p>
            <div className="pf-row">
              <div>
                <p className="pf-row-label">1. Share your link</p>
                <p className="pf-row-desc">Send it to friends, or post it anywhere.</p>
              </div>
            </div>
            <div className="pf-row">
              <div>
                <p className="pf-row-label">2. They sign up and order</p>
                <p className="pf-row-desc">Your code is applied automatically at registration.</p>
              </div>
            </div>
            <div className="pf-row">
              <div>
                <p className="pf-row-label">3. You earn on their first order</p>
                <p className="pf-row-desc">150 points post here the moment their first order is confirmed.</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}