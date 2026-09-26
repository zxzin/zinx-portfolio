import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

export const floralPalette = { rose: "#ac0927", roseEdge: "#e12d43", ivory: "#fff8ed", leaf: "#28523a", stem: "#254830", pollen: "#d8b65e", anther: "#7b4224" };
export const FLOWERS_PER_BOUQUET = 21;
/** Curved, tapered petal; local Y runs from calyx to softly curled tip. */
function petal(width: number, length: number, curl: number) {
  const positions: number[] = [], indices: number[] = [], uvs: number[] = [];
  for (let y = 0; y <= 10; y++) for (let x = 0; x <= 8; x++) {
    const t = y / 10, u = x / 4 - 1;
    uvs.push(x / 8, t);
    positions.push(u * width * Math.pow(Math.sin(Math.PI * t), .65), t * length,
      curl * t * t + .035 * u * u * Math.sin(Math.PI * t) + .003 * Math.sin(u * 6) * t * t);
    if (y < 10 && x < 8) { const n = y * 9 + x; indices.push(n, n + 1, n + 9, n + 1, n + 10, n + 9); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  return geometry;
}

/** Fixed floral arrangement, batched by material; no per-frame flower rendering loop. */
export function createFloralArrangement() {
  const pieces = new Map<string, THREE.BufferGeometry[]>();
  const add = (color: string, geometry: THREE.BufferGeometry, matrix = new THREE.Matrix4()) => {
    geometry.applyMatrix4(matrix); const list = pieces.get(color) ?? []; list.push(geometry); pieces.set(color, list);
  };
  const matrix = (p: THREE.Vector3, r: THREE.Euler, scale = new THREE.Vector3(1, 1, 1)) => new THREE.Matrix4().compose(p, new THREE.Quaternion().setFromEuler(r), scale);
  for (let i = 0; i < FLOWERS_PER_BOUQUET; i++) {
    const angle = i * 2.39996, spread = .24 + Math.sqrt(i / (FLOWERS_PER_BOUQUET - 1)) * .6;
    const head = new THREE.Vector3(Math.cos(angle) * spread, 1.18 + (i % 5) * .18, Math.sin(angle) * .3);
    const root = new THREE.Vector3(head.x * .13, .35, -.1);
    const curve = new THREE.QuadraticBezierCurve3(root, new THREE.Vector3(head.x * .35, head.y * .7, -.2), head);
    add(floralPalette.stem, new THREE.TubeGeometry(curve, 8, .014, 5, false));
    for (const side of [-1, 1]) {
      const leafAt = curve.getPoint(side < 0 ? .42 : .65);
      add(floralPalette.leaf, petal(.09, .38, .065), matrix(leafAt, new THREE.Euler(-.4, side * .45, side * 1.1)));
    }
    const tilt = matrix(head, new THREE.Euler(-.22 + Math.sin(i) * .28, Math.cos(i * 2) * .35, angle));
    const rose = i % 3 !== 1;
    const layers = rose ? 4 : 1;
    for (let layer = 0; layer < layers; layer++) {
      const count = rose ? Math.max(3, 8 - layer * 2) : 6;
      for (let p = 0; p < count; p++) {
        const turn = p * Math.PI * 2 / count + layer * .45;
        const transform = matrix(new THREE.Vector3(0, 0, layer * .04), new THREE.Euler(0, 0, turn));
        const size = rose ? 1 - layer * .21 : p % 2 ? .9 : 1;
        const color = rose ? layer % 2 ? floralPalette.roseEdge : floralPalette.rose : floralPalette.ivory;
        // Lilies have six long, recurved petals around distinct projecting stamens.
        add(color, petal((rose ? .16 : .115) * size, (rose ? .32 : .45) * size, rose ? .13 : -.12), tilt.clone().multiply(transform));
      }
    }
    add(rose ? floralPalette.rose : floralPalette.pollen, new THREE.SphereGeometry(.045, 10, 6),
      tilt.clone().multiply(new THREE.Matrix4().makeScale(1, 1, .5)).multiply(new THREE.Matrix4().makeTranslation(0, 0, .12)));
    if (!rose) for (let stamen = 0; stamen < 6; stamen++) {
      const angle = stamen * Math.PI / 3;
      const end = new THREE.Vector3(Math.sin(angle) * .09, Math.cos(angle) * .09, .21);
      const filament = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, .025), new THREE.Vector3(end.x * .4, end.y * .4, .16), end);
      add(floralPalette.pollen, new THREE.TubeGeometry(filament, 4, .006, 4, false), tilt);
      add(floralPalette.anther, new THREE.SphereGeometry(.018, 8, 6), tilt.clone().multiply(matrix(end, new THREE.Euler(0, 0, angle), new THREE.Vector3(.65, 1.65, .65))));
    }
  }
  return [...pieces].map(([color, geometries]) => {
    const geometry = mergeGeometries(geometries); geometries.forEach(part => part.dispose());
    if (!geometry) throw new Error("Floral geometry must share attributes");
    const material = new THREE.MeshPhysicalMaterial({ color, roughness: .72, metalness: 0, side: THREE.DoubleSide, sheen: .35, sheenColor: new THREE.Color("#ffe4e7"), sheenRoughness: .8, emissive: color, emissiveIntensity: .06 });
    return { color, geometry, material };
  });
}
