import { z } from "zod";
import { scheduleEntrySchema } from "@/lib/validators";

export type ScheduleEntry = z.infer<typeof scheduleEntrySchema>;
