import "dotenv/config";
import { db } from "./index.js";
import {
  schedule as scheduleTable,
  user as userTable,
} from "./schema/index.js";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";

// Helper function to calculate total hours
function calculateTotalHours(startTime: string, endTime: string): string {
  const [startHours, startMinutes] = startTime.split(":").map(Number);
  const [endHours, endMinutes] = endTime.split(":").map(Number);

  const startTotalMinutes = startHours * 60 + startMinutes;
  const endTotalMinutes = endHours * 60 + endMinutes;

  let diffMinutes = endTotalMinutes - startTotalMinutes;

  // Handle overnight shifts
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const totalHours = hours + minutes / 60;

  return totalHours.toFixed(2);
}

async function seed() {
  console.log("🌱 Starting seed...");

  // Get the first user (or you can modify this to get a specific user)
  const users = await db.select().from(userTable).limit(1);

  if (users.length === 0) {
    console.error("❌ No users found. Please create a user first.");
    process.exit(1);
  }

  const userId = users[0].id;
  console.log(`📝 Seeding schedule data for user: ${users[0].email}`);

  // Generate schedule entries for the past 3 weeks (approximately 15 working days)
  // December 10, 2024 is a Tuesday
  // Creating entries for working days going back 3 weeks

  const scheduleEntries = [
    // Week 1 (Most recent)
    {
      date: new Date("2024-12-10"), // Tuesday
      startTime: "09:00:00",
      endTime: "17:30:00",
      notes: "Regular work day",
    },
    {
      date: new Date("2024-12-09"), // Monday
      startTime: "08:30:00",
      endTime: "17:00:00",
      notes: "Early start",
    },
    {
      date: new Date("2024-12-06"), // Friday
      startTime: "09:00:00",
      endTime: "16:00:00",
      notes: "Short Friday",
    },
    {
      date: new Date("2024-12-05"), // Thursday
      startTime: "09:15:00",
      endTime: "18:00:00",
      notes: "Long day",
    },
    {
      date: new Date("2024-12-04"), // Wednesday
      startTime: "10:00:00",
      endTime: "18:30:00",
      notes: "Late start, late finish",
    },
    // Week 2
    {
      date: new Date("2024-12-03"), // Tuesday
      startTime: "09:00:00",
      endTime: "17:00:00",
      notes: "Standard day",
    },
    {
      date: new Date("2024-12-02"), // Monday
      startTime: "08:00:00",
      endTime: "16:30:00",
      notes: "Early morning start",
    },
    {
      date: new Date("2024-11-29"), // Friday
      startTime: "09:30:00",
      endTime: "17:30:00",
      notes: "Friday work",
    },
    {
      date: new Date("2024-11-28"), // Thursday
      startTime: "09:00:00",
      endTime: "18:15:00",
      notes: "Extended hours",
    },
    {
      date: new Date("2024-11-27"), // Wednesday
      startTime: "10:15:00",
      endTime: "19:00:00",
      notes: "Flexible schedule",
    },
    // Week 3
    {
      date: new Date("2024-11-26"), // Tuesday
      startTime: "08:45:00",
      endTime: "17:15:00",
      notes: "Morning shift",
    },
    {
      date: new Date("2024-11-25"), // Monday
      startTime: "09:00:00",
      endTime: "17:00:00",
      notes: "Regular Monday",
    },
    {
      date: new Date("2024-11-22"), // Friday
      startTime: "09:00:00",
      endTime: "15:30:00",
      notes: "Early finish Friday",
    },
    {
      date: new Date("2024-11-21"), // Thursday
      startTime: "09:30:00",
      endTime: "18:00:00",
      notes: "Full day",
    },
    {
      date: new Date("2024-11-20"), // Wednesday
      startTime: "08:00:00",
      endTime: "16:00:00",
      notes: "Early shift",
    },
    // Additional entries for better pagination testing
    {
      date: new Date("2024-11-19"), // Tuesday
      startTime: "10:00:00",
      endTime: "18:00:00",
      notes: "Standard hours",
    },
    {
      date: new Date("2024-11-18"), // Monday
      startTime: "09:00:00",
      endTime: "17:30:00",
      notes: "Regular Monday",
    },
    {
      date: new Date("2024-11-15"), // Friday
      startTime: "09:00:00",
      endTime: "16:45:00",
      notes: "Friday work",
    },
  ];

  // Clear existing schedule entries for this user (optional - comment out if you want to keep existing data)
  await db.delete(scheduleTable).where(eq(scheduleTable.userId, userId));
  console.log("🧹 Cleared existing schedule entries");

  // Insert new schedule entries
  for (const entry of scheduleEntries) {
    const id = randomBytes(16).toString("hex");
    const totalHours = calculateTotalHours(entry.startTime, entry.endTime);

    await db.insert(scheduleTable).values({
      id,
      userId,
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      totalHours,
      notes: entry.notes,
    });

    console.log(
      `✅ Added: ${entry.date.toISOString().split("T")[0]} - ${
        entry.startTime
      } to ${entry.endTime} (${totalHours} hours)`
    );
  }

  console.log("✨ Seed completed successfully!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
