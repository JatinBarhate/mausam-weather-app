export type Interest =
  | "fitness"
  | "travel"
  | "health"
  | "farming"
  | "commuting"
  | "general";

export type Location = {
  id: string;
  name: string;
  country?: string;
  latitude: number;
  longitude: number;
};

export type HourForecast = {
  time: string;
  temperature: number;
  rainChance: number;
  uvIndex: number;
  weatherCode: number;
};

export type DayForecast = {
  date: string;
  high: number;
  low: number;
  rainChance: number;
  weatherCode: number;
};

export type WeatherSnapshot = {
  location: Location;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  rainChance: number;
  uvIndex: number;
  aqi: number | null;
  pm25: number | null;
  pm10: number | null;
  visibility: number;
  condition: string;
  weatherCode: number;
  isDay: boolean;
  hourly: HourForecast[];
  daily: DayForecast[];
  source: "live" | "demo";
  updatedAt: string;
};

type LiveForecast = {
  current?: {
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    wind_speed_10m?: number;
    precipitation?: number;
    weather_code?: number;
    is_day?: number;
    visibility?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    uv_index?: number[];
    weather_code?: number[];
    visibility?: number[];
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    weather_code?: number[];
    uv_index_max?: number[];
  };
};

type LiveAir = {
  current?: {
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
  };
};

const DEMO_CITY: Record<string, Omit<WeatherSnapshot, "location" | "source" | "updatedAt">> = {
  Pune: {
    temperature: 27, feelsLike: 29, humidity: 64, windSpeed: 12,
    rainChance: 18, uvIndex: 6, aqi: 78, pm25: 22, pm10: 41,
    visibility: 9000, condition: "Partly cloudy", weatherCode: 2, isDay: true,
    hourly: [], daily: [],
  },
  Mumbai: {
    temperature: 30, feelsLike: 35, humidity: 76, windSpeed: 18,
    rainChance: 42, uvIndex: 8, aqi: 91, pm25: 29, pm10: 55,
    visibility: 7000, condition: "Light rain", weatherCode: 61, isDay: true,
    hourly: [], daily: [],
  },
  Nashik: {
    temperature: 25, feelsLike: 26, humidity: 51, windSpeed: 9,
    rainChance: 8, uvIndex: 5, aqi: 58, pm25: 15, pm10: 30,
    visibility: 10000, condition: "Clear sky", weatherCode: 1, isDay: true,
    hourly: [], daily: [],
  },
  Sangamner: {
    temperature: 26, feelsLike: 27, humidity: 48, windSpeed: 10,
    rainChance: 5, uvIndex: 7, aqi: 47, pm25: 12, pm10: 26,
    visibility: 10000, condition: "Mostly clear", weatherCode: 1, isDay: true,
    hourly: [], daily: [],
  },
};

export function weatherCondition(code: number): string {
  if (code === 0) return "Clear sky";
  if (code <= 2) return "Partly cloudy";
  if (code === 3) return "Overcast";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if (code >= 71 && code <= 77) return "Snow";
  if (code >= 80 && code <= 82) return "Rain showers";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

function demoForecast(location: Location): WeatherSnapshot {
  const base = DEMO_CITY[location.name] ?? DEMO_CITY.Pune!;
  const now = new Date();
  const hourly: HourForecast[] = Array.from({ length: 24 }, (_, hour) => {
    const time = new Date(now.getTime() + hour * 60 * 60 * 1000);
    const sun = Math.sin(((time.getHours() - 6) / 24) * Math.PI * 2);
    return {
      time: time.toISOString(),
      temperature: Math.round(base.temperature + sun * 3),
      rainChance: Math.max(0, Math.min(95, base.rainChance + Math.round(Math.sin(hour / 4) * 8))),
      uvIndex: Math.max(0, Math.round(base.uvIndex * Math.max(0, sun))),
      weatherCode: base.weatherCode,
    };
  });
  const daily: DayForecast[] = Array.from({ length: 7 }, (_, day) => {
    const date = new Date(now);
    date.setDate(now.getDate() + day);
    return {
      date: date.toISOString(),
      high: Math.round(base.temperature + 2 + Math.sin(day) * 2),
      low: Math.round(base.temperature - 6 + Math.cos(day) * 2),
      rainChance: Math.max(0, Math.min(95, base.rainChance + Math.round(Math.sin(day + 2) * 12))),
      weatherCode: day === 2 && base.rainChance > 20 ? 61 : base.weatherCode,
    };
  });
  return { ...base, location, hourly, daily, source: "demo", updatedAt: now.toISOString() };
}

export async function getWeather(
  location: Location,
  demo: boolean,
): Promise<WeatherSnapshot> {
  if (demo) return demoForecast(location);

  const coords = `latitude=${location.latitude}&longitude=${location.longitude}`;
  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?${coords}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,is_day,wind_speed_10m,visibility" +
    "&hourly=temperature_2m,precipitation_probability,uv_index,weather_code,visibility" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max" +
    "&forecast_days=7&timezone=auto";
  const airUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?${coords}` +
    "&current=us_aqi,pm2_5,pm10&timezone=auto";

  const [forecastResponse, airResponse] = await Promise.all([
    fetch(forecastUrl),
    fetch(airUrl).catch(() => null),
  ]);
  if (!forecastResponse.ok) {
    throw new Error("Live forecast is unavailable right now. Try again or switch to demo data.");
  }
  const forecast = (await forecastResponse.json()) as LiveForecast;
  const air = airResponse?.ok ? ((await airResponse.json()) as LiveAir) : null;
  const current = forecast.current;
  if (!current || typeof current.temperature_2m !== "number") {
    throw new Error("The weather provider returned an incomplete forecast.");
  }

  const times = forecast.hourly?.time ?? [];
  const nearestHour = Math.max(
    0,
    times.findIndex((time) => new Date(time).getTime() >= Date.now()),
  );
  const hourly: HourForecast[] = times.slice(nearestHour, nearestHour + 24).map((time, i) => {
    const index = nearestHour + i;
    return {
      time,
      temperature: Math.round(forecast.hourly?.temperature_2m?.[index] ?? current.temperature_2m!),
      rainChance: Math.round(forecast.hourly?.precipitation_probability?.[index] ?? 0),
      uvIndex: Math.round(forecast.hourly?.uv_index?.[index] ?? 0),
      weatherCode: forecast.hourly?.weather_code?.[index] ?? current.weather_code ?? 3,
    };
  });
  const daily: DayForecast[] = (forecast.daily?.time ?? []).map((date, index) => ({
    date,
    high: Math.round(forecast.daily?.temperature_2m_max?.[index] ?? current.temperature_2m!),
    low: Math.round(forecast.daily?.temperature_2m_min?.[index] ?? current.temperature_2m!),
    rainChance: Math.round(forecast.daily?.precipitation_probability_max?.[index] ?? 0),
    weatherCode: forecast.daily?.weather_code?.[index] ?? current.weather_code ?? 3,
  }));

  return {
    location,
    temperature: Math.round(current.temperature_2m),
    feelsLike: Math.round(current.apparent_temperature ?? current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m ?? 0),
    windSpeed: Math.round(current.wind_speed_10m ?? 0),
    rainChance: Math.round(forecast.daily?.precipitation_probability_max?.[0] ?? 0),
    uvIndex: Math.round(forecast.daily?.uv_index_max?.[0] ?? 0),
    aqi: typeof air?.current?.us_aqi === "number" ? Math.round(air.current.us_aqi) : null,
    pm25: typeof air?.current?.pm2_5 === "number" ? Math.round(air.current.pm2_5) : null,
    pm10: typeof air?.current?.pm10 === "number" ? Math.round(air.current.pm10) : null,
    visibility: Math.round(current.visibility ?? 10000),
    condition: weatherCondition(current.weather_code ?? 3),
    weatherCode: current.weather_code ?? 3,
    isDay: current.is_day === 1,
    hourly,
    daily,
    source: "live",
    updatedAt: new Date().toISOString(),
  };
}

export type PlaceResult = Location;

export async function searchPlaces(query: string): Promise<PlaceResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];
  const url =
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}` +
    "&count=6&language=en&format=json";
  const response = await fetch(url);
  if (!response.ok) throw new Error("Location search is unavailable. Try again.");
  const payload = (await response.json()) as {
    results?: Array<{
      id: number;
      name: string;
      country?: string;
      latitude: number;
      longitude: number;
      admin1?: string;
    }>;
  };
  return (payload.results ?? []).map((place) => ({
    id: String(place.id),
    name: place.name,
    country: place.admin1 ? `${place.admin1}, ${place.country ?? ""}` : place.country,
    latitude: place.latitude,
    longitude: place.longitude,
  }));
}

export function aqiCategory(aqi: number | null): {
  label: string;
  advice: string;
} {
  if (aqi === null) return { label: "Unavailable", advice: "Air quality data is not available for this location." };
  if (aqi <= 50) return { label: "Good", advice: "Air quality is good. Enjoy your usual outdoor routine." };
  if (aqi <= 100) return { label: "Moderate", advice: "Air is acceptable for most people. Sensitive groups may prefer lighter outdoor activity." };
  if (aqi <= 150) return { label: "Sensitive groups", advice: "Reduce prolonged outdoor exertion if you are sensitive to air pollution." };
  if (aqi <= 200) return { label: "Unhealthy", advice: "Limit outdoor exercise and consider wearing a well-fitted mask outside." };
  return { label: "Very unhealthy", advice: "Avoid strenuous outdoor activity and keep windows closed where possible." };
}
