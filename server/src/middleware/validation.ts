import { body, query, param, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation failed",
      details: errors.array(),
    });
    return;
  }
  next();
};

// User validation rules
export const validateUserRegistration = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("First name cannot be empty"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Last name cannot be empty"),
  handleValidationErrors,
];

export const validateUserLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

// Event validation rules
export const validateEventCreation = [
  body("name")
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage("Event name is required and must be between 1-255 characters"),
  body("description").optional().trim(),
  body("eventDate")
    .isISO8601()
    .toDate()
    .custom((value: Date) => {
      if (value <= new Date()) {
        throw new Error("Event date must be in the future");
      }
      return true;
    }),
  body("location")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Location cannot be empty if provided"),
  body("onlineLink")
    .optional()
    .isURL()
    .withMessage("Online link must be a valid URL"),
  body("maxCapacity")
    .isInt({ min: 1 })
    .withMessage("Max capacity must be a positive integer"),
  handleValidationErrors,
];

export const validateEventUpdate = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .isLength({ min: 1, max: 255 })
    .withMessage("Event name must be between 1-255 characters"),
  body("description").optional().trim(),
  body("eventDate")
    .optional()
    .isISO8601()
    .toDate()
    .custom((value: Date) => {
      if (value <= new Date()) {
        throw new Error("Event date must be in the future");
      }
      return true;
    }),
  body("location")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Location cannot be empty if provided"),
  body("onlineLink")
    .optional()
    .isURL()
    .withMessage("Online link must be a valid URL"),
  body("maxCapacity")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Max capacity must be a positive integer"),
  handleValidationErrors,
];

// Query validation rules
export const validateEventFilters = [
  query("date")
    .optional()
    .custom((value) => {
      if (!value) return true;
      // Accept YYYY-MM-DD format for date filters
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(value)) {
        throw new Error("Date must be in YYYY-MM-DD format");
      }
      const date = new Date(value + "T00:00:00");
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      return true;
    }),
  query("name")
    .optional()
    .customSanitizer((value) => {
      // Convert empty string to undefined for optional fields
      return value === "" ? undefined : value;
    })
    .trim()
    .isLength({ min: 1 })
    .withMessage("Name filter cannot be empty"),
  query("location")
    .optional()
    .customSanitizer((value) => {
      // Convert empty string to undefined for optional fields
      return value === "" ? undefined : value;
    })
    .trim()
    .isLength({ min: 1 })
    .withMessage("Location filter cannot be empty"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

export const validateUserFilters = [
  query("search")
    .optional()
    .customSanitizer((value) => {
      // Convert empty string to undefined for optional fields
      return value === "" ? undefined : value;
    })
    .trim()
    .isLength({ min: 1 })
    .withMessage("Search filter cannot be empty"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

export const validateReservationFilters = [
  query("status")
    .optional()
    .customSanitizer((value) => {
      // Convert empty string to undefined for optional fields
      return value === "" ? undefined : value;
    })
    .isIn(["confirmed", "canceled"])
    .withMessage("Status must be either 'confirmed' or 'canceled'"),
  query("eventId")
    .optional()
    .customSanitizer((value) => {
      // Convert empty string to undefined for optional fields
      return value === "" ? undefined : value;
    })
    .isInt({ min: 1 })
    .withMessage("Event ID must be a positive integer"),
  query("userId")
    .optional()
    .customSanitizer((value) => {
      // Convert empty string to undefined for optional fields
      return value === "" ? undefined : value;
    })
    .isInt({ min: 1 })
    .withMessage("User ID must be a positive integer"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  handleValidationErrors,
];

// Param validation rules
export const validateIdParam = [
  param("id").isInt({ min: 1 }).withMessage("ID must be a positive integer"),
  handleValidationErrors,
];
