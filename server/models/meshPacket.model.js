const mongoose = require('mongoose');
const { isConnected } = require('../config/db');

const MeshPacketSchema = new mongoose.Schema({
  packetId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  originalRequestId: {
    type: String,
    required: true
  },
  hops: {
    type: Number,
    default: 1
  },
  relayedBy: {
    type: [String],
    default: []
  },
  payload: {
    type: Object,
    required: true
  },
  syncStatus: {
    type: String,
    enum: ['RELAYED', 'PROCESSED', 'DUPLICATE'],
    default: 'PROCESSED'
  },
  originTimestamp: {
    type: Date,
    default: Date.now
  },
  syncedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const MongoosePacketModel = mongoose.model('MeshPacket', MeshPacketSchema);

// In-Memory store fallback
const inMemoryPackets = new Map();

const MeshPacket = {
  create: async (data) => {
    if (isConnected()) {
      const doc = await MongoosePacketModel.create(data);
      return doc.toObject();
    }
    const doc = {
      ...data,
      _id: 'pkt_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    inMemoryPackets.set(doc.packetId, doc);
    return doc;
  },

  findOne: async (query) => {
    if (isConnected()) {
      const doc = await MongoosePacketModel.findOne(query);
      return doc ? doc.toObject() : null;
    }
    if (query.packetId) {
      return inMemoryPackets.get(query.packetId) || null;
    }
    return Array.from(inMemoryPackets.values()).find(p => {
      return Object.keys(query).every(k => p[k] === query[k]);
    }) || null;
  },

  find: async (filter = {}) => {
    if (isConnected()) {
      const docs = await MongoosePacketModel.find(filter).sort({ createdAt: -1 });
      return docs.map(d => d.toObject());
    }
    return Array.from(inMemoryPackets.values()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  countDocuments: async () => {
    if (isConnected()) {
      return await MongoosePacketModel.countDocuments();
    }
    return inMemoryPackets.size;
  }
};

module.exports = {
  MeshPacket,
  MongoosePacketModel
};
