import { describe, expect, it } from "vitest";
import {
  DEFAULT_REST_SECONDS,
  computeProgress,
  computeRemainingSeconds,
  formatCountdown,
  resolveRestDuration,
} from "@/lib/rest-timer";

describe("computeRemainingSeconds", () => {
  it("arrondit à la seconde supérieure", () => {
    expect(computeRemainingSeconds(10_500, 10_000)).toBe(1);
    expect(computeRemainingSeconds(12_000, 10_000)).toBe(2);
  });

  it("jamais négatif", () => {
    expect(computeRemainingSeconds(10_000, 20_000)).toBe(0);
  });
});

describe("formatCountdown", () => {
  it("formate minutes:secondes", () => {
    expect(formatCountdown(90)).toBe("1:30");
    expect(formatCountdown(7)).toBe("0:07");
    expect(formatCountdown(600)).toBe("10:00");
  });

  it("valeurs négatives → 0:00", () => {
    expect(formatCountdown(-5)).toBe("0:00");
  });
});

describe("resolveRestDuration", () => {
  it("la valeur de la série prime", () => {
    expect(resolveRestDuration(120, 90)).toBe(120);
  });

  it("sinon la préférence globale", () => {
    expect(resolveRestDuration(undefined, 150)).toBe(150);
    expect(resolveRestDuration(0, 150)).toBe(150);
  });

  it("sinon le défaut", () => {
    expect(resolveRestDuration(undefined, undefined)).toBe(DEFAULT_REST_SECONDS);
    expect(resolveRestDuration(0, 0)).toBe(DEFAULT_REST_SECONDS);
  });

  it("plafonné à 10 minutes", () => {
    expect(resolveRestDuration(9999, undefined)).toBe(600);
  });
});

describe("computeProgress", () => {
  it("0 au départ, 1 à la fin, bornée", () => {
    expect(computeProgress(90, 90)).toBe(0);
    expect(computeProgress(45, 90)).toBe(0.5);
    expect(computeProgress(0, 90)).toBe(1);
    expect(computeProgress(120, 90)).toBe(0);
    expect(computeProgress(10, 0)).toBe(1);
  });
});

describe("préférences par défaut", () => {
  it("le minuteur est activé par défaut à 90 s", async () => {
    const { createEmptyAppData } = await import("@/lib/default-data");
    const prefs = createEmptyAppData().preferences;
    expect(prefs.restTimerEnabled).toBe(true);
    expect(prefs.restTimerSeconds).toBe(90);
  });
});
