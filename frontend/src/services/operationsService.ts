import apiClient from './apiClient';

class OperationsService {
  getCurrentOperationalDay() {
    return apiClient.get('api/tenant/operational-day/current');
  }

  getMeterReadings(shiftLedgerId: number | string) {
    return apiClient.get(`api/tenant/meter-readings/${shiftLedgerId}`);
  }

  updateMeterReading(readingId: number | string, payload: any) {
    return apiClient.put(`api/tenant/meter-readings/${readingId}`, payload);
  }

  endManagerShift(payload: { closingReadings: any[]; closingCash?: number }) {
    return apiClient.post('api/tenant/shifts/end', payload);
  }

  startManagerShift(payload: { shiftId: number | string; openingCash?: number }) {
    return apiClient.post('api/tenant/shifts/start', payload);
  }

  autoStartManagerShift(payload: { openingCash?: number }) {
    return apiClient.post('api/tenant/shifts/auto-start', payload);
  }


  getCurrentShiftStatus() {
    return apiClient.get('api/tenant/shifts/status');
  }

  getUserShiftStatus() {
    return apiClient.get('api/tenant/shifts/user-status');
  }
}

export default new OperationsService();

