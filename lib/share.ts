import { MAIN_INTERESTS, SUB_INTERESTS } from "@/lib/content/sub-interests";
import { AVATAR_OPTIONS, isAvatarKey, type AvatarKey } from "@/lib/profile";

type ShareState = {
  interests: string[];
  subInterests: Record<string, string>;
  profile?: {
    nickname?: string;
    avatarKey?: AvatarKey;
  };
};

const MAIN_INTEREST_SET = new Set<string>(MAIN_INTERESTS);

export function encodeShareState(state: ShareState) {
  const params = new URLSearchParams();

  for (const interest of state.interests) {
    params.append("interest", interest);
  }

  for (const [interest, subInterest] of Object.entries(state.subInterests)) {
    if (!subInterest || !MAIN_INTEREST_SET.has(interest)) {
      continue;
    }

    params.append("sub", `${interest}:${subInterest}`);
  }

  if (state.profile?.nickname?.trim()) {
    params.set("nickname", state.profile.nickname.trim().slice(0, 24));
  }

  if (state.profile?.avatarKey && AVATAR_OPTIONS.some((option) => option.key === state.profile?.avatarKey)) {
    params.set("avatar", state.profile.avatarKey);
  }

  return params.toString();
}

export function decodeShareState(input: {
  interest?: string | string[];
  sub?: string | string[];
  nickname?: string | string[];
  avatar?: string | string[];
}) {
  const rawInterests = Array.isArray(input.interest) ? input.interest : input.interest ? [input.interest] : [];
  const interests = rawInterests.filter((value) => MAIN_INTEREST_SET.has(value)).slice(0, 3);

  const rawSubs = Array.isArray(input.sub) ? input.sub : input.sub ? [input.sub] : [];
  const subInterests: Record<string, string> = {};

  for (const entry of rawSubs) {
    const [interest, subInterest] = entry.split(":");
    if (!interest || !subInterest || !MAIN_INTEREST_SET.has(interest) || !interests.includes(interest)) {
      continue;
    }

    if (!(SUB_INTERESTS as Record<string, string[]>)[interest]?.includes(subInterest)) {
      continue;
    }

    subInterests[interest] = subInterest;
  }

  return {
    interests,
    subInterests,
    profile: {
      nickname: typeof input.nickname === "string" ? input.nickname.slice(0, 24) : undefined,
      avatarKey: typeof input.avatar === "string" && isAvatarKey(input.avatar) ? input.avatar : undefined
    }
  };
}

export function formatInterestSummary(state: ShareState) {
  return state.interests
    .map((interest) => `${interest}${state.subInterests[interest] ? ` · ${state.subInterests[interest]}` : ""}`)
    .join(", ");
}
