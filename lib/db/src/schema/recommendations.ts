import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { locationsTable } from "./locations";
import { usersTable } from "./users";

export const recommendationsTable = pgTable("recommendations", {
  id: serial("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  locationId: integer("location_id").references(() => locationsTable.id, {
    onDelete: "set null",
  }),
  category: text("category").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  bestTime: text("best_time"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
