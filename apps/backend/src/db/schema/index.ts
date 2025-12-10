import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  time,
  numeric,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    indexes: [index("session_userId_idx").on(table.userId)],
  })
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    indexes: [index("account_userId_idx").on(table.userId)],
  })
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    indexes: [index("verification_identifier_idx").on(table.identifier)],
  })
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    companyName: text("company_name"),
    description: text("description"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    indexes: {
      projectUserIdIdx: index("project_userId_idx").on(table.userId),
    },
  })
);

export const schedule = pgTable(
  "schedule",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    projectId: text("project_id").references(() => project.id, {
      onDelete: "set null",
    }),
    date: timestamp("date", { mode: "date" }).notNull(),
    startTime: time("start_time").notNull(),
    endTime: time("end_time").notNull(),
    totalHours: numeric("total_hours", { precision: 5, scale: 2 }).notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    indexes: {
      scheduleUserIdIdx: index("schedule_userId_idx").on(table.userId),
      scheduleProjectIdIdx: index("schedule_projectId_idx").on(table.projectId),
      scheduleDateIdx: index("schedule_date_idx").on(table.date),
      scheduleUserIdDateIdx: index("schedule_userId_date_idx").on(
        table.userId,
        table.date
      ),
    },
  })
);

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  schedules: many(schedule),
}));

export const scheduleRelations = relations(schedule, ({ one }) => ({
  user: one(user, {
    fields: [schedule.userId],
    references: [user.id],
  }),
  project: one(project, {
    fields: [schedule.projectId],
    references: [project.id],
  }),
}));

export const userSettings = pgTable(
  "user_settings",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 })
      .default("147.00")
      .notNull(),
    taxRate: numeric("tax_rate", { precision: 5, scale: 4 })
      .default("0.3000")
      .notNull(), // 0.3000 = 30%
    monthlyGoalHours: numeric("monthly_goal_hours", { precision: 5, scale: 2 })
      .default("160.00")
      .notNull(),
    dateFormat: text("date_format").default("en-US").notNull(), // e.g., "en-US", "sv-SE"
    timeFormat: text("time_format").default("24h").notNull(), // "12h" or "24h"
    timezone: text("timezone").default("Europe/Stockholm").notNull(),
    notificationsEnabled: boolean("notifications_enabled")
      .default(true)
      .notNull(),
    emailNotifications: boolean("email_notifications").default(false).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => ({
    indexes: {
      userSettingsUserIdIdx: index("user_settings_userId_idx").on(table.userId),
    },
  })
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  schedules: many(schedule),
  projects: many(project),
  settings: one(userSettings, {
    fields: [user.id],
    references: [userSettings.userId],
  }),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
  user: one(user, {
    fields: [userSettings.userId],
    references: [user.id],
  }),
}));
