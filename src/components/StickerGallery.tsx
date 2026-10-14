import { useEffect, useRef, useState } from "react";
import type { ExhibitMedia } from "../lib/exhibition-model";
import { assetPath } from "../ZinxPortfolio";
import { useReducedMotion } from "../lib/motion";
import "./sticker-gallery.css";

/** Only the star on the podium loads its original GIF; the cast keeps static posters. */
export function StickerGallery({ media }: { media: ExhibitMedia[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const items = media.filter(item => item.kind === "animation");
  const item = items[index];
  const playing = Boolean(item && active === item.id && !reduced);
  useEffect(() => {
    const stop = () => { if (document.hidden) setActive(null); };
    document.addEventListener("visibilitychange", stop);
    const observer = new IntersectionObserver(entries => { if (!entries[0]?.isIntersecting) setActive(null); });
    if (root.current) observer.observe(root.current);
    return () => { document.removeEventListener("visibilitychange", stop); observer.disconnect(); };
  }, []);
  if (!item) return null;
  const select = (i: number) => { setIndex(i); setActive(reduced ? null : items[i].id); };
  return <div className="sticker-gallery" ref={root}>
    <div className="sticker-spotlight">
      <span className="sticker-act" aria-hidden="true">{String(index + 1).padStart(2, "0")} / {items.length}</span>
      <div className="sticker-podium" aria-hidden="true" />
      <button className="sticker-star" aria-label={(playing ? "暂停" : reduced ? "静态预览" : "播放") + item.title}
        aria-pressed={playing} disabled={reduced} onClick={() => setActive(playing ? null : item.id)}>
        <img src={assetPath(playing ? item.src : item.poster)} alt={item.alt} width="240" height="240" />
        <span aria-hidden="true">{playing ? "Ⅱ" : "▷"}</span>
      </button>
      <div className="sticker-star-caption"><strong>{item.title}</strong></div>
    </div>
    <div className="sticker-cast" role="group" aria-label="选择表情">
      {items.map((candidate, i) => <button key={candidate.id} data-sticker-index={i} className="sticker-tile" aria-pressed={i === index}
        aria-label={"选择表情：" + candidate.title} onClick={() => select(i)} onKeyDown={event => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? items.length - 1 : (i + (event.key === "ArrowRight" ? 1 : -1) + items.length) % items.length;
      select(next);
      const button = root.current?.querySelector<HTMLButtonElement>('[data-sticker-index="' + next + '"]');
      button?.focus({ preventScroll: true }); button?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
    }}>
        <img src={assetPath(candidate.poster)} alt="" width="80" height="80" loading="lazy" />
        <span>{candidate.title}</span>
      </button>)}
    </div>
    {reduced && <p className="sticker-gallery-note">静态预览</p>}
  </div>;
}
