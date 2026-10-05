import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { locationsTable } from "./locations";
import { usersTable } from "./users";

export const alertsTable = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  locationId: integer("location_id").references(() => locationsTable.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
});
