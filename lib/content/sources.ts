export type SourceType = "public" | "news" | "blog" | "other";

export type ContentSource = {
  name: string;
  url: string;
  type: SourceType;
};

export type SourceTabKey = "public" | "news" | "other";

export const SOURCE_TYPE_LABELS: Record<SourceTabKey, string> = {
  public: "공공자료",
  news: "기사",
  other: "기타"
};

export function normalizeSourceType(value: string | null | undefined): SourceType {
  if (value === "public" || value === "news" || value === "blog" || value === "other") {
    return value;
  }

  return "other";
}

export function normalizeSources(input: {
  sources?: Array<Partial<ContentSource>> | null;
  source_name?: string | null;
  source_url?: string | null;
}): ContentSource[] {
  const normalized = (input.sources ?? [])
    .map((source) => ({
      name: typeof source.name === "string" ? source.name.trim() : "",
      url: typeof source.url === "string" ? source.url.trim() : "",
      type: normalizeSourceType(source.type)
    }))
    .filter((source) => source.name && source.url);

  if (normalized.length > 0) {
    return normalized;
  }

  if (input.source_name && input.source_url) {
    return [
      {
        name: input.source_name,
        url: input.source_url,
        type: "other"
      }
    ];
  }

  return [];
}

export function getSourceTabKey(type: SourceType): SourceTabKey {
  if (type === "public") return "public";
  if (type === "news") return "news";
  return "other";
}

export function groupSourcesByTab(sources: ContentSource[]) {
  const groups: Record<SourceTabKey, ContentSource[]> = {
    public: [],
    news: [],
    other: []
  };

  for (const source of sources) {
    groups[getSourceTabKey(source.type)].push(source);
  }

  return groups;
}

export function getVisibleSourceTabs(sources: ContentSource[]): SourceTabKey[] {
  const groups = groupSourcesByTab(sources);
  return (["public", "news", "other"] as const).filter((key) => groups[key].length > 0);
}

export function getDefaultSourceTab(sources: ContentSource[]): SourceTabKey | null {
  const tabs = getVisibleSourceTabs(sources);
  if (tabs.includes("public")) return "public";
  if (tabs.includes("news")) return "news";
  return tabs[0] ?? null;
}
