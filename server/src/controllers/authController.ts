import { Response } from "express";
import {
  AuthenticatedRequest,
  CreateUserRequest,
  LoginRequest,
} from "../types/index.js";
import { User } from "../models/index.js";
import { generateToken } from "../utils/jwt.js";
import { cacheUtils, CACHE_KEYS, CACHE_EXPIRY } from "../config/redis.js";

export const register = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password, firstName, lastName }: CreateUserRequest =
      req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({ error: "User with this email already exists" });
      return;
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role: "user",
    });

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Cache user session
    await cacheUtils.set(
      CACHE_KEYS.USER_SESSION(user.id),
      { userId: user.id, email: user.email, role: user.role },
      CACHE_EXPIRY.USER_SESSION
    );

    res.status(201).json({
      message: "User registered successfully",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Validate password
    const isValidPassword = await user.validatePassword(password);
    if (!isValidPassword) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Cache user session
    await cacheUtils.set(
      CACHE_KEYS.USER_SESSION(user.id),
      { userId: user.id, email: user.email, role: user.role },
      CACHE_EXPIRY.USER_SESSION
    );

    res.json({
      message: "Login successful",
      user: user.toJSON(),
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (req.user) {
      // Clear user session from cache
      await cacheUtils.del(CACHE_KEYS.USER_SESSION(req.user.id));
    }

    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    // Try to get from cache first
    const cacheKey = CACHE_KEYS.USER_PROFILE(req.user.id);
    const cachedProfile = await cacheUtils.get(cacheKey);

    if (cachedProfile) {
      console.log(`📦 Cache hit for user profile: ${req.user.id}`);
      res.json({ user: cachedProfile });
      return;
    }

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Cache the user profile
    await cacheUtils.set(cacheKey, user.toJSON(), CACHE_EXPIRY.USER_PROFILE);

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
