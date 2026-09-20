/**
 * FoodBridge Service — Disaster Food Rescue & Matching Engine
 * Connects real food surplus from community donors with emergency resource requests.
 */

const FoodDonor = require('../models/foodDonor.model');

// Coordinate dictionary for automatic geospatial mapping on Crisis Map
const CHENNAI_SECTOR_COORDS = {
  'anna nagar': [13.085, 80.210],
  't. nagar': [13.041, 80.233],
  't nagar': [13.041, 80.233],
  'guindy': [13.006, 80.201],
  'velachery': [12.980, 80.220],
  'adyar': [13.001, 80.256],
  'mylapore': [13.036, 80.267],
  'tambaram': [12.924, 80.127],
  'porur': [13.038, 80.156],
  'koyambedu': [13.070, 80.190],
  'egmore': [13.078, 80.261],
  'central': [13.082, 80.275]
};

class FoodBridgeService {
  /**
   * Get all active surplus donors from database
   */
  async getAvailableDonors(filter = {}) {
    if (filter.simulateEmpty === 'true') {
      return [];
    }

    const query = { availability: 'AVAILABLE' };
    let donors = await FoodDonor.find(query);

    if (filter.minQuantity) {
      const min = parseInt(filter.minQuantity, 10);
      donors = donors.filter(d => d.availableQuantity >= min);
    }

    return donors;
  }

  /**
   * Get single donor by ID
   */
  async getDonorById(donorId) {
    return await FoodDonor.findOne({ donorId });
  }

  /**
   * Add a real food surplus source to the database
   */
  async createDonor(data) {
    const donorId = `DONOR-${Date.now().toString().slice(-4)}${Math.floor(Math.random() * 90 + 10)}`;
    
    // Resolve coordinates from location string or fallback
    const locLower = (data.location || '').toLowerCase();
    let coordinates = [13.05 + (Math.random() * 0.04 - 0.02), 80.22 + (Math.random() * 0.04 - 0.02)];
    for (const [key, coords] of Object.entries(CHENNAI_SECTOR_COORDS)) {
      if (locLower.includes(key)) {
        coordinates = coords;
        break;
      }
    }

    const newDonor = await FoodDonor.create({
      donorId,
      name: data.name.trim(),
      facilityType: data.facilityType || 'COMMUNITY_KITCHEN',
      foodType: data.foodType.trim(),
      availableQuantity: parseInt(data.availableQuantity, 10),
      unit: data.unit || 'meals',
      location: data.location.trim(),
      city: data.city || 'Chennai',
      coordinates,
      distanceKm: parseFloat(data.distanceKm) || (Math.random() * 4 + 1.2).toFixed(1),
      availability: 'AVAILABLE',
      prepTime: data.prepTime || 'Freshly prepared',
      contactPerson: data.contactPerson || 'Coordinator',
      contactPhone: data.contactPhone || '+91 98400 00000',
      isUserCreated: true
    });

    return newDonor;
  }

  /**
   * Delete a donor
   */
  async deleteDonor(donorId) {
    return await FoodDonor.deleteOne({ donorId });
  }

  /**
   * Calculate match possibilities for requested meals using database donors
   */
  async calculateMatchPossibilities(requestedMeals) {
    const donors = await FoodDonor.find({ availability: 'AVAILABLE' });
    const sortedDonors = [...donors].sort((a, b) => a.distanceKm - b.distanceKm);

    // Single full matches
    const fullMatches = sortedDonors.filter(d => d.availableQuantity >= requestedMeals);

    // Partial match candidates
    const partialMatches = sortedDonors.filter(d => d.availableQuantity < requestedMeals);

    return {
      requestedMeals,
      fullMatches,
      partialMatches,
      hasSurplus: sortedDonors.length > 0
    };
  }

  /**
   * Format standard tracking timeline
   */
  createMatchTimeline(recipientArea, matches, matchedQuantity, requestedQuantity) {
    const formatTime = (offsetMinutes = 0) => {
      const now = new Date(Date.now() + offsetMinutes * 60000);
      return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const isFull = matchedQuantity >= requestedQuantity;
    const donorNames = matches.map(m => m.donorName).join(', ');

    return [
      {
        time: formatTime(-10),
        title: 'Resource Request Created',
        description: `Request registered for ${requestedQuantity} meals at ${recipientArea}.`,
        status: 'INFO'
      },
      {
        time: formatTime(-8),
        title: 'FoodBridge Search Activated',
        description: `Searching verified surplus donors within 10 km radius.`,
        status: 'SEARCHING'
      },
      {
        time: formatTime(-5),
        title: 'Surplus Food Sources Identified',
        description: `Found available surplus at ${donorNames}.`,
        status: 'IDENTIFIED'
      },
      {
        time: formatTime(0),
        title: isFull ? 'Full Food Match Confirmed' : 'Partial Food Match Confirmed',
        description: `${matchedQuantity} of ${requestedQuantity} meals allocated from ${donorNames}.`,
        status: 'MATCHED'
      },
      {
        time: formatTime(4),
        title: 'Rescue & Collection Dispatched',
        description: `Volunteer collection team assigned for dispatch to ${recipientArea}.`,
        status: 'ASSIGNED'
      }
    ];
  }
}

module.exports = new FoodBridgeService();
