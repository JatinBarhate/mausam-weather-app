import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import {
  CreateUserBody,
  CreateUserResponse,
  DeleteSavedLocationParams,
  GetUserParams,
  GetUserResponse,
  GetPreferencesParams,
  GetPreferencesResponse,
  ListSavedLocationsParams,
  ListSavedLocationsResponse,
  SaveLocationBody,
  SaveLocationParams,
  SaveLocationResponse,
  UpdatePreferencesBody,
  UpdatePreferencesParams,
  UpdatePreferencesResponse,
} from "@workspace/api-zod";
import {
  db,
  locationsTable,
  savedLocationsTable,
  userPreferencesTable,
  usersTable,
} from "@workspace/db";

const router: IRouter = Router();

router.use((req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Sign in to access this profile." });
    return;
  }
  next();
});

function ownsUser(
  req: Request,
  res: Response,
  userId: string,
): boolean {
  if (getAuth(req).userId === userId) return true;
  res.status(403).json({ error: "You can only access your own profile." });
  return false;
}

router.post("/users", async (req, res): Promise<void> => {
  const parsed = CreateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  if (!ownsUser(req, res, parsed.data.id)) return;

  const [user] = await db
    .insert(usersTable)
    .values(parsed.data)
    .onConflictDoUpdate({
      target: usersTable.id,
      set: { name: parsed.data.name },
    })
    .returning();

  if (!user) {
    res.status(500).json({ error: "Unable to save profile" });
    return;
  }

  await db
    .insert(userPreferencesTable)
    .values({ userId: user.id })
    .onConflictDoNothing();

  res.status(200).json(CreateUserResponse.parse(user));
});

router.get("/users/:userId", async (req, res): Promise<void> => {
  const params = GetUserParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!ownsUser(req, res, params.data.userId)) return;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, params.data.userId));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(GetUserResponse.parse(user));
});

router.get("/users/:userId/preferences", async (req, res): Promise<void> => {
  const params = GetPreferencesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!ownsUser(req, res, params.data.userId)) return;
  const [preferences] = await db
    .select()
    .from(userPreferencesTable)
    .where(eq(userPreferencesTable.userId, params.data.userId));
  if (!preferences) {
    res.status(404).json({ error: "Preferences not found" });
    return;
  }
  res.json(GetPreferencesResponse.parse(preferences));
});

router.put("/users/:userId/preferences", async (req, res): Promise<void> => {
  const params = UpdatePreferencesParams.safeParse(req.params);
  const body = UpdatePreferencesBody.safeParse(req.body);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  if (!ownsUser(req, res, params.data.userId)) return;

  const [preferences] = await db
    .insert(userPreferencesTable)
    .values({ userId: params.data.userId, ...body.data })
    .onConflictDoUpdate({
      target: userPreferencesTable.userId,
      set: { ...body.data, updatedAt: new Date() },
    })
    .returning();
  if (!preferences) {
    res.status(500).json({ error: "Unable to save preferences" });
    return;
  }
  res.json(UpdatePreferencesResponse.parse(preferences));
});

router.get(
  "/users/:userId/saved-locations",
  async (req, res): Promise<void> => {
    const params = ListSavedLocationsParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!ownsUser(req, res, params.data.userId)) return;

    const saved = await db
      .select({
        id: locationsTable.id,
        name: locationsTable.name,
        latitude: locationsTable.latitude,
        longitude: locationsTable.longitude,
        isActive: savedLocationsTable.isActive,
      })
      .from(savedLocationsTable)
      .innerJoin(
        locationsTable,
        eq(savedLocationsTable.locationId, locationsTable.id),
      )
      .where(eq(savedLocationsTable.userId, params.data.userId));
    res.json(ListSavedLocationsResponse.parse(saved));
  },
);

router.post(
  "/users/:userId/saved-locations",
  async (req, res): Promise<void> => {
    const params = SaveLocationParams.safeParse(req.params);
    const body = SaveLocationBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!ownsUser(req, res, params.data.userId)) return;
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    if (!ownsUser(req, res, params.data.userId)) return;

    const [location] = await db
      .insert(locationsTable)
      .values(body.data)
      .onConflictDoUpdate({
        target: [locationsTable.latitude, locationsTable.longitude],
        set: { name: body.data.name },
      })
      .returning();
    if (!location) {
      res.status(500).json({ error: "Unable to save location" });
      return;
    }

    const [saved] = await db
      .insert(savedLocationsTable)
      .values({ userId: params.data.userId, locationId: location.id })
      .onConflictDoUpdate({
        target: [savedLocationsTable.userId, savedLocationsTable.locationId],
        set: { isActive: false },
      })
      .returning();
    if (!saved) {
      res.status(500).json({ error: "Unable to save location" });
      return;
    }
    res.status(201).json(
      SaveLocationResponse.parse({
        ...location,
        isActive: saved.isActive,
      }),
    );
  },
);

router.delete(
  "/users/:userId/saved-locations/:locationId",
  async (req, res): Promise<void> => {
    const params = DeleteSavedLocationParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!ownsUser(req, res, params.data.userId)) return;
    const [removed] = await db
      .delete(savedLocationsTable)
      .where(
        and(
          eq(savedLocationsTable.userId, params.data.userId),
          eq(savedLocationsTable.locationId, params.data.locationId),
        ),
      )
      .returning();
    if (!removed) {
      res.status(404).json({ error: "Saved location not found" });
      return;
    }
    res.sendStatus(204);
  },
);

export default router;
