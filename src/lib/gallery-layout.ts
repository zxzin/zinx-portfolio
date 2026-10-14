export type GalleryPoint = [number, number, number];

/** One room composition drives the camera, exhibits and the host's physical perch. */
export function galleryLayout(aspect: number) {
  const portrait = aspect < .9;
  return {
    portrait,
    distance: Math.max(14.2, (portrait ? 8.5 : 14.5) / (2 * Math.tan(19 * Math.PI / 180) * Math.max(.25, aspect) * .94)),
    companion: (portrait ? [2.75, 0, 3.6] : [5.85, 0, -.45]) as GalleryPoint,
    companionScale: portrait ? .68 : .76,
  };
}
