import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Copy, Check, Download, X, ShieldAlert, Radio } from 'lucide-react';
import { offlineMesh } from '../services/offlineMesh.service';

export const QRPacketModal = ({ packet, onClose }) => {
  const [qrUrl, setQrUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [encodedString, setEncodedString] = useState('');

  useEffect(() => {
    if (!packet) return;

    const str = offlineMesh.encodePacketString(packet);
    setEncodedString(str);

    QRCode.toDataURL(str, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    }).then(url => {
      setQrUrl(url);
    }).catch(err => {
      console.error('[QRPacketModal] QR gen error:', err);
    });
  }, [packet]);

  if (!packet) return null;

  const handleCopy = () => {
    if (!encodedString) return;
    navigator.clipboard.writeText(encodedString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleDownload = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    a.download = `CRISIS-PACKET-${packet.packetId}.png`;
    a.click();
  };

  const resourcesText = packet.payload.resources?.map(r => `${r.quantity} ${r.unit} (${r.type})`).join(', ');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 520, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textAlign: 'left' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'rgba(250, 204, 21, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#facc15'
            }}>
              <QrCode size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: '#facc15', fontWeight: 700, textTransform: 'uppercase' }}>
                Offline Mesh Packet
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc' }}>
                {packet.packetId}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* QR Code Container */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 12,
          padding: '0.875rem',
          display: 'inline-block',
          maxWidth: '100%',
          margin: '0 auto 1rem auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
        }}>
          {qrUrl ? (
            <img src={qrUrl} alt="Crisis Mesh Packet QR" style={{ maxWidth: '100%', width: 260, height: 'auto', aspectRatio: '1/1', display: 'block' }} />
          ) : (
            <div style={{ maxWidth: '100%', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333' }}>
              Generating QR Code...
            </div>
          )}
        </div>

        {/* Packet Summary */}
        <div style={{
          backgroundColor: '#090d16',
          borderRadius: 8,
          border: '1px solid #1e293b',
          padding: '0.875rem',
          textAlign: 'left',
          fontSize: '0.85rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.35rem',
          marginBottom: '1rem'
        }}>
          <div>
            <span style={{ color: '#64748b' }}>Location: </span>
            <strong style={{ color: '#f8fafc' }}>{packet.payload.location?.area}, {packet.payload.location?.city}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>People in Need: </span>
            <strong style={{ color: '#facc15' }}>{packet.payload.peopleCount} individuals</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Resources: </span>
            <strong style={{ color: '#38bdf8' }}>{resourcesText}</strong>
          </div>
          <div>
            <span style={{ color: '#64748b' }}>Mesh Relay Hops: </span>
            <strong style={{ color: '#34d399' }}>{packet.hops || 1} peer hop(s)</strong>
          </div>
        </div>

        <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '1.25rem' }}>
          📱 <strong>Peer Relay Protocol:</strong> Any passing responder, volunteer, or neighbor can scan this QR code to store and carry your request until reaching an internet-connected zone.
        </p>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={handleCopy}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.875rem' }}
          >
            {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
            <span>{copied ? 'Copied Packet!' : 'Copy Packet String'}</span>
          </button>

          <button
            className="btn btn-yellow"
            onClick={handleDownload}
            style={{ fontSize: '0.825rem', padding: '0.5rem 0.875rem' }}
          >
            <Download size={16} />
            <span>Save QR Image</span>
          </button>
        </div>
      </div>
    </div>
  );
};
