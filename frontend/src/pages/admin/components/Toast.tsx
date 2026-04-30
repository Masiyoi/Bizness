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
        position:    'fixed',
        top:         20,
        left:        '50%',
        transform:   'translateX(-50%)',
        background:  type === 'ok' ? T.navy : '#C0392B',
        color:       '#fff',
        fontFamily:  'Jost,sans-serif',
        fontWeight:  600,
        fontSize:    13,
        borderRadius: 12,
        padding:     '13px 28px',
        zIndex:      999,
        boxShadow:   '0 8px 28px rgba(13,27,62,0.3)',
        whiteSpace:  'nowrap',
        letterSpacing: '0.3px',
        display:     'flex',
        alignItems:  'center',
        gap:         8,
      }}
    >
      <span>{type === 'ok' ? '✓' : '⚠'}</span>
      {message}
    </div>
  );
}