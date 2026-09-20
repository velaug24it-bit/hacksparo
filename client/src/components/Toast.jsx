import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, X } from 'lucide-react';

export const Toast = ({ toasts = [], onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" role="region" aria-label="Notifications">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';
        const isWarning = toast.type === 'warning';

        return (
          <div
            key={toast.id}
            className={`toast ${
              isSuccess ? 'toast-success' : isError ? 'toast-error' : 'toast-warning'
            }`}
            role="alert"
          >
            {isSuccess && <CheckCircle2 size={20} className="shrink-0 text-emerald-400" />}
            {isError && <AlertCircle size={20} className="shrink-0 text-red-400" />}
            {isWarning && <AlertTriangle size={20} className="shrink-0 text-yellow-400" />}

            <div style={{ flex: 1 }}>
              {toast.title && <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{toast.title}</div>}
              <div style={{ fontSize: '0.85rem', opacity: 0.95 }}>{toast.message}</div>
            </div>

            {onDismiss && (
              <button
                onClick={() => onDismiss(toast.id)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'inherit',
                  cursor: 'pointer',
                  opacity: 0.7,
                  padding: 2
                }}
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
