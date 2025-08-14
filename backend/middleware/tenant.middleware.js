import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { getTenantDbModels } from '../controller/helper/tenantDb.helper.js';

// Middleware to resolve tenant database for non-super-admin users
export const tenantDbMiddleware = async (req, res, next) => {
	try {
		const bunkId = req.user?.bunkId; // Use bunkId from JWT
		if (!bunkId) {
			// Skip tenant DB resolution for super-admin
			if (req.user?.role === 'super_admin') {
				return next();
			}
			return res.status(400).json({ success: false, message: 'No bunkId found in user context' });
		}

		const masterSequelize = getMasterSequelize();
		const masterRepo = new MasterRepository(masterSequelize);
		const client = await masterRepo.findClientById(bunkId);
		if (!client || !client.is_active) {
			return res.status(404).json({ success: false, message: 'Client not found or inactive' });
		}

		const tenant = await getTenantDbModels(client.db_name);
		req.tenantSequelize = tenant.tenantSequelize;
		req.tenantModels = {
			User: tenant.User,
			Role: tenant.Role,
			UserDetails: tenant.UserDetails,
			RefreshToken: tenant.RefreshToken,
			CreditAccount: tenant.CreditAccount,
			Vehicle: tenant.Vehicle,
			Booth: tenant.Booth,
			Nozzle: tenant.Nozzle,
			Product: tenant.Product,
			Operator: tenant.Operator,
			Shift: tenant.Shift,
			ShiftAssignment: tenant.ShiftAssignment,
		};
		next();
	} catch (err) {
		return res.status(500).json({ success: false, message: 'Error resolving tenant DB', error: err.message });
	}
};