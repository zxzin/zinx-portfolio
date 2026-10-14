import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { DoubleSide, type Group } from "three";
import type { ArcadeMotion } from "../lib/arcade-state";
import { createFloralArrangement, createPetalGeometry, floralPalette } from "../lib/floral-arrangement";
import { PETAL_COUNT, petalFlight } from "../lib/arcade-physics";

function LoosePetals({ motion }: { motion: ArcadeMotion }) {
  const group = useRef<Group>(null);
  const geometry = useMemo(() => createPetalGeometry(.075, .16, .028, .4), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    if (!group.current) return;
    group.current.visible = motion.petals > .001;
    group.current.children.forEach((petal, i) => {
      const pose = petalFlight(motion.petals, i);
      petal.position.set(pose.x, pose.y, pose.z);
      petal.rotation.set(pose.rx, pose.ry, pose.rz);
    });
  });
  return <group ref={group} visible={false} name="petals-from-machine-to-table">{Array.from({ length: PETAL_COUNT }, (_, i) => <mesh key={i} receiveShadow>
    <primitive object={geometry} attach="geometry" />
    <meshPhysicalMaterial color={i % 5 === 0 ? floralPalette.cosmos : i % 2 ? floralPalette.ivory : floralPalette.roseEdge} side={DoubleSide} roughness={.8} sheen={.5} />
  </mesh>)}</group>;
}

export default function CasinoFlorals({ motion }: { motion: ArcadeMotion }) {
  const batches = useMemo(() => createFloralArrangement(), []);
  const garland = useMemo(() => createFloralArrangement("garland"), []);
  const tableFlowers = useRef<Group>(null);
  const machineFlowers = useRef<Group>(null);
  const flowerHeads = useRef<(Group | null)[]>([]);
  useFrame(() => {
    if (!tableFlowers.current) return;
    tableFlowers.current.visible = motion.tableReveal > .02;
    tableFlowers.current.position.y = -2.4 * (1 - motion.tableReveal);
    if (machineFlowers.current) {
      machineFlowers.current.visible = motion.travel < .5;
      machineFlowers.current.position.x = -motion.blast * .4;
      machineFlowers.current.rotation.z = motion.blast * .12;
    }
    flowerHeads.current.forEach((head, i) => { if (head) head.rotation.z = Math.sin(motion.petals * Math.PI * 3) * (1 - motion.petals) ** 2 * .12 * (i % 2 ? -1 : 1); });
  });
  useEffect(() => () => [...batches, ...garland].forEach(({geometry, material}) => { geometry.dispose(); material.dispose(); }), [batches, garland]);
  const bouquet = (at: [number, number, number], scale: number, turn: number, name: string, index: number) => <group position={at} scale={scale} rotation={[0, turn, 0]} name={name}>
      <group position={[0, .54, 0]} ref={node => { flowerHeads.current[index] = node; }}><group position={[0, -.54, 0]}>
        {batches.map(({color, geometry, material}) => <mesh key={color} geometry={geometry} material={material} receiveShadow dispose={null} />)}
      </group></group>
      <mesh position={[0, .28, -.08]} castShadow receiveShadow><cylinderGeometry args={[.2, .32, .54, 24]} /><meshStandardMaterial color="#ad7a46" metalness={.72} roughness={.3} /></mesh>
      <mesh position={[0, .53, -.08]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.205, .035, 6, 24]} /><meshStandardMaterial color="#f6d5a0" metalness={.8} roughness={.23} /></mesh>
    </group>;
  return <group name="romantic-floral-salon">
    <group ref={machineFlowers} name="cabinet-floral-garland" position={[0, 0, 1.6]}>
      {garland.map(({color, geometry, material}) => <mesh key={color} geometry={geometry} material={material} receiveShadow dispose={null} />)}
      {[2.3, 3.8, 4.88].map(y => <mesh key={y} position={[-3.46, y, -.1]} rotation={[0, Math.PI / 2, .2]}><torusGeometry args={[.065, .015, 6, 12]} /><meshStandardMaterial color="#be995f" metalness={.72} roughness={.35} /></mesh>)}
    </group>
    {bouquet([-3.65, 0, 1.8], 1.08, -.12, "left-floor-flowers", 0)}
    {bouquet([3.65, 0, 1.3], .95, .2, "right-floor-flowers", 1)}
    <group ref={tableFlowers} visible={false}>
      {bouquet([-4.35, .84, 5.2], .62, .2, "left-table-flowers", 2)}
      {bouquet([4.35, .84, 5.2], .62, -.2, "right-table-flowers", 3)}
    </group>
    <LoosePetals motion={motion} />
  </group>;
}
