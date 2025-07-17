import { getMasterSequelize } from '../config/db.config.js';
import { initMasterModels } from '../models/master.model.js';
import { hashPassword } from '../util/auth.util.js';

const run = async () => {
  const sequelize = getMasterSequelize();
  const { User } = initMasterModels(sequelize);
  await sequelize.authenticate();
  await sequelize.sync();

  const email = 'superadmin@gmail.com';
  const password = 'superadmin123'; // Change after first login
  const role = 'super_admin';

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    console.log('Super admin already exists.');
    process.exit(0);
  }

  const hashed = await hashPassword(password);
  await User.create({ email, password: hashed, role, client_id: null });
  console.log('Super admin created!');
  process.exit(0);
};

run().catch(e => { console.error(e); process.exit(1); });