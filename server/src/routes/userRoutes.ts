import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  updateProfile,
} from "../controllers/userController.js";
import { authenticate, requireAdmin, requireUser } from "../middleware/auth.js";
import {
  validateIdParam,
  validateUserFilters,
} from "../middleware/validation.js";

const router = Router();

// Admin only routes
router.get("/", authenticate, requireAdmin, validateUserFilters, getAllUsers);
router.get("/:id", authenticate, requireAdmin, validateIdParam, getUserById);
router.put("/:id", authenticate, requireAdmin, validateIdParam, updateUser);
router.delete("/:id", authenticate, requireAdmin, validateIdParam, deleteUser);

// User profile routes
router.put("/profile/me", authenticate, requireUser, updateProfile);

export default router;
