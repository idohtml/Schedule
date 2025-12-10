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

  // December 10, 2024 is a Tuesday
  // Going back 5 working days (excluding weekends):
  // Dec 10 (Tuesday), Dec 9 (Monday), Dec 6 (Friday), Dec 5 (Thursday), Dec 4 (Wednesday)

  const scheduleEntries = [
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
