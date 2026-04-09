import { useState } from 'react';

interface OrderItem {
  id: number;
  product_id: number;
  name: string;
  price: number | string;
  image_url: string;
  category?: string;
  quantity: number;
}

const T = {
  navy: '#0D1B3E', navyMid: '#152348', navyLight: '#1E2F5A',
  gold: '#C8A951', goldLight: '#DEC06A', goldPale: '#F0D98A',
  cream: '#F9F5EC', creamMid: '#F0EAD8', creamDeep: '#E4D9C0',
  white: '#FFFFFF', text: '#0D1B3E', muted: '#7A7A8A',
};

interface ReviewModalProps {
  item: OrderItem;
  onClose: () => void;
  onSubmit: (productId: number, rating: number, comment: string) => Promise<void>;
}

export default function ReviewModal({ item, onClose, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hover, setHover] = useState(0);

  const handleSubmit = async () => {
    if (!rating) {
      setError('Please choose a star rating.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSubmit(item.product_id, rating, comment.trim());
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not submit review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,27,62,0.72)',
        zIndex: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: T.white,
          borderRadius: 20,
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 32px 80px rgba(13,27,62,0.3)',
          overflow: 'hidden',
          animation: 'modalIn 0.22s ease'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: T.navy,
            padding: '18px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}
        >
          <img
            src={item.image_url}
            alt={item.name}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://placehold.co/52x52/152348/C8A951?text=LP`;
            }}
            style={{
              width: 52,
              height: 52,
              objectFit: 'cover',
              borderRadius: 8,
              border: `2px solid rgba(200,169,81,0.3)`,
              flexShrink: 0
            }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: 14,
                color: T.white,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {item.name}
            </div>
            {item.category && (
              <div
                className="jost"
                style={{
                  fontSize: 10,
                  color: `rgba(200,169,81,0.7)`,
                  letterSpacing: '1.5px',
                  textTransform: 'uppercase',
                  marginTop: 3
                }}
              >
                {item.category}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: 'none',
              color: 'rgba(255,255,255,0.6)',
              width: 28,
              height: 28,
              borderRadius: 7,
              cursor: 'pointer',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 22 }}>
          <div style={{ marginBottom: 18 }}>
            <div
              className="jost"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: T.muted,
                marginBottom: 10
              }}
            >
              Your Rating
            </div>
            <div style={{ display: 'flex', gap: 4 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <span
                  key={s}
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHover(s)}
                  onMouseLeave={() => setHover(0)}
                  style={{
                    fontSize: 30,
                    cursor: 'pointer',
                    color: s <= (hover || rating) ? T.gold : T.creamDeep,
                    transition: 'all 0.15s',
                    transform: s <= (hover || rating) ? 'scale(1.2)' : 'scale(1)',
                    display: 'inline-block',
                    userSelect: 'none'
                  }}
                >
                  ★
                </span>
              ))}
            </div>
            <div
              className="jost"
              style={{
                fontSize: 11,
                color: T.gold,
                marginTop: 6,
                fontWeight: 600,
                minHeight: 18
              }}
            >
              {['', 'Terrible', 'Poor', 'Average', 'Good', 'Excellent!'][rating] || ''}
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div
              className="jost"
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: T.muted,
                marginBottom: 8
              }}
            >
              Comment <span style={{ fontWeight: 400 }}>(optional)</span>
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="How was the fit, quality, style?"
              style={{
                width: '100%',
                border: `1.5px solid ${T.creamDeep}`,
                borderRadius: 10,
                padding: '10px 13px',
                fontFamily: "'Jost',sans-serif",
                fontSize: 13,
                color: T.navy,
                resize: 'vertical',
                outline: 'none',
                background: T.cream,
                lineHeight: 1.6,
                transition: 'border-color 0.2s',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = T.gold)}
              onBlur={(e) => (e.currentTarget.style.borderColor = T.creamDeep)}
            />
            <div
              className="jost"
              style={{
                fontSize: 10,
                color: T.muted,
                textAlign: 'right',
                marginTop: 3
              }}
            >
              {comment.length}/1000
            </div>
          </div>

          {error && (
            <div
              className="jost"
              style={{
                fontSize: 12,
                color: '#C0392B',
                background: '#FDF0EE',
                border: '1px solid #F5C6C0',
                borderRadius: 8,
                padding: '8px 12px',
                marginBottom: 14
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              className="jost"
              style={{
                flex: 1,
                background: T.creamMid,
                color: T.navy,
                border: 'none',
                borderRadius: 10,
                padding: '11px 0',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="jost"
              style={{
                flex: 2,
                background: saving ? T.creamDeep : T.gold,
                color: saving ? T.muted : T.navy,
                border: 'none',
                borderRadius: 10,
                padding: '11px 0',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s'
              }}
            >
              {saving ? 'Submitting…' : '★ Submit Review'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}