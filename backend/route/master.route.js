import express from "express";
import { authenticate } from '../middleware/auth.middleware.js';
import { registerClient } from '../controller/master.controller.js';

const router = express.Router();

router.post('/clients/register', authenticate, registerClient);

export default router;