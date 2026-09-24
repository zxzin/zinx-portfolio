import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { Exhibit, ExhibitMedia } from "../lib/exhibition-model";
import { isLocalDemo } from "../lib/exhibition-model";
import type { ScreenRect } from "../lib/arcade-state";
import { useReducedMotion } from "../lib/motion";
import { assetPath, states } from "../ZinxPortfolio";
import { YYActionStage } from "./YYActionStage";
import { PanelBar } from "./PanelBar";

function ExhibitPlayer({ media }: { media: ExhibitMedia }) {
  const [playing, setPlaying] = useState(false);
  const reduced = useReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const stop = () => { if (document.hidden) { video.current?.pause(); setPlaying(false); } };
    document.addEventListener("visibilitychange", stop);
    return () => document.removeEventListener("visibilitychange", stop);
  }, []);
  if (media.kind === "yy") return <YYActionStage action={media.action} />;
  if (media.kind === "video") return playing
    ? <video ref={video} controls muted autoPlay playsInline preload="metadata" poster={assetPath(media.poster)} src={assetPath(media.src)} aria-label={media.title} />
    : <div className="exhibit-play-cover"><img src={assetPath(media.poster)} alt={media.title} /><button type="button" onClick={() => setPlaying(true)}>播放短片 ▷</button></div>;
  if (media.kind === "demo") return playing && isLocalDemo(media.src)
    ? <iframe title={media.title} src={assetPath(media.src)} sandbox="allow-scripts" />
    : <div className="exhibit-play-cover"><img src={assetPath(media.poster)} alt={media.title} /><button type="button" disabled={!isLocalDemo(media.src)} onClick={() => setPlaying(true)}>打开交互演示 ↗</button></div>;
  if (media.kind === "animation") return <div className="exhibit-play-cover"><img src={assetPath(playing && !reduced ? media.src : media.poster)} alt={media.alt} /><button type="button" disabled={reduced} onClick={() => setPlaying(value => !value)}>{reduced ? "静态预览" : playing ? "暂停动画" : "播放动画"}</button></div>;
  return <img src={assetPath(media.src)} alt={media.alt} />;
}

export function ExhibitDialog({ work, origin, onClose, pulse, navigation, returnFocus }: {
  work: Exhibit; origin?: ScreenRect; onClose: () => void; pulse: (frequency: number, duration?: number) => void;
  returnFocus: () => void;
  navigation?: { index: number; total: number; onNavigate: (direction: -1 | 1) => void };
}) {
  const dialog = useRef<HTMLDialogElement>(null), tween = useRef<gsap.core.Tween | null>(null);
  const closing = useRef(false);
  const [index, setIndex] = useState(0);
  const reduced = useReducedMotion();
  const current = work.media[index];
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    const r = element.getBoundingClientRect();
    if (!reduced) tween.current = gsap.fromTo(element, origin ? {
      x: origin.x + origin.width / 2 - r.x - r.width / 2,
      y: origin.y + origin.height / 2 - r.y - r.height / 2,
      scale: Math.max(.15, Math.min(.9, origin.width / r.width)), opacity: .3,
    } : { y: 24, scale: .97, opacity: 0 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: .48, ease: "power3.out" });
    return () => { tween.current?.kill(); element.close(); returnFocus(); };
  }, [origin, reduced, returnFocus]);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true; pulse(260);
    const element = dialog.current;
    if (!element || reduced) { onClose(); return; }
    tween.current?.kill();
    const r = element.getBoundingClientRect();
    tween.current = gsap.to(element, {
      x: origin ? origin.x + origin.width / 2 - r.x - r.width / 2 : 0,
      y: origin ? origin.y + origin.height / 2 - r.y - r.height / 2 : 18,
      scale: origin ? Math.max(.15, Math.min(.9, origin.width / r.width)) : .97,
      opacity: 0, duration: .3, ease: "power2.inOut", onComplete: onClose,
    });
  }, [onClose, origin, pulse, reduced]);
  return <dialog ref={dialog} className={"exhibit-dialog accent-" + work.accent} aria-labelledby="exhibit-title"
    onCancel={event => { event.preventDefault(); close(); }}>
    <header className="exhibit-dialog-head">
      <span><i />{work.title} / {states[work.status] ?? work.status}</span>
      <button type="button" className="exhibit-close" onClick={close} aria-label="关闭作品，返回展台">回到展台 <span>×</span></button>
    </header>
    <div className="exhibit-dialog-body" data-has-media={work.media.length > 0}>
      <div className="exhibit-media-column">
        {current && <PanelBar code={String(index + 1).padStart(2, "0")} end={`${index + 1} / ${work.media.length}`}>{current.title}</PanelBar>}
        {current && <div className="exhibit-player" key={current.id} data-media-kind={current.kind}><ExhibitPlayer media={current} /></div>}
        {work.media.length > 1 && <div className="exhibit-media-tabs" aria-label="作品画面">
          {work.media.map((media, i) => <button key={media.id} type="button" aria-pressed={i === index} onClick={() => { setIndex(i); dialog.current?.scrollTo({ top: 0, behavior: reduced ? "instant" : "smooth" }); pulse(440); }}>
            <small>{String(i + 1).padStart(2, "0")}</small>{media.title}
          </button>)}
        </div>}
        {current?.caption && <p className="exhibit-caption">{current.caption}</p>}
      </div>
      <aside className="exhibit-facts">
        <p className="exhibit-eyebrow">{work.subtitle}</p>
        <h2 id="exhibit-title">{work.title}</h2>
        <p>{work.summary}</p>
        {(work.contribution || work.decision) && <dl>
          {work.contribution && <><dt>我参与的部分</dt><dd>{work.contribution}</dd></>}
          {work.decision && <><dt>设计取舍</dt><dd>{work.decision}</dd></>}
        </dl>}
        <div className="exhibit-tags">{work.tags.map(tag => <span key={tag}>{tag}</span>)}</div>
        <div className="exhibit-links">{work.links.filter(link => /^(https?:\/\/|mailto:|\/)/.test(link.href)).map(link =>
          <a key={link.href} href={link.href.startsWith("/") ? assetPath(link.href) : link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined}>{link.label} ↗</a>)}</div>
        {navigation && <nav className="exhibit-pager" aria-label="按顺序浏览作品"><span>第 {navigation.index + 1} 件 / 共 {navigation.total} 件</span><div><button type="button" disabled={navigation.index === 0} onClick={() => navigation.onNavigate(-1)}>← 上一件</button><button type="button" disabled={navigation.index === navigation.total - 1} onClick={() => navigation.onNavigate(1)}>下一件 →</button></div></nav>}
      </aside>
    </div>
  </dialog>;
}
