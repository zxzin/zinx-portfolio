import { lazy, Suspense, useState } from "react";
import { assetPath } from "../ZinxPortfolio";
import { MediaBoundary } from "./MediaBoundary";
import "./sculpture-viewer.css";

const SculptureViewer = lazy(() => import("./SculptureViewer"));
export function ModelPreview({ src, poster, title, active = false }: { src: string; poster: string; title: string; active?: boolean }) {
  const [opened, setOpened] = useState(active);
  const image = <img src={assetPath(poster)} alt={title} />;
  return opened ? <MediaBoundary fallback={<div className="exhibit-model-cover">{image}<p className="sculpture-hint" role="status">3D 暂时无法载入，仍可查看作品图。</p></div>}>
    <Suspense fallback={<div className="exhibit-model-cover">{image}<p className="sculpture-hint" role="status">正在取出雕塑…</p></div>}><SculptureViewer src={src} /></Suspense>
  </MediaBoundary> : <div className="exhibit-model-cover">{image}<button onClick={() => setOpened(true)}>拿起来转一转 ↗</button></div>;
}
