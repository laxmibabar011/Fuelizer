import { Router } from 'express'
import { authenticate, authorizeRoles } from '../middleware/auth.middleware.js'
import { tenantDbMiddleware } from '../middleware/tenant.middleware.js'
import DecantationLogsController from '../controller/decantationLogs.controller.js'

const router = Router()

// Tenant scoped routes; fuel-admin manages decantation logs
router.use(authenticate, tenantDbMiddleware, authorizeRoles('fuel-admin'))

// Table Configuration Routes
router.post('/decantation-logs/tables', DecantationLogsController.createTable)
router.get('/decantation-logs/tables', DecantationLogsController.listTables)
router.get('/decantation-logs/tables/:id', DecantationLogsController.getTableById)
router.put('/decantation-logs/tables/:id', DecantationLogsController.updateTable)
router.delete('/decantation-logs/tables/:id', DecantationLogsController.deleteTable)
router.patch('/decantation-logs/tables/:id/restore', DecantationLogsController.restoreTable)

// Entry Routes
router.post('/decantation-logs/entries', DecantationLogsController.createEntry)
router.get('/decantation-logs/entries', DecantationLogsController.listEntries)
router.get('/decantation-logs/entries/:id', DecantationLogsController.getEntryById)
router.get('/decantation-logs/entries/date/:dateId', DecantationLogsController.getEntryByDateId)
router.put('/decantation-logs/entries/:id', DecantationLogsController.updateEntry)
router.delete('/decantation-logs/entries/:id', DecantationLogsController.deleteEntry)

// Statistics Routes
router.get('/decantation-logs/stats', DecantationLogsController.getEntryStats)

// Removed default tables route - users create their own tables

export default router
