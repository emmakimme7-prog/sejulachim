import "server-only";

import { MongoClient } from "mongodb";

import { getServerEnv } from "@/lib/env";

declare global {
  var __slmMongoPromise: Promise<MongoClient> | undefined;
}

export async function getMongoDb() {
  const env = getServerEnv();
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    throw new Error("MONGODB_ENV_MISSING");
  }

  if (!global.__slmMongoPromise) {
    const client = new MongoClient(env.MONGODB_URI);
    global.__slmMongoPromise = client.connect();
  }

  const client = await global.__slmMongoPromise;
  return client.db(env.MONGODB_DB_NAME);
}
