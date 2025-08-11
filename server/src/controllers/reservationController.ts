import { Response } from "express";
import { AuthenticatedRequest, ReservationStatus } from "../types/index.js";
import { Event, User, Reservation } from "../models/index.js";
import sequelize from "../config/database.js";
import { cacheUtils, CACHE_KEYS } from "../config/redis.js";

// Helper function to clear all event-related caches
const clearEventCaches = async (eventId: number) => {
  try {
    // Clear popular events cache
    await cacheUtils.del(CACHE_KEYS.POPULAR_EVENTS);

    // Clear specific event details cache
    await cacheUtils.del(CACHE_KEYS.EVENT_DETAILS(eventId));

    // Clear all event list caches using pattern matching
    // This will clear all cache keys that start with "events:page:" regardless of filters
    await cacheUtils.delPattern("events:page:*");

    console.log(`🗑️ Cleared event caches for event ${eventId}`);
  } catch (error) {
    console.error("Error clearing event caches:", error);
  }
};

export const createReservation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { id: eventId } = req.params;
    const userId = req.user.id;

    // Check if event exists
    const event = await Event.findByPk(eventId, { transaction });
    if (!event) {
      await transaction.rollback();
      res.status(404).json({ error: "Event not found" });
      return;
    }

    // Check if event is in the future
    if (event.eventDate <= new Date()) {
      await transaction.rollback();
      res.status(400).json({ error: "Cannot reserve spots for past events" });
      return;
    }

    // Check if admin is trying to reserve their own event
    if (req.user.role === "admin" && event.creatorId === userId) {
      await transaction.rollback();
      res
        .status(400)
        .json({ error: "You cannot reserve a spot for your own event" });
      return;
    }

    // Check if user already has a confirmed reservation for this event
    const existingReservation = await Reservation.findOne({
      where: {
        eventId,
        userId,
        status: ReservationStatus.CONFIRMED,
      },
      transaction,
    });

    if (existingReservation) {
      await transaction.rollback();
      res
        .status(409)
        .json({ error: "You already have a reservation for this event" });
      return;
    }

    // Check if there are available spots
    if (event.availableSpots <= 0) {
      await transaction.rollback();
      res.status(400).json({ error: "No available spots for this event" });
      return;
    }

    // Create reservation and decrement available spots
    const reservation = await Reservation.create(
      {
        eventId: Number(eventId),
        userId,
        status: ReservationStatus.CONFIRMED,
      },
      { transaction }
    );

    // Decrement available spots
    await event.decrement("availableSpots", { by: 1, transaction });

    await transaction.commit();

    // Load reservation with event and user info
    const createdReservation = await Reservation.findByPk(reservation.id, {
      include: [
        {
          model: Event,
          as: "event",
          attributes: ["id", "name", "eventDate", "location", "onlineLink"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
    });

    // Invalidate related caches after successful reservation
    await clearEventCaches(Number(eventId));

    res.status(201).json({
      message: "Reservation created successfully",
      reservation: createdReservation,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Create reservation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const cancelReservation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  const transaction = await sequelize.transaction();

  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { id: reservationId } = req.params;

    const reservation = await Reservation.findByPk(Number(reservationId), {
      transaction,
    });

    if (!reservation) {
      await transaction.rollback();
      res.status(404).json({ error: "Reservation not found" });
      return;
    }

    // Check if user owns the reservation or is admin
    if (
      req.user.role !== "admin" &&
      req.user.id !== Number(reservation.userId)
    ) {
      await transaction.rollback();
      res
        .status(403)
        .json({ error: "You can only cancel your own reservations" });
      return;
    }

    // Check if reservation is already canceled
    if (reservation.status === ReservationStatus.CANCELED) {
      await transaction.rollback();
      res.status(400).json({ error: "Reservation is already canceled" });
      return;
    }

    // Cancel reservation and increment available spots
    await reservation.update(
      { status: ReservationStatus.CANCELED },
      { transaction }
    );

    // Get the event and increment available spots
    const event = await Event.findByPk(reservation.eventId, { transaction });
    if (event) {
      await event.increment("availableSpots", { by: 1, transaction });
    }

    await transaction.commit();

    // Invalidate related caches after successful cancellation
    await clearEventCaches(reservation.eventId);

    res.json({ message: "Reservation canceled successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Cancel reservation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMyReservations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereConditions: any = { userId: req.user.id };
    if (status && (status === "confirmed" || status === "canceled")) {
      whereConditions.status = status;
    }

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: Event,
          as: "event",
          attributes: [
            "id",
            "name",
            "description",
            "eventDate",
            "location",
            "onlineLink",
            "maxCapacity",
            "availableSpots",
          ],
          include: [
            {
              model: User,
              as: "creator",
              attributes: ["id", "email", "firstName", "lastName"],
            },
          ],
        },
      ],
      limit: Number(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      reservations,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get my reservations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getEventReservations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id: eventId } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const whereConditions: any = { eventId };
    if (status && (status === "confirmed" || status === "canceled")) {
      whereConditions.status = status;
    }

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "firstName", "lastName"],
        },
        {
          model: Event,
          as: "event",
          attributes: ["id", "name", "eventDate", "location", "onlineLink"],
        },
      ],
      limit: Number(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      reservations,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get event reservations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getAllReservations = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, eventId, userId } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const whereConditions: any = {};

    // Filter by status if provided
    if (status && (status === "confirmed" || status === "canceled")) {
      whereConditions.status = status;
    }

    // Filter by event if provided
    if (eventId) {
      whereConditions.eventId = Number(eventId);
    }

    // Filter by user if provided
    if (userId) {
      whereConditions.userId = Number(userId);
    }

    const { count, rows: reservations } = await Reservation.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "email", "firstName", "lastName"],
        },
        {
          model: Event,
          as: "event",
          attributes: [
            "id",
            "name",
            "description",
            "eventDate",
            "location",
            "onlineLink",
            "maxCapacity",
            "availableSpots",
          ],
          include: [
            {
              model: User,
              as: "creator",
              attributes: ["id", "email", "firstName", "lastName"],
            },
          ],
        },
      ],
      limit: Number(limit),
      offset,
      order: [["createdAt", "DESC"]],
    });

    res.json({
      reservations,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error("Get all reservations error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const checkUserReservation = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const { eventId } = req.params;
    const userId = req.user.id;

    // Check if event exists
    const event = await Event.findByPk(eventId);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    // Check if user has a confirmed reservation for this event
    const reservation = await Reservation.findOne({
      where: {
        eventId: Number(eventId),
        userId,
        status: ReservationStatus.CONFIRMED,
      },
    });

    res.json({
      hasReservation: !!reservation,
      reservation: reservation ? reservation.toJSON() : null,
    });
  } catch (error) {
    console.error("Check user reservation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
