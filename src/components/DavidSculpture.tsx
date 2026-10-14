import { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import { assetPath } from "../ZinxPortfolio";
import { DAVID_MODEL, prepareDavid, sculptureMaterial, type SculptureFinish } from "../lib/david-model";

export function DavidSculpture({ src = DAVID_MODEL, finish = "mixed" }: { src?: string; finish?: SculptureFinish }) {
  const { scene } = useGLTF(assetPath(src));
  const model = useMemo(() => prepareDavid(scene), [scene]);
  const material = useMemo(() => sculptureMaterial(finish), [finish]);
  useEffect(() => () => model.dispose(), [model]);
  useEffect(() => () => material.dispose(), [material]);
  return <group name="david-original-scan">
    {model.parts.map((geometry, index) => <mesh key={index} castShadow receiveShadow>
      <primitive attach="geometry" object={geometry} /><primitive attach="material" object={material} />
    </mesh>)}
    <mesh castShadow name="david-yellow-eye-band"><primitive attach="geometry" object={model.tape} />
      <meshPhysicalMaterial color="#e8dc27" roughness={.48} metalness={.08} side={2} />
    </mesh>
  </group>;
}
