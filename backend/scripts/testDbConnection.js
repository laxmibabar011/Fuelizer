import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

console.log('DB PASS:', process.env.MASTER_DB_PASS, typeof process.env.MASTER_DB_PASS);

const sequelize = new Sequelize(
  process.env.MASTER_DB_NAME,
  process.env.MASTER_DB_USER,
  process.env.MASTER_DB_PASS,
  {
    host: process.env.MASTER_DB_HOST,
    dialect: 'postgres',
    logging: false,
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
})();

