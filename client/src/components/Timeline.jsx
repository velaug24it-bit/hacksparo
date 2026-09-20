import React from 'react';
import { Clock, CheckCircle, Search, Truck, AlertCircle } from 'lucide-react';

export const Timeline = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '0.875rem' }}>No events recorded yet.</div>;
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'MATCHED':
      case 'DELIVERED':
        return <CheckCircle size={14} className="text-emerald-400" />;
      case 'SEARCHING':
      case 'IDENTIFIED':
        return <Search size={14} className="text-yellow-400" />;
      case 'ASSIGNED':
        return <Truck size={14} className="text-sky-400" />;
      default:
        return <Clock size={14} className="text-slate-400" />;
    }
  };

  return (
    <div className="timeline-list">
      {events.map((evt, idx) => {
        const isLatest = idx === events.length - 1;
        const isSuccess = evt.status === 'MATCHED' || evt.status === 'DELIVERED';

        return (
          <div key={idx} className="timeline-item">
            <div className={`timeline-dot ${isSuccess ? 'success' : isLatest ? 'active' : ''}`} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: '#facc15',
                backgroundColor: 'rgba(250, 204, 21, 0.1)',
                padding: '0.15rem 0.5rem',
                borderRadius: 4
              }}>
                {evt.time}
              </span>
              <span style={{ fontWeight: 600, fontSize: '0.925rem', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {getStatusIcon(evt.status)}
                {evt.title}
              </span>
            </div>

            {evt.description && (
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', paddingLeft: '0.25rem' }}>
                {evt.description}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
