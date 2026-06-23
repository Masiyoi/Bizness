import React from 'react';
import { T } from '../constants';

interface ToastProps {
  message: string;
  type: 'ok' | 'err';
}

export function Toast({ message, type }: ToastProps) {
  if (!message) return null;
  return (
    <div
      className="slide-in"
      style={{
        position:     'fixed',
        top:          20,
        left:         '50%',
        transform:    'translateX(-50%)',
        background:   type === 'ok' ? T.black : '#DC2626',
        color:        T.white,
        fontFamily:   'Jost, sans-serif',
        fontWeight:   600,
        fontSize:     13,
        borderRadius: 9,
        padding:      '12px 24px',
        zIndex:       999,
        boxShadow:    '0 8px 24px rgba(0,0,0,0.25)',
        whiteSpace:   'nowrap',
        letterSpacing: '0.3px',
        display:      'flex',
        alignItems:   'center',
        gap:          8,
      }}
    >
      <span style={{ fontSize: 14 }}>{type === 'ok' ? '✓' : '⚠'}</span>
      {message}
    </div>
  );
}