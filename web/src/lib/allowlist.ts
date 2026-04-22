// Admin email — always gets full Pro access
export const ADMIN_EMAIL = "kpaccess@gmail.com";

// Friends & family — get free Pro access
const ALLOWED_EMAILS: string[] = [
  ADMIN_EMAIL,
  "ratheeshbabukp123@gmail.com",
  "eartharoma60@gmail.com",
  "hassank15@gmail.com",
  "shareengill@gmail.com",
  "admin@gmail.com",
  "ukpslg09@gmail.com",
  "tamilintcs@gmail.com",
  "berikivinod@gmail.com",
  "bethapudi.s@gmail.com",
];

export function isAllowlisted(email: string | null | undefined): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}

export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === ADMIN_EMAIL;
}
