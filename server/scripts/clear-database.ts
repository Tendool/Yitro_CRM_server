import { prisma } from "../lib/prisma.js";

async function clearDatabase() {
  try {
    console.log("🗑️  Clearing all sample data from database...");

    // Delete all data in correct order (foreign key constraints)
    await prisma.activityLog.deleteMany({});
    await prisma.activeDeal.deleteMany({});
    await prisma.contact.deleteMany({});
    await prisma.account.deleteMany({});
    await prisma.lead.deleteMany({});

    console.log("🎉 Database cleared successfully!");
  } catch (error) {
    console.error("❌ Error clearing database:", error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
