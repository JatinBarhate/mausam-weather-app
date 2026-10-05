import type { WeatherAlert } from "./recommendations";

export type NotificationMessage = {
  title: string;
  body: string;
  category: WeatherAlert["severity"];
};

export interface NotificationProvider {
  send(message: NotificationMessage): Promise<void>;
}

/**
 * Alert rules and presentation are independent from delivery. A Firebase
 * provider can implement this interface once server-side credentials exist;
 * the app never receives an FCM service credential.
 */
export function createNotificationService(provider: NotificationProvider) {
  return {
    async deliver(
      alerts: WeatherAlert[],
      enabled: boolean,
    ): Promise<void> {
      if (!enabled) return;
      const actionable = alerts.filter((alert) => alert.severity !== "low");
      await Promise.all(
        actionable.map((alert) =>
          provider.send({
            title: alert.title,
            body: alert.detail,
            category: alert.severity,
          }),
        ),
      );
    },
  };
}
