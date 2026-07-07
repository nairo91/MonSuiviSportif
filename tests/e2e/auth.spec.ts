import { expect, test } from "@playwright/test";
import { PASSWORD, registerAndOnboard, uniqueEmail } from "./helpers";

test("inscription, onboarding, reconnexion : les données survivent au re-login", async ({ page }) => {
  const email = uniqueEmail("auth");
  await registerAndOnboard(page, email);

  // Déconnexion depuis les réglages
  await page.goto("/settings");
  await page.getByRole("button", { name: "Se déconnecter" }).click();
  await expect(page.getByRole("heading", { name: "Connexion" })).toBeVisible();

  // Reconnexion : l'onboarding ne doit PAS être redemandé (persistance serveur)
  await page.locator("#email").fill(email);
  await page.locator("#password").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("button", { name: "Ouvrir mon espace" })).toHaveCount(0);
});

test("mauvais mot de passe : message d'erreur, pas de session", async ({ page }) => {
  const email = uniqueEmail("badpwd");
  await registerAndOnboard(page, email);
  await page.goto("/settings");
  await page.getByRole("button", { name: "Se déconnecter" }).click();

  await page.locator("#email").fill(email);
  await page.locator("#password").fill("mauvais-mot-de-passe");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText(/incorrect|invalide|erreur/i).first()).toBeVisible();
});

test("les données d'un compte ne fuient pas vers un autre sur la même machine", async ({ page }) => {
  const emailA = uniqueEmail("user-a");
  await registerAndOnboard(page, emailA);

  // A crée un exercice distinctif
  await page.goto("/exercises/new");
  await page.locator("#exercise-name").fill("Exercice Secret De A");
  await page.getByRole("button", { name: "Ajouter l'exercice" }).click();

  await page.goto("/settings");
  await page.getByRole("button", { name: "Se déconnecter" }).click();

  // B se crée un compte sur la même machine
  const emailB = uniqueEmail("user-b");
  await page.getByRole("button", { name: "S'inscrire" }).click();
  await page.locator("#email").fill(emailB);
  await page.locator("#password").fill(PASSWORD);
  await page.locator("#confirm-password").fill(PASSWORD);
  await page.getByRole("button", { name: "Créer mon compte" }).click();
  await page.locator("#name").fill("B");
  await page.getByRole("button", { name: "Ouvrir mon espace" }).click();

  await page.goto("/exercises");
  await expect(page.getByText("Exercice Secret De A")).toHaveCount(0);
});
