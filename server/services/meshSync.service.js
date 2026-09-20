const { MeshPacket } = require('../models/meshPacket.model');
const { ResourceRequest } = require('../models/resourceRequest.model');
const resourceRequestService = require('./resourceRequest.service');
const foodBridgeService = require('./foodBridge.service');

// Known geo-coordinates for disaster map visualization (Chennai sector demo)
const GEO_LOCATIONS = {
  shelters: [
    {
      id: 'SHELTER-01',
      name: 'ABC Relief Shelter',
      area: 'Anna Nagar West',
      city: 'Chennai',
      coordinates: [13.0850, 80.2101],
      capacity: 250,
      occupied: 180,
      status: 'HIGH_DEMAND',
      urgency: 'HIGH',
      needs: ['food', 'water'],
      contact: '+91 98401 23456'
    },
    {
      id: 'SHELTER-02',
      name: 'St. Mary Community Hall Relief Camp',
      area: 'T. Nagar',
      city: 'Chennai',
      coordinates: [13.0418, 80.2341],
      capacity: 400,
      occupied: 390,
      status: 'CRITICAL',
      urgency: 'CRITICAL',
      needs: ['drinking_water', 'medicine', 'baby_supplies'],
      contact: '+91 98402 34567'
    },
    {
      id: 'SHELTER-03',
      name: 'Government Higher Secondary Shelter',
      area: 'Guindy',
      city: 'Chennai',
      coordinates: [13.0067, 80.2025],
      capacity: 300,
      occupied: 110,
      status: 'MODERATE',
      urgency: 'MODERATE',
      needs: ['essential_supplies'],
      contact: '+91 98403 45678'
    },
    {
      id: 'SHELTER-04',
      name: 'Koyambedu Disaster Evacuation Center',
      area: 'Koyambedu',
      city: 'Chennai',
      coordinates: [13.0694, 80.1948],
      capacity: 500,
      occupied: 420,
      status: 'HIGH_DEMAND',
      urgency: 'HIGH',
      needs: ['food', 'shelter'],
      contact: '+91 98404 56789'
    }
  ],
  foodDonors: [
    {
      donorId: 'DONOR-001',
      name: 'ABC College Campus Mess',
      type: 'College Mess',
      availableMeals: 120,
      coordinates: [13.0827, 80.2150],
      address: 'Anna Nagar, Chennai',
      prepTime: 'Freshly packed 45 mins ago',
      status: 'AVAILABLE'
    },
    {
      donorId: 'DONOR-002',
      name: 'City Community Kitchen',
      type: 'NGO Kitchen',
      availableMeals: 80,
      coordinates: [13.0450, 80.2310],
      address: 'T. Nagar, Chennai',
      prepTime: 'Ready for pickup',
      status: 'AVAILABLE'
    },
    {
      donorId: 'DONOR-003',
      name: 'Green Restaurant Central Kitchen',
      type: 'Restaurant Kitchen',
      availableMeals: 150,
      coordinates: [13.0100, 80.2080],
      address: 'Guindy, Chennai',
      prepTime: 'Hot meals packaged',
      status: 'AVAILABLE'
    },
    {
      donorId: 'DONOR-004',
      name: 'Metro Relief Pantry',
      type: 'Distribution Depot',
      availableMeals: 40,
      coordinates: [13.0720, 80.1980],
      address: 'Koyambedu, Chennai',
      prepTime: 'Dry rations & ready meals',
      status: 'AVAILABLE'
    }
  ]
};

class MeshSyncService {
  /**
   * Process a batch of offline packets uploaded from a relay node/volunteer
   */
  async processBatchPackets(packets = [], relayNodeId = 'NODE_BROWSER_RELAY') {
    const results = {
      totalReceived: packets.length,
      processed: 0,
      duplicates: 0,
      createdRequests: [],
      errors: []
    };

    for (const packet of packets) {
      try {
        if (!packet.packetId || !packet.payload) {
          results.errors.push({ packetId: packet.packetId || 'unknown', error: 'Invalid packet structure' });
          continue;
        }

        // 1. Deduplication check
        const existing = await MeshPacket.findOne({ packetId: packet.packetId });
        if (existing) {
          results.duplicates++;
          continue;
        }

        // 2. Format resource request from packet payload
        const payload = packet.payload;
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        // Generate official Request ID if not present
        const officialRequestId = await resourceRequestService.generateRequestId();

        const timeline = [
          {
            time: nowStr,
            title: 'Created Offline via Crisis Mesh',
            description: `Generated off-grid with packet hash ${packet.packetId.slice(0, 8)}... (Relayed by ${packet.hops || 1} peer hops).`,
            status: 'OFFLINE_ORIGIN'
          },
          {
            time: nowStr,
            title: 'Relayed to Cloud Gateway',
            description: `Transmitted to central database via Relay Node [${relayNodeId}].`,
            status: 'SYNCHRONIZED'
          }
        ];

        const foodItem = payload.resources?.find(r => r.type === 'food');
        const hasFood = Boolean(foodItem);

        if (hasFood) {
          timeline.push({
            time: nowStr,
            title: 'FoodBridge Auto-Search Activated',
            description: `Automated donor search started for ${foodItem.quantity} meals.`,
            status: 'SEARCHING'
          });
        }

        const createdRequest = await ResourceRequest.create({
          requestId: officialRequestId,
          type: 'RESOURCE_REQUEST',
          resources: payload.resources || [],
          peopleCount: payload.peopleCount || 1,
          urgency: payload.urgency || 'HIGH',
          location: {
            area: payload.location?.area || 'Offline Relayed Site',
            city: payload.location?.city || 'Chennai',
            landmark: payload.location?.landmark ? `${payload.location.landmark} [Relayed via Mesh]` : '[Relayed via Offline Mesh]'
          },
          description: payload.description || 'Offline resource packet relayed via peer mesh courier.',
          status: hasFood ? 'MATCHING' : 'PENDING',
          foodBridgeMatch: {
            matched: false,
            status: hasFood ? 'SEARCHING' : 'NONE',
            requestedQuantity: foodItem ? foodItem.quantity : 0,
            matchedQuantity: 0,
            remainingQuantity: foodItem ? foodItem.quantity : 0,
            matches: []
          },
          timeline
        });

        // 3. Store record in MeshPacket collection
        await MeshPacket.create({
          packetId: packet.packetId,
          originalRequestId: officialRequestId,
          hops: (packet.hops || 0) + 1,
          relayedBy: [...(packet.relayedBy || []), relayNodeId],
          payload: packet.payload,
          syncStatus: 'PROCESSED',
          originTimestamp: packet.originTimestamp || new Date(),
          syncedAt: new Date()
        });

        results.processed++;
        results.createdRequests.push({
          packetId: packet.packetId,
          requestId: officialRequestId,
          urgency: createdRequest.urgency,
          peopleCount: createdRequest.peopleCount
        });

      } catch (err) {
        results.errors.push({ packetId: packet.packetId, error: err.message });
      }
    }

    return results;
  }

  /**
   * Get all relayed mesh packet logs
   */
  async getRelayedPackets() {
    return await MeshPacket.find();
  }

  /**
   * Get crisis map coordinates (combines relief shelters and real dynamic food donors)
   */
  async getMapLocations() {
    try {
      const donors = await foodBridgeService.getAvailableDonors();
      const dynamicDonors = donors.map(d => ({
        donorId: d.donorId,
        name: d.name,
        type: d.facilityType ? d.facilityType.replace('_', ' ') : 'Food Surplus Source',
        availableMeals: d.availableQuantity,
        coordinates: d.coordinates && d.coordinates.length === 2 ? d.coordinates : [13.05, 80.22],
        address: d.location || 'Chennai',
        area: d.location || 'Chennai',
        city: d.city || 'Chennai',
        prepTime: d.prepTime || 'Freshly prepared',
        status: d.availability || 'AVAILABLE'
      }));

      return {
        shelters: GEO_LOCATIONS.shelters,
        foodDonors: dynamicDonors.length > 0 ? dynamicDonors : GEO_LOCATIONS.foodDonors
      };
    } catch (err) {
      console.error('[meshSyncService] getMapLocations error:', err);
      return GEO_LOCATIONS;
    }
  }
}

module.exports = new MeshSyncService();
