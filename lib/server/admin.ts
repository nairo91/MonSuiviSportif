// Rôles administrateur : emails listés dans ADMIN_EMAILS (séparés par des
// virgules, insensible à la casse). Les fonctionnalités coûteuses (coach IA)
// sont réservées aux admins.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;

  const configured = process.env.ADMIN_EMAILS;
  if (!configured) return false;

  const admins = configured
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  return admins.includes(email.trim().toLowerCase());
}
