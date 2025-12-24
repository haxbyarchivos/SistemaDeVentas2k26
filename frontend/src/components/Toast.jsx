// /src/components/Toast.jsx
import React, { useEffect } from 'react';

export default function Toast({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const colors = {
    success: { bg: '#4dff4d', text: '#1a1a1a', icon: '✓' },
    error: { bg: '#ff4d4d', text: 'white', icon: '✕' },
    info: { bg: '#4da6ff', text: 'white', icon: 'ℹ' },
    warning: { bg: '#ffaa4d', text: '#1a1a1a', icon: '⚠' }
  };

  const style = colors[type] || colors.success;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: style.bg,
        color: style.text,
        padding: '16px 24px',
        borderRadius: '10px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '15px',
        fontWeight: 'bold',
        minWidth: '250px',
        animation: 'toastSlideIn 0.3s ease-out',
        cursor: 'pointer'
      }}
      onClick={onClose}
    >
      <span style={{ fontSize: '20px' }}>{style.icon}</span>
      <span>{message}</span>
      <style>
        {`
          @keyframes toastSlideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
}
