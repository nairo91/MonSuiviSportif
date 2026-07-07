import { describe, expect, it } from "vitest";
import { createDefaultExercises, createEmptyAppData, normalizePersistedAppData } from "@/lib/default-data";

describe("createEmptyAppData", () => {
  it("contient la bibliothèque d'exercices par défaut", () => {
    const data = createEmptyAppData();
    expect(data.exercises.length).toBe(createDefaultExercises().length);
    expect(data.exercises.length).toBeGreaterThan(0);
    expect(data.sessions).toEqual([]);
    expect(data.preferences.onboardingCompleted).toBe(false);
  });
});

describe("normalizePersistedAppData", () => {
  it("null/undefined → données par défaut", () => {
    expect(normalizePersistedAppData(null).sessions).toEqual([]);
    expect(normalizePersistedAppData(undefined).exercises.length).toBeGreaterThan(0);
  });

  it("RÉGRESSION bug JSONB : une chaîne (state double-encodé) ne doit pas crasher et retombe sur les défauts", () => {
    const corrupted = JSON.stringify(createEmptyAppData()) as unknown as Parameters<typeof normalizePersistedAppData>[0];
    const result = normalizePersistedAppData(corrupted);
    expect(result.sessions).toEqual([]);
    expect(Array.isArray(result.exercises)).toBe(true);
  });

  it("conserve les données fournies", () => {
    const data = createEmptyAppData();
    data.preferences.onboardingCompleted = true;
    data.sessions = [{ id: "s", startedAt: "", endedAt: "", exerciseEntries: [], notes: "", feeling: 8 }];
    const result = normalizePersistedAppData(data);
    expect(result.preferences.onboardingCompleted).toBe(true);
    expect(result.sessions).toHaveLength(1);
  });

  it("complète les préférences partielles avec les défauts", () => {
    const result = normalizePersistedAppData({ preferences: { theme: "light" } } as never);
    expect(result.preferences.theme).toBe("light");
    expect(result.preferences.units).toBe("kg");
  });

  it("champs invalides → défauts", () => {
    const result = normalizePersistedAppData({ exercises: "oops", sessions: 42, lastCompletedSessionId: 3 } as never);
    expect(Array.isArray(result.exercises)).toBe(true);
    expect(result.sessions).toEqual([]);
    expect(result.lastCompletedSessionId).toBeNull();
  });
});
