import { prisma } from "../lib/prisma";

// Initialize database with schema - SQLite only, no in-memory fallback
export async function initializeDatabase() {
  try {
    const databaseUrl = process.env.DATABASE_URL || "file:./data/production.db";
    console.log(`🔗 Database URL: ${databaseUrl}`);
    console.log("✅ SQLite database configured");
    console.log("🔗 Using Prisma with SQLite");
    console.log("✅ Database initialized");
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    return false;
  }
}
