import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { DavidSculpture } from "./DavidSculpture";
import { DAVID_MODEL, type SculptureFinish } from "../lib/david-model";
import "./sculpture-viewer.css";

export default function SculptureViewer({ src = DAVID_MODEL }: { src?: string }) {
  const [pose, setPose] = useState({ yaw: .2, pitch: 0 });
  const [finish, setFinish] = useState<SculptureFinish>("mixed");
  const drag = useRef<{ x: number; y: number; yaw: number; pitch: number } | null>(null);
  const rotate = (amount: number) => setPose(current => ({ ...current, yaw: current.yaw + amount }));
  return <div className="sculpture-viewer">
    <div className="sculpture-stage" role="button" tabIndex={0} aria-roledescription="可旋转的三维模型" aria-label="大卫雕塑，拖动或用方向键旋转，回车转动，Home 键复位"
      onPointerDown={event => { if (event.button !== 0) return; event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY, ...pose }; }}
      onPointerMove={event => { const start = drag.current; if (start) setPose({ yaw: start.yaw + (event.clientX - start.x) * .012, pitch: Math.max(-.4, Math.min(.4, start.pitch + (event.clientY - start.y) * .007)) }); }}
      onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}
      onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); rotate(.4); return; }
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(event.key)) return; event.preventDefault();
        if (event.key === "Home") setPose({ yaw: .2, pitch: 0 });
        else if (event.key === "ArrowLeft" || event.key === "ArrowRight") rotate(event.key === "ArrowLeft" ? -.2 : .2);
        else setPose(current => ({ ...current, pitch: Math.max(-.4, Math.min(.4, current.pitch + (event.key === "ArrowUp" ? -.1 : .1))) }));
      }}>
      <Canvas shadows frameloop="demand" dpr={[1, 1.5]} camera={{ position: [0, 1.25, 4.5], fov: 35 }} gl={{ antialias: true, alpha: true }} onCreated={({ camera }) => camera.lookAt(0, .25, 0)}>
        <ambientLight intensity={.5} />
        <directionalLight position={[-3, 5, 4]} intensity={3} color="#fff0d7" castShadow shadow-normalBias={.025} />
        <directionalLight position={[3, 2, -1]} intensity={3} color="#779eff" />
        <pointLight position={[-2, 1.8, 1]} intensity={12} color="#ff6297" />
        <Environment resolution={64}><Lightformer position={[-3, 3, 4]} scale={[3, 5, 1]} intensity={3} color="#fff0db" />
          <Lightformer position={[3, 3, 2]} rotation={[0, -Math.PI / 3, 0]} scale={[1, 5, 1]} intensity={4} color="#86b8ff" /></Environment>
        <group position={[0, -1.05, 0]} rotation={[pose.pitch, pose.yaw, 0]}>
          <Suspense fallback={null}><DavidSculpture src={src} finish={finish} /></Suspense>
          <mesh position={[0, -.1, 0]} receiveShadow><cylinderGeometry args={[.95, 1, .18, 64]} /><meshStandardMaterial color="#b78b4d" metalness={.75} roughness={.3} /></mesh>
        </group>
      </Canvas>
    </div>
    <p className="sculpture-hint">拖动，换个角度看看。</p>
    <div className="sculpture-controls" aria-label="雕塑材质">
      {([['mixed','石膏 × 金属'],['plaster','石膏'],['chrome','金属']] as const).map(([value,label]) => <button key={value} aria-pressed={finish === value} onClick={() => setFinish(value)}>{label}</button>)}
    </div>
    <div className="sculpture-controls sculpture-turn"><button onClick={() => rotate(-.4)} aria-label="向左转动雕塑">↶</button><button onClick={() => setPose({ yaw: .2, pitch: 0 })}>复位</button><button onClick={() => rotate(.4)} aria-label="向右转动雕塑">↷</button></div>
  </div>;
}
