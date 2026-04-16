import "server-only";

import { randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { Resend } from "resend";

import { hashPassword } from "@/lib/auth/passwords";
import { getServerEnv, hasSupabaseServerEnv } from "@/lib/env";
import { getBrandedFromEmail, getEmailLogoUrl } from "@/lib/email/brand";
import { renderMagicLinkEmail, renderPasswordResetEmail } from "@/lib/email/auth";
import { getMongoDb } from "@/lib/mongodb/client";
import { getSlmCollections } from "@/lib/mongodb/collections";
import { hashToken } from "@/lib/security/request";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

function serializeUserId(value: ObjectId | string) {
  return typeof value === "string" ? value : value.toString();
}

function maybeObjectId(value: string) {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

export async function ensureMongoIndexes() {
  const db = await getMongoDb();
  const collections = getSlmCollections(db);

  await Promise.all([
    collections.users.createIndex({ email: 1 }, { unique: true }),
    collections.userInterestSelections.createIndex({ user_id: 1 }),
    collections.contentItems.createIndex({ slug: 1 }, { unique: true }),
    collections.contentItems.createIndex({ approval_status: 1, ai_status: 1, published_at: -1 }),
    collections.favorites.createIndex({ user_id: 1, content_item_id: 1 }, { unique: true, sparse: true }),
    collections.favorites.createIndex({ user_id: 1, content_slug: 1 }, { unique: true, sparse: true }),
    collections.sharedLinks.createIndex({ share_key: 1 }, { unique: true }),
    collections.sharedLinks.createIndex({ user_id: 1, created_at: -1 }),
    collections.sharedComments.createIndex({ share_key: 1, created_at: -1 }),
    collections.sharedComments.createIndex({ share_key: 1, parent_id: 1, created_at: 1 }),
    collections.notifications.createIndex({ user_id: 1, created_at: -1 }),
    collections.notifications.createIndex({ user_id: 1, is_read: 1, created_at: -1 }),
    collections.emailLogs.createIndex({ user_id: 1, daily_pick_id: 1 }, { unique: true, sparse: true }),
    collections.magicLinkTokens.createIndex({ token_hash: 1 }, { unique: true }),
    collections.passwordResetTokens.createIndex({ token_hash: 1 }, { unique: true }),
    collections.unsubscribeTokens.createIndex({ token_hash: 1 }, { unique: true })
  ]);
}

export async function findUserByEmail(email: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from("users").select("*").eq("email", email).maybeSingle();
    return data ? { ...data, id: data.id } : null;
  }

  const db = await getMongoDb();
  const user = await getSlmCollections(db).users.findOne({ email });
  if (!user?._id) {
    return null;
  }

  return {
    ...user,
    id: serializeUserId(user._id)
  };
}

export async function findUserById(userId: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
    return data ? { ...data, id: data.id } : null;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const byObjectId = maybeObjectId(userId);
  const user = await collections.users.findOne(byObjectId ? { _id: byObjectId } : { _id: userId as never });
  if (!user?._id) {
    return null;
  }

  return {
    ...user,
    id: serializeUserId(user._id)
  };
}

export async function listUserInterestSelections(userId: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("user_interest_selections")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    return data ?? [];
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);

  return collections.userInterestSelections.find({ user_id: userId }).toArray();
}

export async function updateUserPreferences(input: {
  userId: string;
  interests: string[];
  subInterests: Record<string, string>;
  deliveryTime: string;
}) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();

    await supabase
      .from("users")
      .update({
        delivery_time: input.deliveryTime,
        updated_at: now
      })
      .eq("id", input.userId);

    await supabase.from("user_interest_selections").delete().eq("user_id", input.userId);

    if (input.interests.length > 0) {
      await supabase.from("user_interest_selections").insert(
        input.interests.map((interest) => ({
          user_id: input.userId,
          main_interest: interest,
          sub_interest: input.subInterests[interest] ?? null,
          created_at: now
        }))
      );
    }

    return;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const objectId = maybeObjectId(input.userId);
  const now = new Date().toISOString();

  if (!objectId) {
    throw new Error("INVALID_USER_ID");
  }

  await collections.users.updateOne(
    { _id: objectId },
    {
      $set: {
        delivery_time: input.deliveryTime,
        updated_at: now
      }
    }
  );

  await collections.userInterestSelections.deleteMany({ user_id: input.userId });

  if (input.interests.length > 0) {
    await collections.userInterestSelections.insertMany(
      input.interests.map((interest) => ({
        user_id: input.userId,
        main_interest: interest,
        sub_interest: input.subInterests[interest] ?? null,
        created_at: now
      }))
    );
  }
}

export async function updateUserActiveStatus(userId: string, isActive: boolean) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    await supabase
      .from("users")
      .update({
        is_active: isActive,
        unsubscribed_at: isActive ? null : now,
        updated_at: now
      })
      .eq("id", userId);
    return;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const objectId = maybeObjectId(userId);
  const now = new Date().toISOString();

  if (!objectId) {
    throw new Error("INVALID_USER_ID");
  }

  await collections.users.updateOne(
    { _id: objectId },
    {
      $set: {
        is_active: isActive,
        unsubscribed_at: isActive ? null : now,
        updated_at: now
      }
    }
  );
}

/** 탈퇴 예약 — deleted_at 기록 + 비활성화 (30일 유예) */
export async function deleteUserAccount(userId: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    await supabase
      .from("users")
      .update({
        is_active: false,
        deleted_at: now,
        unsubscribed_at: now,
        updated_at: now
      })
      .eq("id", userId);
    return;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const objectId = maybeObjectId(userId);
  const now = new Date().toISOString();

  if (!objectId) {
    throw new Error("INVALID_USER_ID");
  }

  await collections.users.updateOne(
    { _id: objectId },
    {
      $set: {
        is_active: false,
        deleted_at: now,
        unsubscribed_at: now,
        updated_at: now
      }
    }
  );
}

/** 탈퇴 취소 — 재로그인 시 deleted_at 초기화 */
export async function cancelAccountDeletion(userId: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    await supabase
      .from("users")
      .update({
        is_active: true,
        deleted_at: null,
        unsubscribed_at: null,
        updated_at: now
      })
      .eq("id", userId);
    return;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const objectId = maybeObjectId(userId);
  if (!objectId) throw new Error("INVALID_USER_ID");

  await collections.users.updateOne(
    { _id: objectId },
    { $set: { is_active: true, deleted_at: null, unsubscribed_at: null, updated_at: new Date().toISOString() } }
  );
}

/** 30일 경과한 탈퇴 예약 유저 목록 조회 */
export async function listExpiredDeletedUsers() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("users")
      .select("id, email")
      .not("deleted_at", "is", null)
      .lte("deleted_at", thirtyDaysAgo);
    return data ?? [];
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  return collections.users
    .find({ deleted_at: { $ne: null, $lte: thirtyDaysAgo } })
    .project({ _id: 1, email: 1 })
    .toArray()
    .then((rows) => rows.map((r) => ({ id: String(r._id), email: r.email })));
}

/** 물리적 삭제 — 유저 레코드 + 관련 데이터 완전 삭제 (cascade 처리됨) */
export async function hardDeleteUser(userId: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    // user_interest_selections, favorites, shared_links 등은 ON DELETE CASCADE
    await supabase.from("users").delete().eq("id", userId);
    return;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const objectId = maybeObjectId(userId);
  if (!objectId) throw new Error("INVALID_USER_ID");

  await collections.userInterestSelections.deleteMany({ user_id: userId });
  await collections.users.deleteOne({ _id: objectId });
}

export async function updateUserProfile(input: {
  userId: string;
  nickname: string;
  avatarKey: string;
  avatarDataUrl?: string;
  fontSize: string;
}) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    await supabase
      .from("users")
      .update({
        nickname: input.nickname,
        avatar_key: input.avatarKey,
        avatar_data_url: input.avatarKey === "custom" ? input.avatarDataUrl ?? null : null,
        font_size_preference: input.fontSize,
        updated_at: now
      })
      .eq("id", input.userId);
    return;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const objectId = maybeObjectId(input.userId);
  const now = new Date().toISOString();

  if (!objectId) {
    throw new Error("INVALID_USER_ID");
  }

  await collections.users.updateOne(
    { _id: objectId },
    {
      $set: {
        nickname: input.nickname,
        avatar_key: input.avatarKey,
        avatar_data_url: input.avatarKey === "custom" ? input.avatarDataUrl ?? null : null,
        font_size_preference: input.fontSize,
        updated_at: now
      }
    }
  );
}

export async function upsertSubscriberSignup(input: {
  email: string;
  deliveryTime: string;
  interests: string[];
  subInterests: Record<string, string>;
  consentedAt: string;
  password?: string;
  authProvider?: string;
}) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const passwordHash = input.password ? hashPassword(input.password) : null;

    const { data: user, error } = await supabase
      .from("users")
      .upsert(
        {
          email: input.email,
          delivery_time: input.deliveryTime,
          is_active: true,
          consented_at: input.consentedAt,
          unsubscribed_at: null,
          ...(input.password
            ? {
                has_password: true,
                password_hash: passwordHash,
                password_updated_at: now
              }
            : {}),
          nickname: input.email.split("@")[0],
          avatar_key: "sun",
          font_size_preference: "medium",
          auth_provider: input.authProvider ?? "email",
          updated_at: now
        },
        { onConflict: "email", ignoreDuplicates: false }
      )
      .select("id,email")
      .single();

    if (error || !user) {
      throw new Error("SUPABASE_USER_UPSERT_FAILED");
    }

    await supabase.from("user_interest_selections").delete().eq("user_id", user.id);

    if (input.interests.length > 0) {
      await supabase.from("user_interest_selections").insert(
        input.interests.map((interest) => ({
          user_id: user.id,
          main_interest: interest,
          sub_interest: input.subInterests[interest] ?? null,
          created_at: now
        }))
      );
    }

    return { id: user.id, email: user.email };
  }

  await ensureMongoIndexes();
  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const now = new Date().toISOString();
  const passwordHash = input.password ? hashPassword(input.password) : null;

  await collections.users.updateOne(
    { email: input.email },
    {
      $set: {
        email: input.email,
        delivery_time: input.deliveryTime,
        is_active: true,
        consented_at: input.consentedAt,
        unsubscribed_at: null,
        ...(input.password
          ? {
              has_password: true,
              password_hash: passwordHash,
              password_updated_at: now
            }
          : {}),
        updated_at: now
      },
      $setOnInsert: {
        nickname: input.email.split("@")[0],
        avatar_key: "sun",
        font_size_preference: "medium",
        created_at: now
      }
    },
    { upsert: true }
  );

  const user = await collections.users.findOne({ email: input.email });
  if (!user?._id) {
    throw new Error("MONGO_USER_UPSERT_FAILED");
  }

  const userId = serializeUserId(user._id);
  await collections.userInterestSelections.deleteMany({ user_id: userId });

  if (input.interests.length > 0) {
    await collections.userInterestSelections.insertMany(
      input.interests.map((interest) => ({
        user_id: userId,
        main_interest: interest,
        sub_interest: input.subInterests[interest] ?? null,
        created_at: now
      }))
    );
  }

  return {
    id: userId,
    email: user.email
  };
}

export async function createUnsubscribeToken(userId: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const token = randomBytes(32).toString("hex");
    await supabase.from("unsubscribe_tokens").insert({
      user_id: userId,
      token_hash: hashToken(token),
      created_at: new Date().toISOString(),
      used_at: null
    });
    return token;
  }

  await ensureMongoIndexes();
  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const token = randomBytes(32).toString("hex");

  await collections.unsubscribeTokens.insertOne({
    user_id: userId,
    token_hash: hashToken(token),
    created_at: new Date().toISOString(),
    used_at: null
  });

  return token;
}

export async function markUserUnsubscribedByToken(rawToken: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const tokenHash = hashToken(rawToken);
    const now = new Date().toISOString();
    const { data: tokenRow } = await supabase
      .from("unsubscribe_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .maybeSingle();

    if (!tokenRow) {
      return false;
    }

    await supabase.from("users").update({ is_active: false, unsubscribed_at: now, updated_at: now }).eq("id", tokenRow.user_id);
    await supabase.from("unsubscribe_tokens").update({ used_at: now }).eq("id", tokenRow.id);
    return true;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const tokenHash = hashToken(rawToken);
  const now = new Date().toISOString();

  const tokenRow = await collections.unsubscribeTokens.findOne({
    token_hash: tokenHash,
    used_at: null
  });

  if (!tokenRow) {
    return false;
  }

  const userObjectId = maybeObjectId(tokenRow.user_id);
  if (userObjectId) {
    await collections.users.updateOne(
      { _id: userObjectId },
      {
        $set: {
          is_active: false,
          unsubscribed_at: now,
          updated_at: now
        }
      }
    );
  }

  await collections.unsubscribeTokens.updateOne({ _id: tokenRow._id }, { $set: { used_at: now } });
  return true;
}

export async function createMagicLinkToken(userId: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const rawToken = randomBytes(32).toString("hex");
    const now = Date.now();
    await supabase.from("magic_link_tokens").insert({
      user_id: userId,
      token_hash: hashToken(rawToken),
      expires_at: new Date(now + 1000 * 60 * 15).toISOString(),
      used_at: null,
      created_at: new Date(now).toISOString()
    });
    return rawToken;
  }

  await ensureMongoIndexes();
  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const rawToken = randomBytes(32).toString("hex");
  const now = Date.now();

  await collections.magicLinkTokens.insertOne({
    user_id: userId,
    token_hash: hashToken(rawToken),
    expires_at: new Date(now + 1000 * 60 * 15).toISOString(),
    used_at: null,
    created_at: new Date(now).toISOString()
  });

  return rawToken;
}

export async function consumeMagicLinkToken(rawToken: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const tokenHash = hashToken(rawToken);
    const { data: tokenRow } = await supabase
      .from("magic_link_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", now)
      .maybeSingle();

    if (!tokenRow) {
      return null;
    }

    await supabase.from("magic_link_tokens").update({ used_at: now }).eq("id", tokenRow.id);
    return findUserById(tokenRow.user_id);
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const now = new Date().toISOString();
  const tokenHash = hashToken(rawToken);

  const tokenRow = await collections.magicLinkTokens.findOne({
    token_hash: tokenHash,
    used_at: null,
    expires_at: { $gt: now }
  });

  if (!tokenRow) {
    return null;
  }

  await collections.magicLinkTokens.updateOne({ _id: tokenRow._id }, { $set: { used_at: now } });
  return findUserById(tokenRow.user_id);
}

export async function createPasswordResetToken(userId: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const rawToken = randomBytes(32).toString("hex");
    const now = Date.now();
    await supabase.from("password_reset_tokens").insert({
      user_id: userId,
      token_hash: hashToken(rawToken),
      expires_at: new Date(now + 1000 * 60 * 15).toISOString(),
      used_at: null,
      created_at: new Date(now).toISOString()
    });
    return rawToken;
  }

  await ensureMongoIndexes();
  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const rawToken = randomBytes(32).toString("hex");
  const now = Date.now();

  await collections.passwordResetTokens.insertOne({
    user_id: userId,
    token_hash: hashToken(rawToken),
    expires_at: new Date(now + 1000 * 60 * 15).toISOString(),
    used_at: null,
    created_at: new Date(now).toISOString()
  });

  return rawToken;
}

export async function consumePasswordResetToken(rawToken: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    const tokenHash = hashToken(rawToken);
    const { data: tokenRow } = await supabase
      .from("password_reset_tokens")
      .select("*")
      .eq("token_hash", tokenHash)
      .is("used_at", null)
      .gt("expires_at", now)
      .maybeSingle();

    if (!tokenRow) {
      return null;
    }

    await supabase.from("password_reset_tokens").update({ used_at: now }).eq("id", tokenRow.id);
    return findUserById(tokenRow.user_id);
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const now = new Date().toISOString();
  const tokenHash = hashToken(rawToken);

  const tokenRow = await collections.passwordResetTokens.findOne({
    token_hash: tokenHash,
    used_at: null,
    expires_at: { $gt: now }
  });

  if (!tokenRow) {
    return null;
  }

  await collections.passwordResetTokens.updateOne({ _id: tokenRow._id }, { $set: { used_at: now } });
  return findUserById(tokenRow.user_id);
}

export async function updateUserPassword(userId: string, passwordHash: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    await supabase
      .from("users")
      .update({
        has_password: true,
        password_hash: passwordHash,
        password_updated_at: now,
        updated_at: now
      })
      .eq("id", userId);
    return;
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const objectId = maybeObjectId(userId);
  if (!objectId) {
    throw new Error("INVALID_USER_ID");
  }

  const now = new Date().toISOString();
  await collections.users.updateOne(
    { _id: objectId },
    {
      $set: {
        has_password: true,
        password_hash: passwordHash,
        password_updated_at: now,
        updated_at: now
      }
    }
  );
}

export async function listDashboardUsers() {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const { data } = await supabase
      .from("users")
      .select("id, email, nickname, avatar_key, avatar_data_url, created_at, delivery_time, is_active, has_password, user_interest_selections(main_interest, sub_interest)")
      .order("created_at", { ascending: false })
      .limit(100);
    return data ?? [];
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const users = await collections.users.find({}).sort({ created_at: -1 }).limit(100).toArray();
  const userIds = users.map((user) => serializeUserId(user._id!));
  const interests = await collections.userInterestSelections.find({ user_id: { $in: userIds } }).toArray();

  return users.map((user) => ({
    id: serializeUserId(user._id!),
    email: user.email,
    nickname: user.nickname ?? null,
    avatar_key: user.avatar_key ?? null,
    avatar_data_url: user.avatar_data_url ?? null,
    created_at: user.created_at,
    delivery_time: user.delivery_time,
    is_active: user.is_active,
    has_password: user.has_password,
    user_interest_selections: interests.filter((item) => item.user_id === serializeUserId(user._id!))
  }));
}

export async function getDashboardUserDetail(userId: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const [{ data: user }, { data: interests }, { data: emailLogs }, { data: jobLogs }] = await Promise.all([
      supabase.from("users").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_interest_selections").select("*").eq("user_id", userId),
      supabase.from("email_logs").select("*").eq("user_id", userId).order("sent_at", { ascending: false }).limit(20),
      supabase.from("job_logs").select("*").order("run_at", { ascending: false }).limit(20)
    ]);

    if (!user) {
      return null;
    }

    return {
      user: { ...user, id: user.id },
      interests: interests ?? [],
      emailLogs: emailLogs ?? [],
      jobLogs: (jobLogs ?? []).filter((log) => (log.details ?? "").includes(userId) || (log.details ?? "").includes(user.email))
    };
  }

  const db = await getMongoDb();
  const collections = getSlmCollections(db);
  const user = await findUserById(userId);
  if (!user) {
    return null;
  }

  const [interests, emailLogs, jobLogs] = await Promise.all([
    collections.userInterestSelections.find({ user_id: userId }).toArray(),
    collections.emailLogs.find({ user_id: userId }).sort({ sent_at: -1 }).limit(20).toArray(),
    collections.jobLogs
      .find({
        $or: [
          { details: { $regex: userId, $options: "i" } },
          { details: { $regex: user.email.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } }
        ]
      })
      .sort({ run_at: -1 })
      .limit(20)
      .toArray()
  ]);

  return {
    user,
    interests,
    emailLogs,
    jobLogs
  };
}

export async function sendAuthEmail(input: { to: string; subject: string; html: string }) {
  const env = getServerEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const response = await resend.emails.send({
    from: getBrandedFromEmail(),
    to: input.to,
    subject: input.subject,
    html: input.html
  });

  if (response.error) {
    throw new Error(`RESEND_SEND_FAILED:${response.error.message}`);
  }

  return response;
}

export async function sendMagicLinkEmail(input: { email: string; token: string; rememberMe?: boolean }) {
  const env = getServerEnv();
  const loginUrl = `${env.APP_URL}/auth/verify?token=${input.token}&purpose=login${input.rememberMe ? "&remember=1" : ""}`;
  return sendAuthEmail({
    to: input.email,
    subject: "세줄아침 로그인 링크",
    html: renderMagicLinkEmail({ loginUrl, logoUrl: getEmailLogoUrl() })
  });
}

export async function sendPasswordResetEmail(input: { email: string; token: string }) {
  const env = getServerEnv();
  const resetUrl = `${env.APP_URL}/reset-password?token=${input.token}`;
  return sendAuthEmail({
    to: input.email,
    subject: "세줄아침 비밀번호 재설정",
    html: renderPasswordResetEmail({ resetUrl, logoUrl: getEmailLogoUrl() })
  });
}

export async function sendCommentNotificationEmail(input: {
  email: string;
  actorName: string;
  targetUrl: string;
  contentTitle: string;
}) {
  return sendAuthEmail({
    to: input.email,
    subject: "세줄아침 새 댓글 알림",
    html: `
      <div style="background:#f8fafc;padding:24px;font-family:Apple SD Gothic Neo,Pretendard,system-ui,sans-serif;color:#112033;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #dbe7f5;border-radius:24px;padding:28px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:700;letter-spacing:0.14em;color:#e57c23;">NOTIFICATION</p>
          <h1 style="margin:0 0 18px;font-size:30px;line-height:1.3;">${input.actorName}님이 새 댓글을 작성했어요</h1>
          <p style="margin:0 0 14px;font-size:16px;line-height:1.8;color:#41566f;">공유한 소식에 새 반응이 도착했습니다.</p>
          <div style="margin:0 0 20px;padding:18px 20px;border-radius:20px;background:#f4f8fd;">
            <p style="margin:0;font-size:15px;line-height:1.7;font-weight:700;">${input.contentTitle}</p>
          </div>
          <a href="${input.targetUrl}" style="display:inline-block;background:#112033;color:#ffffff;text-decoration:none;font-weight:700;padding:14px 20px;border-radius:16px;">댓글 보러 가기</a>
        </div>
      </div>
    `
  });
}

export async function addSecurityJobLog(jobName: string, status: string, details: string) {
  if (hasSupabaseServerEnv()) {
    const supabase = createAdminSupabaseClient();
    const now = new Date().toISOString();
    await supabase.from("job_logs").insert({
      job_name: jobName,
      run_at: now,
      status,
      details,
      created_at: now
    });
    return;
  }

  const db = await getMongoDb();
  await getSlmCollections(db).jobLogs.insertOne({
    job_name: jobName,
    run_at: new Date().toISOString(),
    status,
    details,
    created_at: new Date().toISOString()
  });
}

export async function addJobLog(jobName: string, status: string, details: string) {
  return addSecurityJobLog(jobName, status, details);
}
