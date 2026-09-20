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

// Detect API base URL: supports custom VITE_API_URL, live Render cloud backend, or local dev proxy
const getApiBase = () => {
  if (import.meta.env && import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    // If hosted on Render (e.g. hacksparo-1.onrender.com) or any remote domain
    if (window.location.hostname.includes('onrender.com') || 
       (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
      return 'https://hacksparo.onrender.com/api';
    }
  }
  return '/api';
};

// Resilient multi-tier fetch with automatic cloud & localhost fallbacks
const apiFetch = async (endpoint, options = {}) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const base = getApiBase();
  const primaryUrl = `${base}${cleanEndpoint}`;

  // Strategy 1: Primary configured/detected URL
  try {
    const res = await fetch(primaryUrl, options);
    return await handleResponse(res);
  } catch (primaryError) {
    console.warn(`[API] Primary fetch to ${primaryUrl} failed, trying fallback...`, primaryError.message);
  }

  // Strategy 2: Direct live Render backend fallback (if primary wasn't already Render)
  if (!primaryUrl.includes('hacksparo.onrender.com')) {
    try {
      const renderUrl = `https://hacksparo.onrender.com/api${cleanEndpoint}`;
      const renderRes = await fetch(renderUrl, options);
      return await handleResponse(renderRes);
    } catch (renderError) {
      console.warn('[API] Cloud Render fallback failed:', renderError.message);
    }
  }

  // Strategy 3: Localhost fallback for local offline development
  const localUrl = `http://localhost:5000/api${cleanEndpoint}`;
  const localRes = await fetch(localUrl, options);
  return await handleResponse(localRes);
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
