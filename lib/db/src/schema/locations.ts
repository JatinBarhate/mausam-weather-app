import {
  doublePrecision,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const locationsTable = pgTable(
  "locations",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    latitude: doublePrecision("latitude").notNull(),
    longitude: doublePrecision("longitude").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("locations_coordinates_uq").on(table.latitude, table.longitude),
  ],
);
