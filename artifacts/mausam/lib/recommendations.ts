import type { Interest, WeatherSnapshot } from "./weather";

export type WeatherInsight = {
  icon: string;
  title: string;
  body: string;
  tone: "good" | "caution" | "neutral";
};

export type WeatherAlert = {
  title: string;
  detail: string;
  severity: "high" | "medium" | "low";
  icon: string;
};

export function personalizedInsights(
  weather: WeatherSnapshot,
  interest: Interest,
  activity: string,
): WeatherInsight[] {
  const insights: WeatherInsight[] = [];
  if (interest === "fitness") {
    const exerciseHour = weather.hourly.find(
      (hour) => hour.uvIndex <= 4 && hour.temperature <= 28 && hour.rainChance < 30,
    );
    insights.push({
      icon: "activity",
      title: exerciseHour ? "A good window to move" : "Plan a lighter session",
      body: exerciseHour
        ? `${activity || "A run"} looks most comfortable around ${new Date(exerciseHour.time).toLocaleTimeString([], { hour: "numeric" })}.`
        : "Warmth or UV may make strenuous exercise less comfortable. Try an indoor session.",
      tone: exerciseHour ? "good" : "caution",
    });
  } else if (interest === "travel") {
    insights.push({
      icon: "navigation",
      title: weather.rainChance >= 40 ? "Allow extra travel time" : "Travel conditions look steady",
      body: weather.rainChance >= 40
        ? "Rain is possible today. Check your route before heading out."
        : `Visibility is ${(weather.visibility / 1000).toFixed(1)} km with a ${weather.rainChance}% rain chance.`,
      tone: weather.rainChance >= 40 ? "caution" : "good",
    });
  } else if (interest === "health") {
    insights.push({
      icon: "heart",
      title: weather.aqi !== null && weather.aqi > 100 ? "Take it easy outdoors" : "A comfortable day for fresh air",
      body: weather.aqi !== null && weather.aqi > 100
        ? "Air quality is elevated. Reduce long or intense outdoor activity."
        : "Air conditions are reasonable for most people. Stay hydrated in the afternoon.",
      tone: weather.aqi !== null && weather.aqi > 100 ? "caution" : "good",
    });
  } else if (interest === "farming") {
    insights.push({
      icon: "sun",
      title: weather.rainChance >= 50 ? "Rain may support the soil" : "Check soil moisture",
      body: weather.rainChance >= 50
        ? "Rain is likely. Review drainage and avoid irrigation until the forecast clears."
        : "Rain is limited today. Check soil conditions before scheduling irrigation.",
      tone: weather.rainChance >= 50 ? "good" : "neutral",
    });
  } else if (interest === "commuting") {
    insights.push({
      icon: "map",
      title: weather.rainChance >= 40 ? "Keep a rain layer nearby" : "Your commute looks clear",
      body: weather.visibility < 3000
        ? "Visibility is low. Leave extra following distance and allow more time."
        : `${weather.rainChance}% chance of rain with ${(weather.visibility / 1000).toFixed(1)} km visibility.`,
      tone: weather.rainChance >= 40 || weather.visibility < 3000 ? "caution" : "good",
    });
  } else {
    insights.push({
      icon: "sun",
      title: weather.temperature >= 34 ? "Take a midday break" : "A good day to get outside",
      body: weather.temperature >= 34
        ? "The afternoon will feel hot. Plan outdoor errands for earlier or later."
        : "Conditions are comfortable for everyday plans. Keep an eye on the afternoon forecast.",
      tone: weather.temperature >= 34 ? "caution" : "good",
    });
  }
  if (weather.rainChance >= 60) {
    insights.push({ icon: "umbrella", title: "Bring an umbrella", body: `There is a ${weather.rainChance}% chance of rain today.`, tone: "caution" });
  }
  if (weather.uvIndex >= 8) {
    insights.push({ icon: "sun", title: "High UV this afternoon", body: "Use sun protection and seek shade during peak afternoon hours.", tone: "caution" });
  }
  return insights;
}

export function relevantAlerts(weather: WeatherSnapshot): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  if (weather.weatherCode >= 95) {
    alerts.push({ title: "Thunderstorm nearby", detail: "Pause outdoor plans and move away from exposed areas.", severity: "high", icon: "cloud-lightning" });
  }
  if (weather.rainChance >= 65) {
    alerts.push({ title: "Rain likely today", detail: `${weather.rainChance}% chance of rain. Carry an umbrella and allow more travel time.`, severity: "medium", icon: "cloud-rain" });
  }
  if (weather.temperature >= 38 || weather.feelsLike >= 40) {
    alerts.push({ title: "Heat advisory", detail: "Limit strenuous activity during the hottest part of the day and drink water.", severity: "high", icon: "thermometer" });
  }
  if (weather.uvIndex >= 8) {
    alerts.push({ title: "High UV index", detail: "Use SPF, cover exposed skin, and look for shade around midday.", severity: "medium", icon: "sun" });
  }
  if (weather.aqi !== null && weather.aqi > 150) {
    alerts.push({ title: "Air quality alert", detail: "Reduce outdoor exertion and keep sensitive groups informed.", severity: "high", icon: "wind" });
  }
  if (weather.visibility < 1500) {
    alerts.push({ title: "Low visibility", detail: "Drive carefully and allow additional time for your journey.", severity: "medium", icon: "eye" });
  }
  if (!alerts.length) {
    alerts.push({ title: "No active weather alerts", detail: "Nothing needs your attention right now. We will highlight conditions that matter to you.", severity: "low", icon: "check-circle" });
  }
  return alerts;
}

export function aqiSummary(aqi: number | null): string {
  if (aqi === null) return "Air quality readings are not available right now.";
  if (aqi <= 50) return "Good air quality. A great day for outdoor plans.";
  if (aqi <= 100) return "Moderate air quality. Most people can continue usual activities.";
  if (aqi <= 150) return "Sensitive groups may want to reduce prolonged outdoor exertion.";
  return "Air quality is poor. Consider moving intense activity indoors.";
}
