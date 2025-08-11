import { Router } from "express";
import {
  createReservation,
  cancelReservation,
  getMyReservations,
  getEventReservations,
  getAllReservations,
  checkUserReservation,
} from "../controllers/reservationController.js";
import { authenticate, requireAdmin, requireUser } from "../middleware/auth.js";
import {
  validateIdParam,
  validateReservationFilters,
} from "../middleware/validation.js";

const router = Router();

// User routes
router.post(
  "/events/:id/reserve",
  authenticate,
  requireUser,
  validateIdParam,
  createReservation
);
router.delete(
  "/:id",
  authenticate,
  requireUser,
  validateIdParam,
  cancelReservation
);
router.get(
  "/my-reservations",
  authenticate,
  requireUser,
  validateReservationFilters,
  getMyReservations
);
router.get(
  "/events/:eventId/check",
  authenticate,
  requireUser,
  validateIdParam,
  checkUserReservation
);

// Admin routes
router.get(
  "/events/:id/reservations",
  authenticate,
  requireAdmin,
  validateIdParam,
  validateReservationFilters,
  getEventReservations
);
router.get(
  "/",
  authenticate,
  requireAdmin,
  validateReservationFilters,
  getAllReservations
);

export default router;
