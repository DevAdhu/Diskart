import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from 'react-icons/fa';

const ToastContext = createContext(null);

const toastColors = {
  success: { border: '#388e3c', icon: '#388e3c' },
  error: { border: '#c62828', icon: '#c62828' },
  info: { border: '#2874f0', icon: '#2874f0' },
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (message, type = 'success') => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => dismissToast(id), 3500);
    },
    [dismissToast]
  );

  // The API interceptor announces expired sessions through this event.
  useEffect(() => {
    const handler = () =>
      showToast('Your session has expired. Please login again.', 'error');
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const ToastContainer = () => {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, dismissToast } = context;

  return (
    <div style={styles.container} aria-live="polite">
      {toasts.map((toast) => {
        const colors = toastColors[toast.type] || toastColors.info;
        const Icon =
          toast.type === 'success'
            ? FaCheckCircle
            : toast.type === 'error'
            ? FaExclamationCircle
            : FaInfoCircle;
        return (
          <div
            key={toast.id}
            style={{ ...styles.toast, borderLeftColor: colors.border }}
          >
            <Icon style={{ color: colors.icon, flexShrink: 0 }} />
            <span style={styles.message}>{toast.message}</span>
            <button
              type="button"
              aria-label="Dismiss notification"
              style={styles.close}
              onClick={() => dismissToast(toast.id)}
            >
              <FaTimes />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside a ToastProvider');
  return context;
};

const styles = {
  container: {
    position: 'fixed',
    top: 70,
    right: 16,
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    maxWidth: 'calc(100vw - 32px)',
    pointerEvents: 'none',
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    minWidth: 240,
    maxWidth: 360,
    background: 'white',
    borderLeft: '4px solid #2874f0',
    borderRadius: 4,
    boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
    padding: '12px 12px 12px 14px',
    fontSize: 14,
    color: '#212121',
    pointerEvents: 'auto',
  },
  message: { flex: 1, lineHeight: 1.4 },
  close: {
    background: 'none',
    border: 'none',
    color: '#878787',
    cursor: 'pointer',
    padding: 4,
    fontSize: 12,
  },
};
