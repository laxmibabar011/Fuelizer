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
    }
  );
};
console.log()

// Tenant DB connection (dynamic)
export const getTenantSequelize = ({ dbName, dbUser, dbPass, dbHost }) => {
  return new Sequelize(dbName, dbUser, dbPass, {
    host: dbHost,
    dialect: 'postgres',
    logging: false,
  });
};

// Utility to create a new database
export async function createDatabase(dbName) {
  // Connect to the default 'postgres' database as a superuser or a user with CREATEDB privilege
  const adminSequelize = new Sequelize(
    'postgres',
    process.env.MASTER_DB_USER,
    process.env.MASTER_DB_PASS,
    {
      host: process.env.MASTER_DB_HOST,
      dialect: 'postgres',
      logging: false,
    }
  );

  try {
    await adminSequelize.query(`CREATE DATABASE "${dbName}";`);
    console.log(`Database ${dbName} created!`);
  } catch (err) {
    // If database already exists, ignore error
    if (err.original && err.original.code === '42P04') {
      console.log(`Database ${dbName} already exists.`);
    } else {
      throw err;
    }
  } finally {
    await adminSequelize.close();
  }
}