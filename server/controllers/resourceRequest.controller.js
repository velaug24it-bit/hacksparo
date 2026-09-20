const resourceRequestService = require('../services/resourceRequest.service');
const foodBridgeService = require('../services/foodBridge.service');

class ResourceRequestController {
  /**
   * POST /api/resource-requests
   * Create a new resource request
   */
  async createRequest(req, res, next) {
    try {
      const created = await resourceRequestService.createRequest(req.body);

      return res.status(201).json({
        success: true,
        message: 'Resource request created successfully',
        data: created
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/resource-requests
   * List all resource requests with optional query filters
   */
  async getRequests(req, res, next) {
    try {
      const { status, urgency, resourceType } = req.query;
      const filters = {};
      if (status) filters.status = status;
      if (urgency) filters.urgency = urgency;
      if (resourceType) filters.resourceType = resourceType;

      const requests = await resourceRequestService.getAllRequests(filters);

      return res.status(200).json({
        success: true,
        count: requests.length,
        data: requests
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/resource-requests/:id
   * Get single request details by ID
   */
  async getRequestById(req, res, next) {
    try {
      const { id } = req.params;
      const request = await resourceRequestService.getRequestById(id);

      if (!request) {
        return res.status(404).json({
          success: false,
          message: `Resource request "${id}" not found.`
        });
      }

      return res.status(200).json({
        success: true,
        data: request
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/resource-requests/:id/status
   * Update request status
   */
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, note } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status field is required.'
        });
      }

      const updated = await resourceRequestService.updateStatus(id, status, note);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: `Resource request "${id}" not found.`
        });
      }

      return res.status(200).json({
        success: true,
        message: `Resource request status updated to ${status}`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/foodbridge/donors
   * Retrieve available food surplus donors
   */
  async getFoodDonors(req, res, next) {
    try {
      const donors = await foodBridgeService.getAvailableDonors(req.query);

      return res.status(200).json({
        success: true,
        count: donors.length,
        data: donors,
        sourceTag: 'DEMO FOOD SOURCES'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/resource-requests/:id/match-food
   * Match donor(s) for a food request
   */
  async matchFoodDonors(req, res, next) {
    try {
      const { id } = req.params;
      const { donorIds } = req.body;

      if (!donorIds || !Array.isArray(donorIds) || donorIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one donor ID must be selected to create a match.'
        });
      }

      const matchedRequest = await resourceRequestService.matchFoodDonors(id, donorIds);

      return res.status(200).json({
        success: true,
        message: 'Food rescue match successfully created and assigned.',
        data: matchedRequest
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/foodbridge/donors
   * Register a new surplus food source to avoid mock data
   */
  async createFoodDonor(req, res, next) {
    try {
      const { name, foodType, availableQuantity, location } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Facility or Donor name is required.' });
      }
      if (!foodType || !foodType.trim()) {
        return res.status(400).json({ success: false, message: 'Food item description is required.' });
      }
      if (!availableQuantity || parseInt(availableQuantity, 10) <= 0) {
        return res.status(400).json({ success: false, message: 'Available surplus meals count must be greater than 0.' });
      }
      if (!location || !location.trim()) {
        return res.status(400).json({ success: false, message: 'Location area is required.' });
      }

      const created = await foodBridgeService.createDonor(req.body);

      return res.status(201).json({
        success: true,
        message: `Surplus food source "${created.name}" registered successfully with ${created.availableQuantity} meals.`,
        data: created
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/foodbridge/donors/:id
   * Remove a food donor
   */
  async deleteFoodDonor(req, res, next) {
    try {
      const { id } = req.params;
      const result = await foodBridgeService.deleteDonor(id);
      return res.status(200).json({
        success: true,
        message: 'Food donor removed successfully.',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ResourceRequestController();
