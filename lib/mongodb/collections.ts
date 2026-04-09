import "server-only";

import type { Db, ObjectId } from "mongodb";

export type SlmUserDoc = {
  _id?: ObjectId;
  email: string;
  delivery_time: string | null;
  is_active: boolean;
  consented_at: string | null;
  unsubscribed_at: string | null;
  has_password: boolean;
  password_hash: string | null;
  password_updated_at: string | null;
  nickname?: string | null;
  avatar_key?: string | null;
  avatar_data_url?: string | null;
  font_size_preference?: string | null;
  created_at: string;
  updated_at: string;
};

export type SlmUserInterestSelectionDoc = {
  _id?: ObjectId;
  user_id: string;
  main_interest: string;
  sub_interest: string | null;
  created_at: string;
};

export type SlmContentItemDoc = {
  _id?: ObjectId;
  title: string;
  category: string;
  sub_interest?: string | null;
  long_summary?: string | null;
  thumbnail_url?: string | null;
  thumbnail_alt?: string | null;
  thumbnail_page_url?: string | null;
  thumbnail_author?: string | null;
  thumbnail_license?: string | null;
  source_name: string;
  source_url: string;
  sources?: Array<{
    name: string;
    url: string;
    type: "public" | "news" | "blog" | "other";
  }>;
  raw_text: string;
  short_summary: string | null;
  action_line: string | null;
  summary_type: "MUST" | "USEFUL" | "ACTION";
  approval_status: "pending" | "approved" | "rejected";
  ai_status: "pending" | "completed" | "failed";
  ai_processing_started_at: string | null;
  published_at: string | null;
  slug: string;
  created_at: string;
  updated_at: string;
};

export type SlmInterestConfigDoc = {
  _id?: ObjectId;
  main_interest: string;
  label?: string;
  sub_interests: string[];
  order?: number;
  updated_at: string;
};

export type SlmEmailLogDoc = {
  _id?: ObjectId;
  user_id: string;
  daily_pick_id?: string | null;
  status: string;
  provider_message_id: string | null;
  sent_at: string;
  mode?: string;
  created_at: string;
};

export type SlmJobLogDoc = {
  _id?: ObjectId;
  job_name: string;
  run_at: string;
  status: string;
  details: string;
  created_at: string;
};

export type SlmFavoriteDoc = {
  _id?: ObjectId;
  user_id: string;
  content_item_id?: string | null;
  content_slug?: string | null;
  created_at: string;
};

export type SlmSharedLinkDoc = {
  _id?: ObjectId;
  user_id: string;
  share_key: string;
  slugs: string[];
  nickname?: string | null;
  avatar_key?: string | null;
  message?: string | null;
  view_count: number;
  created_at: string;
  updated_at: string;
  last_viewed_at?: string | null;
};

export type SlmSharedCommentDoc = {
  _id?: ObjectId;
  share_key: string;
  user_id?: string | null;
  parent_id?: string | null;
  depth: number;
  name: string;
  content: string;
  created_at: string;
};

export type SlmNotificationDoc = {
  _id?: ObjectId;
  user_id: string;
  type: "share_comment";
  actor_name: string;
  title: string;
  body: string;
  target_url: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
};

export type SlmTokenDoc = {
  _id?: ObjectId;
  user_id: string;
  token_hash: string;
  expires_at?: string;
  used_at: string | null;
  created_at: string;
};

export type SlmSiteSettingDoc = {
  _id?: ObjectId;
  key: string;
  title?: string | null;
  subtitle?: string | null;
  use_image?: boolean | null;
  section_title?: string | null;
  section_description?: string | null;
  image_url?: string | null;
  image_alt?: string | null;
  image_title?: string | null;
  image_description?: string | null;
  updated_at: string;
};

export function getSlmCollections(db: Db) {
  return {
    users: db.collection<SlmUserDoc>("slm_users"),
    userInterestSelections: db.collection<SlmUserInterestSelectionDoc>("slm_user_interest_selections"),
    contentItems: db.collection<SlmContentItemDoc>("slm_content_items"),
    interestConfigs: db.collection<SlmInterestConfigDoc>("slm_interest_configs"),
    favorites: db.collection<SlmFavoriteDoc>("slm_favorites"),
    sharedLinks: db.collection<SlmSharedLinkDoc>("slm_shared_links"),
    sharedComments: db.collection<SlmSharedCommentDoc>("slm_shared_comments"),
    notifications: db.collection<SlmNotificationDoc>("slm_notifications"),
    siteSettings: db.collection<SlmSiteSettingDoc>("slm_site_settings"),
    dailyPicks: db.collection("slm_daily_picks"),
    dailyPickItems: db.collection("slm_daily_pick_items"),
    emailLogs: db.collection<SlmEmailLogDoc>("slm_email_logs"),
    jobLogs: db.collection<SlmJobLogDoc>("slm_job_logs"),
    unsubscribeTokens: db.collection<SlmTokenDoc>("slm_unsubscribe_tokens"),
    magicLinkTokens: db.collection<SlmTokenDoc>("slm_magic_link_tokens"),
    passwordResetTokens: db.collection<SlmTokenDoc>("slm_password_reset_tokens")
  };
}
