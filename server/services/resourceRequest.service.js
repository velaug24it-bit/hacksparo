const { ResourceRequest } = require('../models/resourceRequest.model');
const foodBridgeService = require('./foodBridge.service');

class ResourceRequestService {
  /**
   * Generate sequential, readable Request ID (e.g. RR-1024)
   */
  async generateRequestId() {
    const count = await ResourceRequest.countDocuments();
    const sequence = 1000 + count + 1;
    return `RR-${sequence}`;
  }

  /**
   * Create a new resource request
   */
  async createRequest(payload) {
    const requestId = await this.generateRequestId();

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Initial timeline event
    const initialTimeline = [
      {
        time: nowStr,
        title: 'Resource Request Created',
        description: `Registered assistance request for ${payload.peopleCount} people.`,
        status: 'PENDING'
      }
    ];

    // Check if FOOD is requested to initialize FoodBridge status
    const foodItem = payload.resources.find(r => r.type === 'food');
    const hasFood = Boolean(foodItem);

    const initialStatus = hasFood ? 'MATCHING' : 'PENDING';

    if (hasFood) {
      initialTimeline.push({
        time: nowStr,
        title: 'FoodBridge Auto-Search Activated',
        description: `Initiated surplus food matching for ${foodItem.quantity} meals.`,
        status: 'SEARCHING'
      });
    }

    const newRequest = {
      requestId,
      type: 'RESOURCE_REQUEST',
      resources: payload.resources,
      peopleCount: payload.peopleCount,
      urgency: payload.urgency,
      location: {
        area: payload.location.area,
        city: payload.location.city,
        landmark: payload.location.landmark || ''
      },
      description: payload.description,
      status: initialStatus,
      foodBridgeMatch: {
        matched: false,
        status: hasFood ? 'SEARCHING' : 'NONE',
        requestedQuantity: foodItem ? foodItem.quantity : 0,
        matchedQuantity: 0,
        remainingQuantity: foodItem ? foodItem.quantity : 0,
        matches: []
      },
      timeline: initialTimeline
    };

    return await ResourceRequest.create(newRequest);
  }

  /**
   * Get all requests with optional filters
   */
  async getAllRequests(filters = {}) {
    return await ResourceRequest.find(filters);
  }

  /**
   * Get request by requestId (e.g. RR-1024)
   */
  async getRequestById(requestId) {
    return await ResourceRequest.findOne({ requestId });
  }

  /**
   * Update request status (guarded against invalid statuses)
   */
  async updateStatus(requestId, status, note = '') {
    const validStatuses = ['PENDING', 'MATCHING', 'MATCHED', 'ASSIGNED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status "${status}". Allowed: ${validStatuses.join(', ')}`);
    }

    const existing = await ResourceRequest.findOne({ requestId });
    if (!existing) {
      return null;
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const timeline = [...(existing.timeline || [])];
    timeline.push({
      time: nowStr,
      title: `Status Updated to ${status}`,
      description: note || `Request status transitioned to ${status}.`,
      status
    });

    return await ResourceRequest.findOneAndUpdate(
      { requestId },
      { status, timeline }
    );
  }

  /**
   * Perform FoodBridge match (single or multiple donors)
   */
  async matchFoodDonors(requestId, donorIds) {
    const request = await ResourceRequest.findOne({ requestId });
    if (!request) {
      throw new Error('Resource request not found');
    }

    const foodItem = request.resources.find(r => r.type === 'food');
    if (!foodItem) {
      throw new Error('This request does not contain a food resource');
    }

    const requestedMeals = foodItem.quantity;
    const matches = [];
    let allocatedTotal = 0;

    for (const donorId of donorIds) {
      const donor = await foodBridgeService.getDonorById(donorId);
      if (!donor) continue;

      const remainingNeeded = requestedMeals - allocatedTotal;
      if (remainingNeeded <= 0) break;

      const alloc = Math.min(donor.availableQuantity, remainingNeeded);
      matches.push({
        donorId: donor.donorId,
        donorName: donor.name,
        allocatedMeals: alloc,
        distanceKm: donor.distanceKm,
        foodType: donor.foodType
      });
      allocatedTotal += alloc;
    }

    if (matches.length === 0) {
      throw new Error('No valid donors provided for matching');
    }

    const isFullMatch = allocatedTotal >= requestedMeals;
    const remainingMeals = Math.max(0, requestedMeals - allocatedTotal);
    const newStatus = isFullMatch ? 'MATCHED' : 'MATCHING';
    const foodBridgeStatus = isFullMatch ? 'MATCHED' : 'PARTIAL';

    const timeline = foodBridgeService.createMatchTimeline(
      request.location.area,
      matches,
      allocatedTotal,
      requestedMeals
    );

    const updated = await ResourceRequest.findOneAndUpdate(
      { requestId },
      {
        status: newStatus,
        foodBridgeMatch: {
          matched: true,
          status: foodBridgeStatus,
          requestedQuantity: requestedMeals,
          matchedQuantity: allocatedTotal,
          remainingQuantity: remainingMeals,
          matches,
          matchedAt: new Date(),
          notes: isFullMatch
            ? 'Full food rescue match confirmed.'
            : `Partial match: ${allocatedTotal} of ${requestedMeals} meals allocated.`
        },
        timeline
      }
    );

    return updated;
  }
}

module.exports = new ResourceRequestService();
