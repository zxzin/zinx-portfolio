import { useEffect, useId, useRef, useState } from "react";
import type { PointerEvent } from "react";
import { coinInitials, type PlacedExhibit } from "../lib/exhibition-model";
import { assetPath, states } from "../ZinxPortfolio";
import { useReducedMotion } from "../lib/motion";

function CoinRim({ inscribed = false }: { inscribed?: boolean } = {}) {
  return <svg className="coin-rim" viewBox="0 0 280 280" aria-hidden="true" focusable="false">
    <circle cx="140" cy="140" r="134" /><circle cx="140" cy="140" r="124" />
    <circle className="coin-milling" cx="140" cy="140" r="129" />
    <circle className="coin-inner-ring" cx="140" cy="140" r="114" />
    {(inscribed ? [1, 3] : [0, 1, 2, 3]).map(i => <path key={i} transform={`rotate(${i * 90} 140 140)`} d="M140 20l4 5-4 5-4-5z" />)}
  </svg>;
}

function CoinInscription({ title, number, suit }: { title: string; number: number; suit: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  return <svg className="coin-inscription" viewBox="0 0 280 280" aria-hidden="true" focusable="false">
    <defs>
      <path id={id + "-title"} d="M40 140a100 100 0 0 1 200 0" />
      <path id={id + "-action"} d="M30 140a110 110 0 0 0 220 0" />
    </defs>
    <text className="coin-front-title" textAnchor="middle" textLength={title.length > 16 ? 184 : undefined} lengthAdjust="spacingAndGlyphs"><textPath href={"#" + id + "-title"} startOffset="50%">{title}</textPath></text>
    <text className="coin-front-action" textAnchor="middle"><textPath href={"#" + id + "-action"} startOffset="50%">{String(number).padStart(2, "0")} · {suit === "♥" ? "产品" : suit === "♣" ? "工具" : "影像"}</textPath></text>
  </svg>;
}

function CoinEmblem({ work }: { work: PlacedExhibit }) {
  const id = "emblem-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!work.emblem) return;
    const image = new Image();
    image.onerror = () => setFailed(true);
    image.src = assetPath(work.emblem.src);
    return () => { image.onerror = null; };
  }, [work.emblem]);
  const emblem = failed ? undefined : work.emblem;
  return <svg className="coin-product-emblem" viewBox="0 0 280 280" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={id + "-gold"} x1="0" y1="0" x2=".8" y2="1"><stop stopColor="#fff3bf" /><stop offset=".35" stopColor="#eac066" /><stop offset=".65" stopColor="#986024" /><stop offset="1" stopColor="#f6d68e" /></linearGradient>
      <filter id={id + "-relief"} x="-20%" y="-20%" width="140%" height="145%" colorInterpolationFilters="sRGB">
        <feMorphology in="SourceAlpha" operator="dilate" radius="3" result="rim" />
        <feOffset in="rim" dy="4" result="depth" /><feFlood floodColor="#82531e" /><feComposite in2="depth" operator="in" result="edge" />
        <feGaussianBlur in="depth" stdDeviation="3" /><feOffset dy="3" /><feComponentTransfer><feFuncA type="linear" slope=".35" /></feComponentTransfer><feComposite in2="SourceAlpha" operator="out" result="shadow" />
        <feFlood floodColor="#f9dfa0" /><feComposite in2="rim" operator="in" result="lip" />
        <feMerge><feMergeNode in="shadow" /><feMergeNode in="edge" /><feMergeNode in="lip" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <clipPath id={id + "-clip"}><rect x="75" y="75" width="130" height="130" rx="25" /></clipPath>
      <linearGradient id={id + "-glaze"} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fff8dc" stopOpacity=".4" /><stop offset=".48" stopColor="#fff8dc" stopOpacity="0" /><stop offset="1" stopColor="#51300d" stopOpacity=".2" /></linearGradient>
    </defs>
    {emblem ? <g filter={`url(#${id}-relief)`}>
      <image href={assetPath(emblem.src)} x={emblem.treatment === "tile" ? 75 : 42} y={emblem.treatment === "tile" ? 75 : 42} width={emblem.treatment === "tile" ? 130 : 196} height={emblem.treatment === "tile" ? 130 : 196} preserveAspectRatio="xMidYMid meet" clipPath={emblem.treatment === "tile" ? `url(#${id}-clip)` : undefined} />
      {emblem.treatment === "tile" && <rect x="75" y="75" width="130" height="130" rx="25" fill={`url(#${id}-glaze)`} stroke="#fff0bf" strokeWidth="1" />}
    </g> : <text x="140" y="164" textAnchor="middle" className="coin-monogram" fill={`url(#${id}-gold)`} stroke="#9a672c" strokeWidth=".7" filter={`url(#${id}-relief)`}>{coinInitials(work.title)}</text>}
  </svg>;
}

/** Product identity on the coin; source-native media stays in the detail viewer. */
export function ProjectCard({ work, number, suit, viewed, revealed, onReveal, onOpen }: {
  work: PlacedExhibit; number: number; suit: string; viewed: boolean; revealed: boolean;
  onReveal: (id: string) => void;
  onOpen: (id: string, target: HTMLButtonElement) => void;
}) {
  const reduced = useReducedMotion();
  const [active, setActive] = useState(false);
  const card = useRef<HTMLButtonElement>(null), footprint = useRef<HTMLElement>(null);
  const faceUp = revealed || active;
  useEffect(() => {
    const hide = () => { if (document.hidden) setActive(false); };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, []);
  const reset = () => {
    setActive(false); card.current?.style.removeProperty("--tilt-x"); card.current?.style.removeProperty("--tilt-y");
    card.current?.style.setProperty("--shine-x", "50%"); card.current?.style.setProperty("--shine-y", "20%");
  };
  const tilt = (event: PointerEvent<HTMLButtonElement>) => {
    if (reduced || event.pointerType !== "mouse") return;
    const r = footprint.current?.getBoundingClientRect();
    if (!r) return;
    const x = Math.max(-1, Math.min(1, (event.clientX - r.x) / r.width * 2 - 1));
    const y = Math.max(-1, Math.min(1, (event.clientY - r.y) / r.height * 2 - 1));
    event.currentTarget.style.setProperty("--tilt-x", `${-y * 8}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${x * 10}deg`);
    event.currentTarget.style.setProperty("--shine-x", `${(x + 1) * 50}%`);
    event.currentTarget.style.setProperty("--shine-y", `${(y + 1) * 50}%`);
  };
  return <article ref={footprint} className={"wall-exhibit accent-" + work.accent} data-exhibit={work.id} data-viewed={viewed}>
    <button ref={card} type="button" className="exhibit-open project-card" data-face-up={faceUp} aria-label={(faceUp ? "查看 " : "翻开 ") + work.title}
      onPointerMove={event => { if (event.pointerType === "mouse") setActive(true); tilt(event); }} onPointerLeave={reset} onPointerCancel={reset}
      onFocus={event => { if (event.currentTarget.matches(":focus-visible")) setActive(true); }} onBlur={reset}
      onClick={event => { if (!faceUp) { onReveal(work.id); return; } onReveal(work.id); reset(); onOpen(work.id, event.currentTarget); }}>
      <span className="coin-turner">
        <span className="card-face" aria-hidden={!faceUp}>
          <CoinRim inscribed /><CoinInscription title={work.title} number={number} suit={suit} />
          <span className="coin-metal-field" aria-hidden="true" />
          <CoinEmblem key={work.emblem?.src ?? work.id} work={work} />
        </span>
        <span className="coin-back" aria-hidden={faceUp}>
          <CoinRim /><span className="coin-mint">ZINX · COLLECTION</span>
          <svg className="coin-emblem" viewBox="0 0 64 64" aria-hidden="true"><path d="M11 11h42v6H11z M41 17h12v6H41z M35 23h12v6H35z M29 29h12v6H29z M23 35h12v6H23z M17 41h12v6H17z M11 47h42v6H11z" fill="currentColor" /><path d="M2 29h5v5H2zM57 29h5v5h-5z" fill="currentColor" /></svg>
          <span className="coin-serial">{suit} · {String(number).padStart(2, "0")}</span>
        </span>
      </span>
    </button>
    <div className="coin-caption"><strong>{work.title}</strong><span>{states[work.status] ?? work.status}</span><p>{work.preview?.caption ?? work.subtitle}</p><small className="coin-visit">{viewed ? "✓ 已看过" : "查看作品 ↗"}</small></div>
  </article>;
}
