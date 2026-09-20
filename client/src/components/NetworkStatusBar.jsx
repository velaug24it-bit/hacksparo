import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Radio, Sparkles } from 'lucide-react';
import { offlineMesh } from '../services/offlineMesh.service';

export const NetworkStatusBar = ({ onSyncSuccess }) => {
  const [networkState, setNetworkState] = useState({
    isOnline: true,
    isSimulated: false,
    packetCount: 0,
    nodeId: ''
  });
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineMesh.subscribe((state) => {
      setNetworkState(state);
    });
    return unsubscribe;
  }, []);

  const handleToggleOfflineSimulation = () => {
    offlineMesh.setSimulateOffline(!networkState.isSimulated);
  };

  const handleManualSync = async () => {
    if (networkState.packetCount === 0 || !networkState.isOnline) return;
    setSyncing(true);
    try {
      const res = await offlineMesh.syncAllPackets();
      if (onSyncSuccess) onSyncSuccess(res);
    } catch (err) {
      console.error('[NetworkStatusBar] Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{
      backgroundColor: networkState.isOnline ? '#090d16' : '#2a1a04',
      borderBottom: `1px solid ${networkState.isOnline ? '#1e293b' : '#854d0e'}`,
      padding: '0.4rem 1rem',
      fontSize: '0.8rem',
      transition: 'all 0.3s ease'
    }}>
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        {/* Connection status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          {networkState.isOnline ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#34d399', fontWeight: 600 }}>
              <Wifi size={14} />
              <span>ONLINE: Gateway Connected</span>
              <span style={{ color: '#64748b' }}>• Node [{networkState.nodeId}]</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#facc15', fontWeight: 700 }}>
              <WifiOff size={14} className="animate-pulse" />
              <span>OFF-GRID MESH MODE</span>
              <span style={{ color: '#cbd5e1', fontWeight: 500 }}>
                ({networkState.packetCount} Crisis {networkState.packetCount === 1 ? 'Packet' : 'Packets'} in Carrier Bag)
              </span>
            </div>
          )}
        </div>

        {/* Action controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {networkState.packetCount > 0 && networkState.isOnline && (
            <button
              onClick={handleManualSync}
              disabled={syncing}
              className="btn btn-yellow"
              style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', borderRadius: 4 }}
            >
              <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
              <span>Sync {networkState.packetCount} Packets to Cloud</span>
            </button>
          )}

          {/* Offline simulator toggle for hackathon demo */}
          <button
            onClick={handleToggleOfflineSimulation}
            style={{
              background: networkState.isSimulated ? '#eab308' : '#1e293b',
              color: networkState.isSimulated ? '#0f172a' : '#94a3b8',
              border: `1px solid ${networkState.isSimulated ? '#facc15' : '#334155'}`,
              borderRadius: 4,
              padding: '0.2rem 0.5rem',
              fontSize: '0.725rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            title="Toggle off-grid mode to demonstrate offline QR generation & courier sync"
          >
            <Radio size={12} />
            <span>{networkState.isSimulated ? 'Exit Offline Sim' : 'Simulate Off-Grid'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
