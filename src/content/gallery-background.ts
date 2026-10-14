import type { GalleryPoint } from "../lib/gallery-layout";

/** Background slots stay behind the machine. Empty slots add no visible furniture. */
export const backgroundSlots = {
  "rear-left": { position: [-6.25, 0, -4.7] as GalleryPoint, scale: .72, rotation: .12 },
  "rear-right": { position: [6.35, .05, -4.85] as GalleryPoint, scale: .7, rotation: -.12 },
  "outer-left": { position: [-7.8, 0, -5.3] as GalleryPoint, scale: .48, rotation: .3 },
  "outer-right": { position: [7.8, 0, -5.3] as GalleryPoint, scale: .48, rotation: -.3 },
};

type BackgroundExhibit = { id: string; slot: keyof typeof backgroundSlots; visible: boolean } & (
  { kind: "david" } | { kind: "picture"; src: string }
);
/** Still, unlabelled room dressing; full works remain in the coin collection. */
export const backgroundExhibits: BackgroundExhibit[] = [
  { id: "david-sculpture", slot: "rear-left", kind: "david", visible: true },
  { id: "secret-love-vj", slot: "rear-right", kind: "picture", src: "/projects/secret-love-vj/poster-v26.jpg", visible: true },
];
