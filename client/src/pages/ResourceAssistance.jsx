import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, AlertTriangle, Users, MapPin, Check, Loader2, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { Toast } from '../components/Toast';

const RESOURCE_TYPES = [
  { id: 'food', name: 'Food', icon: '🍚', defaultUnit: 'meals', placeholder: 'e.g. 95 meals', label: 'Meals Required' },
  { id: 'water', name: 'Drinking Water', icon: '💧', defaultUnit: 'litres', placeholder: 'e.g. 200 litres', label: 'Water Required (Litres)' },
  { id: 'medicine', name: 'Medicine', icon: '💊', defaultUnit: 'kits/packs', placeholder: 'e.g. 10 first aid kits, insulin, bandages', label: 'Medicine Quantity & Details' },
  { id: 'baby_supplies', name: 'Baby Supplies', icon: '🍼', defaultUnit: 'items', placeholder: 'e.g. 30 baby formula cans, 50 diapers', label: 'Baby Supplies Quantity' },
  { id: 'essential_supplies', name: 'Essential Supplies', icon: '🧴', defaultUnit: 'kits', placeholder: 'e.g. 40 hygiene kits, soap, blankets', label: 'Supplies Quantity & Details' },
  { id: 'shelter', name: 'Shelter', icon: '🏠', defaultUnit: 'capacity', placeholder: 'e.g. 60 beds / temporary tents', label: 'Shelter Capacity Required' },
];

const URGENCY_LEVELS = [
  {
    id: 'MODERATE',
    label: '🟡 MODERATE',
    dotClass: 'status-dot-yellow',
    color: '#facc15',
    cardClass: 'selected-moderate',
    description: 'Resources are limited but currently available.'
  },
  {
    id: 'HIGH',
    label: '🟠 HIGH',
    dotClass: 'status-dot-orange',
    color: '#fb923c',
    cardClass: 'selected-high',
    description: 'Resources may run out soon.'
  },
  {
    id: 'CRITICAL',
    label: '🔴 CRITICAL',
    dotClass: 'status-dot-red',
    color: '#f87171',
    cardClass: 'selected-critical',
    description: 'Immediate resource assistance is required.'
  }
];

export const ResourceAssistance = () => {
  const navigate = useNavigate();

  // Form state
  const [selectedResources, setSelectedResources] = useState(['food']);
  const [quantities, setQuantities] = useState({
    food: 95,
    water: 200,
    medicine: 10,
    baby_supplies: 25,
    essential_supplies: 40,
    shelter: 50
  });
  const [peopleCount, setPeopleCount] = useState(120);
  const [urgency, setUrgency] = useState('HIGH');
  const [location, setLocation] = useState({
    area: 'ABC Relief Shelter',
    city: 'Chennai',
    landmark: 'Near Government School'
  });
  const [description, setDescription] = useState('120 people are staying at the shelter and food will last only for the next 4 hours.');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const toggleResource = (id) => {
    if (selectedResources.includes(id)) {
      if (selectedResources.length === 1) {
        addToast('warning', 'Resource Selection', 'At least one resource must remain selected.');
        return;
      }
      setSelectedResources(selectedResources.filter(r => r !== id));
    } else {
      setSelectedResources([...selectedResources, id]);
    }
  };

  const handleQuantityChange = (resourceId, value) => {
    const val = parseInt(value, 10);
    setQuantities(prev => ({
      ...prev,
      [resourceId]: isNaN(val) ? '' : Math.max(1, val)
    }));
  };

  // Demo autofill helper
  const handleAutoFillDemo = () => {
    setSelectedResources(['food', 'water']);
    setQuantities(prev => ({ ...prev, food: 95, water: 200 }));
    setPeopleCount(120);
    setUrgency('HIGH');
    setLocation({
      area: 'ABC Relief Shelter',
      city: 'Chennai',
      landmark: 'Near Government School'
    });
    setDescription('120 people are staying at the shelter and food will last only for the next 4 hours.');
    addToast('success', 'Demo Data Loaded', 'Sample disaster relief shelter parameters loaded.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validations
    if (selectedResources.length === 0) {
      addToast('error', 'Validation Error', 'Please select at least one resource.');
      return;
    }

    const count = parseInt(peopleCount, 10);
    if (!count || count <= 0) {
      addToast('error', 'Validation Error', 'Please specify a valid count of people needing assistance (> 0).');
      return;
    }

    // Check quantities
    for (const resId of selectedResources) {
      const q = parseInt(quantities[resId], 10);
      if (!q || q <= 0) {
        const item = RESOURCE_TYPES.find(r => r.id === resId);
        addToast('error', 'Validation Error', `Please provide a positive quantity for ${item.name}.`);
        return;
      }
    }

    if (!location.area.trim()) {
      addToast('error', 'Validation Error', 'Location / Shelter area is required.');
      return;
    }
    if (!location.city.trim()) {
      addToast('error', 'Validation Error', 'City is required.');
      return;
    }
    if (!description.trim() || description.trim().length < 5) {
      addToast('error', 'Validation Error', 'Please provide a clear description of the situation (min 5 characters).');
      return;
    }

    // 2. Build payload
    const resourcesPayload = selectedResources.map(resId => {
      const def = RESOURCE_TYPES.find(r => r.id === resId);
      return {
        type: resId,
        quantity: parseInt(quantities[resId], 10),
        unit: def.defaultUnit,
        details: `${quantities[resId]} ${def.defaultUnit}`
      };
    });

    const payload = {
      resources: resourcesPayload,
      peopleCount: count,
      urgency,
      location: {
        area: location.area.trim(),
        city: location.city.trim(),
        landmark: location.landmark.trim()
      },
      description: description.trim()
    };

    setIsSubmitting(true);

    try {
      const response = await api.createResourceRequest(payload);
      const created = response?.data;

      if (!created || !created.requestId) {
        throw new Error(response?.message || 'Server did not return a valid request ID. Please check backend connection.');
      }

      addToast('success', 'Request Registered', `Emergency Resource Request ${created.requestId} dispatched successfully!`);

      // Check if FOOD was requested: route to FoodBridge matching
      const hasFood = selectedResources.includes('food');

      setTimeout(() => {
        if (hasFood) {
          navigate(`/foodbridge/${created.requestId}`);
        } else {
          navigate(`/requests/${created.requestId}`);
        }
      }, 1000);

    } catch (err) {
      console.error('[ResourceAssistance] Submission error:', err);
      addToast('error', 'Request Failed', err.message || 'Unable to connect to emergency dispatch server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Top Header & Navigation */}
      <div style={{ marginBottom: '1.75rem' }}>
        <button
          className="btn btn-outline"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate('/requests');
            }
          }}
          style={{ marginBottom: '1.25rem', padding: '0.4rem 0.875rem', fontSize: '0.875rem' }}
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-green">
              <span className="status-dot status-dot-green" />
              RESOURCE ASSISTANCE
            </span>
            <span style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>• Sector Channel 🟢</span>
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleAutoFillDemo}
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
          >
            <Sparkles size={14} className="text-emerald-400" />
            <span>Load Demo Shelter Values</span>
          </button>
        </div>

        <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.5rem', letterSpacing: '-0.02em' }}>
          🟢 Resource Assistance
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '1.05rem', marginTop: '0.25rem' }}>
          Request essential resources for people affected by an emergency.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
        {/* Section 1: Resource Type Selection */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              1. Select Required Resources
            </h2>
            <p className="form-hint">
              Select one or multiple essential categories needed for your shelter or community.
            </p>
          </div>

          <div className="selectable-grid">
            {RESOURCE_TYPES.map(res => {
              const isSelected = selectedResources.includes(res.id);
              return (
                <div
                  key={res.id}
                  className={`selectable-card ${isSelected ? 'selected-green' : ''}`}
                  onClick={() => toggleResource(res.id)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggleResource(res.id);
                    }
                  }}
                >
                  {isSelected && (
                    <div className="selectable-card-check selectable-card-check-green">
                      <Check size={12} strokeWidth={4} />
                    </div>
                  )}
                  <span className="selectable-card-icon">{res.icon}</span>
                  <span className="selectable-card-title">{res.name}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: People Affected */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              2. People Count
            </h2>
            <p className="form-hint">
              Number of displaced or affected individuals requiring immediate support.
            </p>
          </div>

          <div className="form-group" style={{ maxWidth: 360 }}>
            <label htmlFor="people-input" className="form-label">
              <Users size={16} className="text-emerald-400" />
              How many people need assistance? *
            </label>
            <input
              id="people-input"
              type="number"
              min="1"
              step="1"
              required
              className="form-input"
              placeholder="e.g. 120"
              value={peopleCount}
              onChange={(e) => setPeopleCount(e.target.value)}
            />
          </div>
        </div>

        {/* Section 3: Dynamic Resource Quantities */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              3. Resource Quantity Details
            </h2>
            <p className="form-hint">
              Specify the required amounts for each selected category.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {selectedResources.map(resId => {
              const item = RESOURCE_TYPES.find(r => r.id === resId);
              return (
                <div key={resId} className="form-group" style={{ backgroundColor: '#090d16', padding: '1rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                  <label htmlFor={`qty-${resId}`} className="form-label" style={{ justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>{item.icon}</span>
                      <span>{item.label} *</span>
                    </span>
                    <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>{item.defaultUnit}</span>
                  </label>
                  <input
                    id={`qty-${resId}`}
                    type="number"
                    min="1"
                    required
                    className="form-input"
                    placeholder={item.placeholder}
                    value={quantities[resId] || ''}
                    onChange={(e) => handleQuantityChange(resId, e.target.value)}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 4: Urgency Level */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              4. Urgency Level
            </h2>
            <p className="form-hint">
              Select the current severity. Only one level can be selected.
            </p>
          </div>

          <div className="urgency-grid">
            {URGENCY_LEVELS.map(lvl => {
              const isSelected = urgency === lvl.id;
              return (
                <div
                  key={lvl.id}
                  className={`urgency-card ${isSelected ? lvl.cardClass : ''}`}
                  onClick={() => setUrgency(lvl.id)}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setUrgency(lvl.id);
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 700, color: lvl.color, fontSize: '0.95rem' }}>
                      {lvl.label}
                    </span>
                    {isSelected && <span className="selectable-card-check" style={{ position: 'static' }}><Check size={12} strokeWidth={4} /></span>}
                  </div>
                  <p style={{ fontSize: '0.8125rem', color: '#cbd5e1', marginTop: '0.25rem' }}>
                    {lvl.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 5: Location Details */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              5. Location Information
            </h2>
            <p className="form-hint">
              Provide relief shelter or community area location (no GPS hardware needed).
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
            <div className="form-group">
              <label htmlFor="area-input" className="form-label">
                <MapPin size={16} className="text-emerald-400" />
                Location / Shelter Name *
              </label>
              <input
                id="area-input"
                type="text"
                required
                className="form-input"
                placeholder="e.g. ABC Relief Shelter"
                value={location.area}
                onChange={(e) => setLocation({ ...location, area: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label htmlFor="city-input" className="form-label">
                City / Region *
              </label>
              <input
                id="city-input"
                type="text"
                required
                className="form-input"
                placeholder="e.g. Chennai"
                value={location.city}
                onChange={(e) => setLocation({ ...location, city: e.target.value })}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="landmark-input" className="form-label">
                Landmark / Specific Directions (Optional)
              </label>
              <input
                id="landmark-input"
                type="text"
                className="form-input"
                placeholder="e.g. Near Government School, Sector 4 Gate"
                value={location.landmark}
                onChange={(e) => setLocation({ ...location, landmark: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Section 6: Situation Description */}
        <div className="card">
          <div style={{ marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              6. Situation Description
            </h2>
            <p className="form-hint">
              Explain current stockpile levels, remaining hours, and specific demographics.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="desc-input" className="form-label">
              Describe the current situation *
            </label>
            <textarea
              id="desc-input"
              required
              className="form-textarea"
              placeholder="Example: 120 people are staying at the shelter and food will last only for the next 4 hours."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        {/* Section 7: Submit Button */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-green btn-lg"
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={22} className="animate-spin" />
                <span>DISPATCHING RESOURCE REQUEST...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>🟢 SEND RESOURCE REQUEST</span>
              </>
            )}
          </button>
          <div style={{ textAlign: 'center', fontSize: '0.8125rem', color: '#94a3b8' }}>
            {selectedResources.includes('food') ? (
              <span>🍱 <strong>FoodBridge surplus matching</strong> will automatically trigger upon submission.</span>
            ) : (
              <span>Your request will be assigned to local relief logistics networks.</span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
