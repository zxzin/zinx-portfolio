import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group } from "three";
import type { ArcadeMotion } from "../lib/arcade-state";
import { createFloralArrangement } from "../lib/floral-arrangement";

export default function CasinoFlorals({ motion }: { motion: ArcadeMotion }) {
  const batches = useMemo(() => createFloralArrangement(), []);
  const tableFlowers = useRef<Group>(null);
  useFrame(() => {
    if (!tableFlowers.current) return;
    tableFlowers.current.visible = motion.tableReveal > .02;
    tableFlowers.current.position.y = -2.4 * (1 - motion.tableReveal);
  });
  useEffect(() => () => batches.forEach(({geometry, material}) => { geometry.dispose(); material.dispose(); }), [batches]);
  const bouquet = (at: [number, number, number], scale: number, turn: number, name: string) => <group position={at} scale={scale} rotation={[0, turn, 0]} name={name}>
      {batches.map(({color, geometry, material}) => <mesh key={color} geometry={geometry} material={material} receiveShadow dispose={null} />)}
      <mesh position={[0, .28, -.08]} castShadow receiveShadow><cylinderGeometry args={[.2, .32, .54, 24]} /><meshStandardMaterial color="#ad7a46" metalness={.72} roughness={.3} /></mesh>
      <mesh position={[0, .53, -.08]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[.205, .035, 6, 24]} /><meshStandardMaterial color="#f6d5a0" metalness={.8} roughness={.23} /></mesh>
    </group>;
  return <group name="romantic-floral-salon">
    {bouquet([-3.65, 0, 1.8], 1.08, -.12, "left-floor-flowers")}
    {bouquet([3.65, 0, 1.3], .95, .2, "right-floor-flowers")}
    <group ref={tableFlowers} visible={false}>
      {bouquet([-4.35, .84, 5.2], .62, .2, "left-table-flowers")}
      {bouquet([4.35, .84, 5.2], .62, -.2, "right-table-flowers")}
    </group>
  </group>;
}
