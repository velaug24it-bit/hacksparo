import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Plus, Filter, Users, MapPin, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Toast } from '../components/Toast';

export const RequestDashboard = () => {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [toasts, setToasts] = useState([]);

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (urgencyFilter) params.urgency = urgencyFilter;
      if (resourceFilter) params.resourceType = resourceFilter;

      const res = await api.getResourceRequests(params);
      setRequests(res.data || []);
    } catch (err) {
      console.error('[RequestDashboard] Fetch error:', err);
      addToast('error', 'Fetch Failed', err.message || 'Unable to load resource requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, urgencyFilter, resourceFilter]);

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-green">
              <span className="status-dot status-dot-green" />
              🟢 RESOURCE REGISTRY
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>• Sector Dispatch Records</span>
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            My Resource Requests
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
            Track active logistics dispatch, FoodBridge donor allocations, and fulfillment statuses.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-outline"
            onClick={fetchRequests}
            title="Refresh list"
            style={{ padding: '0.6rem 0.875rem' }}
          >
            <RefreshCw size={16} />
          </button>

          <button
            className="btn btn-green"
            onClick={() => navigate('/resource-assistance')}
          >
            <Plus size={18} />
            <span>New Resource Request</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94a3b8', fontSize: '0.875rem', fontWeight: 600 }}>
          <Filter size={16} className="text-yellow-400" />
          <span>Filters:</span>
        </div>

        {/* Status Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 150, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">🟡 PENDING</option>
          <option value="MATCHING">🔵 MATCHING</option>
          <option value="MATCHED">🟢 MATCHED</option>
          <option value="ASSIGNED">🔵 ASSIGNED</option>
          <option value="DELIVERED">🟢 DELIVERED</option>
          <option value="CANCELLED">🔴 CANCELLED</option>
        </select>

        {/* Urgency Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 140, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          value={urgencyFilter}
          onChange={(e) => setUrgencyFilter(e.target.value)}
        >
          <option value="">All Urgencies</option>
          <option value="MODERATE">🟡 Moderate</option>
          <option value="HIGH">🟠 High</option>
          <option value="CRITICAL">🔴 Critical</option>
        </select>

        {/* Resource Type Filter */}
        <select
          className="form-select"
          style={{ width: 'auto', minWidth: 150, padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          value={resourceFilter}
          onChange={(e) => setResourceFilter(e.target.value)}
        >
          <option value="">All Resources</option>
          <option value="food">🍚 Food</option>
          <option value="water">💧 Drinking Water</option>
          <option value="medicine">💊 Medicine</option>
          <option value="baby_supplies">🍼 Baby Supplies</option>
          <option value="essential_supplies">🧴 Essential Supplies</option>
          <option value="shelter">🏠 Shelter</option>
        </select>

        {(statusFilter || urgencyFilter || resourceFilter) && (
          <button
            className="btn btn-outline"
            style={{ fontSize: '0.75rem', padding: '0.35rem 0.6rem' }}
            onClick={() => {
              setStatusFilter('');
              setUrgencyFilter('');
              setResourceFilter('');
            }}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Requests Content */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: '1rem' }}>
          <Loader2 size={32} className="animate-spin text-yellow-400" />
          <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading resource requests...</div>
        </div>
      ) : requests.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', border: '1px dashed #334155' }}>
          <ClipboardList size={40} className="text-slate-500" style={{ margin: '0 auto 1rem auto' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.5rem' }}>
            No Resource Requests Found
          </h3>
          <p style={{ color: '#94a3b8', maxWidth: 420, margin: '0 auto 1.5rem auto', fontSize: '0.9rem' }}>
            {statusFilter || urgencyFilter || resourceFilter
              ? 'No requests match your current filters. Try changing or clearing filters.'
              : 'You have not submitted any resource requests yet.'}
          </p>
          <button
            className="btn btn-green"
            onClick={() => navigate('/resource-assistance')}
          >
            <Plus size={18} />
            <span>Create Resource Request</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {requests.map(req => {
            const hasFood = req.resources.some(r => r.type === 'food');
            const createdDate = new Date(req.createdAt).toLocaleString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={req.requestId}
                className="card"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  transition: 'all 0.2s ease',
                  borderLeft: req.urgency === 'CRITICAL' ? '4px solid #ef4444' : req.urgency === 'HIGH' ? '4px solid #f97316' : '4px solid #facc15'
                }}
                onClick={() => navigate(`/requests/${req.requestId}`)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.05rem', fontWeight: 800, color: '#facc15' }}>
                        {req.requestId}
                      </span>
                      <StatusBadge type="urgency" value={req.urgency} />
                      <StatusBadge type="status" value={req.status} />
                      {hasFood && (
                        <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>
                          🍱 FoodBridge Active
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <MapPin size={14} className="text-slate-400" />
                      <span>{req.location.area}, {req.location.city}</span>
                      <span>•</span>
                      <span>{createdDate}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#facc15', fontSize: '0.875rem', fontWeight: 600 }}>
                    <span>View Details</span>
                    <ArrowRight size={16} />
                  </div>
                </div>

                {/* Resource Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                  {req.resources.map((res, i) => (
                    <span
                      key={i}
                      style={{
                        backgroundColor: '#0b111e',
                        border: '1px solid #1e293b',
                        borderRadius: 6,
                        padding: '0.25rem 0.6rem',
                        fontSize: '0.8rem',
                        color: '#f8fafc',
                        fontWeight: 500
                      }}
                    >
                      {res.type === 'food' && '🍚 '}
                      {res.type === 'water' && '💧 '}
                      {res.type === 'medicine' && '💊 '}
                      {res.type === 'baby_supplies' && '🍼 '}
                      {res.type === 'essential_supplies' && '🧴 '}
                      {res.type === 'shelter' && '🏠 '}
                      <strong>{res.quantity}</strong> {res.unit}
                    </span>
                  ))}

                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Users size={14} className="text-slate-400" />
                    <span><strong>{req.peopleCount}</strong> people supported</span>
                  </span>
                </div>

                {/* Description snippet */}
                {req.description && (
                  <p style={{
                    fontSize: '0.85rem',
                    color: '#cbd5e1',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    borderTop: '1px solid #1e293b',
                    paddingTop: '0.5rem',
                    margin: 0
                  }}>
                    {req.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
