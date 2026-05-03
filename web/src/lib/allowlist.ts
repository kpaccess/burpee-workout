// Admin emails — always get full Pro access
export const ADMIN_EMAIL = "kpaccess@gmail.com";
const ADMIN_EMAILS = [ADMIN_EMAIL, "your-test-admin@gmail.com"];

// Friends & family — get free Pro access
const ALLOWED_EMAILS: string[] = [
  ...ADMIN_EMAILS,
  "ratheeshbabukp123@gmail.com",
  "eartharoma60@gmail.com",
  "hassank15@gmail.com",
  "shareengill@gmail.com",
  "admin@gmail.com",
  "ukpslg09@gmail.com",
  "tamilintcs@gmail.com",
  "berikivinod@gmail.com",
  "bethapudi.s@gmail.com",
  "prynkapradhan93@gmail.com",
  "pryapradhan93@gmail.com",
  "chetankrpradhan96@gmail.com",
  "berikivinod@gmail.com",
  "eartharoma60@gmail.com",
  "gudiwadaneeraja@gmail.com",
  "nabin.bagale09@gmail.com"
];

export function isAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
