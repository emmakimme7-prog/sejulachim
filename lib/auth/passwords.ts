import "server-only";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const weakPasswordSet = new Set([
  "12345678",
  "123456789",
  "password",
  "password1",
  "qwer1234",
  "asdf1234",
  "11111111",
  "00000000",
  "abcdefgh"
]);

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false;
  }

  const [salt, expected] = storedHash.split(":");
  if (!salt || !expected) {
    return false;
  }

  const derived = scryptSync(password, salt, 64).toString("hex");
  const left = Buffer.from(derived);
  const right = Buffer.from(expected);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function isStrongEnoughPassword(password: string, email?: string | null) {
  const normalized = password.trim().toLowerCase();
  if (normalized.length < 8) {
    return false;
  }

  if (weakPasswordSet.has(normalized)) {
    return false;
  }

  if (/^(.)\1+$/.test(normalized)) {
    return false;
  }

  if (!/\d/.test(password)) {
    return false;
  }

  return true;
}
