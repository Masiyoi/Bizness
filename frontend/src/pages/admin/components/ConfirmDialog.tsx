import React from 'react';
import { T } from '../constants';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  confirmDanger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(13,27,62,0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, padding: '32px 28px',
        width: '100%', maxWidth: 380,
        boxShadow: '0 32px 80px rgba(13,27,62,0.25)',
        animation: 'wizardIn 0.28s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ fontSize: 36, marginBottom: 12, textAlign: 'center' }}>
          {confirmDanger ? '🗑️' : '⚠️'}
        </div>
        <h3 style={{
          fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 20,
          color: T.navy, textAlign: 'center', marginBottom: 10,
        }}>{title}</h3>
        <p style={{
          fontFamily: 'Jost,sans-serif', fontSize: 14, color: T.muted,
          textAlign: 'center', lineHeight: 1.65, marginBottom: 24,
        }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, borderRadius: 10, border: `1px solid ${T.cream3}`,
              padding: '12px', fontFamily: 'Jost,sans-serif', fontWeight: 600,
              fontSize: 13, background: T.cream, color: T.muted, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, borderRadius: 10, border: 'none',
              padding: '12px', fontFamily: 'Jost,sans-serif', fontWeight: 700,
              fontSize: 13, cursor: 'pointer',
              background: confirmDanger
                ? 'linear-gradient(135deg,#C0392B,#E74C3C)'
                : `linear-gradient(135deg,${T.gold},${T.gold2})`,
              color: confirmDanger ? '#fff' : T.navy,
              boxShadow: confirmDanger
                ? '0 4px 14px rgba(192,57,43,0.3)'
                : `0 4px 14px rgba(200,169,81,0.28)`,
            }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}