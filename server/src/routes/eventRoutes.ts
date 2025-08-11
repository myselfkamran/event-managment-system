import { Router } from "express";
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getPopularEvents,
  getDashboardStats,
} from "../controllers/eventController.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import {
  validateEventCreation,
  validateEventUpdate,
  validateEventFilters,
  validateIdParam,
} from "../middleware/validation.js";

const router = Router();

// Public routes
router.get("/", validateEventFilters, getAllEvents);
router.get("/popular", getPopularEvents);
router.get("/:id", validateIdParam, getEventById);

// Admin routes
router.post(
  "/",
  authenticate,
  requireAdmin,
  validateEventCreation,
  createEvent
);
router.put(
  "/:id",
  authenticate,
  requireAdmin,
  validateIdParam,
  validateEventUpdate,
  updateEvent
);
router.delete("/:id", authenticate, requireAdmin, validateIdParam, deleteEvent);
router.get("/dashboard/stats", authenticate, requireAdmin, getDashboardStats);

export default router;
