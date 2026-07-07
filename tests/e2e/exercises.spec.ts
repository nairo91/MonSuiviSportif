import { expect, test } from "@playwright/test";
import { registerAndOnboard, uniqueEmail } from "./helpers";

test("création d'un exercice puis recherche dans la bibliothèque", async ({ page }) => {
  await registerAndOnboard(page, uniqueEmail("exo"));

  await page.goto("/exercises/new");
  await page.locator("#exercise-name").fill("Front Squat E2E");
  await page.locator("#exercise-subcategory").fill("Force verticale");
  await page.getByRole("button", { name: "Ajouter l'exercice" }).click();

  await page.goto("/exercises");
  await expect(page.getByText("Front Squat E2E")).toBeVisible();

  // La recherche filtre
  const search = page.getByPlaceholder(/recherch/i).first();
  await search.fill("Front Squat E2E");
  await expect(page.getByText("Front Squat E2E")).toBeVisible();
  await search.fill("zzz-introuvable");
  await expect(page.getByText("Front Squat E2E")).toHaveCount(0);
});
