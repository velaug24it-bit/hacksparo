import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Users, Calendar, Clock, Utensils, CheckCircle2, AlertTriangle, Truck, ExternalLink, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { StatusBadge } from '../components/StatusBadge';
import { Timeline } from '../components/Timeline';
import { ImpactMetrics } from '../components/ImpactMetrics';
import { Toast } from '../components/Toast';

export const RequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (type, title, message) => {
    const toastId = Date.now() + Math.random();
    setToasts(prev => [...prev, { id: toastId, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== toastId)), 5000);
  };

  const removeToast = (toastId) => setToasts(prev => prev.filter(t => t.id !== toastId));

  const fetchRequest = async () => {
    setLoading(true);
    try {
      const res = await api.getResourceRequestById(id);
      setRequest(res.data);
    } catch (err) {
      console.error('[RequestDetail] Fetch error:', err);
      addToast('error', 'Request Not Found', err.message || 'Could not locate resource request.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try {
      const res = await api.updateStatus(id, newStatus, `Manual status change via crisis dispatch console`);
      setRequest(res.data);
      addToast('success', 'Status Updated', `Request status transitioned to ${newStatus}.`);
    } catch (err) {
      console.error('[RequestDetail] Status update error:', err);
      addToast('error', 'Update Failed', err.message || 'Could not update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: '1rem' }}>
        <Loader2 size={36} className="animate-spin text-yellow-400" />
        <div style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Loading request details...</div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem', maxWidth: 600, margin: '2rem auto' }}>
        <AlertTriangle size={40} className="text-yellow-400" style={{ margin: '0 auto 1rem auto' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.5rem' }}>
          Resource Request Not Found
        </h2>
        <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
          No records exist for request identifier "{id}".
        </p>
        <button className="btn btn-yellow" onClick={() => navigate('/requests')}>
          Back to Requests Dashboard
        </button>
      </div>
    );
  }

  const hasFood = request.resources.some(r => r.type === 'food');
  const foodItem = request.resources.find(r => r.type === 'food');
  const createdDate = new Date(request.createdAt).toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div style={{ maxWidth: 940, margin: '0 auto' }}>
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Top Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => navigate('/requests')}
          style={{ padding: '0.4rem 0.875rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} />
          <span>BACK TO REQUESTS</span>
        </button>

        {/* Quick status transition dropdown for test evaluation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>DISPATCH STATUS:</span>
          <select
            className="form-select"
            style={{ width: 'auto', padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
            value={request.status}
            disabled={updating}
            onChange={(e) => handleStatusChange(e.target.value)}
          >
            <option value="PENDING">PENDING</option>
            <option value="MATCHING">MATCHING</option>
            <option value="MATCHED">MATCHED</option>
            <option value="ASSIGNED">ASSIGNED</option>
            <option value="DELIVERED">DELIVERED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Main Request Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.35rem' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 800, color: '#facc15' }}>
                {request.requestId}
              </span>
              <StatusBadge type="urgency" value={request.urgency} />
              <StatusBadge type="status" value={request.status} />
            </div>

            <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <MapPin size={15} className="text-yellow-400" />
                {request.location.area}, {request.location.city} {request.location.landmark ? `(${request.location.landmark})` : ''}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Calendar size={15} className="text-slate-400" />
                {createdDate}
              </span>
            </div>
          </div>

          <div style={{
            backgroundColor: '#090d16',
            padding: '0.75rem 1.25rem',
            borderRadius: 8,
            border: '1px solid #1e293b',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>PEOPLE SUPPORTED</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc' }}>
              {request.peopleCount} <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>people</span>
            </div>
          </div>
        </div>

        {/* Resources Requested Breakdown */}
        <div style={{ marginTop: '1.25rem' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
            Requested Resources
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {request.resources.map((res, i) => (
              <div
                key={i}
                style={{
                  backgroundColor: '#090d16',
                  borderRadius: 8,
                  border: '1px solid #1e293b',
                  padding: '0.75rem 1rem'
                }}
              >
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                  {res.type.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#facc15', marginTop: '0.2rem' }}>
                  {res.quantity} <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>{res.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Situation Description */}
        <div style={{ marginTop: '1.25rem', backgroundColor: '#090d16', borderRadius: 8, border: '1px solid #1e293b', padding: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            Situation Description
          </div>
          <p style={{ color: '#cbd5e1', fontSize: '0.925rem', lineHeight: 1.6, margin: 0 }}>
            {request.description}
          </p>
        </div>
      </div>

      {/* SECTION: FoodBridge Integration (Only shown if FOOD is requested) */}
      {hasFood && (
        <div className="card" style={{
          marginBottom: '1.5rem',
          border: '2px solid rgba(250, 204, 21, 0.4)',
          backgroundColor: 'rgba(250, 204, 21, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                backgroundColor: 'rgba(250, 204, 21, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#facc15'
              }}>
                <Utensils size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                  FoodBridge Surplus Integration
                </h3>
                <p style={{ fontSize: '0.825rem', color: '#94a3b8' }}>
                  Target: {foodItem.quantity} meals for {request.location.area}
                </p>
              </div>
            </div>

            <button
              className="btn btn-yellow"
              onClick={() => navigate(`/foodbridge/${request.requestId}`)}
              style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}
            >
              <span>{request.foodBridgeMatch?.matched ? 'Manage Food Match' : 'Find Surplus Donors'}</span>
              <ExternalLink size={14} />
            </button>
          </div>

          {request.foodBridgeMatch?.matched ? (
            <div>
              <div style={{
                backgroundColor: '#090d16',
                padding: '1rem',
                borderRadius: 8,
                border: '1px solid #1e293b',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>DONOR NAME(S)</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#f8fafc', marginTop: '0.2rem' }}>
                    {request.foodBridgeMatch.matches.map(m => m.donorName).join(', ')}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>MEALS MATCHED</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
                    {request.foodBridgeMatch.matchedQuantity} meals
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>REMAINING NEED</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: request.foodBridgeMatch.remainingQuantity > 0 ? '#ef4444' : '#34d399', marginTop: '0.2rem' }}>
                    {request.foodBridgeMatch.remainingQuantity} meals
                  </div>
                </div>
              </div>

              {/* Verified Impact Metrics */}
              <ImpactMetrics
                mealsRescued={request.foodBridgeMatch.matchedQuantity}
                peopleSupported={request.peopleCount}
                foodDiverted={request.foodBridgeMatch.matchedQuantity}
              />
            </div>
          ) : (
            <div style={{
              backgroundColor: '#090d16',
              borderRadius: 8,
              border: '1px solid #1e293b',
              padding: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <div style={{ fontWeight: 700, color: '#facc15', fontSize: '0.95rem' }}>
                  Surplus Food Not Yet Matched
                </div>
                <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.2rem' }}>
                  {foodItem.quantity} meals are pending donor matching. Click below to find local surplus donors.
                </div>
              </div>

              <button
                className="btn btn-yellow"
                onClick={() => navigate(`/foodbridge/${request.requestId}`)}
              >
                OPEN FOODBRIDGE MATCHING
              </button>
            </div>
          )}
        </div>
      )}

      {/* SECTION: Request Operations Timeline */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Clock size={18} className="text-yellow-400" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            Operations & Dispatch Timeline
          </h3>
        </div>

        <Timeline events={request.timeline} />
      </div>
    </div>
  );
};
