import React from 'react';
import { Sprout, Users, PackageCheck } from 'lucide-react';

export const ImpactMetrics = ({ mealsRescued = 0, peopleSupported = 0, foodDiverted = 0 }) => {
  return (
    <div style={{
      marginTop: '1.5rem',
      padding: '1.25rem',
      borderRadius: 12,
      backgroundColor: 'rgba(16, 185, 129, 0.05)',
      border: '1px solid rgba(16, 185, 129, 0.25)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginBottom: '1rem',
        color: '#34d399',
        fontWeight: 700,
        fontSize: '0.875rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        <Sprout size={18} />
        <span>Verified Food Rescue Impact</span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '1rem'
      }}>
        <div style={{
          backgroundColor: '#0b111e',
          padding: '1rem',
          borderRadius: 8,
          border: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <Sprout size={16} className="text-emerald-400" />
            <span>🌱 FOOD RESCUED</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
            {mealsRescued} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>meals</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#0b111e',
          padding: '1rem',
          borderRadius: 8,
          border: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <Users size={16} className="text-sky-400" />
            <span>👥 PEOPLE SUPPORTED</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
            {peopleSupported} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>individuals</span>
          </div>
        </div>

        <div style={{
          backgroundColor: '#0b111e',
          padding: '1rem',
          borderRadius: 8,
          border: '1px solid #1e293b'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
            <PackageCheck size={16} className="text-amber-400" />
            <span>📦 FOOD DIVERTED FROM WASTE</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.25rem' }}>
            {foodDiverted || mealsRescued} <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 500 }}>meals</span>
          </div>
        </div>
      </div>
    </div>
  );
};
