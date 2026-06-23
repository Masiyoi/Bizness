import React from 'react';
import { T } from '../../constants';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number | null;
  accent?: boolean;
  onClick?: () => void;
}

export function StatCard({ label, value, sub, trend, accent, onClick }: StatCardProps) {
  const hasTrend = trend !== null && trend !== undefined;
  const up = hasTrend && (trend as number) >= 0;

  return (
    <div
      onClick={onClick}
      style={{
        padding: '18px 20px',
        borderRadius: 12,
        border: `1px solid ${T.grey3}`,
        background: accent ? T.black : T.white,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.12s',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 8,
      }}>
        <span style={{
          fontFamily: 'Jost,sans-serif', fontSize: 9, fontWeight: 700,
          letterSpacing: '1.5px', textTransform: 'uppercase',
          color: accent ? 'rgba(255,255,255,0.45)' : T.grey1,
        }}>{label}</span>

        {hasTrend && (
          <span style={{
            fontFamily: 'Jost,sans-serif', fontSize: 11, fontWeight: 700,
            color: up ? '#4ADE80' : '#F87171',
            display: 'flex', alignItems: 'center', gap: 2,
          }}>
            {up ? '▲' : '▼'} {Math.abs(trend as number).toFixed(1)}%
          </span>
        )}
      </div>

      <div style={{
        fontFamily: "'Cormorant Garamond',serif", fontWeight: 700, fontSize: 24,
        color: accent ? T.white : T.black, lineHeight: 1.1,
      }}>{value}</div>

      {sub && (
        <div style={{
          fontFamily: 'Jost,sans-serif', fontSize: 11, marginTop: 4,
          color: accent ? 'rgba(255,255,255,0.5)' : T.grey1,
        }}>{sub}</div>
      )}
    </div>
  );
}