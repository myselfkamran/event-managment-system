import { Response } from "express";
import {
  AuthenticatedRequest,
  CreateEventRequest,
  UpdateEventRequest,
  EventFilters,
} from "../types/index.js";
import { Event, User, Reservation } from "../models/index.js";
import { Op, literal } from "sequelize";
import { cacheUtils, CACHE_KEYS, CACHE_EXPIRY } from "../config/redis.js";

// Helper function to calculate spot status
const calculateSpotStatus = (event: any) => {
  const now = new Date();
  const eventDate = new Date(event.eventDate);

  // Check if event is in the past
  if (eventDate < now) {
    return "past-event";
  }

  // Check if fully booked
  if (event.availableSpots === 0) {
    return "fully-booked";
  }

  // Check if limited spots (5 or fewer)
  if (event.availableSpots <= 5) {
    return "limited";
  }

  // Otherwise available
  return "available";
};

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

export const getAllEvents = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      date,
      name,
      location,
      page = 1,
      limit = 10,
    }: EventFilters = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Generate cache key based on query parameters
    const cacheKey =
      CACHE_KEYS.EVENT_LIST(Number(page), Number(limit)) +
      `:date:${date || "all"}:name:${name || "all"}:location:${
        location || "all"
      }`;

    // Try to get from cache first
    const cachedResult = await cacheUtils.get(cacheKey);
    if (cachedResult) {
      console.log(`📦 Cache hit for events list: ${cacheKey}`);
      res.json(cachedResult);
      return;
    }

    // Build where conditions
    const whereConditions: any = {};

    if (date) {
      // Parse the date and set it to the start of the day in local timezone
      // This ensures we get all events for the specified date regardless of timezone
      const searchDate = new Date(date + "T00:00:00");
      const nextDay = new Date(date + "T00:00:00");
      nextDay.setDate(nextDay.getDate() + 1);

      whereConditions.eventDate = {
        [Op.gte]: searchDate,
        [Op.lt]: nextDay,
      };
    }

    if (name) {
      whereConditions.name = { [Op.iLike]: `%${name}%` };
    }

    if (location) {
      whereConditions.location = { [Op.iLike]: `%${location}%` };
    }

    const { count, rows: events } = await Event.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
      limit: Number(limit),
      offset,
      order: [["eventDate", "ASC"]],
    });

    // Add spot status to each event
    const eventsWithStatus = events.map((event) => ({
      ...event.toJSON(),
      spotStatus: calculateSpotStatus(event),
    }));

    const result = {
      events: eventsWithStatus,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, CACHE_EXPIRY.EVENT_LIST);

    res.json(result);
  } catch (error) {
    console.error("Get all events error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getEventById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const cacheKey = CACHE_KEYS.EVENT_DETAILS(Number(id));

    // Try to get from cache first
    const cachedEvent = await cacheUtils.get(cacheKey);
    if (cachedEvent) {
      console.log(`📦 Cache hit for event: ${id}`);
      res.json(cachedEvent);
      return;
    }

    const event = await Event.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
    });

    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    const eventWithStatus = {
      ...event.toJSON(),
      spotStatus: calculateSpotStatus(event),
    };

    const result = { event: eventWithStatus };

    // Cache the result
    await cacheUtils.set(cacheKey, result, CACHE_EXPIRY.EVENT_DETAILS);

    res.json(result);
  } catch (error) {
    console.error("Get event by ID error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getPopularEvents = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const cacheKey = CACHE_KEYS.POPULAR_EVENTS;

    // Try to get from cache first
    const cachedEvents = await cacheUtils.get(cacheKey);
    if (cachedEvents) {
      console.log(`📦 Cache hit for popular events`);
      res.json(cachedEvents);
      return;
    }

    // Get popular events based on reservation percentage
    const popularEvents = await Event.findAll({
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
      where: {
        eventDate: {
          [Op.gte]: new Date(), // Upcoming events
        },
      },
      order: [
        // Order by reservation percentage (descending) - higher percentage = more popular
        // Formula: (maxCapacity - availableSpots) / maxCapacity * 100
        [
          literal(
            '(("Event"."maxCapacity" - "Event"."availableSpots") / "Event"."maxCapacity")'
          ),
          "DESC",
        ],
        ["eventDate", "ASC"], // Then by date
      ],
      limit: 10,
    });

    // Add spot status to each event
    const eventsWithStatus = popularEvents.map((event) => ({
      ...event.toJSON(),
      spotStatus: calculateSpotStatus(event),
    }));

    const result = {
      events: eventsWithStatus,
      message: "Popular events retrieved successfully",
    };

    // Cache the result
    await cacheUtils.set(cacheKey, result, CACHE_EXPIRY.POPULAR_EVENTS);

    res.json(result);
  } catch (error) {
    console.error("Get popular events error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    const {
      name,
      description,
      eventDate,
      location,
      onlineLink,
      maxCapacity,
    }: CreateEventRequest = req.body;

    const event = await Event.create({
      name,
      description,
      eventDate: new Date(eventDate),
      location,
      onlineLink,
      maxCapacity,
      availableSpots: maxCapacity,
      creatorId: req.user.id,
    });

    // Load the event with creator info
    const createdEvent = await Event.findByPk(event.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
    });

    // Invalidate related caches
    await clearEventCaches(event.id);

    res.status(201).json({
      message: "Event created successfully",
      event: createdEvent,
    });
  } catch (error) {
    console.error("Create event error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      eventDate,
      location,
      onlineLink,
      maxCapacity,
    }: UpdateEventRequest = req.body;

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    // Check if user is the creator or admin
    if (req.user?.role !== "admin" && req.user?.id !== event.creatorId) {
      res.status(403).json({ error: "You can only update your own events" });
      return;
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (eventDate) updateData.eventDate = new Date(eventDate);
    if (location !== undefined) updateData.location = location;
    if (onlineLink !== undefined) updateData.onlineLink = onlineLink;

    // Handle maxCapacity change
    if (maxCapacity && maxCapacity !== event.maxCapacity) {
      const reservedSpots = event.maxCapacity - event.availableSpots;

      if (maxCapacity < reservedSpots) {
        res.status(400).json({
          error: `Cannot reduce capacity below ${reservedSpots} (current reservations)`,
        });
        return;
      }

      updateData.maxCapacity = maxCapacity;
      updateData.availableSpots = maxCapacity - reservedSpots;
    }

    await event.update(updateData);

    // Load updated event with creator info
    const updatedEvent = await Event.findByPk(event.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "email", "firstName", "lastName"],
        },
      ],
    });

    // Invalidate related caches
    await clearEventCaches(event.id);

    res.json({
      message: "Event updated successfully",
      event: updatedEvent,
    });
  } catch (error) {
    console.error("Update event error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteEvent = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const event = await Event.findByPk(id);
    if (!event) {
      res.status(404).json({ error: "Event not found" });
      return;
    }

    // Check if user is the creator or admin
    if (req.user?.role !== "admin" && req.user?.id !== event.creatorId) {
      res.status(403).json({ error: "You can only delete your own events" });
      return;
    }

    await event.destroy();

    // Invalidate related caches
    await clearEventCaches(event.id);

    res.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
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

export const getDashboardStats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Get total events count
    const totalEvents = await Event.count();

    // Get active events count (events with future dates)
    const now = new Date();
    const activeEvents = await Event.count({
      where: {
        eventDate: {
          [Op.gt]: now,
        },
      },
    });

    res.json({
      totalEvents,
      activeEvents,
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
