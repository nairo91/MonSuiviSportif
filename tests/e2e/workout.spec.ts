import { expect, test } from "@playwright/test";
import { registerAndOnboard, uniqueEmail } from "./helpers";

test("séance complète : sélection, séries, terminer, historique", async ({ page }) => {
  await registerAndOnboard(page, uniqueEmail("workout"));

  await page.goto("/workouts/start");
  // Sélectionne le premier exercice de la liste
  await page.getByText("Developpe couche", { exact: false }).first().click();
  await page.getByRole("button", { name: "Commencer" }).click();

  await expect(page).toHaveURL(/workouts\/active/);

  // Ajoute une série 100 kg × 5
  await page.getByPlaceholder("Poids").first().fill("100");
  await page.getByPlaceholder("Reps").first().fill("5");
  await page.getByRole("button", { name: "Valider la serie" }).first().click();
  await expect(page.getByText(/Serie 1/i)).toBeVisible();

  // Termine la séance
  await page.getByRole("button", { name: "Terminer" }).click();
  await expect(page).toHaveURL(/workouts\/summary/);

  // Elle apparaît dans l'historique
  await page.goto("/history");
  await expect(page.getByText(/Developpe couche/i).first()).toBeVisible();
});
