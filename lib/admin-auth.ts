import { timingSafeEqual } from "node:crypto";

function matches(value: string, expected: string) {
  const left = Buffer.from(value);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function adminAuthConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

export function validAdminCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD;
  return Boolean(expectedUsername && expectedPassword && matches(username, expectedUsername) && matches(password, expectedPassword));
}
