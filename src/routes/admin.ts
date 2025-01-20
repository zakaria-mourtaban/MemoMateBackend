import { Router } from 'express';
import { getUsers, getAdminMetrics, banUser, changeUserRole } from '../controllers/admin';
import { adminProtect } from '../middleware/admin';

const router = Router();

// Protect all admin routes
router.use(adminProtect);

// Get all users with pagination
router.get('/users', getUsers);

// Get admin metrics
router.get('/metrics', getAdminMetrics);

// Ban a user
router.put('/users/:id/ban', banUser);

// Change user role
router.put('/users/:id/role', changeUserRole);

export default router;