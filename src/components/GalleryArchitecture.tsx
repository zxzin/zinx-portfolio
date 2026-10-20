import { useEffect, useMemo } from "react";
import { useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";

type V3 = [number, number, number];

const brass = "#a98b59";
const walnut = "#35211c";
const stoneUrl = import.meta.env.BASE_URL + "projects/gallery-theater/plum-stone.jpg";

function Block({ at, size, color = walnut, metal = .08, rough = .72, radius = .05, coat = .08 }: {
  at: V3; size: V3; color?: string; metal?: number; rough?: number; radius?: number; coat?: number;
}) {
  return <RoundedBox position={at} args={size} radius={Math.min(radius, ...size.map(n => n / 3))} smoothness={3} castShadow receiveShadow>
    <meshPhysicalMaterial color={color} metalness={metal} roughness={rough} clearcoat={coat} clearcoatRoughness={.45} />
  </RoundedBox>;
}

function roundedOutline(width: number, height: number, radius: number) {
  const shape = new THREE.Shape(), x = -width / 2, y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

function archOutline(width: number, height: number) {
  const shape = new THREE.Shape(), half = width / 2, bottom = -height / 2, top = height / 2;
  const foot = .1;
  shape.moveTo(-half + foot, bottom);
  shape.lineTo(half - foot, bottom);
  shape.quadraticCurveTo(half, bottom, half, bottom + foot);
  shape.lineTo(half, top - half);
  shape.absarc(0, top - half, half, 0, Math.PI, false);
  shape.lineTo(-half, bottom + foot);
  shape.quadraticCurveTo(-half, bottom, -half + foot, bottom);
  return shape;
}

/** Each recessed frame is solid joinery with a fine independent metal inlay. */
function InsetPanel({ at, width, height, radius = .1, color, rim = 0, arch = false, rough = .65, depth = .025, rotation, fill = 0 }: {
  at: V3; width: number; height: number; radius?: number; color: string; rim?: number;
  arch?: boolean; rough?: number; depth?: number; rotation?: V3; fill?: number;
}) {
  const geometry = useMemo(() => {
    const outline = (w: number, h: number, r: number) => arch ? archOutline(w, h) : roundedOutline(w, h, r);
    const shape = outline(width, height, radius);
    if (rim) shape.holes.push(new THREE.Path(outline(width - rim * 2, height - rim * 2, Math.max(.01, radius - rim)).getPoints(36).reverse()));
    return new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelSegments: 2, bevelSize: .008, bevelThickness: .008, curveSegments: 24,
    });
  }, [width, height, radius, rim, arch, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={at} rotation={rotation} castShadow receiveShadow>
    <meshPhysicalMaterial color={color} metalness={rim ? .72 : .04} roughness={rough} clearcoat={rim ? .2 : .02}
      emissive={color} emissiveIntensity={fill} />
  </mesh>;
}

function EllipseBand({ radius, width, y, color, depth = .035, glow = 0 }: {
  radius: [number, number]; width: number; y: number; color: string; depth?: number; glow?: number;
}) {
  const [rx, rz] = radius;
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absellipse(0, 0, rx, rz, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absellipse(0, 0, rx - width, rz - width, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 96 });
  }, [rx, rz, width, depth]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name={glow ? "ceiling-recessed-warm-diffuser" : undefined} position={[0, y, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={geometry} receiveShadow>
    <meshStandardMaterial color={color} metalness={glow ? .05 : .65} roughness={glow ? .65 : .4}
      emissive={glow ? "#ffce86" : "#000000"} emissiveIntensity={glow} />
  </mesh>;
}

/** A settled cloth surface in room coordinates; the opening curtains are separate. */
function BackdropVelvet() {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(16.25, 6.9, 240, 28);
    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const tint = new THREE.Color("#561526");
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i);
      const fall = (3.45 - y) / 6.9;
      const phase = x * Math.PI * 3.35 + Math.sin(x * .7) * .2 + fall * Math.sin(x * .85) * .15;
      const fold = Math.sin(phase) * .14 + Math.sin(phase * 2 + .3) * .036;
      positions.setZ(i, fold * (.8 + fall * .2));
      positions.setY(i, y - Math.sin(x * 1.6) ** 2 * .025 * fall);
      const shade = .8 + (Math.sin(phase) + 1) * .1;
      colors.set([tint.r * shade, tint.g * shade, tint.b * shade], i * 3);
    }
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group name="permanent-velvet-backdrop">
    <mesh geometry={geometry} position={[0, 3.49, -5.91]}>
      <meshPhysicalMaterial vertexColors color="#ffffff" metalness={0} roughness={.98}
        sheen={.8} sheenColor="#7f3342" sheenRoughness={.93} clearcoat={0} envMapIntensity={.15} />
    </mesh>
    <Block at={[0, .12, -5.7]} size={[16.25, .24, .16]} color="#29191c" radius={.025} />
    <Block at={[0, .255, -5.61]} size={[16.25, .018, .025]} color="#796042" metal={.62} radius={.005} />
    <Block at={[0, 6.99, -5.82]} size={[16.4, .19, .36]} color={walnut} radius={.035} />
    <Block at={[0, 6.89, -5.62]} size={[16.3, .022, .025]} color={brass} metal={.72} radius={.004} />
  </group>;
}

function CeilingCove() {
  const walnutMaterial = useMemo(() => {
    const material = new THREE.MeshPhysicalMaterial({
      color: "#5a3522", roughness: .8, metalness: .02, clearcoat: .06,
      emissive: "#4f2915", emissiveIntensity: .35,
    });
    // The concealed cove grazes this physical underside, fading toward its center.
    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vCovePosition;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvCovePosition = position.xy;");
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vCovePosition;")
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          float radius = min(1., length(vCovePosition));
          float coveWash = exp(-pow((1. - radius) / .135, 2.));
          float woodGrain = .97 + .03 * sin(vCovePosition.y * 205. + sin(vCovePosition.x * 8.) * 1.7);
          diffuseColor.rgb *= woodGrain;
          totalEmissiveRadiance += vec3(.2, .087, .027) * coveWash;
        `);
    };
    material.customProgramCacheKey = () => "gallery-walnut-cove-v1";
    return material;
  }, []);
  useEffect(() => () => walnutMaterial.dispose(), [walnutMaterial]);
  return <group name="gallery-ceiling-cove" position={[0, 7.15, -1]}>
    <Block at={[0, .2, 0]} size={[18, .3, 12]} color="#211610" rough={.88} metal={.02} />
    <mesh name="solid-walnut-ceiling" position={[0, .08, 0]} scale={[7.78, 1, 4.38]} receiveShadow>
      <cylinderGeometry args={[1, 1, .12, 128]} />
      <meshPhysicalMaterial color="#42271c" roughness={.74} metalness={.03} clearcoat={.08}
        emissive="#30170e" emissiveIntensity={.08} />
    </mesh>
    <EllipseBand radius={[7.85, 4.45]} width={.075} y={-.095} depth={.1} color="#655037" />
    <EllipseBand radius={[7.76, 4.36]} width={.018} y={-.1} color="#b39a6b" />
    <EllipseBand radius={[7.62, 4.22]} width={.09} y={-.075} color="#21130d" depth={.08} />
    <EllipseBand radius={[7.54, 4.14]} width={.08} y={-.079} color="#d5aa6c" glow={.55} depth={.015} />
    <EllipseBand radius={[7.48, 4.08]} width={.045} y={-.045} color="#705035" depth={.025} />
    <mesh name="walnut-inset-ceiling" position={[0, -.03, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[7.42, 4.02, 1]} receiveShadow>
      <circleGeometry args={[1, 128]} />
      <primitive object={walnutMaterial} attach="material" />
    </mesh>
    {[[-4.65, -.9], [0, -2.6], [4.65, -.9]].map(([x, z]) => <group key={x} position={[x, -.04, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[.046, .069, 24]} /><meshStandardMaterial color="#8e714d" metalness={.7} roughness={.48} />
      </mesh>
      <mesh position={[0, -.006, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[.041, 24]} /><meshStandardMaterial color="#f4d5a0" emissive="#ffce83" emissiveIntensity={.6} roughness={.8} />
      </mesh>
    </group>)}
  </group>;
}

export function CasinoArchitecture() {
  const { size } = useThree();
  const source = useTexture(stoneUrl);
  const { floor, apron } = useMemo(() => {
    const prepare = (x: number, y: number) => {
      const texture = source.clone();
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(x, y);
      texture.anisotropy = 4;
      texture.needsUpdate = true;
      return texture;
    };
    return { floor: prepare(7, 8), apron: prepare(3, 2) };
  }, [source]);
  useEffect(() => () => { floor.dispose(); apron.dispose(); }, [floor, apron]);
  return <group name="casino-salon">
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.42, -6]} receiveShadow name="polished-stone-floor">
      <planeGeometry args={[38, 44]} />
      <MeshReflectorMaterial map={floor} resolution={size.width < 700 ? 256 : 512} mirror={.08}
        mixStrength={.22} color="#c4aaae" roughness={.7} metalness={.06}
        emissiveMap={floor} emissive="#775b60" emissiveIntensity={.18} />
    </mesh>
    <group name="continuous-inlaid-stone-stage">
      <Block at={[0, -.19, -1.1]} size={[16.5, .36, 10.6]} color="#302327" rough={.77} radius={.8} />
      <Block at={[0, -.035, -1.11]} size={[16.4, .04, 10.5]} color="#776044" rough={.5} metal={.65} radius={.75} />
      <RoundedBox position={[0, -.007, -1.11]} args={[16.24, .035, 10.35]} radius={.01} smoothness={3} receiveShadow>
        <meshPhysicalMaterial map={apron} color="#d4b8bc" roughness={.76} metalness={.04} clearcoat={.1} clearcoatRoughness={.65}
          emissiveMap={apron} emissive="#89666a" emissiveIntensity={.2} />
      </RoundedBox>
      <InsetPanel at={[0, .016, -1.11]} rotation={[-Math.PI / 2, 0, 0]} width={15.98} height={10.09}
        radius={.62} rim={.018} color="#95784e" rough={.58} depth={.002} />
      <Block at={[0, -.18, 4.27]} size={[14.8, .3, .75]} color="#3e2c2c" rough={.8} radius={.13} />
      <Block at={[0, -.31, 4.78]} size={[15.5, .18, .55]} color="#2f2124" rough={.8} radius={.1} />
      <Block at={[0, -.067, 4.639]} size={[14.55, .018, .018]} color="#967549" metal={.72} rough={.48} radius={.004} />
      <Block at={[0, -.245, 5.047]} size={[15.24, .014, .018]} color="#735737" metal={.65} rough={.54} radius={.003} />
    </group>
    <Block at={[0, 3.7, -6.3]} size={[23, 8.4, .4]} color="#2a171c" metal={.02} rough={.98} coat={0} />
    <BackdropVelvet />
    {[-1, 1].map(side => <group key={side} name="gallery-colonnade">
      <Block at={[side * 8.65, 3.7, -1.5]} size={[.6, 7.4, 10]} color="#271b1b" rough={.9} metal={.02} coat={0} />
      {[-4.5, 1.1].map(z => <group key={z} position={[side * 8.1, 0, z]}>
        <Block at={[0, 3.45, 0]} size={[.6, 6.9, .65]} color="#513b2d" metal={.04} rough={.77} radius={.06} />
        {[-.21, -.14, -.07, 0, .07, .14, .21].map(x => <Block key={x} at={[x, 3.45, .338]} size={[.025, 6.52, .025]} color="#211814" rough={.9} radius={.006} />)}
        <Block at={[0, .12, 0]} size={[.76, .22, .8]} color="#35251b" rough={.75} />
        <Block at={[0, .25, 0]} size={[.7, .035, .74]} color={brass} metal={.7} rough={.5} radius={.01} />
        <Block at={[0, 6.76, 0]} size={[.7, .08, .75]} color="#755b3a" metal={.45} />
        <Block at={[0, 6.85, 0]} size={[.8, .06, .85]} color={brass} metal={.7} rough={.48} radius={.015} />
      </group>)}
      <rectAreaLight position={[side * 6, 5.2, -3]} rotation={[-.25, 0, 0]} width={2.5} height={2.5} color="#ffcc9d" intensity={.4} />
    </group>)}
    <CeilingCove />
  </group>;
}

export function GalleryNiche() {
  return <group name="rounded-exhibit-alcove">
    <InsetPanel at={[0, 2.8, -.96]} width={3.48} height={5.56} arch color="#37241d" depth={.12} />
    <InsetPanel at={[0, 2.8, -.817]} width={3.38} height={5.46} arch rim={.052} color="#947344" rough={.5} />
    <InsetPanel at={[0, 2.8, -.804]} width={3.23} height={5.31} arch color="#5a2b35" rough={.93} fill={.25} />
    <InsetPanel at={[0, 2.8, -.77]} width={3.17} height={5.25} arch rim={.014} color="#775939" rough={.62} />
    <Block at={[0, .09, -.08]} size={[3.55, .17, 2.3]} color="#382722" rough={.77} radius={.16} />
    <Block at={[0, .185, -.08]} size={[3.45, .018, 2.22]} color="#997c51" rough={.54} metal={.65} radius={.08} />
    <Block at={[0, .214, -.08]} size={[3.39, .037, 2.16]} color="#483536" rough={.78} radius={.07} />
  </group>;
}

export function ExhibitPlinth({ height = 1.3, radius = .95 }: { height?: number; radius?: number }) {
  return <group name="stone-and-brass-plinth">
    <mesh position={[0, height / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius * .9, radius * .92, height, 64]} />
      <meshPhysicalMaterial color="#38261f" roughness={.76} metalness={.04} clearcoat={.08} />
    </mesh>
    {Array.from({ length: 40 }, (_, i) => {
      const angle = i * Math.PI / 20;
      return <mesh key={i} position={[Math.sin(angle) * radius * .918, height * .49, Math.cos(angle) * radius * .918]} rotation={[0, angle, 0]} receiveShadow>
        <boxGeometry args={[.012, height * .81, .02]} /><meshStandardMaterial color="#705137" roughness={.76} metalness={.06} />
      </mesh>;
    })}
    {[.055, height - .025].map(y => <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius * .98, radius * .98, .038, 64]} />
      <meshStandardMaterial color="#a3885b" metalness={.74} roughness={.45} />
    </mesh>)}
    <mesh position={[0, .022, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[radius, radius * 1.015, .04, 64]} /><meshStandardMaterial color="#33251e" roughness={.75} />
    </mesh>
    <mesh position={[0, height + .014, 0]} receiveShadow>
      <cylinderGeometry args={[radius * .975, radius * .99, .075, 64]} />
      <meshPhysicalMaterial color="#baaa94" roughness={.68} metalness={.02} clearcoat={.08} />
    </mesh>
    <mesh position={[0, height + .053, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <ringGeometry args={[radius * .91, radius * .92, 64]} /><meshStandardMaterial color="#8e795e" metalness={.3} roughness={.65} />
    </mesh>
  </group>;
}
