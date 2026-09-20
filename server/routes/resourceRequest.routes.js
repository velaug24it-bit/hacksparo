const express = require('express');
const router = express.Router();
const resourceRequestController = require('../controllers/resourceRequest.controller');
const { validateResourceRequest } = require('../middleware/validator');

// Create a new resource request (with validation)
router.post('/resource-requests', validateResourceRequest, (req, res, next) => {
  resourceRequestController.createRequest(req, res, next);
});

// List resource requests with optional filters (?status=&urgency=&resourceType=)
router.get('/resource-requests', (req, res, next) => {
  resourceRequestController.getRequests(req, res, next);
});

// Get a single resource request by ID (e.g. RR-1024)
router.get('/resource-requests/:id', (req, res, next) => {
  resourceRequestController.getRequestById(req, res, next);
});

// Update request status (PENDING, MATCHING, MATCHED, ASSIGNED, DELIVERED, CANCELLED)
router.patch('/resource-requests/:id/status', (req, res, next) => {
  resourceRequestController.updateStatus(req, res, next);
});

// Get available food surplus donors
router.get('/foodbridge/donors', (req, res, next) => {
  resourceRequestController.getFoodDonors(req, res, next);
});

// Register a new food surplus source
router.post('/foodbridge/donors', (req, res, next) => {
  resourceRequestController.createFoodDonor(req, res, next);
});

// Remove a food donor
router.delete('/foodbridge/donors/:id', (req, res, next) => {
  resourceRequestController.deleteFoodDonor(req, res, next);
});

// Confirm FoodBridge match for a request
router.post('/resource-requests/:id/match-food', (req, res, next) => {
  resourceRequestController.matchFoodDonors(req, res, next);
});

module.exports = router;
