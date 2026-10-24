import { requestJson } from "./client";

export type DailyStatistics = {
  date: string;
  timezone: string;
  heartRateBpm: number | null;
  steps: number | null;
  sleepHours: number | null;
  waterMl: number | null;
};

export type WaterIntakeRequest = {
  intakeId: string;
  occurredAt: string;
  amountMl: number;
};

export type WaterIntakeResponse = {
  intakeId: string;
  amountMl: number;
  status: "CREATED" | "DUPLICATE" | string;
};

export type SleepDailyRequest = {
  sleepHours: number;
};

export type SleepDailyResponse = {
  date: string;
  timezone: string;
  sleepHours: number;
};

export function getDailyStatistics(signal?: AbortSignal) {
  return requestJson<DailyStatistics>("/api/statistics/daily", { signal });
}

export function createWaterIntake(payload: WaterIntakeRequest) {
  return requestJson<WaterIntakeResponse>("/api/water-intakes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateDailySleep(payload: SleepDailyRequest) {
  return requestJson<SleepDailyResponse>("/api/sleep/daily", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function createIntakeId(): string {
  return (
    "intake-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}
