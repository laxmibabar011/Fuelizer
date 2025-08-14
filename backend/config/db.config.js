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
				max: Number(process.env.DB_POOL_MAX || 20),
				min: Number(process.env.DB_POOL_MIN || 0),
				acquire: Number(process.env.DB_POOL_ACQUIRE_MS || 30000),
				idle: Number(process.env.DB_POOL_IDLE_MS || 10000)
			},
			dialectOptions: {
				keepAlive: true
			},
			retry: {
				max: Number(process.env.DB_RETRY_MAX || 3)
			}
		}
	);
};

// Tenant DB connection (dynamic with pooling)
export const tenantConnections = new Map();

export const getTenantSequelize = ({ dbName }) => {
	if (!tenantConnections.has(dbName)) {
		const sequelize = new Sequelize(dbName, process.env.TENANT_DB_USER, process.env.TENANT_DB_PASS, {
			host: process.env.TENANT_DB_HOST,
			dialect: 'postgres',
			logging: false,
			pool: {
				max: Number(process.env.DB_POOL_MAX || 20),
				min: Number(process.env.DB_POOL_MIN || 0),
				acquire: Number(process.env.DB_POOL_ACQUIRE_MS || 30000),
				idle: Number(process.env.DB_POOL_IDLE_MS || 10000)
			},
			dialectOptions: {
				keepAlive: true
			},
			retry: {
				max: Number(process.env.DB_RETRY_MAX || 3)
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