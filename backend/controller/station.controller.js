import { sendResponse } from '../util/response.util.js';
import { StationRepository } from '../repository/station.repository.js';

export default class StationController {
  static async listBooths(req, res) {
    try {
      const repo = new StationRepository(req.tenantSequelize);
      await repo.ensureFuelProducts(); // seed minimal fuels
      const booths = await repo.listBooths();
      
      // Debug: Log the raw data before sending
      console.log('Raw booths data:', JSON.stringify(booths, null, 2));
      
      return sendResponse(res, { data: booths, message: 'Booths fetched' });
    } catch (err) {
      console.error('Error in listBooths:', err);
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
      const repo = new StationRepository(req.tenantSequelize);
      const nozzles = await repo.listNozzles();
      return sendResponse(res, { data: nozzles, message: 'Nozzles fetched' });
    } catch (err) {
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to fetch nozzles', status: 500 });
    }
  }

  static async createNozzle(req, res) {
    try {
      const { boothId, code, productId } = req.body;
      
      if (!boothId || !code) {
        return sendResponse(res, { success: false, error: 'boothId and code required', message: 'Validation error', status: 400 });
      }
      
      console.log('Creating nozzle:', { boothId, code, productId });
      
      const repo = new StationRepository(req.tenantSequelize);
      const nozzle = await repo.createNozzle({ boothId, code, productId });
      
      console.log('Nozzle created successfully:', {
        id: nozzle.id,
        code: nozzle.code,
        codeLength: nozzle.code?.length,
        boothId: nozzle.boothId,
        productId: nozzle.productId
      });
      
      return sendResponse(res, { data: nozzle, message: 'Nozzle created', status: 201 });
    } catch (err) {
      console.error('Error creating nozzle:', err);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to create nozzle', status: 500 });
    }
  }

  static async updateNozzle(req, res) {
    try {
      const { id } = req.params;
      const { code, productId } = req.body;
      
      console.log('Updating nozzle:', { id, code, productId });
      
      const repo = new StationRepository(req.tenantSequelize);
      const updated = await repo.updateNozzle(id, { code, productId });
      
      if (!updated) {
        return sendResponse(res, { success: false, error: 'Not found', message: 'Nozzle not found', status: 404 });
      }
      
      console.log('Nozzle updated successfully:', {
        id: updated.id,
        code: updated.code,
        codeLength: updated.code?.length,
        boothId: updated.boothId,
        productId: updated.productId
      });
      
      return sendResponse(res, { data: updated, message: 'Nozzle updated' });
    } catch (err) {
      console.error('Error updating nozzle:', err);
      return sendResponse(res, { success: false, error: err.message, message: 'Failed to update nozzle', status: 500 });
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


