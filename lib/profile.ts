export const AVATAR_OPTIONS = [
  { key: "sun", emoji: "🌅", label: "해돋이" },
  { key: "leaf", emoji: "🍃", label: "나뭇잎" },
  { key: "coffee", emoji: "☕", label: "커피" }
] as const;

export type AvatarKey = (typeof AVATAR_OPTIONS)[number]["key"];

const AVATAR_KEY_SET = new Set<string>(AVATAR_OPTIONS.map((option) => option.key));

export function isAvatarKey(value: string | null | undefined): value is AvatarKey {
  return Boolean(value && AVATAR_KEY_SET.has(value));
}

export function getAvatarOption(value: string | null | undefined) {
  return AVATAR_OPTIONS.find((option) => option.key === value) ?? AVATAR_OPTIONS[0];
}
