/** The cabinet owns the brightest light; scene transitions dim every local accent. */
export function machineLightCue(spotlight: number, spin: number, stop: number, travel: number, blackout: number) {
  const unit = (value: number) => Math.min(1, Math.max(0, value));
  const visible = unit(spotlight) * (1 - unit(travel)) * (1 - unit(blackout));
  const energy = unit(spin) * .6 + unit(stop) * .25;
  return {
    visible,
    key: visible * (225 + energy * 75),
    fill: visible * (125 + energy * 50),
    rim: visible * (2.4 + energy * 3.6),
    trim: visible * (.48 + energy * .6),
    halo: visible * (.13 + energy * .15),
    beam: visible * (.045 + energy * .025),
  };
}
