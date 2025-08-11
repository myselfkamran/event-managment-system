import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Import configurations
import sequelize from "./config/database.js";
import redis from "./config/redis.js";

// Import models to initialize associations
import "./models/index.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import eventRoutes from "./routes/eventRoutes.js";
import reservationRoutes from "./routes/reservationRoutes.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.CORS_ORIGIN || "http://localhost:3000",
      "http://localhost:5173", // Vite development server
      "http://127.0.0.1:5173", // Alternative localhost
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   message: "Too many requests from this IP, please try again later.",
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/reservations", reservationRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Global error handler:", err);

    // Handle Sequelize validation errors
    if (err.name === "SequelizeValidationError") {
      return res.status(400).json({
        error: "Validation error",
        details: err.errors.map((e: any) => ({
          field: e.path,
          message: e.message,
        })),
      });
    }

    // Handle Sequelize unique constraint errors
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        error: "Duplicate entry",
        message: "A record with this information already exists",
      });
    }

    // Default error response
    res.status(err.status || 500).json({
      error:
        process.env.NODE_ENV === "production"
          ? "Internal server error"
          : err.message || "Internal server error",
    });
  }
);

// Database connection and server startup
const startServer = async () => {
  try {
    // Start the server first
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(
        `📖 Health check available at http://localhost:${PORT}/health`
      );
      console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
    });

    // Try to connect to PostgreSQL (optional for testing)
    try {
      await sequelize.authenticate();
      console.log("✅ Database connected successfully");

      // Sync database models without forcing recreation
      await sequelize.sync({ force: false });
      console.log("✅ Database synced successfully");
    } catch (error) {
      console.log(
        "⚠️  Database connection failed - some features may not work:",
        (error as Error).message
      );
      console.log(
        "📝 Please set up your Neon PostgreSQL database and update the DATABASE_URL in .env"
      );
    }
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");

  try {
    await sequelize.close();
    console.log("✅ Connections closed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 SIGTERM received, shutting down gracefully...");

  try {
    await sequelize.close();
    console.log("✅ Connections closed successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error during shutdown:", error);
    process.exit(1);
  }
});

// Start the server
startServer();
