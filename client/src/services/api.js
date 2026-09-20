/**
 * API Service Client
 * Handles HTTP requests to the CrisisCare Mesh Node.js/Express Backend.
 * Features dual-strategy routing (Vite proxy + direct port 5000 fallback).
 */

const handleResponse = async (response) => {
  let json = {};
  try {
    json = await response.json();
  } catch (err) {
    json = { message: 'Failed to parse response from server' };
  }

  if (!response.ok) {
    const errorMsg = json.errors ? json.errors.join(', ') : (json.message || 'Request failed');
    const err = new Error(errorMsg);
    err.status = response.status;
    err.details = json;
    throw err;
  }

  return json;
};

// Resilient fetch: uses Vite proxy (/api) first, then falls back to direct http://localhost:5000/api
const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  // Strategy 1: Relative /api (proxied seamlessly by Vite without CORS)
  try {
    const res = await fetch(`/api${cleanEndpoint}`, options);
    return await handleResponse(res);
  } catch (proxyError) {
    console.warn(`[API] Proxy fetch to /api${cleanEndpoint} failed, attempting direct backend connection...`, proxyError.message);
  }

  // Strategy 2: Direct backend URL fallback
  const directUrl = `http://localhost:5000/api${cleanEndpoint}`;
  const directRes = await fetch(directUrl, options);
  return await handleResponse(directRes);
};

export const api = {
  // Check backend connectivity
  checkHealth: async () => {
    return await apiFetch('/health');
  },

  // Submit a new resource request
  createResourceRequest: async (payload) => {
    return await apiFetch('/resource-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // List resource requests
  getResourceRequests: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiFetch(`/resource-requests${query ? `?${query}` : ''}`);
  },

  // Get specific request by ID (e.g. RR-1024)
  getResourceRequestById: async (id) => {
    return await apiFetch(`/resource-requests/${id}`);
  },

  // Update status (e.g. PENDING, MATCHED, DELIVERED)
  updateStatus: async (id, status, note = '') => {
    return await apiFetch(`/resource-requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note })
    });
  },

  // Get FoodBridge surplus donors
  getFoodDonors: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiFetch(`/foodbridge/donors${query ? `?${query}` : ''}`);
  },

  // Register a new real food surplus source to avoid mock data
  createFoodDonor: async (payload) => {
    return await apiFetch('/foodbridge/donors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // Delete a food donor
  deleteFoodDonor: async (donorId) => {
    return await apiFetch(`/foodbridge/donors/${donorId}`, {
      method: 'DELETE'
    });
  },

  // Create FoodBridge match
  matchFoodDonors: async (requestId, donorIds) => {
    return await apiFetch(`/resource-requests/${requestId}/match-food`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ donorIds })
    });
  },

  // Bulk sync offline mesh packets
  syncMeshPackets: async (packets, relayNodeId = 'NODE_BROWSER_RELAY') => {
    return await apiFetch('/mesh/sync-packets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packets, relayNodeId })
    });
  },

  // Get network relay logs
  getRelayedPackets: async () => {
    return await apiFetch('/mesh/packets');
  },

  // Get disaster coordinates for the crisis map
  getMapLocations: async () => {
    return await apiFetch('/map/locations');
  }
};
