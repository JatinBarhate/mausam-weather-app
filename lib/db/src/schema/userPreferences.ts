import { pgTable, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const userPreferencesTable = pgTable("user_preferences", {
  userId: text("user_id")
    .primaryKey()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  interests: text("interests").array().notNull().default(["general"]),
  preferredActivity: text("preferred_activity").notNull().default("walking"),
  notificationsEnabled: boolean("notifications_enabled").notNull().default(false),
  useDemoData: boolean("use_demo_data").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
