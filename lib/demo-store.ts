import "server-only";

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type DemoSignup = {
  email: string;
  deliveryTime: string;
  interests: string[];
  subInterests: Record<string, string>;
  consentedAt: string;
};

const dataDir = path.join(process.cwd(), ".data");
const signupFile = path.join(dataDir, "demo-signups.json");

async function ensureFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(signupFile, "utf8");
  } catch {
    await writeFile(signupFile, "[]", "utf8");
  }
}

export async function saveDemoSignup(input: DemoSignup) {
  await ensureFile();
  const raw = await readFile(signupFile, "utf8");
  const current = JSON.parse(raw) as DemoSignup[];
  const next = current.filter((item) => item.email !== input.email);
  next.push(input);
  await writeFile(signupFile, JSON.stringify(next, null, 2), "utf8");
}
