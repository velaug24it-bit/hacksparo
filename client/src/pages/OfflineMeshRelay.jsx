import React, { useState, useEffect } from 'react';
import { Radio, QrCode, Wifi, WifiOff, RefreshCw, Plus, Users, MapPin, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight, Trash2, Eye, Sparkles, Send } from 'lucide-react';
import { offlineMesh } from '../services/offlineMesh.service';
import { QRPacketModal } from '../components/QRPacketModal';
import { QRScannerModal } from '../components/QRScannerModal';
import { Toast } from '../components/Toast';

export const OfflineMeshRelay = () => {
  const [networkState, setNetworkState] = useState({
    isOnline: true,
    isSimulated: false,
    packetCount: 0,
    packets: [],
    nodeId: ''
  });

  // Offline form inputs
  const [selectedResources, setSelectedResources] = useState(['food', 'water']);
  const [mealsCount, setMealsCount] = useState(50);
  const [waterCount, setWaterCount] = useState(120);
  const [peopleCount, setPeopleCount] = useState(40);
  const [urgency, setUrgency] = useState('HIGH');
  const [area, setArea] = useState('Sector 4 Flood Relief Camp');
  const [city, setCity] = useState('Chennai');
  const [landmark, setLandmark] = useState('Near Canal Bridge');
  const [description, setDescription] = useState('Cell tower destroyed. 40 people isolated near canal bridge without drinking water or dry rations.');

  // Modals & UI
  const [activeQRModalPacket, setActiveQRModalPacket] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toasts, setToasts] = useState([]);

  const addToast = (type, title, message) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const unsubscribe = offlineMesh.subscribe((state) => {
      setNetworkState(state);
    });
    return unsubscribe;
  }, []);

  const handleCreateOfflinePacket = (e) => {
    e.preventDefault();

    if (!area.trim() || !description.trim()) {
      addToast('error', 'Validation', 'Location area and situation description are required.');
      return;
    }

    const resources = [];
    if (selectedResources.includes('food')) {
      resources.push({ type: 'food', quantity: parseInt(mealsCount, 10) || 50, unit: 'meals', details: `${mealsCount} meals` });
    }
    if (selectedResources.includes('water')) {
      resources.push({ type: 'water', quantity: parseInt(waterCount, 10) || 100, unit: 'litres', details: `${waterCount} litres` });
    }
    if (selectedResources.includes('medicine')) {
      resources.push({ type: 'medicine', quantity: 5, unit: 'kits', details: 'Emergency First Aid' });
    }

    const payload = {
      resources,
      peopleCount: parseInt(peopleCount, 10) || 30,
      urgency,
      location: {
        area: area.trim(),
        city: city.trim() || 'Chennai',
        landmark: landmark.trim()
      },
      description: description.trim()
    };

    const newPacket = offlineMesh.createPacket(payload);
    addToast('success', 'Offline Packet Created', `Crisis Packet ${newPacket.packetId} generated! Stored in local carrier bag.`);
    setActiveQRModalPacket(newPacket);
  };

  const handleSyncAll = async () => {
    if (!networkState.isOnline) {
      addToast('warning', 'Off-Grid Mode', 'Device is currently offline. Reconnect or exit offline simulation to sync with central database.');
      return;
    }

    setSyncing(true);
    try {
      const res = await offlineMesh.syncAllPackets();
      addToast('success', 'Relay Sync Complete', `Uploaded ${res.syncedCount} packets to central MongoDB! Duplicates filtered: ${res.duplicateCount || 0}.`);
    } catch (err) {
      console.error('[OfflineMeshRelay] Sync error:', err);
      addToast('error', 'Sync Failed', err.message || 'Could not contact gateway.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDeletePacket = (packetId) => {
    offlineMesh.deletePacket(packetId);
    addToast('info', 'Packet Removed', `Removed packet ${packetId} from carrier bag.`);
  };

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      <Toast toasts={toasts} onDismiss={removeToast} />

      {/* Header Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(30, 25, 10, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%)',
        border: '2px solid rgba(250, 204, 21, 0.4)',
        boxShadow: 'var(--shadow-yellow)',
        marginBottom: '2rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-yellow">
                <span className="status-dot status-dot-yellow" />
                🟡 OFFLINE CRISIS MESH RELAY
              </span>
              <span className="badge badge-blue">
                NSL-02: BEYOND CONNECTIVITY
              </span>
            </div>
            <h1 style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '-0.02em' }}>
              🟡 Offline Mesh & QR Packet Relay
            </h1>
            <p style={{ color: '#cbd5e1', maxWidth: 680, marginTop: '0.35rem', fontSize: '0.975rem' }}>
              Operates during cellular and internet network collapse. Victims and shelters generate encrypted offline packets, passing rescue couriers scan QR codes, and packets auto-sync to MongoDB upon signal detection.
            </p>
          </div>

          <div style={{
            backgroundColor: '#090d16',
            padding: '1rem 1.25rem',
            borderRadius: 10,
            border: '1px solid #334155',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>LOCAL MESH NODE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 800, color: '#facc15' }}>
              {networkState.nodeId || 'NODE_UNKNOWN'}
            </div>
            <div style={{ fontSize: '0.75rem', color: networkState.isOnline ? '#34d399' : '#fb923c', marginTop: '0.2rem' }}>
              {networkState.isOnline ? '🟢 Connected to Gateway' : '🟡 Off-Grid Courier Mode'}
            </div>
          </div>
        </div>
      </div>

      {/* Control Action Bar */}
      <div className="card" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        marginBottom: '2rem',
        backgroundColor: '#0f172a'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: 'rgba(250, 204, 21, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#facc15'
          }}>
            <Radio size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: 600 }}>CARRIER BAG STORAGE</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f8fafc' }}>
              {networkState.packetCount} {networkState.packetCount === 1 ? 'Packet' : 'Packets'} Awaiting Gateway Sync
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            className="btn btn-secondary"
            onClick={() => setIsScannerOpen(true)}
            style={{ fontSize: '0.85rem' }}
          >
            <QrCode size={16} className="text-yellow-400" />
            <span>Collect Peer QR Packet</span>
          </button>

          <button
            className="btn btn-yellow"
            disabled={networkState.packetCount === 0 || syncing || !networkState.isOnline}
            onClick={handleSyncAll}
            style={{ fontSize: '0.85rem' }}
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            <span>{syncing ? 'Syncing...' : `Transmit ${networkState.packetCount} Packets to Cloud`}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Form + Carrier Bag */}
      <div className="mesh-relay-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.75rem', marginBottom: '2rem' }}>
        {/* Panel 1: Generate Offline Packet */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Plus size={18} className="text-yellow-400" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
              1. Generate Off-Grid Crisis Packet
            </h2>
          </div>
          <p className="form-hint" style={{ marginBottom: '1.25rem' }}>
            Works with zero internet connection. Compresses data into high-contrast QR code.
          </p>

          <form onSubmit={handleCreateOfflinePacket} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">
                <Users size={15} className="text-yellow-400" />
                Displaced People Count *
              </label>
              <input
                type="number"
                min="1"
                required
                className="form-input"
                value={peopleCount}
                onChange={(e) => setPeopleCount(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">🍚 Meals Needed</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={mealsCount}
                  onChange={(e) => setMealsCount(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">💧 Water (Litres)</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={waterCount}
                  onChange={(e) => setWaterCount(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Urgency Level</label>
              <select
                className="form-select"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                <option value="CRITICAL">🔴 CRITICAL (Immediate danger/rescue)</option>
                <option value="HIGH">🟠 HIGH (Food/water running out)</option>
                <option value="MODERATE">🟡 MODERATE (Supplies limited)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                <MapPin size={15} className="text-yellow-400" />
                Shelter / Location Area *
              </label>
              <input
                type="text"
                required
                className="form-input"
                value={area}
                onChange={(e) => setArea(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Situation Description *</label>
              <textarea
                className="form-textarea"
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn btn-yellow"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
            >
              <QrCode size={18} />
              <span>GENERATE OFFLINE QR PACKET</span>
            </button>
          </form>
        </div>

        {/* Panel 2: Stored Carrier Bag Packets */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={18} className="text-yellow-400" />
              <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc' }}>
                2. Packets in Carrier Bag ({networkState.packetCount})
              </h2>
            </div>

            {networkState.packetCount > 0 && (
              <button
                className="btn btn-outline"
                onClick={() => offlineMesh.clearAllPackets()}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
              >
                Clear All
              </button>
            )}
          </div>
          <p className="form-hint" style={{ marginBottom: '1.25rem' }}>
            Packets collected or generated on this device waiting to reach cell signal.
          </p>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: 480, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {networkState.packets.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem 1.5rem',
                border: '1px dashed #334155',
                borderRadius: 8,
                color: '#94a3b8'
              }}>
                <QrCode size={36} className="text-slate-500" style={{ margin: '0 auto 0.75rem auto' }} />
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>Carrier Bag is Empty</div>
                <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                  Generate an offline packet or collect a packet from a nearby peer.
                </div>
              </div>
            ) : (
              networkState.packets.map((pkt) => (
                <div
                  key={pkt.packetId}
                  style={{
                    backgroundColor: '#090d16',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                    padding: '0.875rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800, color: '#facc15' }}>
                        {pkt.packetId}
                      </span>
                      <span className="badge badge-yellow" style={{ fontSize: '0.65rem' }}>
                        {pkt.hops || 1} peer hop(s)
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setActiveQRModalPacket(pkt)}
                        style={{ padding: '0.3rem', borderRadius: 4 }}
                        title="Display QR code"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        className="btn btn-outline"
                        onClick={() => handleDeletePacket(pkt.packetId)}
                        style={{ padding: '0.3rem', borderRadius: 4 }}
                        title="Remove packet"
                      >
                        <Trash2 size={14} className="text-red-400" />
                      </button>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
                    <strong>{pkt.payload.peopleCount} people</strong> at {pkt.payload.location?.area}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Relay chain: {pkt.relayedBy?.join(' ➔ ') || 'Initial Origin'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Peer Mesh Protocol Flow Diagram for Judges */}
      <div className="card" style={{ backgroundColor: '#090d16', border: '1px solid #1e293b' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f8fafc', marginBottom: '0.75rem' }}>
          📡 CrisisCare Mesh Off-Grid Relay Protocol (NSL-02 Standard)
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          fontSize: '0.825rem'
        }}>
          <div style={{ borderLeft: '2px solid #facc15', paddingLeft: '0.75rem' }}>
            <div style={{ fontWeight: 700, color: '#facc15' }}>1. Off-Grid Generation</div>
            <div style={{ color: '#94a3b8', marginTop: '0.2rem' }}>
              Victim phones without Wi-Fi generate signed offline packets encoded as QR codes.
            </div>
          </div>
          <div style={{ borderLeft: '2px solid #38bdf8', paddingLeft: '0.75rem' }}>
            <div style={{ fontWeight: 700, color: '#38bdf8' }}>2. Peer Courier Pickup</div>
            <div style={{ color: '#94a3b8', marginTop: '0.2rem' }}>
              Volunteers or disaster boats scan victim QR codes into their local bag (+1 hop).
            </div>
          </div>
          <div style={{ borderLeft: '2px solid #34d399', paddingLeft: '0.75rem' }}>
            <div style={{ fontWeight: 700, color: '#34d399' }}>3. Cloud Sync Uplink</div>
            <div style={{ color: '#94a3b8', marginTop: '0.2rem' }}>
              First courier touching cell signal or Starlink Wi-Fi auto-syncs all packets into MongoDB.
            </div>
          </div>
        </div>
      </div>

      {/* QR Display Modal */}
      {activeQRModalPacket && (
        <QRPacketModal
          packet={activeQRModalPacket}
          onClose={() => setActiveQRModalPacket(null)}
        />
      )}

      {/* QR Scanner / Peer Importer Modal */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onPacketImported={(pkt) => {
          addToast('success', 'Peer Packet Added', `Packet ${pkt.packetId} now in your courier bag!`);
        }}
      />
    </div>
  );
};
