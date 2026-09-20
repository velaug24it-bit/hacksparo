/**
 * Offline Crisis Mesh Service
 * Powers off-grid packet creation, QR encoding/decoding, peer courier relay, and auto-sync.
 */

import { api } from './api';

const STORAGE_KEY = 'crisiscare_offline_packets';
const SIMULATE_OFFLINE_KEY = 'crisiscare_simulate_offline';
const NODE_ID_KEY = 'crisiscare_local_node_id';

class OfflineMeshService {
  constructor() {
    // Generate or retrieve persistent local mesh node ID
    let nodeId = localStorage.getItem(NODE_ID_KEY);
    if (!nodeId) {
      nodeId = 'NODE_' + Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem(NODE_ID_KEY, nodeId);
    }
    this.localNodeId = nodeId;
    this.listeners = [];

    // Browser network listeners
    window.addEventListener('online', () => this.handleNetworkChange());
    window.addEventListener('offline', () => this.handleNetworkChange());
  }

  getLocalNodeId() {
    return this.localNodeId;
  }

  isOnline() {
    const isSimulatedOffline = localStorage.getItem(SIMULATE_OFFLINE_KEY) === 'true';
    if (isSimulatedOffline) return false;
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  setSimulateOffline(enabled) {
    localStorage.setItem(SIMULATE_OFFLINE_KEY, enabled ? 'true' : 'false');
    this.notifyListeners();
    if (!enabled && this.isOnline()) {
      this.attemptAutoSync();
    }
  }

  isSimulatedOffline() {
    return localStorage.getItem(SIMULATE_OFFLINE_KEY) === 'true';
  }

  /**
   * Get all queued packets stored on this device
   */
  getPackets() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('[OfflineMesh] Failed to load packets:', err);
      return [];
    }
  }

  savePackets(packets) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(packets));
      this.notifyListeners();
    } catch (err) {
      console.error('[OfflineMesh] Failed to save packets:', err);
    }
  }

  /**
   * Create a new crisis packet off-grid
   */
  createPacket(resourcePayload) {
    const packetId = 'PKT-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const packet = {
      packetId,
      hops: 1,
      relayedBy: [this.localNodeId],
      originTimestamp: new Date().toISOString(),
      payload: resourcePayload,
      status: 'QUEUED_LOCALLY'
    };

    const current = this.getPackets();
    // Prepend new packet
    this.savePackets([packet, ...current]);
    return packet;
  }

  /**
   * Add a relayed packet collected from another peer (via QR scan or paste)
   */
  importRelayedPacket(rawPacket) {
    const packet = typeof rawPacket === 'string' ? this.decodePacketString(rawPacket) : rawPacket;
    if (!packet || !packet.packetId || !packet.payload) {
      throw new Error('Invalid or corrupted Crisis Mesh packet.');
    }

    const current = this.getPackets();
    const exists = current.some(p => p.packetId === packet.packetId);
    if (exists) {
      return { packet, duplicate: true };
    }

    // Increment hop count & append this device to courier chain
    const updatedPacket = {
      ...packet,
      hops: (packet.hops || 1) + 1,
      relayedBy: [...(packet.relayedBy || []), this.localNodeId],
      importedAt: new Date().toISOString(),
      status: 'RELAY_CARRIER'
    };

    this.savePackets([updatedPacket, ...current]);
    return { packet: updatedPacket, duplicate: false };
  }

  /**
   * Encode packet object to compact Base64 string for high-density QR representation
   */
  encodePacketString(packet) {
    try {
      const json = JSON.stringify({
        id: packet.packetId,
        h: packet.hops || 1,
        t: packet.originTimestamp,
        r: packet.relayedBy || [],
        p: packet.payload
      });
      // Unicode safe Base64
      return 'CCM1:' + btoa(unescape(encodeURIComponent(json)));
    } catch (err) {
      console.error('[OfflineMesh] Encoding error:', err);
      return '';
    }
  }

  /**
   * Decode Base64 or raw JSON string into packet object
   */
  decodePacketString(str) {
    if (!str || typeof str !== 'string') return null;
    let cleanStr = str.trim();
    if (cleanStr.startsWith('CCM1:')) {
      cleanStr = cleanStr.slice(5);
      try {
        const jsonStr = decodeURIComponent(escape(atob(cleanStr)));
        const parsed = JSON.parse(jsonStr);
        return {
          packetId: parsed.id,
          hops: parsed.h,
          originTimestamp: parsed.t,
          relayedBy: parsed.r,
          payload: parsed.p
        };
      } catch (err) {
        console.error('[OfflineMesh] Failed to decode Base64 packet:', err);
        return null;
      }
    }

    // Attempt plain JSON
    try {
      return JSON.parse(cleanStr);
    } catch (err) {
      return null;
    }
  }

  /**
   * Delete a single packet from queue
   */
  deletePacket(packetId) {
    const current = this.getPackets();
    this.savePackets(current.filter(p => p.packetId !== packetId));
  }

  /**
   * Clear all packets
   */
  clearAllPackets() {
    this.savePackets([]);
  }

  /**
   * Synchronize all stored packets with backend MongoDB
   */
  async syncAllPackets() {
    const packets = this.getPackets();
    if (packets.length === 0) {
      return { syncedCount: 0, message: 'No packets in queue to sync.' };
    }

    if (!this.isOnline()) {
      throw new Error('Device is currently off-grid. Connect to internet or disable offline simulation to sync.');
    }

    const response = await api.syncMeshPackets(packets, this.localNodeId);
    const result = response.data;

    // Clear packets that were processed or duplicate
    this.clearAllPackets();

    return {
      syncedCount: result.processed,
      duplicateCount: result.duplicates,
      createdRequests: result.createdRequests,
      message: `Successfully synchronized ${result.processed} packets with cloud command hub!`
    };
  }

  /**
   * Auto-sync when reconnecting
   */
  async attemptAutoSync() {
    if (!this.isOnline()) return;
    const packets = this.getPackets();
    if (packets.length > 0) {
      console.log(`[OfflineMesh] Auto-syncing ${packets.length} packets to central gateway...`);
      try {
        await this.syncAllPackets();
      } catch (err) {
        console.warn('[OfflineMesh] Auto-sync attempt deferred:', err.message);
      }
    }
  }

  handleNetworkChange() {
    this.notifyListeners();
    if (this.isOnline()) {
      this.attemptAutoSync();
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener({
      isOnline: this.isOnline(),
      isSimulated: this.isSimulatedOffline(),
      packetCount: this.getPackets().length,
      packets: this.getPackets(),
      nodeId: this.localNodeId
    });

    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notifyListeners() {
    const state = {
      isOnline: this.isOnline(),
      isSimulated: this.isSimulatedOffline(),
      packetCount: this.getPackets().length,
      packets: this.getPackets(),
      nodeId: this.localNodeId
    };
    this.listeners.forEach(l => l(state));
  }
}

export const offlineMesh = new OfflineMeshService();
