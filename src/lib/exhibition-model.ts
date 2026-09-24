import type { Accent, ProjectLink, YYActionId } from "../content/portfolio.ts";

type MediaBase = { id: string; title: string; caption?: string };
export type ExhibitMedia = MediaBase & (
  | { kind: "image"; src: string; alt: string }
  | { kind: "video"; src: string; poster: string }
  | { kind: "animation"; src: string; poster: string; alt: string }
  | { kind: "yy"; action: YYActionId; poster: string }
  | { kind: "demo"; src: string; poster: string }
);
export type Exhibit = {
  id: string; title: string; subtitle: string; summary: string; status: string;
  accent: Accent; tags: string[]; media: ExhibitMedia[]; links: ProjectLink[];
  contribution?: string; decision?: string; defaultGroup: string;
  preview?: { mediaId?: string; caption: string };
  emblem?: { src: string; treatment: "silhouette" | "tile" };
};
export type ExhibitionGroup = { id: string; title: string; label: string; suit?: string; layout: "salon" | "grid" | "index" };
export type Placement = { id: string; group?: string; order?: number; visible?: boolean; featured?: boolean; mediaIds?: string[] };
export type PlacedExhibit = Exhibit & { featured: boolean };
export type ExhibitionSection = ExhibitionGroup & { works: PlacedExhibit[] };

export function coinInitials(title: string): string {
  const words = title.trim().replace(/([a-z])([A-Z])/g, "$1 $2").split(/[\s-]+/).filter(Boolean);
  return (words.length > 1 ? words.map(word => Array.from(word)[0]).join("") : Array.from(words[0] ?? "").slice(0, 2).join("")).slice(0, 3).toUpperCase();
}

/** Curatorial visibility controls presentation. Only public-safe records belong in this catalog. */
export function composeExhibition(catalog: Exhibit[], groups: ExhibitionGroup[], placements: Placement[] = []): ExhibitionSection[] {
  const ids = new Set<string>(), groupIds = new Set(groups.map(group => group.id));
  if (groupIds.size !== groups.length) throw new Error("Duplicate exhibition group");
  for (const work of catalog) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(work.id)) throw new Error(`Invalid exhibit ID: ${work.id}`);
    if (ids.has(work.id)) throw new Error(`Duplicate exhibit: ${work.id}`);
    ids.add(work.id);
    if (new Set(work.media.map(media => media.id)).size !== work.media.length) throw new Error(`Duplicate media: ${work.id}`);
  }
  const settings = new Map<string, Placement>();
  for (const placement of placements) {
    if (!ids.has(placement.id) || settings.has(placement.id)) throw new Error(`Invalid placement: ${placement.id}`);
    settings.set(placement.id, placement);
  }
  const entries = catalog.map((work, index) => {
    const setting = settings.get(work.id);
    const group = setting?.group ?? work.defaultGroup;
    if (!groupIds.has(group)) throw new Error(`Unknown group: ${group}`);
    const media = setting?.mediaIds?.map(id => {
      const found = work.media.find(item => item.id === id);
      if (!found) throw new Error(`Unknown media: ${work.id}/${id}`);
      return found;
    }) ?? work.media;
    if (work.preview?.mediaId && !media.some(item => item.id === work.preview?.mediaId)) throw new Error(`Unknown preview: ${work.id}/${work.preview.mediaId}`);
    return { group, order: setting?.order ?? index + 100, visible: setting?.visible === true && media.length > 0,
      work: { ...work, media, featured: setting?.featured ?? false } };
  });
  return groups.map(group => ({ ...group, works: entries.filter(entry => entry.visible && entry.group === group.id)
    .sort((a, b) => a.order - b.order || a.work.id.localeCompare(b.work.id)).map(entry => entry.work) }))
    .filter(group => group.works.length > 0);
}

export function previewMedia(work: Exhibit): ExhibitMedia | undefined {
  return work.media.find(item => item.id === work.preview?.mediaId) ?? work.media[0];
}

export function mediaPoster(media: ExhibitMedia): string {
  return media.kind === "image" ? media.src : media.poster;
}

/** Embed local, packaged demos only. External destinations remain explicit links. */
export function isLocalDemo(src: string): boolean {
  return /^\/projects\/[a-zA-Z0-9/_-]+\.html$/.test(src) && !src.includes("..");
}
