export const PAGE_KEYS = [
  "dashboard",
  "overview",
  "report",
  "explorer",
  "insights",
  "communications",
  "playbooks",
  "strategy",
  "paid-ads",
  "ugc-creators",
  "segments",
  "pains",
  "data-ops",
  "settings",
  "export",
];

export const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  overview: "Overview",
  report: "Full Report",
  explorer: "Explorer",
  insights: "Insights",
  communications: "Communications",
  playbooks: "Playbooks",
  strategy: "Strategy",
  "paid-ads": "Paid Ads",
  "ugc-creators": "UGC Creators",
  segments: "Segments",
  pains: "Pains",
  "data-ops": "Data & Ops",
  settings: "Settings",
  export: "Export",
};

export function buildAccessMap(
  pages: Array<{ page_key: string; is_enabled: boolean }> = [],
  overrides: Array<{ page_key: string; is_enabled: boolean }> = []
): Record<string, boolean> {
  const access: Record<string, boolean> = {};
  for (const key of PAGE_KEYS) {
    access[key] = true;
  }
  for (const page of pages) {
    if (page.page_key in access) {
      access[page.page_key] = page.is_enabled;
    }
  }
  for (const override of overrides) {
    if (override.page_key in access) {
      access[override.page_key] = override.is_enabled;
    }
  }
  return access;
}

export function getPageKeyFromSlug(slug: string | null): string | null {
  switch (slug || "") {
    case "":
      return "dashboard";
    case "overview":
      return "overview";
    case "report":
      return "report";
    case "explorer":
      return "explorer";
    case "insights":
      return "insights";
    case "communications":
      return "communications";
    case "playbooks":
      return "playbooks";
    case "strategy":
      return "strategy";
    case "paid-ads":
      return "paid-ads";
    case "ugc-creators":
      return "ugc-creators";
    case "segments":
      return "segments";
    case "pains":
      return "pains";
    case "settings":
      return "settings";
    case "export":
      return "export";
    default:
      return null;
  }
}

export function getPageKeyFromPath(pathname: string): string | null {
  if (!pathname || pathname.includes("/generate/")) {
    return null;
  }
  const match = pathname.match(/\/projects\/[a-f0-9-]+(?:\/([^/?#]+))?/);
  if (!match) return null;
  return getPageKeyFromSlug(match[1] || "");
}
