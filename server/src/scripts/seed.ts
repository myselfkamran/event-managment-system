import dotenv from "dotenv";
import sequelize from "../config/database.js";
import { User } from "../models/index.js";

dotenv.config();

const seedDatabase = async () => {
  try {
    console.log("🌱 Starting database seeding...");

    // Connect to database
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Sync models
    await sequelize.sync({ force: false });
    console.log("✅ Database synced");

    // Check if admin user already exists
    const existingAdmin = await User.findOne({
      where: { email: "admin@example.com" },
    });

    if (existingAdmin) {
      console.log("⚠️  Admin user already exists");
      return;
    }

    // Create admin user
    const adminUser = await User.create({
      email: "admin@example.com",
      password: "admin123",
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });

    console.log("✅ Admin user created successfully");
    console.log("📧 Email: admin@example.com");
    console.log("🔑 Password: admin123");
    console.log("⚠️  Please change the admin password after first login!");

    // Create a test regular user
    const existingUser = await User.findOne({
      where: { email: "user@example.com" },
    });

    if (!existingUser) {
      await User.create({
        email: "user@example.com",
        password: "user123",
        firstName: "Test",
        lastName: "User",
        role: "user",
      });

      console.log("✅ Test user created successfully");
      console.log("📧 Email: user@example.com");
      console.log("🔑 Password: user123");
    }

    console.log("🎉 Database seeding completed!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
};

seedDatabase();
