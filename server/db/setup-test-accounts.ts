import { prisma } from "../lib/prisma";

// Setup test accounts using Prisma (SQLite only)
export async function setupTestAccounts() {
  try {
    console.log("✅ Starting the account setup...");

    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl || !databaseUrl.startsWith("file:")) {
      console.log("❌ SQLite database not configured");
      console.log("Please set DATABASE_URL to a valid SQLite file path");
      throw new Error("DATABASE_URL not configured for SQLite");
    }

    console.log("🔐 Creating test accounts in SQLite database...");

    // Create or update admin user profile
    await prisma.userProfile.upsert({
      where: { email: "admin@yitro.com" },
      update: {
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
      },
      create: {
        email: "admin@yitro.com",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN",
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
      },
    });

    // Create or update test user profile
    await prisma.userProfile.upsert({
      where: { email: "user@yitro.com" },
      update: {
        firstName: "Test",
        lastName: "User",
        role: "USER",
      },
      create: {
        email: "user@yitro.com",
        firstName: "Test",
        lastName: "User",
        role: "USER",
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
      },
    });

    console.log("✅ SQLite test accounts created successfully!");
    console.log("🔑 Admin Login - Email: admin@yitro.com | Password: admin123");
    console.log("🔑 User Login - Email: user@yitro.com | Password: user123");

    return true;
  } catch (error) {
    console.error("❌ Failed to setup test accounts:", error);
    console.error("Make sure the database is migrated: npm run migrate");
    throw error;
  }
}

// Remove auto-execution to prevent issues when imported
// setupTestAccounts();
