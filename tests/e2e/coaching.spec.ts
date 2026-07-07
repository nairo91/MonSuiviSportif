import { expect, test } from "@playwright/test";
import { registerAndOnboard, uniqueEmail } from "./helpers";

const fakePlan = {
  id: "plan-e2e",
  createdAt: new Date().toISOString(),
  goalDescription: "Prise de force",
  durationWeeks: 4,
  coachSummary: "Plan de test généré par le mock E2E.",
  progressionStrategy: "Progression linéaire simple.",
  workouts: [
    {
      id: "pw-e2e-1",
      weekNumber: 1,
      sessionNumber: 1,
      label: "Push Force",
      focusDescription: "Pectoraux et épaules",
      estimatedDurationMinutes: 45,
      exercises: [
        {
          exerciseId: "bench-press",
          exerciseName: "Developpe couche",
          sets: [
            { reps: 8, weight: 60 },
            { reps: 8, weight: 62.5 },
          ],
        },
      ],
    },
  ],
};

test("génération de plan IA (mockée) puis séance pré-remplie depuis le plan", async ({ page }) => {
  await registerAndOnboard(page, uniqueEmail("coach"));

  // Mock de l'API IA : pas de clé requise, réponse déterministe
  await page.route("**/api/ai/plan", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ plan: fakePlan }) }),
  );

  await page.goto("/coaching/generate");
  // Les 8 premiers exercices sont pré-sélectionnés (>= 3 requis)
  await page.getByRole("textbox").first().fill("Objectif E2E : prise de force sur 4 semaines");
  await page.getByRole("button", { name: /Générer mon plan IA/i }).click();

  // Le plan s'affiche sur /coaching
  await expect(page).toHaveURL(/coaching/);
  await expect(page.getByText("Push Force")).toBeVisible();

  // « Démarrer » ouvre le dialogue, la séance démarre pré-remplie
  await page.getByRole("button", { name: "Démarrer", exact: true }).first().click();
  await page.getByRole("button", { name: "Démarrer la séance" }).click();
  await expect(page).toHaveURL(/workouts\/active/);
  await expect(page.getByText(/Serie 1/i).first()).toBeVisible();
  await expect(page.getByText(/Serie 2/i).first()).toBeVisible();

  // Terminer marque la séance planifiée comme faite
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(page).toHaveURL(/workouts\/summary/);
  await page.goto("/coaching");
  await expect(page.getByText(/1\/1 séances réalisées|1\/1/).first()).toBeVisible();
});
