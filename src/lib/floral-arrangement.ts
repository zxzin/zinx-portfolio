import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const floralPalette = { rose: "#ac0927", roseEdge: "#ef4865", ivory: "#fff8ed", apricot: "#f39b43", peach: "#ffd491", cosmos: "#d94f95", violet: "#9272de", blue: "#7aade9", leaf: "#28523a", stem: "#254830", pollen: "#d8b65e", anther: "#7b4224" };
export const FLOWERS_PER_BOUQUET = 21;
export const FLORAL_VARIETIES = ["rose", "lily", "dahlia", "cosmos", "hydrangea"] as const;
/** Curved, tapered petal; local Y runs from calyx to softly curled tip. */
export function createPetalGeometry(width: number, length: number, curl: number, roundness = .65) {
  const positions: number[] = [], indices: number[] = [], uvs: number[] = [];
  for (let y = 0; y <= 12; y++) for (let x = 0; x <= 10; x++) {
    const t = y / 12, u = x / 5 - 1;
    uvs.push(x / 10, t);
    positions.push(u * width * Math.pow(Math.sin(Math.PI * t), roundness), t * length,
      curl * t * t + .025 * u * u * Math.sin(Math.PI * t) + .003 * Math.cos(u * 9) * Math.sin(Math.PI * t));
    if (y < 12 && x < 10) { const n = y * 11 + x; indices.push(n, n + 1, n + 11, n + 1, n + 12, n + 11); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}
const petal = createPetalGeometry;
// Roses and lilies carry the arrangement; the smaller varieties provide color accents.
export const FLORAL_RHYTHM = ["rose", "lily", "rose", "dahlia", "rose", "lily", "hydrangea", "lily", "cosmos"] as const;

/** Fixed floral arrangement, batched by material; no per-frame flower rendering loop. */
export function createFloralArrangement(layout: "bouquet" | "garland" = "bouquet") {
  const pieces = new Map<string, THREE.BufferGeometry[]>();
  const add = (color: string, geometry: THREE.BufferGeometry, matrix = new THREE.Matrix4()) => {
    const positions = geometry.getAttribute("position"), shades = new Float32Array(positions.count * 3);
    for (let v = 0; v < positions.count; v++) {
      const shade = .84 + .16 * Math.min(1, Math.max(0, positions.getY(v) * 3 + .35));
      shades.set([shade, shade, shade], v * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(shades, 3));
    geometry.applyMatrix4(matrix); const list = pieces.get(color) ?? []; list.push(geometry); pieces.set(color, list);
  };
  const matrix = (p: THREE.Vector3, r: THREE.Euler, scale = new THREE.Vector3(1, 1, 1)) => new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(r), scale);
  const flowerCount = layout === "garland" ? 17 : FLOWERS_PER_BOUQUET;
  if (layout === "garland") {
    const spine = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.44, 1.85, -.12), new THREE.Vector3(-3.5, 3, -.13), new THREE.Vector3(-3.46, 4.5, -.12), new THREE.Vector3(-3.29, 5.24, -.1), new THREE.Vector3(-2, 5.28, -.12)]);
    add(floralPalette.stem, new THREE.TubeGeometry(spine, 36, .026, 6, false));
    const corner = new THREE.QuadraticBezierCurve3(new THREE.Vector3(2.25, 5.25, -.12), new THREE.Vector3(3.2, 5.38, -.12), new THREE.Vector3(3.48, 4.99, -.12));
    add(floralPalette.stem, new THREE.TubeGeometry(corner, 12, .021, 6, false));
  }
  for (let i = 0; i < flowerCount; i++) {
    const angle = i * 2.39996, spread = .24 + Math.sqrt(i / (FLOWERS_PER_BOUQUET - 1)) * .6;
    const head = layout === "bouquet"
      ? new THREE.Vector3(Math.cos(angle) * spread, 1.18 + (i % 5) * .18, Math.sin(angle) * .3)
      : i < 11 ? new THREE.Vector3(-3.43 + Math.sin(i * 2) * .1, 2.1 + i * .3, 0)
      : i < 14 ? new THREE.Vector3(-3.2 + (i - 11) * .6, 5.29 + Math.sin(i) * .06, 0)
      : new THREE.Vector3(2.5 + (i - 14) * .4, 5.28 - (i - 14) * .13, 0);
    const root = layout === "bouquet" ? new THREE.Vector3(head.x * .13, .35, -.1)
      : head.clone().add(head.y > 4.9 && head.x > -3.25 ? new THREE.Vector3(-.3, .02, -.12) : new THREE.Vector3(.04, -.38, -.12));
    const curve = new THREE.QuadraticBezierCurve3(root, root.clone().lerp(head, .65).add(new THREE.Vector3(-.07, 0, -.12)), head);
    add(floralPalette.stem, new THREE.TubeGeometry(curve, 8, .014, 5, false));
    for (const side of [-1, 1]) {
      const leafAt = curve.getPoint(side < 0 ? .42 : .65);
      add(floralPalette.leaf, petal(.09, .38, .065), matrix(leafAt, new THREE.Euler(-.4, side * .45, side * 1.1)));
    }
    const kind = FLORAL_RHYTHM[i % FLORAL_RHYTHM.length];
    const flowerScale = (layout === "garland" ? .63 : 1) * (.78 + (i % 4) * .08) * (kind === "hydrangea" || kind === "cosmos" ? .79 : 1);
    const tilt = matrix(head, new THREE.Euler(-.3 + Math.sin(i) * .42, Math.cos(i * 2) * .45, angle), new THREE.Vector3().setScalar(flowerScale));
    const rose = kind === "rose", lily = kind === "lily", dahlia = kind === "dahlia", hydrangea = kind === "hydrangea";
    add(floralPalette.leaf, new THREE.SphereGeometry(.064, 8, 6), tilt.clone().multiply(new THREE.Matrix4().makeScale(.8, .8, 1.2)));
    const layers = rose ? 4 : dahlia ? 3 : 1;
    for (let layer = 0; layer < layers; layer++) {
      const count = rose ? Math.max(3, 8 - layer * 2) : lily ? 6 : dahlia ? 16 - layer * 3 : hydrangea ? 0 : 8;
      for (let p = 0; p < count; p++) {
        const turn = p * Math.PI * 2 / count + layer * .45;
        const transform = matrix(new THREE.Vector3(0, 0, layer * .04), new THREE.Euler(0, 0, turn));
        const size = rose || dahlia ? 1 - layer * .21 : p % 2 ? .9 : 1;
        const color = rose ? layer % 2 ? floralPalette.roseEdge : floralPalette.rose : lily ? floralPalette.ivory : dahlia ? layer % 2 ? floralPalette.peach : floralPalette.apricot : floralPalette.cosmos;
        // Lilies have six long, recurved petals around distinct projecting stamens.
        const opening = rose ? .86 + (i % 3) * .07 : 1;
        add(color, petal((rose ? .16 : dahlia ? .055 : .115) * size * opening, (lily ? .45 : .32) * size, rose ? .13 + layer * .012 : lily ? -.12 : .065, rose ? .4 : .65), tilt.clone().multiply(transform));
      }
    }
    add(rose ? floralPalette.rose : floralPalette.pollen, new THREE.SphereGeometry(.045, 10, 6),
      tilt.clone().multiply(new THREE.Matrix4().makeScale(1, 1, .5)).multiply(new THREE.Matrix4().makeTranslation(0, 0, .12)));
    if (lily) for (let stamen = 0; stamen < 6; stamen++) {
      const angle = stamen * Math.PI / 3;
      const end = new THREE.Vector3(Math.sin(angle) * .09, Math.cos(angle) * .09, .21);
      const filament = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, .025), new THREE.Vector3(end.x * .4, end.y * .4, .16), end);
      add(floralPalette.pollen, new THREE.TubeGeometry(filament, 4, .006, 4, false), tilt);
      add(floralPalette.anther, new THREE.SphereGeometry(.018, 8, 6), tilt.clone().multiply(matrix(end, new THREE.Euler(0, 0, angle), new THREE.Vector3(.65, 1.65, .65))));
    }
    if (hydrangea) for (let floret = 0; floret < 9; floret++) {
      const a = floret * 2.4, radius = .075 * Math.sqrt(floret);
      const center = new THREE.Vector3(Math.cos(a) * radius, Math.sin(a) * radius, .09 - radius * .2);
      for (let p = 0; p < 4; p++) add(floret % 2 ? floralPalette.blue : floralPalette.violet,
        petal(.055, .105, .028, .4), tilt.clone().multiply(matrix(center, new THREE.Euler(0, 0, p * Math.PI / 2 + a))));
      add(floralPalette.ivory, new THREE.SphereGeometry(.016, 6, 4), tilt.clone().multiply(new THREE.Matrix4().makeTranslation(center.x, center.y, center.z + .012)));
    }
    if (!rose && !lily && !hydrangea) for (let seed = 0; seed < 12; seed++) {
      const a = seed * 2.4, radius = .013 * Math.sqrt(seed);
      add(floralPalette.anther, new THREE.SphereGeometry(.009, 5, 4), tilt.clone().multiply(new THREE.Matrix4().makeTranslation(Math.cos(a) * radius, Math.sin(a) * radius, .035)));
    }
  }
  return [...pieces].map(([color, geometries]) => {
    const geometry = mergeGeometries(geometries); geometries.forEach(part => part.dispose());
    if (!geometry) throw new Error("Floral geometry must share attributes");
    const material = new THREE.MeshPhysicalMaterial({ color, vertexColors: true, roughness: .78, metalness: 0, side: THREE.DoubleSide, sheen: .5, sheenColor: new THREE.Color("#ffe4e7"), sheenRoughness: .8, emissive: color, emissiveIntensity: .025 });
    return { color, geometry, material };
  });
}
