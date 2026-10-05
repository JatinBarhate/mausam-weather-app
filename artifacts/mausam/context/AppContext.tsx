import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  createUser,
  deleteSavedLocation as removeLocationFromServer,
  getPreferences,
  getUser,
  listSavedLocations,
  saveLocation as saveLocationToServer,
  updatePreferences,
} from "@workspace/api-client-react";
import type { Interest, Location } from "../lib/weather";

const STORAGE_PREFIX = "mausam.profile.v1.";
const INITIAL_LOCATION: Location = {
  id: "pune",
  name: "Pune",
  country: "Maharashtra, India",
  latitude: 18.5204,
  longitude: 73.8567,
};

export type UserProfile = {
  id: string;
  name: string;
  interest: Interest;
  activity: string;
  notificationsEnabled: boolean;
  useDemoData: boolean;
  activeLocation: Location;
  savedLocations: Location[];
};

type AppContextValue = {
  profile: UserProfile | null;
  isLoading: boolean;
  syncWarning: string | null;
  completeSetup: (name: string, interest: Interest, activity: string) => Promise<void>;
  updateProfile: (changes: Partial<Pick<UserProfile, "interest" | "activity" | "notificationsEnabled" | "useDemoData">>) => Promise<void>;
  setActiveLocation: (location: Location) => Promise<void>;
  addLocation: (location: Location) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;
  clearSyncWarning: () => void;
};

const AppContext = createContext<AppContextValue | null>(null);

function storageKey(userId: string) {
  return `${STORAGE_PREFIX}${userId}`;
}

async function persistLocally(userId: string, profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), JSON.stringify(profile));
}

export function AppProvider({ children, userId }: { children: ReactNode; userId: string | null }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setProfile(null);
    setSyncWarning(null);
    if (!userId) {
      setIsLoading(false);
      return () => {
        alive = false;
      };
    }
    setIsLoading(true);
    const restore = async () => {
      let cachedProfile: UserProfile | null = null;
      try {
        const raw = await AsyncStorage.getItem(storageKey(userId));
        if (raw) {
          const parsed = JSON.parse(raw) as UserProfile;
          if (parsed.id === userId) cachedProfile = parsed;
        }
      } catch {
        cachedProfile = null;
      }
      try {
        const [user, preferences, serverLocations] = await Promise.all([
          getUser(userId),
          getPreferences(userId),
          listSavedLocations(userId),
        ]);
        const savedLocations: Location[] = serverLocations.map((location) => ({
          id: String(location.id),
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
        }));
        const activeLocation = serverLocations.find((location) => location.isActive);
        const restored: UserProfile = {
          id: userId,
          name: user.name,
          interest: (preferences.interests[0] ?? "general") as Interest,
          activity: preferences.preferredActivity,
          notificationsEnabled: preferences.notificationsEnabled,
          useDemoData: preferences.useDemoData,
          activeLocation: activeLocation
            ? {
                id: String(activeLocation.id),
                name: activeLocation.name,
                latitude: activeLocation.latitude,
                longitude: activeLocation.longitude,
              }
            : savedLocations[0] ?? INITIAL_LOCATION,
          savedLocations: savedLocations.length ? savedLocations : [INITIAL_LOCATION],
        };
        if (alive) {
          setProfile(restored);
          await persistLocally(userId, restored);
        }
      } catch {
        if (alive) {
          setProfile(cachedProfile);
          setSyncWarning(
            cachedProfile
              ? "Showing this device’s saved profile because account sync is unavailable."
              : "We couldn’t restore this account’s saved profile. Set it up again or try once the connection is back.",
          );
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    };
    void restore();
    return () => {
      alive = false;
    };
  }, [userId]);

  const completeSetup = useCallback(async (name: string, interest: Interest, activity: string) => {
    if (!userId) throw new Error("Sign in before creating a weather profile.");
    const id = userId;
    const next: UserProfile = {
      id,
      name: name.trim(),
      interest,
      activity,
      notificationsEnabled: false,
      useDemoData: true,
      activeLocation: INITIAL_LOCATION,
      savedLocations: [INITIAL_LOCATION],
    };
    setProfile(next);
    await persistLocally(userId, next);
    try {
      await createUser({ id, name: next.name });
      await updatePreferences(id, {
        interests: [interest],
        preferredActivity: activity,
        notificationsEnabled: false,
        useDemoData: true,
      });
      const serverLocation = await saveLocationToServer(id, {
        name: INITIAL_LOCATION.name,
        latitude: INITIAL_LOCATION.latitude,
        longitude: INITIAL_LOCATION.longitude,
      });
      const savedPune = { ...INITIAL_LOCATION, id: String(serverLocation.id) };
      const synced = { ...next, activeLocation: savedPune, savedLocations: [savedPune] };
      setProfile(synced);
      await persistLocally(userId, synced);
      setSyncWarning(null);
    } catch {
      setSyncWarning("Profile saved on this device. Server sync is unavailable until the API is online.");
    }
  }, [userId]);

  const updateProfile = useCallback(async (
    changes: Partial<Pick<UserProfile, "interest" | "activity" | "notificationsEnabled" | "useDemoData">>,
  ) => {
    if (!profile) return;
    const next = { ...profile, ...changes };
    setProfile(next);
    await persistLocally(profile.id, next);
    try {
      await updatePreferences(profile.id, {
        interests: [next.interest],
        preferredActivity: next.activity,
        notificationsEnabled: next.notificationsEnabled,
        useDemoData: next.useDemoData,
      });
      setSyncWarning(null);
    } catch {
      setSyncWarning("Your change is saved on this device, but could not sync to the server.");
    }
  }, [profile]);

  const setActiveLocation = useCallback(async (location: Location) => {
    if (!profile) return;
    const saved = profile.savedLocations.some((place) => place.id === location.id)
      ? profile.savedLocations
      : [...profile.savedLocations, location];
    const next = { ...profile, activeLocation: location, savedLocations: saved };
    setProfile(next);
    await persistLocally(profile.id, next);
    if (!profile.savedLocations.some((place) => place.id === location.id)) {
      try {
        const savedLocation = await saveLocationToServer(profile.id, {
          name: location.name,
          latitude: location.latitude,
          longitude: location.longitude,
        });
        const syncedLocation = { ...location, id: String(savedLocation.id) };
        const synced = {
          ...next,
          activeLocation: syncedLocation,
          savedLocations: next.savedLocations.map((place) =>
            place.id === location.id ? syncedLocation : place,
          ),
        };
        setProfile(synced);
        await persistLocally(profile.id, synced);
      } catch {
        setSyncWarning("Location saved on this device, but could not sync to the server.");
      }
    }
  }, [profile]);

  const addLocation = useCallback(async (location: Location) => {
    if (!profile) return;
    if (profile.savedLocations.some((place) => place.id === location.id)) {
      await setActiveLocation(location);
      return;
    }
    const next = { ...profile, savedLocations: [...profile.savedLocations, location] };
    setProfile(next);
    await persistLocally(profile.id, next);
    try {
      const savedLocation = await saveLocationToServer(profile.id, {
        name: location.name,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      const syncedLocation = { ...location, id: String(savedLocation.id) };
      const synced = {
        ...next,
        savedLocations: next.savedLocations.map((place) =>
          place.id === location.id ? syncedLocation : place,
        ),
      };
      setProfile(synced);
      await persistLocally(profile.id, synced);
      setSyncWarning(null);
    } catch {
      setSyncWarning("Location saved on this device, but could not sync to the server.");
    }
  }, [profile, setActiveLocation]);

  const removeLocation = useCallback(async (id: string) => {
    if (!profile || profile.savedLocations.length < 2) return;
    const nextLocations = profile.savedLocations.filter((place) => place.id !== id);
    const next = {
      ...profile,
      savedLocations: nextLocations,
      activeLocation: profile.activeLocation.id === id ? nextLocations[0]! : profile.activeLocation,
    };
    setProfile(next);
    await persistLocally(profile.id, next);
    const numericId = Number(id);
    if (Number.isFinite(numericId)) {
      try {
        await removeLocationFromServer(profile.id, numericId);
      } catch {
        setSyncWarning("Location removed from this device, but could not sync to the server.");
      }
    }
  }, [profile]);

  const value = useMemo<AppContextValue>(() => ({
    profile,
    isLoading,
    syncWarning,
    completeSetup,
    updateProfile,
    setActiveLocation,
    addLocation,
    removeLocation,
    clearSyncWarning: () => setSyncWarning(null),
  }), [profile, isLoading, syncWarning, completeSetup, updateProfile, setActiveLocation, addLocation, removeLocation]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside AppProvider");
  return context;
}
