import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import type { Exhibit, ExhibitMedia } from "../lib/exhibition-model";
import { isLocalDemo, mediaPoster } from "../lib/exhibition-model";
import type { ScreenRect } from "../lib/arcade-state";
import { useReducedMotion } from "../lib/motion";
import { assetPath, states } from "../ZinxPortfolio";
import { YYActionStage } from "./YYActionStage";
import { ModelPreview } from "./ModelPreview";
import { GamePreview } from "./GamePreview";
import { StickerGallery } from "./StickerGallery";
import { CoinExperience } from "./CoinPlay";
import { ExhibitCoin } from "./ProjectCard";
import { exhibition } from "../content/exhibition";
import "./exhibit-stage.css";

function ExhibitPlayer({ media }: { media: ExhibitMedia }) {
  const [playing, setPlaying] = useState(false), [failed, setFailed] = useState(false);
  const reduced = useReducedMotion();
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const stop = () => { if (document.hidden) { video.current?.pause(); setPlaying(false); } };
    document.addEventListener("visibilitychange", stop);
    return () => document.removeEventListener("visibilitychange", stop);
  }, []);
  useEffect(() => { if (reduced) video.current?.pause(); }, [reduced]);
  if (media.kind === "yy") return <YYActionStage action={media.action} />;
  if (media.kind === "game") return <GamePreview media={media} />;
  if (media.kind === "model") return <ModelPreview src={media.src} poster={media.poster} title={media.title} active />;
  if (media.kind === "video") return <div className="stage-film" data-playing={playing}>
    <video ref={video} controls muted playsInline preload="none" poster={assetPath(media.poster)} src={assetPath(media.src)} aria-label={media.title}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)} onError={() => { setFailed(true); setPlaying(false); }} />
    {!playing && <button type="button" className="stage-play" disabled={failed} onClick={() => {
      void video.current?.play().catch(() => setFailed(true));
    }}>{failed ? "影片暂时无法播放" : "▷ 开始放映"}</button>}
  </div>;
  if (media.kind === "demo") return playing && isLocalDemo(media.src)
    ? <iframe title={media.title} src={assetPath(media.src)} sandbox="allow-scripts" />
    : <div className="exhibit-play-cover"><img src={assetPath(media.poster)} alt={media.title} /><button type="button" disabled={!isLocalDemo(media.src)} onClick={() => setPlaying(true)}>打开演示 ↗</button></div>;
  if (media.kind === "animation") return <div className="exhibit-play-cover"><img src={assetPath(playing && !reduced ? media.src : media.poster)} alt={media.alt} /><button type="button" disabled={reduced} onClick={() => setPlaying(value => !value)}>{reduced ? "静态预览" : playing ? "暂停动画" : "播放动画"}</button></div>;
  return <img src={assetPath(media.src)} alt={media.alt} />;
}

export function ExhibitDialog({ work, origin, onClose, pulse, navigation, returnFocus, initialExperience = false,
  picked, ticketCount, onPick, onTicket }: {
  work: Exhibit; origin?: ScreenRect; onClose: () => void; pulse: (frequency: number, duration?: number) => void;
  returnFocus: () => void; initialExperience?: boolean;
  picked: boolean; ticketCount: number; onPick: () => void; onTicket: () => void;
  navigation?: { index: number; total: number; onNavigate: (direction: -1 | 1) => void };
}) {
  const dialog = useRef<HTMLDialogElement>(null), coin = useRef<HTMLDivElement>(null);
  const timeline = useRef<gsap.core.Timeline | null>(null), closing = useRef(false);
  const hasDemo = ["yy", "capture", "tasks", "diary"].includes(work.preview?.play ?? "");
  const [demo, setDemo] = useState(initialExperience && hasDemo);
  const [index, setIndex] = useState(0), [notice, setNotice] = useState("");
  const reduced = useReducedMotion();
  const current = work.media[index];
  const kind = work.preview?.play === "stickers" ? "stickers" : demo ? "play" : current?.kind ?? "image";
  useEffect(() => {
    const element = dialog.current, token = coin.current;
    if (!element || !token) return;
    closing.current = false;
    element.showModal();
    const bounds = token.getBoundingClientRect();
    const context = gsap.context(() => {
      if (reduced) return;
      timeline.current = gsap.timeline();
      if (origin) timeline.current.fromTo(token, {
        x: origin.x + origin.width / 2 - bounds.x - bounds.width / 2,
        y: origin.y + origin.height / 2 - bounds.y - bounds.height / 2,
        scale: origin.width / bounds.width, rotationY: -30, rotationZ: -9,
      }, { x: 0, y: 0, scale: 1, rotationY: 0, rotationZ: 0, duration: .64, ease: "power3.inOut", clearProps: "transform" }, 0);
      else timeline.current.from(token, { y: 24, opacity: 0, duration: .4, clearProps: "transform,opacity" }, 0);
      timeline.current.from(".stage-lights", { opacity: 0, duration: .65, clearProps: "opacity" }, .08)
        .from(".stage-performance", { y: 45, scale: .94, opacity: 0, duration: .6, ease: "power3.out", clearProps: "transform,opacity" }, .16)
        .from(".stage-title, .stage-control-bar", { y: 10, opacity: 0, duration: .35, stagger: .06, clearProps: "transform,opacity" }, .25);
    }, element);
    return () => { timeline.current?.kill(); context.revert(); element.close(); };
  }, [origin, reduced]);
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true; pulse(260);
    const element = dialog.current, token = coin.current;
    const done = () => { onClose(); requestAnimationFrame(returnFocus); };
    if (!element || !token || reduced) { done(); return; }
    timeline.current?.kill();
    const bounds = token.getBoundingClientRect();
    timeline.current = gsap.timeline({ onComplete: done })
      .to(element.querySelectorAll(".stage-performance, .stage-title, .stage-control-bar, .stage-lights"), { opacity: 0, y: 14, duration: .22 }, 0)
      .to(token, origin ? {
        x: origin.x + origin.width / 2 - bounds.x - bounds.width / 2,
        y: origin.y + origin.height / 2 - bounds.y - bounds.height / 2,
        scale: origin.width / bounds.width, rotationZ: 5, duration: .4, ease: "power3.inOut",
      } : { opacity: 0, y: 24, duration: .3 }, .05);
  }, [onClose, origin, pulse, reduced, returnFocus]);
  useEffect(() => () => { timeline.current?.kill(); }, []);
  return <dialog ref={dialog} className={"exhibit-dialog exhibit-stage accent-" + work.accent} data-stage-kind={kind} aria-labelledby="exhibit-title"
    onCancel={event => { event.preventDefault(); close(); }}>
    <div className="stage-lights" aria-hidden="true"><i /><i /><span /></div>
    <header className="stage-header">
      <button type="button" className="stage-back" onClick={close} aria-label="关闭作品，返回展台">← 回到展台</button>
      <div className="stage-heading">
        <div ref={coin} className="stage-token"><ExhibitCoin work={work} number={(navigation?.index ?? 0) + 1} suit={exhibition.find(section => section.works.some(item => item.id === work.id))?.suit ?? "♦"} /></div>
        <div className="stage-title"><small>{states[work.status] ?? work.status}</small><h2 id="exhibit-title">{work.title}</h2></div>
      </div>
      <button className="stage-ticket-link" onClick={onTicket} aria-label={"打开纪念票，已选 " + ticketCount + " 件"}>参观票 <span>{ticketCount}/3</span></button>
    </header>
    <div className="stage-scroll">
      <div className="stage-performance">
        {kind === "stickers" ? <StickerGallery media={work.media} /> : <>
          {current?.contentNote && !demo && <p className="stage-content-note">{current.contentNote}</p>}
          <div className="stage-proscenium" data-kind={kind}>
            <div className="stage-floor" aria-hidden="true" />
            {demo ? <CoinExperience work={work} pulse={pulse} /> : current && <div className="exhibit-player" key={current.id} data-media-kind={current.kind}><ExhibitPlayer media={current} /></div>}
          </div>
          {!demo && current && work.media.length > 1 && <p className="stage-media-name">{current.title}</p>}
          {(work.media.length > 1 || hasDemo) && <div className="stage-media-rail" aria-label="作品画面">
            {hasDemo && <button className="stage-demo-tab" aria-pressed={demo} onClick={() => { setDemo(true); pulse(440); }}><span aria-hidden="true">✦</span>玩一下</button>}
            {work.media.map((media, i) => <button key={media.id} aria-pressed={!demo && index === i} aria-label={"展示 " + media.title}
              onClick={() => { setDemo(false); setIndex(i); pulse(440); }}>
              <img src={assetPath(mediaPoster(media))} alt="" loading="lazy" /><span>{String(i + 1).padStart(2, "0")}</span>
            </button>)}
          </div>}
        </>}
      </div>
      <div className="stage-control-bar">
        <div className="stage-actions">
          {navigation && <button aria-label="上一件作品" disabled={navigation.index === 0} onClick={() => navigation.onNavigate(-1)}>← 上一件</button>}
          <button className="stage-keep" aria-pressed={picked} onClick={() => {
            if (!picked && ticketCount >= 3) { setNotice("已选 3 件，可在参观票中调整。"); return; }
            onPick(); setNotice(picked ? "已取消收藏" : "已收藏"); pulse(760, .08);
          }}>{picked ? "♥ 已收藏" : "♡ 收藏作品"}</button>
          {navigation && <button aria-label="下一件作品" disabled={navigation.index === navigation.total - 1} onClick={() => navigation.onNavigate(1)}>下一件 →</button>}
        </div>
        <p className="stage-notice" role="status">{notice}</p>
        <details className="stage-exhibit-note">
          <summary>展签 <span aria-hidden="true">＋</span></summary>
          <div><p>{work.summary}</p>
            {(work.contribution || work.decision) && <dl>
              {work.contribution && <><dt>创作</dt><dd>{work.contribution}</dd></>}
              {work.decision && <><dt>细节</dt><dd>{work.decision}</dd></>}
            </dl>}
            {current?.caption && <p>{current.caption}</p>}
            <div className="stage-external-links">{work.links.filter(link => /^(https?:\/\/|mailto:|\/)/.test(link.href) || /^#case-[a-z0-9-]+$/.test(link.href)).map(link =>
              <a key={link.href} href={link.href.startsWith("/") ? assetPath(link.href) : link.href} target={link.external ? "_blank" : undefined} rel={link.external ? "noreferrer" : undefined}>{link.label} ↗</a>)}</div>
          </div>
        </details>
      </div>
    </div>
  </dialog>;
}
