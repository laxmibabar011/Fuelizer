import { getMasterSequelize } from '../config/db.config.js';
import { MasterRepository } from '../repository/master.repository.js';
import { hashPassword } from '../util/auth.util.js';
import { logger } from '../util/logger.util.js';

const run = async () => {
  try {
    const sequelize = getMasterSequelize();
    const masterRepo = new MasterRepository(sequelize);
    await sequelize.authenticate();

    // For development only: sync master DB tables to match models
    // WARNING: This will alter tables in the master DB! Remove in production.
    await sequelize.sync({ alter: true });

    const email = 'superadmin@gmail.com';
    const password = 'superadmin123'; // Change after first login
    const role = 'super_admin';

    const existing = await masterRepo.findSuperAdminUserByEmail(email);
    if (existing) {
      logger.info('[setupSuperAdmin]: Super admin already exists.');
      process.exit(0);
    }

    const hashed = await hashPassword(password);
    await masterRepo.createSuperAdminUser({ email, password: hashed, role, client_id: null });
    logger.info('[setupSuperAdmin]: Super admin created!');
    process.exit(0);
  } catch (err) {
    logger.error(`[setupSuperAdmin]: ${err.message}`);
    process.exit(1);
  }
};

run();