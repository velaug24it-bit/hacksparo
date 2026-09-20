const express = require('express');
const router = express.Router();
const meshController = require('../controllers/mesh.controller');

// Bulk sync offline mesh packets
router.post('/mesh/sync-packets', (req, res, next) => {
  meshController.syncPackets(req, res, next);
});

// Get mesh packet transmission logs
router.get('/mesh/packets', (req, res, next) => {
  meshController.getPackets(req, res, next);
});

// Get disaster map coordinates
router.get('/map/locations', (req, res, next) => {
  meshController.getMapLocations(req, res, next);
});

module.exports = router;
