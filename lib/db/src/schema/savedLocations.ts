import { boolean, pgTable, primaryKey, text, timestamp, integer } from "drizzle-orm/pg-core";
import { locationsTable } from "./locations";
import { usersTable } from "./users";

export const savedLocationsTable = pgTable(
  "saved_locations",
  {
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    locationId: integer("location_id")
      .notNull()
      .references(() => locationsTable.id, { onDelete: "cascade" }),
    isActive: boolean("is_active").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.locationId] })],
);
