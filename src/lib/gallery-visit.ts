export const TICKET_LIMIT = 3;
export const VISIT_STORAGE_KEY = "zinx-gallery-visit-v1";
export type GalleryVisit = { date: string; seen: string[]; picks: string[] };

/** Session-only keepsakes survive a refresh and an opening replay. No account or telemetry. */
export function readVisit(raw: string | null, ids: readonly string[], now = new Date().toISOString()): GalleryVisit {
  const empty: GalleryVisit = { date: now, seen: [], picks: [] };
  if (!raw) return empty;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object") return empty;
    const valid = (list: unknown) => Array.isArray(list) ? [...new Set(list.filter((id): id is string => typeof id === "string" && ids.includes(id)))] : [];
    return {
      date: typeof value.date === "string" && Number.isFinite(Date.parse(value.date)) ? value.date : now,
      seen: valid(value.seen), picks: valid(value.picks).slice(0, TICKET_LIMIT),
    };
  } catch { return empty; }
}

export function toggleTicketPick(picks: string[], id: string, validIds: readonly string[]): string[] {
  if (!validIds.includes(id)) return picks;
  if (picks.includes(id)) return picks.filter(item => item !== id);
  return picks.length < TICKET_LIMIT ? [...picks, id] : picks;
}

export function ticketDate(date: string): string {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date)).replaceAll("/", ".");
}
