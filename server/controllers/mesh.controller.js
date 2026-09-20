const meshSyncService = require('../services/meshSync.service');

class MeshController {
  /**
   * POST /api/mesh/sync-packets
   * Bulk ingest offline mesh packets
   */
  async syncPackets(req, res, next) {
    try {
      const { packets, relayNodeId } = req.body;

      if (!Array.isArray(packets) || packets.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Expected a non-empty array of mesh packets.'
        });
      }

      const summary = await meshSyncService.processBatchPackets(packets, relayNodeId);

      return res.status(200).json({
        success: true,
        message: `Processed ${summary.processed} new packets (${summary.duplicates} duplicates ignored).`,
        data: summary
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/mesh/packets
   * View all mesh packet logs
   */
  async getPackets(req, res, next) {
    try {
      const packets = await meshSyncService.getRelayedPackets();
      return res.status(200).json({
        success: true,
        count: packets.length,
        data: packets
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/map/locations
   * Get disaster coordinates for the interactive map
   */
  async getMapLocations(req, res, next) {
    try {
      const locations = await meshSyncService.getMapLocations();
      return res.status(200).json({
        success: true,
        data: locations
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MeshController();
