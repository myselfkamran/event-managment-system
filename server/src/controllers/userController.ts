import { Response } from "express";
import { AuthenticatedRequest, CreateUserRequest } from "../types/index.js";
import { User } from "../models/index.js";
import { Op } from "sequelize";
import { cacheUtils, CACHE_KEYS } from "../config/redis.js";

export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereCondition = search
      ? {
          [Op.or]: [
            { email: { [Op.iLike]: `%${search}%` } },
            { firstName: { [Op.iLike]: `%${search}%` } },
            { lastName: { [Op.iLike]: `%${search}%` } },
          ],
        }
      : {};

    const { count, rows: users } = await User.findAndCountAll({
      where: whereCondition,
      limit: Number(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      users: users.map((user) => user.toJSON()),
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get all users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user: user.toJSON() });
  } catch (error) {
    console.error("Get user by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, firstName, lastName, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(409).json({ error: "Email is already taken" });
        return;
      }
    }

    // Update user fields
    const updateData: any = {};
    if (email) updateData.email = email;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (role && req.user?.role === "admin") updateData.role = role;

    await user.update(updateData);

    // Invalidate user profile and session cache to ensure fresh data
    await Promise.all([
      cacheUtils.del(CACHE_KEYS.USER_PROFILE(user.id)),
      cacheUtils.del(CACHE_KEYS.USER_SESSION(user.id)),
    ]);

    res.json({
      message: "User updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Prevent admin from deleting themselves
    if (req.user?.id === user.id) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }

    await user.destroy();

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { email, firstName, lastName } = req.body;

    const user = await User.findByPk(req.user.id);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(409).json({ error: "Email is already taken" });
        return;
      }
    }

    // Update user fields
    const updateData: any = {};
    if (email) updateData.email = email;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;

    await user.update(updateData);

    // Invalidate user profile and session cache to ensure fresh data
    await Promise.all([
      cacheUtils.del(CACHE_KEYS.USER_PROFILE(req.user.id)),
      cacheUtils.del(CACHE_KEYS.USER_SESSION(req.user.id)),
    ]);

    res.json({
      message: "Profile updated successfully",
      user: user.toJSON(),
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
