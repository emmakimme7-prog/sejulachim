import "server-only";

import textToSpeech, { protos } from "@google-cloud/text-to-speech";

import { getOptionalServerEnv } from "@/lib/env";

type SynthesisOptions = {
  voiceName?: string;
  speakingRate?: number;
};

const DEFAULT_VOICE = "ko-KR-Neural2-B";
const DEFAULT_RATE = 1.0;

let cachedClient: InstanceType<typeof textToSpeech.TextToSpeechClient> | null = null;

function parseCredentials(): Record<string, unknown> | null {
  const env = getOptionalServerEnv();
  const raw = env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`GOOGLE_APPLICATION_CREDENTIALS_JSON parse failed: ${(error as Error).message}`);
  }
}

export function hasGoogleTtsCredentials() {
  return Boolean(getOptionalServerEnv().GOOGLE_APPLICATION_CREDENTIALS_JSON);
}

function getClient() {
  if (cachedClient) return cachedClient;
  const credentials = parseCredentials();
  if (!credentials) {
    throw new Error("GOOGLE_TTS_CREDENTIALS_MISSING");
  }
  cachedClient = new textToSpeech.TextToSpeechClient({ credentials });
  return cachedClient;
}

export async function synthesizeKoreanMp3(text: string, options: SynthesisOptions = {}): Promise<Buffer> {
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    throw new Error("GOOGLE_TTS_EMPTY_TEXT");
  }

  const client = getClient();
  const [response] = await client.synthesizeSpeech({
    input: { text: trimmed },
    voice: {
      languageCode: "ko-KR",
      name: options.voiceName ?? DEFAULT_VOICE
    },
    audioConfig: {
      audioEncoding: protos.google.cloud.texttospeech.v1.AudioEncoding.MP3,
      speakingRate: options.speakingRate ?? DEFAULT_RATE
    }
  });

  const audio = response.audioContent;
  if (!audio) {
    throw new Error("GOOGLE_TTS_EMPTY_AUDIO");
  }
  return Buffer.isBuffer(audio) ? audio : Buffer.from(audio as Uint8Array);
}
