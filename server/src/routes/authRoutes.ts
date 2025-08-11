import { Router } from "express";
import {
  register,
  login,
  logout,
  getProfile,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import {
  validateUserRegistration,
  validateUserLogin,
} from "../middleware/validation.js";

const router = Router();

// Public routes
router.post("/register", validateUserRegistration, register);
router.post("/login", validateUserLogin, login);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/profile", authenticate, getProfile);

export default router;
