// import Redis from 'ioredis';
// import dotenv from 'dotenv';
// import { logger } from '../util/logger.util.js';

// dotenv.config();

// const redisClient = new Redis({
//   host: process.env.REDIS_HOST || 'localhost',
//   port: process.env.REDIS_PORT || 6379,
//   password: process.env.REDIS_PASSWORD || undefined,
//   maxRetriesPerRequest: 3,
//   retryStrategy(times) {
//     const delay = Math.min(times * 50, 2000);
//     return delay;
//   }
// });

// redisClient.on('connect', () => {
//   logger.info('[redis.config]: Connected to Redis');
// });

// redisClient.on('error', (err) => {
//   logger.error(`[redis.config]: Redis error: ${err.message}`);
// });

// export const getRedisClient = () => redisClient;