import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Master DB connection
export const getMasterSequelize = () => {
  return new Sequelize(
    process.env.MASTER_DB_NAME,
    process.env.MASTER_DB_USER,
    process.env.MASTER_DB_PASS,
    {
      host: process.env.MASTER_DB_HOST,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
};

// Tenant DB connection (dynamic with pooling)
const tenantConnections = new Map();

export const getTenantSequelize = ({ dbName }) => {
  if (!tenantConnections.has(dbName)) {
    const sequelize = new Sequelize(dbName, process.env.TENANT_DB_USER, process.env.TENANT_DB_PASS, {
      host: process.env.TENANT_DB_HOST,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    });
    tenantConnections.set(dbName, sequelize);
  }
  return tenantConnections.get(dbName);
};

// Utility to create a new database
export async function createDatabase(dbName) {
  const adminSequelize = new Sequelize(
    'postgres',
    process.env.MASTER_DB_USER,
    process.env.MASTER_DB_PASS,
    {
      host: process.env.MASTER_DB_HOST,
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    await adminSequelize.query(`CREATE DATABASE "${dbName}";`);
    console.log(`Database ${dbName} created!`);
  } catch (err) {
    if (err.original && err.original.code === '42P04') {
      console.log(`Database ${dbName} already exists.`);
    } else {
      throw err;
    }
  } finally {
    await adminSequelize.close();
  }
}