import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filename) {
  try {
    const filePath = resolve(process.cwd(), filename);
    const raw = readFileSync(filePath, "utf8");
    const entries = {};
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      let value = trimmed.slice(eqIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      entries[key] = value;
    }
    return entries;
  } catch {
    return {};
  }
}

const env = { ...loadEnvFile(".env.local"), ...process.env };

const BASE_URL = env.APP_URL || "http://localhost:3000";
const CRON_SECRET = env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error("CRON_SECRET not found in .env.local");
  process.exit(1);
}

function addDays(dateStr, days) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const startDate = process.argv[2] || "2026-04-08";
const days = parseInt(process.argv[3] || "7", 10);

console.log(`\n=== 세줄아침 일주일치 콘텐츠 생성 ===`);
console.log(`시작일: ${startDate}, ${days}일간`);
console.log(`서버: ${BASE_URL}\n`);

for (let i = 0; i < days; i++) {
  const date = addDays(startDate, i);
  console.log(`[${i + 1}/${days}] ${date} 생성 중...`);

  try {
    const res = await fetch(
      `${BASE_URL}/api/cron/generate-content?date=${date}`,
      {
        method: "POST",
        headers: { "x-cron-secret": CRON_SECRET },
      }
    );

    const body = await res.json();

    if (res.ok) {
      console.log(`  ✓ ${body.count}개 콘텐츠 생성 완료`);
    } else {
      console.error(`  ✗ 실패: ${JSON.stringify(body)}`);
    }
  } catch (err) {
    console.error(`  ✗ 네트워크 오류: ${err.message}`);
  }

  // 각 날짜 사이 2초 대기 (API rate limit 고려)
  if (i < days - 1) {
    await new Promise((r) => setTimeout(r, 2000));
  }
}

console.log("\n=== 완료 ===\n");
