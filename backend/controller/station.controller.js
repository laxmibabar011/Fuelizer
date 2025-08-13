import { sendResponse } from '../util/response.util.js';
import { StationRepository } from '../repository/station.repository.js';

export default class StationController {
  static async listBooths(req, res) {
    try {
      const repo = new StationRepository(req.tenantSequelize);
      // Ensure mapping list populated from Product Master fuels
      await repo.ensureFuelProductsFromMaster({
        ProductMasterProduct: req.ProductMasterProduct || req.tenantSequelize.models.ProductMasterProduct,
      });
      const booths = await repo.listBooths();
      return sendResponse(res, { data: booths, message: 'Booths fetched' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch booths', status: 500 });
    }
  }

  static async createBooth(req, res) {
    try {
      const { name, code, active = true } = req.body;
      if (!name || !code) {
        return sendResponse(res, { success: false, error: 'name and code required', message: 'Validation error', status: 400 });
      }
      const repo = new StationRepository(req.tenantSequelize);
      const booth = await repo.createBooth({ name, code, active });
      return sendResponse(res, { data: booth, message: 'Booth created', status: 201 });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create booth', status: 500 });
    }
  }

  static async updateBooth(req, res) {
    try {
      const { id } = req.params;
      const repo = new StationRepository(req.tenantSequelize);
      const updated = await repo.updateBooth(id, req.body);
      if (!updated) {
        return sendResponse(res, { success: false, error: 'Not found', message: 'Booth not found', status: 404 });
      }
      return sendResponse(res, { data: updated, message: 'Booth updated' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update booth', status: 500 });
    }
  }

  static async deleteBooth(req, res) {
    try {
      const { id } = req.params;
      const repo = new StationRepository(req.tenantSequelize);
      const deleted = await repo.deleteBooth(id);
      if (!deleted) {
        return sendResponse(res, { success: false, error: 'Not found', message: 'Booth not found', status: 404 });
      }
      return sendResponse(res, { data: {}, message: 'Booth deleted' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete booth', status: 500 });
    }
  }

  static async listNozzles(req, res) {
    try {
      const { boothId } = req.params;
      const repo = new StationRepository(req.tenantSequelize);
      const nozzles = await repo.listNozzles(boothId);
      return sendResponse(res, { data: nozzles, message: 'Nozzles fetched' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch nozzles', status: 500 });
    }
  }

  static async upsertNozzle(req, res) {
    try {
      const { boothId } = req.params;
      const nozzle = req.body;
      const repo = new StationRepository(req.tenantSequelize);
      const saved = await repo.upsertNozzle(boothId, nozzle);
      if (!saved) {
        return sendResponse(res, { success: false, error: 'Not found', message: 'Nozzle not found', status: 404 });
      }
      return sendResponse(res, { data: saved, message: 'Nozzle saved' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to save nozzle', status: 500 });
    }
  }

  static async deleteNozzle(req, res) {
    try {
      const { nozzleId } = req.params;
      const repo = new StationRepository(req.tenantSequelize);
      const deleted = await repo.deleteNozzle(nozzleId);
      if (!deleted) {
        return sendResponse(res, { success: false, error: 'Not found', message: 'Nozzle not found', status: 404 });
      }
      return sendResponse(res, { data: {}, message: 'Nozzle deleted' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to delete nozzle', status: 500 });
    }
  }
}


