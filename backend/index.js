import express from 'express';
import dotenv from 'dotenv';
import router from './route/index.routes.js';
// import path from 'path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
// import { fileURLToPath } from 'url';
import { getMasterSequelize } from './config/db.config.js';
import { initMasterModels } from './models/master.model.js';


dotenv.config();
originUrl = process.env.ORIGIN_URL

const app = express();

app.use(express.json());

app.use(cookieParser());

// Configure CORS
app.use(cors({
  originUrl,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Serve static files from public
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', router);

const PORT = process.env.PORT || 3000;

// For development only: force sync master DB tables to match models
// WARNING: This will DROP and recreate all tables in the master DB!
// Comment out or remove in production.
(async () => {
  const sequelize = getMasterSequelize();
  initMasterModels(sequelize);
  await sequelize.sync({ alter: true });
  console.log(`[INFO]:[index]:startServer(): DB Connected Successfully`)
  // await sequelize.sync({ force: true }); // <-- REMOVE or comment out in production!
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();