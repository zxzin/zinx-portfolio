import { useEffect, useState } from "react";
import { assetPath } from "../ZinxPortfolio";
import { isLocalDemo, type ExhibitMedia } from "../lib/exhibition-model";
import "./game-preview.css";

/** A game runs only inside its open exhibit. Unmounting releases its canvas and audio. */
export function GamePreview({ media }: { media: Extract<ExhibitMedia, { kind: "game" }> }) {
  const [playing, setPlaying] = useState(false);
  const [left, setLeft] = useState(false);
  useEffect(() => {
    const stop = () => {
      if (document.hidden) { setPlaying(false); setLeft(true); }
    };
    document.addEventListener("visibilitychange", stop);
    return () => document.removeEventListener("visibilitychange", stop);
  }, []);
  return <div className="game-preview">
    <div className="game-surface">
      {playing && isLocalDemo(media.src)
        ? <iframe title={media.title} src={assetPath(media.src)} sandbox="allow-scripts" allow="autoplay 'none'; camera 'none'; microphone 'none'; geolocation 'none'" />
        : <div className="game-cover"><img src={assetPath(media.poster)} alt={media.title + "封面"} /><button type="button" disabled={!isLocalDemo(media.src)} onClick={() => { setLeft(false); setPlaying(true); }}>{left ? "重新开一局 ▷" : "开始试玩 ▷"}</button></div>}
    </div>
    <p>{media.instructions}</p>
    <small>独立试玩 · 关闭或切走页面会结束本局</small>
  </div>;
}
