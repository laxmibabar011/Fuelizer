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
    const password = 'superadmin123';
    const role = 'super_admin';
    const full_name = 'Invenger Admin';
    const phone = '9876543210';
    const city = 'Mangaluru';
    const state = 'Karnataka';
    const country = 'India';
    const postal_code = '575001';
    const gstin = 'ABCDE1234F';

    const existing = await masterRepo.getSuperAdminByEmail(email);
    if (existing) {
      logger.info('[setupSuperAdmin]: Super admin already exists.');
      process.exit(0);
    }

    const hashed = await hashPassword(password);
    await masterRepo.createSuperAdminUser({ 
      email, 
      password: hashed, 
      role,
      full_name,
      phone,
      city,
      state,
      country,
      postal_code,
      gstin
    });
    logger.info('[setupSuperAdmin]: Super admin created!');
    process.exit(0);
  } catch (err) {
    logger.error(`[setupSuperAdmin]: ${err.message}`);
    process.exit(1);
  }
};

run();