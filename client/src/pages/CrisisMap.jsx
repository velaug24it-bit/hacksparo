import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Utensils, ShieldAlert, Filter, Layers, Navigation, ArrowRight, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { Toast } from '../components/Toast';

export const CrisisMap = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const navigate = useNavigate();

  const [locations, setLocations] = useState({ shelters: [], foodDonors: [] });
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL'); // ALL, SHELTERS, FOOD
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [toasts, setToasts] = useState([]);

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  // Fetch coordinates from backend
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.getMapLocations();
      setLocations(res.data || { shelters: [], foodDonors: [] });
    } catch (err) {
      console.error('[CrisisMap] Failed to fetch coordinates:', err);
      addToast('error', 'Map Error', 'Using local sector coordinates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center: Chennai Disaster Sector
    const map = L.map(mapContainerRef.current, {
      center: [13.055, 80.215],
      zoom: 12,
      zoomControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 100% Free OpenStreetMap with tactical dark styling (Zero API Key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      className: 'dark-map-tiles',
      maxZoom: 19
    }).addTo(map);

    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Plot or re-plot markers whenever locations or filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const { shelters = [], foodDonors = [] } = locations;

    // 1. Plot Shelters
    if (filterType === 'ALL' || filterType === 'SHELTERS') {
      shelters.forEach((shelter) => {
        const isCritical = shelter.urgency === 'CRITICAL';
        const color = isCritical ? '#ef4444' : shelter.urgency === 'HIGH' ? '#f97316' : '#facc15';

        const shelterIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `
            <div style="
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background-color: ${color};
              border: 3px solid #090d16;
              box-shadow: 0 0 14px ${color};
              display: flex;
              align-items: center;
              justify-content: center;
              color: #0b0f19;
              font-weight: 800;
              font-size: 14px;
              cursor: pointer;
            ">🏠</div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker(shelter.coordinates, { icon: shelterIcon });
        marker.on('click', () => {
          setSelectedLocation({ ...shelter, category: 'SHELTER' });
        });
        marker.addTo(markersLayerRef.current);
      });
    }

    // 2. Plot Food Donors
    if (filterType === 'ALL' || filterType === 'FOOD') {
      foodDonors.forEach((donor) => {
        const donorIcon = L.divIcon({
          className: 'custom-map-icon',
          html: `
            <div style="
              width: 34px;
              height: 34px;
              border-radius: 50%;
              background-color: #10b981;
              border: 3px solid #090d16;
              box-shadow: 0 0 16px rgba(16, 185, 129, 0.7);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              font-weight: 800;
              font-size: 14px;
              cursor: pointer;
            ">🍱</div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17]
        });

        const marker = L.marker(donor.coordinates, { icon: donorIcon });
        marker.on('click', () => {
          setSelectedLocation({ ...donor, category: 'DONOR' });
        });
        marker.addTo(markersLayerRef.current);
      });
    }
  }, [locations, filterType]);

  const totalMealsAvailable = locations.foodDonors?.reduce((acc, d) => acc + (d.availableMeals || 0), 0) || 0;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Header & Stats */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span className="badge badge-yellow">
              <span className="status-dot status-dot-yellow" />
              🗺️ DISASTER RELIEF RADAR
            </span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>• Sector 4 Grid</span>
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
            Crisis & Surplus Geospatial Radar
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.925rem' }}>
            Real-time coordinates of emergency relief shelters and verified FoodBridge food surplus sources.
          </p>
        </div>

        {/* Live Radar Summary Stats */}
        <div className="crisis-radar-stats" style={{
          display: 'flex',
          gap: '1rem',
          backgroundColor: '#0f172a',
          padding: '0.75rem 1.25rem',
          borderRadius: 10,
          border: '1px solid #1e293b',
          flexWrap: 'wrap'
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>ACTIVE SHELTERS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#facc15' }}>
              {locations.shelters?.length || 0}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>SURPLUS DONORS</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#34d399' }}>
              {locations.foodDonors?.length || 0}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '1rem' }}>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600 }}>MEALS IN GRID</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8' }}>
              {totalMealsAvailable}
            </div>
          </div>
        </div>
      </div>

      {/* Map Filter Controls Bar */}
      <div className="card" style={{
        padding: '0.75rem 1.25rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        backgroundColor: '#0f172a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} className="text-yellow-400" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>Display Layer:</span>
          <div style={{ display: 'flex', gap: '0.35rem' }}>
            <button
              className={`btn ${filterType === 'ALL' ? 'btn-yellow' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
              onClick={() => setFilterType('ALL')}
            >
              All Pins
            </button>
            <button
              className={`btn ${filterType === 'SHELTERS' ? 'btn-yellow' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
              onClick={() => setFilterType('SHELTERS')}
            >
              🏠 Shelters Only
            </button>
            <button
              className={`btn ${filterType === 'FOOD' ? 'btn-green' : 'btn-secondary'}`}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.65rem' }}
              onClick={() => setFilterType('FOOD')}
            >
              🍱 Food Surplus Only
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.75rem', color: '#94a3b8' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#ef4444', display: 'inline-block' }} />
            Critical Shelter
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#f97316', display: 'inline-block' }} />
            High Demand
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
            FoodBridge Surplus
          </span>
        </div>
      </div>

      {/* Map & Detail Sidebar Layout */}
      <div className="crisis-map-grid" style={{ display: 'grid', gridTemplateColumns: selectedLocation ? '1fr 340px' : '1fr', gap: '1.25rem' }}>
        {/* Leaflet Map Canvas */}
        <div
          ref={mapContainerRef}
          className="crisis-map-canvas"
          style={{
            height: 600,
            width: '100%',
            borderRadius: 12,
            overflow: 'hidden',
            border: '2px solid #1e293b',
            boxShadow: 'var(--shadow-lg)'
          }}
        />

        {/* Selected Pin Details Card */}
        {selectedLocation && (
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            border: selectedLocation.category === 'DONOR' ? '2px solid rgba(16, 185, 129, 0.5)' : '2px solid rgba(250, 204, 21, 0.5)',
            backgroundColor: '#0f172a'
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                <span className={`badge ${selectedLocation.category === 'DONOR' ? 'badge-green' : 'badge-yellow'}`}>
                  {selectedLocation.category === 'DONOR' ? '🍱 FOODBRIDGE SURPLUS' : '🏠 RELIEF SHELTER'}
                </span>
                <button
                  onClick={() => setSelectedLocation(null)}
                  style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '1rem' }}
                >
                  ✕
                </button>
              </div>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.35rem' }}>
                {selectedLocation.name}
              </h3>

              <div style={{ fontSize: '0.85rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '1rem' }}>
                <MapPin size={14} className="text-yellow-400" />
                <span>{selectedLocation.area}, {selectedLocation.city || 'Chennai'}</span>
              </div>

              {selectedLocation.category === 'DONOR' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#090d16', padding: '1rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>SURPLUS MEALS AVAILABLE</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
                      {selectedLocation.availableMeals} meals
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>DONOR FACILITY TYPE</div>
                    <div style={{ fontSize: '0.9rem', color: '#f8fafc', fontWeight: 600 }}>
                      {selectedLocation.type}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>FRESHNESS TIMING</div>
                    <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                      {selectedLocation.prepTime}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', backgroundColor: '#090d16', padding: '1rem', borderRadius: 8, border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>OCCUPANCY</div>
                      <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#facc15' }}>
                        {selectedLocation.occupied} / {selectedLocation.capacity}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>DISPATCH URGENCY</div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: selectedLocation.urgency === 'CRITICAL' ? '#ef4444' : '#f97316' }}>
                        {selectedLocation.urgency}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>CURRENT SHORTAGES</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                      {selectedLocation.needs?.map((n, i) => (
                        <span key={i} className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>
                          {n.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '1.25rem' }}>
              {selectedLocation.category === 'DONOR' ? (
                <button
                  className="btn btn-green"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  onClick={() => navigate('/foodbridge')}
                >
                  <Utensils size={15} />
                  <span>Match Surplus Food</span>
                </button>
              ) : (
                <button
                  className="btn btn-yellow"
                  style={{ width: '100%', fontSize: '0.85rem' }}
                  onClick={() => navigate('/resource-assistance')}
                >
                  <Navigation size={15} />
                  <span>Send Resources Here</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
