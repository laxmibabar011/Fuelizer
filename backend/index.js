import express from 'express';
import dotenv from 'dotenv';
import router from './route/index.routes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { getMasterSequelize } from './config/db.config.js';
import { initMasterModels } from './models/master.model.js';

dotenv.config();
const originUrl = process.env.ORIGIN_URL;
console.log(originUrl);

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: originUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use('/api', router);

const PORT = process.env.PORT || 3000;

// For development only: sync master DB tables to match models
// WARNING: This will alter tables in the master DB! Remove in production.
(async () => {
  const sequelize = getMasterSequelize();
  initMasterModels(sequelize);
  await sequelize.sync({ alter: true });
  console.log(`[INFO]:[index]:startServer(): DB Connected Successfully`);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();