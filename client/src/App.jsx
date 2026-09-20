import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { NetworkStatusBar } from './components/NetworkStatusBar';
import { ResourceAssistance } from './pages/ResourceAssistance';
import { FoodBridgeMatching } from './pages/FoodBridgeMatching';
import { RequestDashboard } from './pages/RequestDashboard';
import { RequestDetail } from './pages/RequestDetail';
import { OfflineMeshRelay } from './pages/OfflineMeshRelay';
import { CrisisMap } from './pages/CrisisMap';

export const App = () => {
  return (
    <div className="app-container">
      <Navbar />
      <NetworkStatusBar />
      <main className="main-content">
        <Routes>
          {/* Default entry point: Green SOS Resource Assistance */}
          <Route path="/" element={<ResourceAssistance />} />
          <Route path="/resource-assistance" element={<ResourceAssistance />} />

          {/* Yellow SOS Module: Offline Crisis Mesh & QR Packet Relay */}
          <Route path="/mesh-relay" element={<OfflineMeshRelay />} />

          {/* Interactive Geospatial Crisis & Surplus Map */}
          <Route path="/crisis-map" element={<CrisisMap />} />

          {/* FoodBridge Surplus Matching */}
          <Route path="/foodbridge" element={<FoodBridgeMatching />} />
          <Route path="/foodbridge/:requestId" element={<FoodBridgeMatching />} />

          {/* Requests Status Registry & Details */}
          <Route path="/requests" element={<RequestDashboard />} />
          <Route path="/requests/:id" element={<RequestDetail />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid #1e293b',
        padding: '1.5rem 1rem',
        textAlign: 'center',
        color: '#64748b',
        fontSize: '0.8125rem',
        backgroundColor: '#090d16'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <strong>CrisisCare Mesh</strong> • Green Resource Assistance & Yellow Offline Mesh Relay
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span>🟢 Resource Assistance</span>
            <span>🟡 Offline Mesh Relay (NSL-02)</span>
            <span>🗺️ Crisis Radar Map</span>
            <span>🍱 FoodBridge Surplus Rescue</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
