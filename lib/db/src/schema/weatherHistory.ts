import {
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { locationsTable } from "./locations";
import { usersTable } from "./users";

export const weatherHistoryTable = pgTable("weather_history", {
  id: serial("id").primaryKey(),
  userId: text("user_id").references(() => usersTable.id, {
    onDelete: "set null",
  }),
  locationId: integer("location_id").references(() => locationsTable.id, {
    onDelete: "set null",
  }),
  weatherData: jsonb("weather_data")
    .$type<Record<string, unknown>>()
    .notNull(),
  recordedAt: timestamp("recorded_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
