import { useEffect, useMemo, useRef } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Html, Lightformer, MeshReflectorMaterial, RoundedBox, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { entranceEmblems } from "../content/exhibition";
import StageCurtain from "./StageCurtain";
import { drawReelEmblem } from "../lib/reel-art";
import {
  canPull, clamp01, spinLightLevel, blastEnvelope,
  SYMBOL_COUNT, symbolSuit, TAU,
  type ArcadeMotion, type ArcadeState,
} from "../lib/arcade-state";

type V3 = [number, number, number];
type SceneProps = {
  state: ArcadeState;
  motion: ArcadeMotion;
  onReady: () => void;
  onFailure: () => void;
  onPull: () => void;
  onDragLever: (value: number) => void;
  onReleaseLever: (value: number, tapped: boolean) => void;
};
const colors = ["#eb3d35", "#ffd23a", "#3184ff", "#26ca80"];
const mix = THREE.MathUtils.lerp;

function Block({ at, size, color = "#c0cddd", metal = 0.7, rough = 0.25, radius = 0.07, glow = 0, coat = .55, sheen = 0 }: {
  at: V3; size: V3; color?: string; metal?: number; rough?: number; radius?: number; glow?: number; coat?: number; sheen?: number;
}) {
  return <RoundedBox position={at} args={size} radius={Math.min(radius, ...size.map(n => n / 3))} smoothness={3} castShadow receiveShadow>
    <meshPhysicalMaterial color={color} metalness={metal} roughness={rough} clearcoat={coat} clearcoatRoughness={0.18} sheen={sheen} sheenColor={color} sheenRoughness={.8} emissive={color} emissiveIntensity={glow} />
  </RoundedBox>;
}

/** Closed, bevelled polygon extruded into a genuinely thick shell component. */
function Panel({ points, depth, at = [0, 0, 0], color = "#bac9db", metal = 0.72, bevel = 0.07, glow = 0 }: {
  points: [number, number][]; depth: number; at?: V3; color?: string; metal?: number; bevel?: number; glow?: number;
}) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    points.forEach(([x, y], i) => i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: bevel, bevelThickness: bevel });
    geo.translate(0, 0, -depth / 2);
    return geo;
  }, [points, depth, bevel]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={at} castShadow receiveShadow>
    <meshPhysicalMaterial color={color} metalness={metal} roughness={0.26} clearcoat={0.65} emissive={color} emissiveIntensity={glow} />
  </mesh>;
}
const marqueeShape: [number, number][] = [[-3.1, -.34], [3.1, -.34], [3.3, -.12], [3.3, .17], [3.09, .39], [-3.09, .39], [-3.3, .17], [-3.3, -.12]];
const wingShape: [number, number][] = [[2.64, .65], [3.27, .65], [3.18, 1.5], [3.04, 1.75], [3.04, 4.12], [3.22, 4.43], [2.72, 4.43], [2.53, 4.1], [2.53, 1.74]];
const consoleShape: [number, number][] = [[-3.28, -.47], [3.28, -.47], [3.13, .35], [2.9, .47], [-2.9, .47], [-3.13, .35]];

function Label({ text, at, size, color = "#15263e", background = "#eef4fa", tracking = false }: {
  text: string; at: V3; size: [number, number]; color?: string; background?: string; tracking?: boolean;
}) {
  const texture = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 1024; c.height = Math.max(128, Math.round(1024 * size[1] / size[0]));
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = background; ctx.fillRect(0, 0, c.width, c.height);
    ctx.fillStyle = color; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "900 " + Math.round(c.height * (tracking ? .48 : .64)) + "px Arial, PingFang SC, sans-serif";
    ctx.fillText(text, 512, c.height * .53, 958);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }, [text, color, background, size, tracking]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <mesh position={at}><planeGeometry args={size} /><meshBasicMaterial map={texture} transparent={background === "transparent"} toneMapped={false} /></mesh>;
}

/** Diffusing acrylic, separately printed lettering and a local optical halo. */
function MarqueeLightbox() {
  const trims = useMemo(() => [.983, .963, .944].map(scale => marqueeShape.map(([x, y]): [number, number] => [x * scale, y * (1 - (1 - scale) * 4)])), []);
  return <group name="backlit-marquee">
    <Panel points={marqueeShape} at={[0, 4.68, .08]} depth={2.55} color="#66717b" bevel={.09} />
    <Panel points={trims[0]} at={[0, 4.68, 1.39]} depth={.06} color="#cab589" metal={.88} bevel={.023} />
    <Panel points={trims[1]} at={[0, 4.68, 1.432]} depth={.025} color="#382e2a" metal={.5} bevel={.018} />
    <Panel points={trims[2]} at={[0, 4.68, 1.459]} depth={.035} color="#fff3d6" metal={.02} bevel={.022} glow={1.2} />
    <mesh position={[0, 4.7, 1.47]} name="marquee-edge-bloom" renderOrder={1}>
      <planeGeometry args={[7.5, 1.75]} />
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}
        vertexShader={`varying vec2 uvLight; void main(){ uvLight=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`}
        fragmentShader={`varying vec2 uvLight; void main(){
          vec2 p=(uvLight-.5)*vec2(7.5,1.75);
          vec2 q=abs(p)-vec2(2.96,.12);
          float d=length(max(q,0.))+min(max(q.x,q.y),0.)-.16;
          float halo=exp(-max(d,0.)*10.)*.28;
          gl_FragColor=vec4(1.,.79,.48,halo);
        }`} />
    </mesh>
    <Label text="ZINX  /  CREATIVE PORTAL" at={[0, 4.68, 1.505]} size={[5.55, .35]} color="#152033" background="transparent" />
    <rectAreaLight position={[0, 4.68, 1.76]} width={5.9} height={.46} color="#fff0ce" intensity={7} />
  </group>;
}

function roundedOutline(width: number, height: number, radius: number) {
  const path = new THREE.Shape(), x = -width / 2, y = -height / 2, r = radius;
  path.moveTo(x + r, y); path.lineTo(x + width - r, y);
  path.quadraticCurveTo(x + width, y, x + width, y + r); path.lineTo(x + width, y + height - r);
  path.quadraticCurveTo(x + width, y + height, x + width - r, y + height); path.lineTo(x + r, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - r); path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y); path.closePath(); return path;
}

/** The face radius is independent of depth, preserving concentric soft corners. */
function InsetPanel({ at, width, height, radius, color, rim = 0, glow = 0 }: {
  at: V3; width: number; height: number; radius: number; color: string; rim?: number; glow?: number;
}) {
  const geometry = useMemo(() => {
    const shape = roundedOutline(width, height, radius);
    if (rim) shape.holes.push(new THREE.Path(roundedOutline(width - rim * 2, height - rim * 2, radius - rim).getPoints(12).reverse()));
    return new THREE.ExtrudeGeometry(shape, { depth: .025, bevelEnabled: true, bevelSegments: 4, bevelSize: .012, bevelThickness: .012, curveSegments: 16 });
  }, [width, height, radius, rim]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh geometry={geometry} position={at} castShadow receiveShadow>
    <meshPhysicalMaterial color={color} metalness={rim ? .85 : .15} roughness={rim ? .22 : .3} clearcoat={.75} clearcoatRoughness={.14} emissive={color} emissiveIntensity={glow} />
  </mesh>;
}

function ConsoleInstruments({ rounds }: { rounds: number }) {
  return <group name="inlaid-console-instruments">
    <group position={[-2.1, 1.12, 1.49]} name="round-counter-lightbox">
      <InsetPanel at={[0, 0, 0]} width={1.62} height={.69} radius={.13} color="#292528" />
      <InsetPanel at={[0, 0, .025]} width={1.62} height={.69} radius={.13} rim={.035} color="#cfb580" />
      <InsetPanel at={[0, 0, .017]} width={1.48} height={.55} radius={.085} color="#18252b" />
      <Label text={rounds + " / 3"} at={[0, .113, .06]} size={[1.03, .28]} color="#ffe2a0" background="transparent" />
      <Block at={[0, -.04, .06]} size={[1.12, .009, .008]} color="#9a825f" radius={.002} />
      {[0, 1, 2].map(i => <group key={i} position={[(i - 1) * .38, -.16, .065]}>
        <mesh><torusGeometry args={[.066, .012, 8, 40]} /><meshStandardMaterial color="#d7ba82" metalness={.85} roughness={.2} /></mesh>
        <mesh scale={[1, 1, .4]}><sphereGeometry args={[.055, 24, 16]} />
          <meshPhysicalMaterial color={i < rounds ? "#ffca63" : "#533827"} metalness={.15} roughness={.21} clearcoat={1} emissive="#ffaf37" emissiveIntensity={i < rounds ? 2 : .03} />
        </mesh>
      </group>)}
    </group>
    <group position={[-.05, 1.17, 1.49]} name="console-display-lightbox">
      <InsetPanel at={[0, 0, 0]} width={2.3} height={.67} radius={.13} color="#332a26" />
      <InsetPanel at={[0, 0, .025]} width={2.3} height={.67} radius={.13} rim={.045} color="#cbb17f" />
      <InsetPanel at={[0, 0, .023]} width={2.16} height={.53} radius={.083} color="#fff1d0" glow={1.1} />
      <Label text="来把大的！" at={[0, .005, .069]} size={[1.69, .235]} color="#492f25" background="transparent" />
      {[-1, 1].map(side => <group key={side} position={[side * .985, 0, .06]}>
        {[-.09, -.045, 0, .045, .09].map(y => <Block key={y} at={[0, y, 0]} size={[.055, .008, .006]} color="#c3a171" radius={.001} />)}
      </group>)}
      <pointLight position={[0, 0, .27]} intensity={.3} distance={1.2} color="#ffdc9c" />
    </group>
  </group>;
}

function Bolt({ at }: { at: V3 }) {
  return <group position={at}>
    <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.055, .055, .035, 12]} /><meshStandardMaterial color="#dce5ee" metalness={.9} roughness={.18} /></mesh>
    <Block at={[0, 0, .025]} size={[.048, .009, .009]} color="#41536c" radius={.001} />
  </group>;
}

function MachineLights({ motion }: { motion: ArcadeMotion }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    group.current?.children.forEach((g, i) => {
      const value = (motion.lights[i] * .6 + spinLightLevel(motion.spinPhase, i / 4, motion.spinGlow, motion.stopGlow)) * (1 - motion.blackout);
      const material = (g.children[1] as THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>).material;
      material.emissiveIntensity = .02 + value * 4;
      material.color.set(colors[i]).multiplyScalar(.15 + value * .8);
      (g.children[2] as THREE.PointLight).intensity = value * 11;
      (g.children[3] as THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>).material.uniforms.strength.value = value * .55;
    });
  });
  return <group ref={group}>
    {colors.map((color, i) => <group key={color} position={[(i - 1.5) * 1.32, 4.18, 1.46]}>
      <Block at={[0, 0, -.03]} size={[.46, .23, .15]} color="#18253b" radius={.06} />
      <mesh position={[0, 0, .08]}><boxGeometry args={[.28, .09, .06]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={.1} /></mesh>
      <pointLight position={[0, -.15, .4]} color={color} intensity={0} distance={4.5} decay={2} />
      <mesh position={[0, 0, .14]}>
        <planeGeometry args={[1.15, .65]} />
        <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false}
          uniforms={{ tint: { value: new THREE.Color(color) }, strength: { value: 0 } }}
          vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={`varying vec2 vUv; uniform vec3 tint; uniform float strength; void main(){float d=length((vUv-.5)*2.);float a=pow(max(0.,1.-d),2.)*strength;gl_FragColor=vec4(tint,a);}`} />
      </mesh>
    </group>)}
  </group>;
}

function SpinLightTrim({ motion }: { motion: ArcadeMotion }) {
  const lamps = useRef<THREE.Group>(null);
  const tints = useMemo(() => colors.map(color => new THREE.Color(color)), []);
  const left = useRef<THREE.RectAreaLight>(null), right = useRef<THREE.RectAreaLight>(null);
  const positions = useMemo(() => [
    ...Array.from({ length: 10 }, (_, i): V3 => [-2.65 + i * .59, 3.96, 1.58]),
    ...Array.from({ length: 6 }, (_, i): V3 => [2.94, 3.66 - i * .34, 1.58]),
    ...Array.from({ length: 10 }, (_, i): V3 => [2.65 - i * .59, 1.72, 1.58]),
    ...Array.from({ length: 6 }, (_, i): V3 => [-2.94, 1.96 + i * .34, 1.58]),
  ], []);
  useFrame(() => {
    const fade = (1 - motion.blackout) * (1 - motion.blast);
    lamps.current?.children.forEach((lamp, i) => {
      const level = spinLightLevel(motion.spinPhase, i / positions.length, motion.spinGlow, motion.stopGlow) * fade;
      const material = (lamp.children[1] as THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhysicalMaterial>).material;
      material.emissiveIntensity = .025 + level * 3;
      material.color.set("#e9cd91").lerp(tints[Math.floor(i / 8)], clamp01(level * 2));
    });
    if (left.current) left.current.intensity = (motion.spinGlow * 5 + motion.stopGlow * 3) * fade;
    if (right.current) right.current.intensity = (motion.spinGlow * 5 + motion.stopGlow * 3) * fade;
  });
  return <group name="spin-light-trim">
    <group name="recessed-lamp-channels">
      {[-2.94,2.94].map(x => <group key={x}>
        <InsetPanel at={[x,2.81,1.485]} width={.24} height={2.16} radius={.1} color="#29292c" />
        <InsetPanel at={[x,2.81,1.5]} width={.24} height={2.16} radius={.1} rim={.025} color="#bda57d" />
      </group>)}
      {[1.72,3.96].map(y => <group key={y}>
        <InsetPanel at={[0,y,1.485]} width={5.67} height={.2} radius={.085} color="#29292c" />
        <InsetPanel at={[0,y,1.5]} width={5.67} height={.2} radius={.085} rim={.02} color="#bda57d" />
      </group>)}
    </group>
    <group ref={lamps}>{positions.map((at, i) => {
      const horizontal = i % 16 < 10;
      return <group key={i} position={at} name="bevelled-lamp-capsule">
        <RoundedBox args={[horizontal ? .36 : .13, horizontal ? .12 : .25, .065]} radius={.028} smoothness={3}>
          <meshStandardMaterial color="#9d835c" metalness={.85} roughness={.24} />
        </RoundedBox>
        <RoundedBox position={[0,0,.032]} args={[horizontal ? .285 : .074,horizontal ? .064 : .175,.052]} radius={.023} smoothness={3}>
          <meshPhysicalMaterial color="#e9cd91" emissive={colors[Math.floor(i / 8)]} emissiveIntensity={.025} metalness={.06} roughness={.17} clearcoat={1} clearcoatRoughness={.08} />
        </RoundedBox>
      </group>;
    })}</group>
    <rectAreaLight ref={left} position={[-3.2, 3, 2.4]} rotation={[0, -.65, 0]} width={.7} height={3.2} color="#ff5578" intensity={0} />
    <rectAreaLight ref={right} position={[3.2, 3, 2.4]} rotation={[0, .65, 0]} width={.7} height={3.2} color="#69b9ff" intensity={0} />
  </group>;
}

function ReelLightbox({ motion }: { motion: ArcadeMotion }) {
  const rail = useRef<THREE.Group>(null);
  const rim = useMemo(() => {
    const outline = (path: THREE.Path, w: number, h: number, r: number) => {
      path.moveTo(-w / 2 + r, -h / 2); path.lineTo(w / 2 - r, -h / 2);
      path.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); path.lineTo(w / 2, h / 2 - r);
      path.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); path.lineTo(-w / 2 + r, h / 2);
      path.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); path.lineTo(-w / 2, -h / 2 + r);
      path.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); path.closePath();
    };
    const shape = new THREE.Shape(), hole = new THREE.Path();
    outline(shape, 5.34, 2.5, .2); outline(hole, 5.12, 2.29, .12); shape.holes.push(hole);
    return new THREE.ExtrudeGeometry(shape, { depth: .065, bevelEnabled: true, bevelSize: .025, bevelThickness: .025, bevelSegments: 3, steps: 1 });
  }, []);
  useEffect(() => () => rim.dispose(), [rim]);
  useFrame(() => {
    rail.current?.children.forEach(object => {
      const material = (object as THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>).material;
      material.emissiveIntensity = .65 + motion.spinGlow * .45 + motion.stopGlow * 1.5;
    });
  });
  return <group name="reel-lightbox" position={[0, 2.83, 1.46]}>
    <mesh geometry={rim} castShadow><meshPhysicalMaterial color="#d2b681" metalness={.88} roughness={.22} clearcoat={.7} /></mesh>
    {[-.81, .81].map(x => <Block key={x} at={[x, 0, .018]} size={[.055, 2.23, .09]} color="#74879a" metal={.94} rough={.16} radius={.022} />)}
    {[-1.62, 0, 1.62].map(x => <group key={x} position={[x, 0, .07]}>
      <mesh><boxGeometry args={[1.51, 2.23, .025]} /><meshPhysicalMaterial color="#e5f3ff" roughness={.06} metalness={.08} transparent opacity={.065} depthWrite={false} clearcoat={1} /></mesh>
      <mesh position={[0, 0, .02]}><planeGeometry args={[1.51, 2.23]} />
        <shaderMaterial transparent depthWrite={false}
          vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
          fragmentShader={`varying vec2 vUv; void main(){
            float edge=pow(abs(vUv.y-.5)*2.,5.);
            float side=pow(abs(vUv.x-.5)*2.,12.);
            float reflection=exp(-pow((vUv.x+vUv.y*.16-.16)*32.,2.))*.11;
            vec3 tint=mix(vec3(.05,.07,.12),vec3(.85,.94,1.),step(.02,reflection));
            gl_FragColor=vec4(tint,edge*.5+side*.15+reflection);
          }`} />
      </mesh>
    </group>)}
    <group ref={rail} name="payline-light-guides">
      {[-1, 1].flatMap(side => [<mesh key={side + "upper"} position={[side * 2.47, .045, .13]} rotation={[0, 0, side * .6]}><boxGeometry args={[.18, .034, .025]} /><meshStandardMaterial color="#ffe6aa" emissive="#ffca67" /></mesh>,
        <mesh key={side + "lower"} position={[side * 2.47, -.045, .13]} rotation={[0, 0, side * -.6]}><boxGeometry args={[.18, .034, .025]} /><meshStandardMaterial color="#ffe6aa" emissive="#ffca67" /></mesh>])}
    </group>
  </group>;
}

function useSymbols() {
  const textures = useMemo(() => colors.map((_, i) => {
    const c = document.createElement("canvas"); c.width = 1024; c.height = 576;
    const ctx = c.getContext("2d")!;
    ctx.scale(2,2); drawReelEmblem(ctx, i);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  }), []);
  useEffect(() => () => textures.forEach(t => t.dispose()), [textures]);
  return textures;
}

/** Ten curved panels wrap the full circumference; the cylinder rotates, not a slideshow. */
function ReelAssembly({ index, motion, symbols }: { index: number; motion: ArcadeMotion; symbols: THREE.Texture[] }) {
  const assembly = useRef<THREE.Group>(null), drum = useRef<THREE.Group>(null);
  const patch = useMemo(() => {
    const positions: number[] = [], uvs: number[] = [], indices: number[] = [];
    const segments = 12, arc = TAU / SYMBOL_COUNT * .982, radius = 1.147;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments - .5) * arc;
      for (const x of [-.685, .685]) { positions.push(x, Math.sin(a) * radius, Math.cos(a) * radius); uvs.push(x < 0 ? 0 : 1, i / segments); }
      if (i < segments) { const n = i * 2; indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    g.setIndex(indices); g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => patch.dispose(), [patch]);
  useFrame(() => {
    if (!assembly.current || !drum.current) return;
    drum.current.rotation.x = motion.reels[index];
  });
  return <group ref={assembly} position={[(index - 1) * 1.62, 2.83, -.04]} name={"reel-assembly-" + index}>
    <mesh rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.095, .095, 1.63, 16]} /><meshStandardMaterial color="#829bb6" metalness={.95} roughness={.18} /></mesh>
    <group ref={drum} name={"continuous-reel-" + index}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[1.14, 1.14, 1.44, 64]} /><meshStandardMaterial color="#ccd6e0" metalness={.3} roughness={.3} /></mesh>
      {Array.from({ length: SYMBOL_COUNT }, (_, symbol) => <group rotation={[-symbol * TAU / SYMBOL_COUNT, 0, 0]} key={symbol}>
        <mesh geometry={patch}><meshBasicMaterial map={symbols[symbolSuit(symbol)]} toneMapped={false} /></mesh>
      </group>)}
      {[-.735, .735].map(x => <mesh key={x} position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}><torusGeometry args={[1.11, .035, 8, 64]} /><meshStandardMaterial color="#ebf2f8" metalness={.9} roughness={.14} /></mesh>)}
    </group>
  </group>;
}

function LeverAssembly({ motion, state, onDragLever, onReleaseLever, onPull }: SceneProps) {
  const pivot = useRef<THREE.Group>(null), drag = useRef<{ y: number; value: number; moved: number } | null>(null);
  useFrame(() => { if (pivot.current) pivot.current.rotation.x = motion.lever * 1.38; });
  const finish = (event: ReactPointerEvent<HTMLButtonElement>, cancel = false) => {
    if (!drag.current) return;
    const { value, moved } = drag.current; drag.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
    onReleaseLever(cancel ? 0 : value, !cancel && moved < 7);
  };
  return <group position={[3.55, 1.83, .05]} name="mechanical-lever">
    {state.inputMode === "entrance" && <Html center position={[-.15, 2.28, .15]} zIndexRange={[12, 11]} style={{ pointerEvents: "none" }}>
      <span className="lever-guide" data-busy={!canPull(state)}>{state.phase === "revealing" ? "即将开场" : state.phase === "spinning" ? "转动中" : state.shakes === 2 ? "最后一拉" : state.shakes === 1 ? "再拉一次" : "下拉启动"}<span aria-hidden="true">↘</span></span>
    </Html>}
    <mesh rotation={[0, 0, Math.PI / 2]} castShadow><cylinderGeometry args={[.3, .3, .58, 32]} /><meshPhysicalMaterial color="#a0b6cc" metalness={.95} roughness={.2} /></mesh>
    <mesh position={[.3, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.17, .17, .02, 20]} /><meshStandardMaterial color="#172b43" metalness={.5} /></mesh>
    <group ref={pivot} position={[.38, 0, 0]}>
      <mesh position={[0, .79, 0]} castShadow><cylinderGeometry args={[.057, .073, 1.58, 20]} /><meshPhysicalMaterial color="#e5edf7" metalness={1} roughness={.13} /></mesh>
      <mesh position={[0, 1.64, 0]} castShadow><sphereGeometry args={[.26, 32, 24]} /><meshPhysicalMaterial color="#e6292e" metalness={.18} roughness={.16} clearcoat={1} clearcoatRoughness={.06} /></mesh>
      {state.inputMode === "entrance" && <Html center position={[0, 1.64, 0]} zIndexRange={[12, 11]}>
        <button className="lever-hit" type="button" aria-label="拉下机器拉杆" aria-keyshortcuts="Space" title="向下拉动" disabled={!canPull(state)}
          onPointerDown={e => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); drag.current = { y: e.clientY, value: 0, moved: 0 }; }}
          onPointerMove={e => { if (!drag.current) return; const dy = e.clientY - drag.current.y; drag.current.moved = Math.max(drag.current.moved, Math.abs(dy)); drag.current.value = clamp01(dy / Math.min(125, innerHeight * .14)); onDragLever(drag.current.value); }}
          onPointerUp={e => finish(e)} onPointerCancel={e => finish(e, true)}
          onClick={e => { if (e.detail === 0) onPull(); }}>
          <span className="sr-only">向下拖动，或点击拉杆</span>
        </button>
      </Html>}
    </group>
  </group>;
}

function InnerMechanism({ motion }: { motion: ArcadeMotion }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    group.current?.children.forEach((object, i) => {
      if (object.name === "gear") object.rotation.z = motion.reels[i % 3] * .35;
    });
  });
  return <group ref={group}>
    {[-2.85, 2.85].map((x, i) => <group key={x}>
      <Block at={[x, 2.85, -.1]} size={[.13, 2.5, .2]} color="#647e9b" />
      <Block at={[x, 2.8, .31]} size={[.04, 2.14, .03]} color={colors[i + 1]} glow={.75} />
      {[1.83, 2.4, 3.7].map(y => <mesh key={y} position={[x, y, .15]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.14, .14, .17, 12]} /><meshStandardMaterial color="#ccd4db" metalness={.85} roughness={.25} /></mesh>)}
    </group>)}
    {[-2.7, 2.7].map(x => <mesh key={x} name="gear" position={[x, 2.9, .37]}><torusGeometry args={[.3, .075, 4, 16]} /><meshStandardMaterial color="#697b95" metalness={.9} roughness={.3} /></mesh>)}
  </group>;
}

function WorkStickers() {
  const textures = useTexture(entranceEmblems.map(emblem => import.meta.env.BASE_URL + emblem.src.replace(/^\//, "")));
  return <group name="real-product-stickers" position={[2.1, 1.14, 1.52]}>
    {textures.map((texture, i) => <group key={i} position={[(i - (textures.length - 1) / 2) * .52, i === 1 ? .05 : -.02, i * .002]} rotation={[0, 0, [ .14, -.1, .1 ][i]]}>
      <Block at={[0, 0, 0]} size={[.49, .49, .025]} color="#fff9e9" metal={0} rough={.8} radius={.08} />
      <mesh position={[0, 0, .02]}><planeGeometry args={[.42, .42]} /><meshBasicMaterial map={texture} transparent toneMapped={false} /></mesh>
    </group>)}
  </group>;
}

function PortalGate(props: SceneProps) {
  const { motion, state } = props;
  const consoleRef = useRef<THREE.Group>(null);
  const symbols = useSymbols();
  useFrame(() => {
    if (consoleRef.current) consoleRef.current.position.y = -motion.lever * .015;
  });
  return <group name="coin-machine-core">
    <InnerMechanism motion={motion} />
    <group><group scale={[-1, 1, 1]}><Panel points={wingShape} depth={2.5} />
      <Block at={[2.76, 2.85, 1.35]} size={[.12, 2.57, .13]} color="#cce4fa" metal={1} rough={.13} />
      <Block at={[3.1, 2.9, 1.31]} size={[.055, 2.4, .04]} color={colors[2]} glow={.7} />
    </group></group>
    <group><Panel points={wingShape} depth={2.5} />
      <Block at={[2.76, 2.85, 1.35]} size={[.12, 2.57, .13]} color="#cce4fa" metal={1} rough={.13} />
      <Block at={[3.1, 2.9, 1.31]} size={[.055, 2.4, .04]} color={colors[2]} glow={.7} />
      {[2, 2.18, 2.36, 2.54, 2.72].map(y => <Block key={y} at={[3.275, y, -.6]} size={[.025, .065, .9]} color="#172439" radius={.012} />)}
      <LeverAssembly {...props} />
    </group>
    <group>
      <MarqueeLightbox />
      <MachineLights motion={motion} />
      <SpinLightTrim motion={motion} />
      <Block at={[0, 4.04, 1.37]} size={[5.7, .12, .17]} color="#566c85" />
      {[-2.91, 2.91].map(x => <Bolt key={x} at={[x, 4.69, 1.53]} />)}
    </group>
    {[0, 1, 2].map(i => <ReelAssembly key={i} index={i} symbols={symbols} motion={motion} />)}
    <ReelLightbox motion={motion} />
    <group ref={consoleRef} name="machine-control-deck">
      <Panel points={consoleShape} at={[0, 1.1, .03]} depth={2.64} color="#becbdc" />
      <Panel points={consoleShape.map(([x, y]) => [x * .96, y * .86])} at={[0, 1.1, 1.4]} depth={.035} color="#e8eff6" metal={.15} bevel={.04} />
      <ConsoleInstruments rounds={state.shakes} />
      <WorkStickers />
    </group>
  </group>;
}

function SlotCabinetShell(props: SceneProps) {
  const machine = useRef<THREE.Group>(null);
  const pieces = useRef<{ object: THREE.Object3D; position: THREE.Vector3; rotation: THREE.Euler }[]>([]);
  useEffect(() => {
    const root = machine.current;
    if (!root) return;
    pieces.current = root.children.flatMap(child => child.name === "coin-machine-core" ? child.children : [child])
      .map(object => ({ object, position: object.position.clone(), rotation: object.rotation.clone() }));
    return () => { pieces.current = []; };
  }, []);
  useFrame(() => {
    const root = machine.current, m = props.motion;
    if (!root) return;
    root.visible = m.blast < .99;
    root.position.y = motionKick(m);
    root.rotation.z = Math.sin(m.smoke * 65) * m.smoke * .035 * (1 - m.blast);
    pieces.current.forEach(({ object, position, rotation }, i) => {
      const p = 1 - (1 - m.blast) ** 3, direction = i % 2 ? 1 : -1;
      object.position.set(position.x + direction * p * (6 + i % 4), position.y + Math.sin(p * Math.PI) * (2.8 + i % 3) - p * p * 4, position.z - p * (1.5 + i % 3));
      object.rotation.set(rotation.x + p * direction * .35, rotation.y + p * direction * .55, rotation.z + p * direction * 1.2);
    });
  });
  return <group ref={machine} name="slot-machine">
    <Block at={[0, .29, .02]} size={[6.92, .38, 2.94]} color="#68819c" radius={.13} />
    <Block at={[0, .09, .02]} size={[6.56, .11, 2.64]} color="#142238" radius={.035} />
    <Block at={[0, .49, 1.48]} size={[6.59, .055, .035]} color="#bfd3e8" />
    <Block at={[0, .65, 1.53]} size={[1.62, .1, .08]} color="#100915" radius={.025} />
    {[-2.75, -1, 1, 2.75].map(x => <Block key={x} at={[x, .3, 1.5]} size={[.23, .16, .015]} color="#dceaff" glow={.55} />)}
    <PortalGate {...props} />
  </group>;
}
const motionKick = (m: ArcadeMotion) => Math.sin(m.kick * Math.PI * 2) * .014;

function CoinBurst({ motion }: { motion: ArcadeMotion }) {
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = motion.deal > .005;
    group.current.children.forEach((coin, i) => {
      const p = clamp01((motion.deal - i * .018) / (1 - i * .018));
      const angle = i * 2.39996;
      coin.position.set(Math.cos(angle) * (1 + i % 3) * p, 2.6 * (1 - p) + .97 * p + Math.sin(p * Math.PI) * (2 + i % 3 * .4), 1.6 + (3.2 + Math.sin(angle) * 1.5) * p);
      coin.rotation.set(-Math.PI / 2 * p, Math.PI * 4 * p, angle + Math.sin(p * Math.PI) * 3);
    });
  });
  return <group ref={group} visible={false} name="burst-gold-coins">
    {Array.from({ length: 12 }, (_, i) => <group key={i}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[.31, .31, .085, 48]} /><meshStandardMaterial color="#efbd49" metalness={.9} roughness={.24} /></mesh>
      {[-.05, .05].map(z => <mesh key={z} position={[0, 0, z]}><torusGeometry args={[.266, .018, 8, 48]} /><meshStandardMaterial color="#ffe6a0" metalness={.85} roughness={.19} /></mesh>)}
      <Label text="Z" at={[0, 0, .053]} size={[.29, .3]} color="#93611d" background="transparent" />
    </group>)}
  </group>;
}

function MachineSmoke({ motion }: { motion: ArcadeMotion }) {
  const group = useRef<THREE.Group>(null), flash = useRef<THREE.PointLight>(null);
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!;
    for (let i = 0; i < 7; i++) {
      const angle = i * 2.39996, x = 64 + Math.cos(angle) * 18, y = 64 + Math.sin(angle) * 16;
      const glow = ctx.createRadialGradient(x, y, 2, x, y, 41);
      glow.addColorStop(0, "rgba(210,196,207,.42)"); glow.addColorStop(.45, "rgba(151,134,150,.28)"); glow.addColorStop(1, "rgba(67,49,68,0)");
      ctx.fillStyle = glow; ctx.fillRect(0, 0, 128, 128);
    }
    return new THREE.CanvasTexture(canvas);
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  useFrame(() => {
    const impact = blastEnvelope(motion.blast);
    if (flash.current) flash.current.intensity = impact.glow * 115;
    if (!group.current) return;
    group.current.visible = motion.smoke > .005;
    group.current.children.forEach((object, i) => {
      const sprite = object as THREE.Sprite, angle = i * 2.39996, p = motion.smoke, b = motion.blast;
      const spread = 1 - (1 - b) ** 2;
      sprite.position.set(Math.cos(angle) * (.55 + spread * 4.5) * (1 + i % 3 * .3), 2.2 + p * .8 + i % 4 * .45 + b * 1.6, 1.9 + Math.sin(angle) * .7);
      sprite.scale.setScalar((1.3 + i % 3 * .55) * (.4 + p + b * .6));
      sprite.material.opacity = p * .8 * (1 - b * .35);
      sprite.material.color.setRGB(1, 1 - impact.glow * .2, 1 - impact.glow * .45);
      sprite.material.rotation = angle + b * .5;
    });
  });
  return <><pointLight ref={flash} position={[0, 3, 2]} intensity={0} color="#ffcc71" distance={12} />
    <group ref={group} name="machine-smoke-cloud" visible={false}>{Array.from({ length: 24 }, (_, i) => <sprite key={i}><spriteMaterial map={texture} transparent depthWrite={false} opacity={0} /></sprite>)}</group></>;
}

function BlastImpact({ motion }: { motion: ArcadeMotion }) {
  const root = useRef<THREE.Group>(null), ring = useRef<THREE.Mesh<THREE.TorusGeometry, THREE.MeshBasicMaterial>>(null);
  const core = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>(null), sparks = useRef<THREE.Group>(null);
  useFrame(() => {
    const p = motion.blast, effect = blastEnvelope(p);
    if (root.current) root.current.visible = p > 0 && p < 1;
    if (ring.current) {
      ring.current.scale.setScalar(.35 + effect.ring * 7.5);
      ring.current.material.opacity = Math.sin(effect.ring * Math.PI) * .7;
    }
    if (core.current) {
      core.current.scale.setScalar(.7 + Math.min(p * 5, 1) * 1.8);
      core.current.material.uniforms.strength.value = effect.glow * .7;
    }
    sparks.current?.children.forEach((object, i) => {
      const spark = object as THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>;
      const angle = i * 2.39996, speed = 4 + i % 5;
      const radius = speed * (1 - (1 - p) ** 2);
      spark.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * .65 - p * p * 3, Math.sin(i * 1.7) * p * 2);
      spark.rotation.z = angle - Math.PI / 2;
      spark.scale.set(.045, .13 + effect.sparks * .7, .045);
      spark.material.opacity = effect.sparks * 2;
    });
  });
  return <group ref={root} name="explosion-impact" position={[0, 2.8, 2.8]} visible={false}>
    <mesh ref={ring}><torusGeometry args={[1, .035, 8, 96]} /><meshBasicMaterial color="#ffcb78" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} /></mesh>
    <mesh ref={core}><planeGeometry args={[3, 3]} />
      <shaderMaterial transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} uniforms={{ strength: { value: 0 } }}
        vertexShader={`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`}
        fragmentShader={`varying vec2 vUv; uniform float strength; void main(){float d=length((vUv-.5)*2.);float a=pow(max(0.,1.-d),2.)*strength;gl_FragColor=vec4(1.,.58,.18,a);}`} />
    </mesh>
    <group ref={sparks}>{Array.from({length: 28}, (_, i) => <mesh key={i}>
      <sphereGeometry args={[1, 6, 4]} /><meshBasicMaterial color={i % 3 ? "#ffd58b" : "#ff8051"} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
    </mesh>)}</group>
  </group>;
}

function CardTable({ motion }: { motion: ArcadeMotion }) {
  const table = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!table.current) return;
    table.current.visible = motion.tableReveal > .02;
    table.current.position.y = -2.4 * (1 - motion.tableReveal);
  });
  return <group ref={table} visible={false} name="project-coin-table">
    <Block at={[0, .5, 5.1]} size={[10.6, .42, 5]} color="#40202f" radius={.55} metal={.1} rough={.3} />
    <Block at={[0, .73, 5.1]} size={[10.15, .09, 4.58]} color="#d3a971" radius={.4} metal={.8} rough={.2} />
    <Block at={[0, .79, 5.1]} size={[9.95, .09, 4.38]} color="#3c172b" radius={.38} metal={0} rough={.94} coat={0} sheen={.4} />
  </group>;
}

function CasinoSconce({ at }: { at: V3 }) {
  return <group position={at} name="brass-and-opal-sconce">
    <Block at={[0, 0, -.06]} size={[.72, 1.8, .16]} color="#493527" metal={.8} radius={.12} />
    {[-.19, 0, .19].map((x, i) => <Block key={x} at={[x, 0, .06]} size={[.09, 1.15 + (i === 1 ? .24 : 0), .12]} color="#ffe2a7" metal={.05} rough={.3} glow={3} />)}
    <pointLight position={[0, .1, .46]} color="#ffb85c" intensity={15} distance={5} decay={2} />
  </group>;
}

function CasinoArchitecture() {
  const { size } = useThree();
  return <group name="casino-salon">
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -.02, -6]} receiveShadow name="polished-stone-floor">
      <planeGeometry args={[38, 44]} />
      <MeshReflectorMaterial resolution={size.width < 700 ? 256 : 512} mirror={.3} mixStrength={.65} color="#21131d" roughness={.34} metalness={.45} />
    </mesh>
    <Block at={[0, .005, -7]} size={[7.35, .025, 25]} color="#3e071b" metal={0} rough={.98} coat={0} sheen={.3} radius={.005} />
    {[-3.72, 3.72].map(x => <Block key={x} at={[x, .02, -7]} size={[.035, .02, 25]} color="#be8946" metal={.8} rough={.24} />)}
    <Block at={[0, 4, -10]} size={[23, 8, .3]} color="#210817" metal={.05} rough={.96} coat={0} />
    {[-8, -5.4, -2.7, 0, 2.7, 5.4, 8].map(x => <group key={x}>
      <Block at={[x, 3.9, -9.77]} size={[2.35, 6.65, .2]} color="#450f28" metal={0} rough={.95} coat={0} sheen={.5} radius={.18} />
      <Block at={[x - 1.23, 3.9, -9.62]} size={[.035, 6.75, .05]} color="#c99857" metal={.85} />
    </group>)}
    {[-1, 1].map(side => <group key={side}>
      <Block at={[side * 8.3, 3.6, -3]} size={[.3, 7.2, 17]} color="#280b1b" metal={.08} rough={.85} coat={0} />
      {[-6.8, -2.7, 1.4].map(z => <group key={z} position={[side * 6.3, 0, z]}>
        <Block at={[0, 3.55, 0]} size={[.5, 7.1, .48]} color="#302322" metal={.72} rough={.22} radius={.08} />
        <Block at={[-side * .18, 3.5, .26]} size={[.055, 6.6, .06]} color="#ffcb80" metal={.1} glow={1.6} />
        <CasinoSconce at={[-side * .35, 3.6, .25]} />
      </group>)}
      <group position={[side * 5.4, 0, -2.6]} name="velvet-banquette">
        <Block at={[0, .3, 0]} size={[2, .34, 2.5]} color="#6d4c2b" radius={.15} />
        <Block at={[0, .68, 0]} size={[1.95, .5, 2.3]} color="#69122c" metal={0} rough={.9} coat={0} sheen={.7} radius={.2} />
        <Block at={[side * .7, 1.19, 0]} size={[.42, 1.3, 2.3]} color="#581022" metal={0} rough={.95} coat={0} sheen={.7} radius={.16} />
      </group>
      <pointLight position={[side * 5.6, 1.7, -4.2]} color={side < 0 ? "#ff3569" : "#627cff"} intensity={23} distance={7} decay={2} />
    </group>)}
    {/* Receding brass ceiling coffers establish depth around the hero machine. */}
    {[-7, -2.5, 2].map(z => <group key={z}>
      <Block at={[0, 7.05, z]} size={[16.8, .22, .28]} color="#795535" metal={.85} rough={.2} />
      <Block at={[0, 6.9, z + .03]} size={[15.8, .035, .1]} color="#ffd69a" metal={0} glow={2.8} />
    </group>)}
    {[-5.7, 5.7].map(x => <Block key={x} at={[x, 6.92, -3]} size={[.06, .055, 15]} color="#ffcf81" metal={0} glow={2.5} />)}
  </group>;
}

function CameraRig({ motion, state }: { motion: ArcadeMotion; state: ArcadeState }) {
  const { camera, size, invalidate, gl, scene } = useThree();
  const eye = useMemo(() => new THREE.Vector3(), []), target = useMemo(() => new THREE.Vector3(), []);
  const backgroundDay = useMemo(() => new THREE.Color("#160a13"), []);
  const backgroundNight = useMemo(() => new THREE.Color("#09060e"), []);
  const key = useRef<THREE.DirectionalLight>(null), ambient = useRef<THREE.AmbientLight>(null);
  useEffect(() => {
    motion.frames.add(invalidate); invalidate();
    return () => { motion.frames.delete(invalidate); };
  }, [motion, invalidate]);
  useEffect(() => {
    const lost = (e: Event) => e.preventDefault();
    gl.domElement.addEventListener("webglcontextlost", lost);
    return () => gl.domElement.removeEventListener("webglcontextlost", lost);
  }, [gl]);
  useFrame(() => {
    const aspect = size.width / size.height, mobile = aspect < .9;
    const distance = Math.max(11.2, 7.85 / (2 * Math.tan(THREE.MathUtils.degToRad(19)) * aspect * .92));
    const p = motion.travel;
    const start = new THREE.Vector3(mobile ? .2 : 1.35, mobile ? 3.45 : 3.45, distance);
    const end = new THREE.Vector3(0, 6.8, distance + 2.5);
    const curve = new THREE.CubicBezierCurve3(start, new THREE.Vector3(.5, 4, distance - .4), new THREE.Vector3(0, 6.5, distance + 1.7), end);
    curve.getPoint(p, eye);
    target.set(mix(mobile ? .28 : 0, 0, p), mix(2.65, .8, p), mix(0, 3.8, p));
    if (state.inputMode === "entrance") { eye.x += motion.parallaxX; eye.y += motion.parallaxY; }
    const recoil = blastEnvelope(motion.blast).recoil;
    eye.x += recoil * .085; eye.y += recoil * .065; eye.z += recoil * .14;
    camera.position.copy(eye); camera.lookAt(target); camera.updateMatrixWorld();
    if (scene.background instanceof THREE.Color) scene.background.copy(backgroundDay).lerp(backgroundNight, motion.darkness);
    if (scene.fog instanceof THREE.Fog) {
      scene.fog.color.copy(scene.background as THREE.Color);
      scene.fog.near = mix(Math.max(17, distance + 4), 17, p);
      scene.fog.far = scene.fog.near + 25;
    }
    if (key.current) key.current.intensity = mix(1.65, 1.2, motion.darkness) * (.4 + .6 * motion.spotlight) * (1 - motion.blackout);
    if (ambient.current) ambient.current.intensity = mix(.22, .1, motion.darkness);
  }, -1);
  return <>
    <ambientLight ref={ambient} intensity={.22} />
    <directionalLight ref={key} position={[-4, 8, 5]} intensity={2.2} color="#ffe0af" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-camera-far={32} shadow-normalBias={.025} shadow-bias={-.0001} />
    <directionalLight position={[6, 4, -3]} intensity={1.5} color="#8b9eff" />
    <pointLight position={[-4, 3, 2]} color="#ff4972" intensity={12} distance={8} />
  </>;
}

function MachineSpotlights({ motion }: { motion: ArcadeMotion }) {
  const spots = useRef<THREE.Group>(null), beams = useRef<THREE.Group>(null);
  const target = useMemo(() => { const object = new THREE.Object3D(); object.position.set(0, 1.6, .3); return object; }, []);
  const fixtures = useMemo(() => ([-1, 1] as const).map(side => {
    const source = new THREE.Vector3(side * 4.6, 7.2, 4.5);
    const bottom = new THREE.Vector3(side * -.5, .4, .4);
    return { source, midpoint: source.clone().add(bottom).multiplyScalar(.5), length: source.distanceTo(bottom),
      rotation: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), bottom.clone().sub(source).normalize()) };
  }), []);
  useFrame(() => {
    const level = motion.spotlight * (1 - motion.travel) * (1 - motion.blackout);
    spots.current?.children.forEach((light, i) => { (light as THREE.SpotLight).intensity = level * (i === 0 ? 160 : 95) * (1 + motion.spinGlow * .12); });
    beams.current?.children.forEach(beam => { (beam as THREE.Mesh<THREE.CylinderGeometry, THREE.ShaderMaterial>).material.uniforms.strength.value = level * .065; });
  });
  return <group name="machine-stage-spotlights">
    <primitive object={target} />
    <group ref={spots}>{fixtures.map(({source}, i) => <spotLight key={i} position={source} target={target} color={i ? "#c7ddff" : "#ffe2b0"} intensity={0}
      angle={.43} penumbra={.8} distance={18} decay={2} castShadow={i === 0} shadow-mapSize={[1024, 1024]} shadow-normalBias={.035} />)}</group>
    <group ref={beams}>{fixtures.map(({midpoint,length,rotation}, i) => <mesh key={i} position={midpoint} quaternion={rotation}>
      <cylinderGeometry args={[.08, 2.45, length, 40, 1, true]} />
      <shaderMaterial transparent depthWrite={false} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false}
        uniforms={{ strength: { value: 0 }, tint: { value: new THREE.Color(i ? "#b8d6ff" : "#ffe2ad") } }}
        vertexShader={`varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; void main(){vUv=uv;vNormal=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vView=-mv.xyz;gl_Position=projectionMatrix*mv;}`}
        fragmentShader={`varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; uniform float strength; uniform vec3 tint; void main(){float edge=pow(abs(dot(normalize(vNormal),normalize(vView))),2.);float fade=smoothstep(0.,.25,vUv.y)*(1.-smoothstep(.85,1.,vUv.y));gl_FragColor=vec4(tint,edge*fade*strength);}`} />
    </mesh>)}</group>
  </group>;
}

function TableLighting({ motion }: { motion: ArcadeMotion }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => { if (light.current) light.current.intensity = 8 + motion.tableReveal * 18; });
  return <group name="table-light-spill">
    <pointLight ref={light} position={[0, 4.5, 5]} color="#ffe0af" intensity={8} distance={12} decay={2} />
    <spotLight position={[-2, 8, 3]} angle={.43} penumbra={.55} intensity={85} color="#fff0d0" distance={18} castShadow shadow-mapSize={[1024, 1024]} shadow-normalBias={.025} />
  </group>;
}

function Scene(props: SceneProps) {
  const { gl, invalidate } = useThree();
  const { onReady, onFailure } = props;
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = () => onFailure();
    canvas.addEventListener("webglcontextlost", lost);
    onReady(); invalidate();
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, invalidate, onReady, onFailure]);
  return <>
    <color attach="background" args={["#160a13"]} /><fog attach="fog" args={["#160a13", 17, 42]} />
    <Environment resolution={128} environmentIntensity={.65}>
      <Lightformer form="rect" intensity={3} color="#ffe3b7" position={[-4, 7, 3]} rotation={[Math.PI / 3, 0, 0]} scale={[6, 2, 1]} />
      <Lightformer form="rect" intensity={2} color="#ff718f" position={[4, 4, 3]} rotation={[0, -Math.PI / 3, 0]} scale={[.6, 6, 1]} />
      <Lightformer form="rect" intensity={2.5} color="#819eff" position={[-5, 3, -3]} rotation={[0, Math.PI / 2, 0]} scale={[.7, 5, 1]} />
    </Environment>
    <CameraRig motion={props.motion} state={props.state} />
    <MachineSpotlights motion={props.motion} />
    <CasinoArchitecture />
    <TableLighting motion={props.motion} />
    <SlotCabinetShell {...props} />
    <CardTable motion={props.motion} />
    <CoinBurst motion={props.motion} />
    <MachineSmoke motion={props.motion} />
    <BlastImpact motion={props.motion} />
    {props.state.phase === "revealing" && <StageCurtain motion={props.motion} />}
  </>;
}

export default function PortalScene(props: SceneProps) {
  return <Canvas shadows={{ type: THREE.PCFShadowMap }} dpr={[1, 1.5]} frameloop="demand"
    camera={{ position: [1.35, 3.45, 9.45], fov: 38, near: .06, far: 65 }}
    gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}>
    <Scene {...props} />
  </Canvas>;
}
