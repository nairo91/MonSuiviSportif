import { Page, expect } from "@playwright/test";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@e2e.test`;
}

export const PASSWORD = "motdepasse123";

/** Crée un compte tout neuf et passe l'onboarding : arrive sur le dashboard. */
export async function registerAndOnboard(page: Page, email: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "S'inscrire" }).click();
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.locator("#confirm-password").fill(PASSWORD);
  await page.getByRole("button", { name: "Créer mon compte" }).click();

  // Onboarding
  await page.locator("#name").fill("Testeur E2E");
  await expect(page.getByRole("button", { name: "Ouvrir mon espace" })).toBeVisible();
  await page.getByRole("button", { name: "Ouvrir mon espace" }).click();

  // Dashboard visible
  await expect(page.getByText("IronTrack").first()).toBeVisible();
}
