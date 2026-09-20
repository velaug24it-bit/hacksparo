const mongoose = require('mongoose');
const { isConnected } = require('../config/db');

const FoodDonorSchema = new mongoose.Schema({
  donorId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  facilityType: {
    type: String,
    enum: ['COLLEGE_MESS', 'WEDDING_HALL', 'RESTAURANT', 'COMMUNITY_KITCHEN', 'BAKERY', 'HOTEL', 'NGO', 'OTHER'],
    default: 'COMMUNITY_KITCHEN'
  },
  foodType: {
    type: String,
    required: true,
    trim: true
  },
  availableQuantity: {
    type: Number,
    required: true,
    min: 1
  },
  unit: {
    type: String,
    default: 'meals'
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    default: 'Chennai',
    trim: true
  },
  coordinates: {
    type: [Number],
    default: [13.05, 80.22]
  },
  distanceKm: {
    type: Number,
    default: 3.2
  },
  availability: {
    type: String,
    enum: ['AVAILABLE', 'MATCHED', 'EXPIRED'],
    default: 'AVAILABLE'
  },
  prepTime: {
    type: String,
    default: 'Freshly prepared'
  },
  contactPerson: {
    type: String,
    default: 'Food Coordinator'
  },
  contactPhone: {
    type: String,
    default: '+91 98400 00000'
  },
  isUserCreated: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

const MongooseFoodDonor = mongoose.model('FoodDonor', FoodDonorSchema);

// In-Memory store fallback
const inMemoryDonors = new Map();

// Initial seed donors
const SEED_DONORS = [
  {
    donorId: 'DONOR-001',
    name: 'ABC College Campus Mess',
    facilityType: 'COLLEGE_MESS',
    foodType: 'Prepared Meals & Rice Kits',
    availableQuantity: 120,
    unit: 'meals',
    location: 'Anna Nagar, Chennai',
    city: 'Chennai',
    coordinates: [13.085, 80.210],
    distanceKm: 2.4,
    availability: 'AVAILABLE',
    prepTime: 'Freshly packed 45 mins ago',
    contactPerson: 'Campus Food Coordinator',
    contactPhone: '+91 98401 11223',
    isUserCreated: false
  },
  {
    donorId: 'DONOR-002',
    name: 'City Community Kitchen',
    facilityType: 'COMMUNITY_KITCHEN',
    foodType: 'Nutritious Dal Khichdi & Breads',
    availableQuantity: 80,
    unit: 'meals',
    location: 'T. Nagar, Chennai',
    city: 'Chennai',
    coordinates: [13.041, 80.233],
    distanceKm: 4.1,
    availability: 'AVAILABLE',
    prepTime: 'Ready for pickup',
    contactPerson: 'Chef Raman',
    contactPhone: '+91 98402 33445',
    isUserCreated: false
  },
  {
    donorId: 'DONOR-003',
    name: 'Green Restaurant & Banquets',
    facilityType: 'RESTAURANT',
    foodType: 'Cooked Hot Dinners',
    availableQuantity: 150,
    unit: 'meals',
    location: 'Guindy, Chennai',
    city: 'Chennai',
    coordinates: [13.006, 80.201],
    distanceKm: 5.2,
    availability: 'AVAILABLE',
    prepTime: 'Prepared 30 mins ago',
    contactPerson: 'Operations Manager',
    contactPhone: '+91 98403 55667',
    isUserCreated: false
  },
  {
    donorId: 'DONOR-004',
    name: 'Metro Relief Pantry',
    facilityType: 'NGO',
    foodType: 'Dry Ration Packs & Ready Meals',
    availableQuantity: 40,
    unit: 'meals',
    location: 'Koyambedu, Chennai',
    city: 'Chennai',
    coordinates: [13.070, 80.190],
    distanceKm: 1.8,
    availability: 'AVAILABLE',
    prepTime: 'Immediate handover',
    contactPerson: 'Relief Coordinator',
    contactPhone: '+91 98404 77889',
    isUserCreated: false
  }
];

// Initialize seed in memory
SEED_DONORS.forEach(d => inMemoryDonors.set(d.donorId, { ...d, createdAt: new Date() }));

// Unified Model Adapter
const FoodDonor = {
  create: async (data) => {
    if (isConnected()) {
      const doc = await MongooseFoodDonor.create(data);
      return doc.toObject();
    }
    const doc = {
      ...data,
      _id: 'mem_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryDonors.set(doc.donorId, doc);
    return doc;
  },

  find: async (filter = {}) => {
    if (isConnected()) {
      // Ensure seed donors exist if empty
      const count = await MongooseFoodDonor.countDocuments();
      if (count === 0) {
        await MongooseFoodDonor.insertMany(SEED_DONORS);
      }
      return await MongooseFoodDonor.find(filter).sort({ createdAt: -1 }).lean();
    }
    let results = Array.from(inMemoryDonors.values());
    if (filter.availability) {
      results = results.filter(d => d.availability === filter.availability);
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  findOne: async (filter) => {
    if (isConnected()) {
      return await MongooseFoodDonor.findOne(filter).lean();
    }
    for (const d of inMemoryDonors.values()) {
      if (filter.donorId && d.donorId === filter.donorId) return d;
    }
    return null;
  },

  findOneAndUpdate: async (filter, update) => {
    if (isConnected()) {
      return await MongooseFoodDonor.findOneAndUpdate(filter, update, { new: true }).lean();
    }
    const donor = await FoodDonor.findOne(filter);
    if (!donor) return null;
    const updated = { ...donor, ...update, updatedAt: new Date() };
    inMemoryDonors.set(donor.donorId, updated);
    return updated;
  },

  deleteOne: async (filter) => {
    if (isConnected()) {
      return await MongooseFoodDonor.deleteOne(filter);
    }
    if (filter.donorId && inMemoryDonors.has(filter.donorId)) {
      inMemoryDonors.delete(filter.donorId);
      return { deletedCount: 1 };
    }
    return { deletedCount: 0 };
  }
};

module.exports = FoodDonor;
