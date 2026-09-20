import React, { useState } from 'react';
import { QrCode, Upload, ArrowDownToLine, X, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { offlineMesh } from '../services/offlineMesh.service';

export const QRScannerModal = ({ isOpen, onClose, onPacketImported }) => {
  const [pasteInput, setPasteInput] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const handleImport = (rawString) => {
    setError('');
    setSuccess('');

    if (!rawString || !rawString.trim()) {
      setError('Please paste a valid Crisis Mesh packet string.');
      return;
    }

    try {
      const result = offlineMesh.importRelayedPacket(rawString.trim());
      if (result.duplicate) {
        setSuccess(`Packet ${result.packet.packetId} was already collected in this carrier bag.`);
      } else {
        setSuccess(`Packet ${result.packet.packetId} collected! Hop count: ${result.packet.hops}. Added to carrier bag.`);
      }

      setPasteInput('');
      if (onPacketImported) onPacketImported(result.packet);
    } catch (err) {
      setError(err.message || 'Failed to parse packet.');
    }
  };

  const handleDemoPacket = () => {
    const demoPayload = {
      resources: [
        { type: 'food', quantity: 60, unit: 'meals' },
        { type: 'water', quantity: 150, unit: 'litres' }
      ],
      peopleCount: 45,
      urgency: 'HIGH',
      location: {
        area: 'Community Hall Ward 12',
        city: 'Chennai',
        landmark: 'Opposite Railway Gate'
      },
      description: 'Cell tower down in Sector 12. Transmitted via offline QR mesh peer courier.'
    };

    const tempPacket = {
      packetId: 'PKT-DEMO-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
      hops: 1,
      relayedBy: ['PEER_VICTIM_PHONE'],
      originTimestamp: new Date().toISOString(),
      payload: demoPayload
    };

    const encoded = offlineMesh.encodePacketString(tempPacket);
    setPasteInput(encoded);
    handleImport(encoded);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              backgroundColor: 'rgba(250, 204, 21, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#facc15'
            }}>
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc' }}>
                Collect Peer Mesh Packet
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Import off-grid SOS requests from nearby victim devices.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Feedback Messages */}
        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '0.75rem',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#f87171',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            padding: '0.75rem',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: '#34d399',
            fontSize: '0.85rem',
            marginBottom: '1rem'
          }}>
            <CheckCircle2 size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Text Input / Base64 Paste */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="mesh-input" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '0.35rem' }}>
            Paste Scanned Packet String (Starts with CCM1: or JSON)
          </label>
          <textarea
            id="mesh-input"
            className="form-textarea"
            rows={4}
            placeholder="Paste raw packet data string here..."
            value={pasteInput}
            onChange={(e) => setPasteInput(e.target.value)}
            style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDemoPacket}
            style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
          >
            <Sparkles size={14} className="text-yellow-400" />
            <span>Simulate Peer QR Scan</span>
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem' }}
            >
              Done
            </button>

            <button
              type="button"
              className="btn btn-yellow"
              onClick={() => handleImport(pasteInput)}
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
            >
              <ArrowDownToLine size={16} />
              <span>Import to Carrier Bag</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
