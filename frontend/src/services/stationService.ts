import api from "./apiClient";

export type NozzleDTO = {
  id?: number | string;
  code: string;
  productId?: number | null;
  status?: "active" | "inactive";
};

export type BoothDTO = {
  id?: number | string;
  name: string;
  code: string;
  active?: boolean;
  nozzles?: NozzleDTO[];
};

const StationService = {
  // Booths
  listBooths() {
    return api.get("/api/tenant/station/booths");
  },
  createBooth(payload: { name: string; code: string; active?: boolean }) {
    return api.post("/api/tenant/station/booths", payload);
  },
  updateBooth(id: string | number, payload: Partial<BoothDTO>) {
    return api.put(`/api/tenant/station/booths/${id}`, payload);
  },
  deleteBooth(id: string | number) {
    return api.delete(`/api/tenant/station/booths/${id}`);
  },

  // Nozzles (simple CRUD)
  listNozzles() {
    return api.get("/api/tenant/station/nozzles");
  },
  createNozzle(nozzle: NozzleDTO & { boothId: string | number }) {
    return api.post("/api/tenant/station/nozzles", nozzle);
  },
  updateNozzle(nozzleId: string | number, nozzle: NozzleDTO) {
    return api.put(`/api/tenant/station/nozzles/${nozzleId}`, nozzle);
  },
  deleteNozzle(nozzleId: string | number) {
    return api.delete(`/api/tenant/station/nozzles/${nozzleId}`);
  },
};

export default StationService;


