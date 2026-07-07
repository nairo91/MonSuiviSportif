import { expect, test } from "@playwright/test";
import { registerAndOnboard, uniqueEmail } from "./helpers";

test("export JSON puis ré-import : les données reviennent", async ({ page }) => {
  await registerAndOnboard(page, uniqueEmail("export"));

  // Crée un exercice distinctif puis exporte
  await page.goto("/exercises/new");
  await page.locator("#exercise-name").fill("Exercice Exporté E2E");
  await page.getByRole("button", { name: "Ajouter l'exercice" }).click();

  await page.goto("/settings");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();

  // Reset complet puis ré-import du fichier
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Reset complet" }).click();
  await page.goto("/exercises");
  await expect(page.getByText("Exercice Exporté E2E")).toHaveCount(0);

  await page.goto("/settings");
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles(path!);

  await page.goto("/exercises");
  await expect(page.getByText("Exercice Exporté E2E")).toBeVisible();
});
