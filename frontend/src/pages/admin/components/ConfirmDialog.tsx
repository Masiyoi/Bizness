import React from 'react';
import { T } from '../constants';

interface ConfirmDialogProps {
  title:         string;
  message:       string;
  confirmLabel?: string;
  confirmDanger?: boolean;
  onConfirm:     () => void;
  onCancel:      () => void;
}

export function ConfirmDialog({
  title, message, confirmLabel = 'Confirm', confirmDanger = false,
  onConfirm, onCancel,
}: ConfirmDialogProps) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 600,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div style={{
        background: T.white,
        borderRadius: 16,
        padding: '32px 28px',
        width: '100%',
        maxWidth: 380,
        boxShadow: '0 24px 60px rgba(0,0,0,0.2)',
        animation: 'wizardIn 0.25s cubic-bezier(.34,1.56,.64,1)',
      }}>
        <div style={{ fontSize: 32, marginBottom: 14, textAlign: 'center' }}>
          {confirmDanger ? '🗑️' : '⚠️'}
        </div>
        <h3 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 700, fontSize: 20,
          color: T.black, textAlign: 'center', marginBottom: 10,
        }}>{title}</h3>
        <p style={{
          fontFamily: 'Jost, sans-serif', fontSize: 14,
          color: T.grey1, textAlign: 'center',
          lineHeight: 1.65, marginBottom: 24,
        }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, borderRadius: 8,
              border: `1px solid ${T.grey3}`,
              padding: '12px',
              fontFamily: 'Jost, sans-serif', fontWeight: 600, fontSize: 13,
              background: T.grey5, color: T.grey1, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, borderRadius: 8, border: 'none',
              padding: '12px',
              fontFamily: 'Jost, sans-serif', fontWeight: 700, fontSize: 13,
              cursor: 'pointer',
              background: confirmDanger ? '#DC2626' : T.black,
              color: T.white,
              boxShadow: confirmDanger ? '0 4px 12px rgba(220,38,38,0.3)' : '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}