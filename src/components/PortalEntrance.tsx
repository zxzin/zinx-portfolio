import { Component, lazy, Suspense, useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useArcade } from "../lib/useArcade";
import { useExhibitionAudio } from "../lib/useExhibitionAudio";
import { useReducedMotion } from "../lib/motion";
import { Pixels } from "../ZinxPortfolio";
import { YYCompanion, type YYOutfit } from "./YYCompanion";
import ExhibitionWall from "./ExhibitionWall";
import "../design/tokens.css";
import "./arcade.css";

const PortalScene = lazy(() => import("./PortalScene"));
class SceneBoundary extends Component<{ children: ReactNode; onError: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.failed ? null : this.props.children; }
}
const outfits: YYOutfit[] = ["daily", "scarf", "hat"];
const outfitNames = { daily: "出门走走", scarf: "红围巾", hat: "小黄帽" };

export default function PortalEntrance() {
  const reduced = useReducedMotion();
  const { enabled, status, bgmStatus, toggle, pulse, spin, open, silence } = useExhibitionAudio();
  const [ready, setReady] = useState(false);
  const { state, motion, stage, pull, fail, direct, restart, dragLever, releaseLever } = useArcade(reduced, spin, open, silence, ready);
  const [group, setGroup] = useState("selected");
  const [chosenOutfit, setChosenOutfit] = useState<YYOutfit | null>(null);
  const outfit: YYOutfit = chosenOutfit ?? (group === "practice" ? "hat" : group === "software" ? "scarf" : "daily");
  const onSection = useCallback((id: string) => setGroup(id), []);
  const onReady = useCallback(() => setReady(true), []);
  const exhibition = state.inputMode === "exhibition";
  const busy = state.phase !== "ready" && state.phase !== "idle";
  const home = import.meta.env.BASE_URL;
  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    document.body.classList.add("arcade-body");
    return () => document.body.classList.remove("arcade-body");
  }, [reduced]);
  useEffect(() => {
    if (ready || state.fallback || exhibition) return;
    const timeout = window.setTimeout(fail, 12000);
    return () => clearTimeout(timeout);
  }, [ready, state.fallback, exhibition, fail]);
  const replay = () => { if (state.fallback) setReady(false); restart(); };
  return <div className="arcade-experience" ref={stage} data-input-mode={state.inputMode} data-phase={state.phase} data-shakes={state.shakes} data-render={state.fallback ? "static" : "webgl"} data-ready={ready} data-audio={status} data-bgm={bgmStatus}>
    <a className="skip-link" href="#hub" onClick={event => { event.preventDefault(); direct(); }}>直接浏览作品</a>
    <div className="arcade-world" aria-hidden={exhibition || undefined}>
      {!state.fallback && <SceneBoundary onError={fail}>
        <Suspense fallback={null}><PortalScene state={state} motion={motion} onReady={onReady} onFailure={fail} onPull={pull} onDragLever={dragLever} onReleaseLever={releaseLever} /></Suspense>
      </SceneBoundary>}
    </div>
    {!exhibition && <div className="arcade-shade" aria-hidden="true" />}
    <div className="arcade-blackout" aria-hidden="true" />
    {state.phase === "revealing" && !reduced && !state.fallback && <div className="stage-curtains" aria-hidden="true" />}
    <header className="arcade-header">
      <a className="arcade-identity" href={home + "#top"} aria-label="Zinx 首页与老虎机开场" onClick={event => { event.preventDefault(); if (!busy) replay(); }}>
        <Pixels /><b>ZINX</b>
      </a>
      <nav className="scene-control-rail" aria-label="展示设置">
        {exhibition && <a className="opening-link" href={home + "#top"} onClick={event => { event.preventDefault(); replay(); }}><span aria-hidden="true">▥</span>老虎机开场</a>}
        <button className="rail-switch" type="button" onClick={toggle} aria-pressed={enabled} aria-label={enabled ? "关闭声音" : "开启声音"}><svg className="rail-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM17 8q5 4 0 8" /></svg><span>声音 <small>{enabled ? "开" : "关"}</small></span><i className="rail-indicator" aria-hidden="true" /></button>
        <a className="rail-about" href="#about"><span className="rail-seal" aria-hidden="true">Z</span>关于我<span className="rail-arrow" aria-hidden="true">↗</span></a>
      </nav>
    </header>
    {!ready && !state.fallback && !exhibition && <div className="arcade-loading" role="status"><Pixels /><span>正在准备开场</span><button type="button" onClick={fail}>直接浏览</button></div>}
    {!exhibition && <p className="sr-only" role="status">{state.phase === "revealing" ? "红幕揭开，准备开场" : state.phase === "opening" ? "金币出场" : state.phase === "spinning" ? `第 ${state.shakes + 1} 轮转动中` : `已完成 ${state.shakes} 轮，共 3 轮。下拉红色拉杆，或按空格键继续。`}</p>}
    {exhibition && <ExhibitionWall pulse={pulse} onSection={onSection} onReplay={replay} />}
    <aside className="exhibition-companion" aria-label="歪歪的陪伴" data-location={exhibition ? "wall" : "entrance"} data-crossing={state.inputMode === "travelling"}>
      <div className="companion-perch" aria-hidden="true" />
      <YYCompanion outfit={outfit} onInteract={() => pulse(660, .12)} />
      <button className="companion-outfit" type="button" data-outfit={outfit} aria-label={"给 YY 换衣服，当前" + outfitNames[outfit]} onClick={() => { setChosenOutfit(outfits[(outfits.indexOf(outfit) + 1) % outfits.length]); pulse(480); }}>换一套 <span aria-hidden="true">↻</span></button>
    </aside>
    <footer className="arcade-footer">
      <span><i />{exhibition ? "ZINX / COIN COLLECTION" : "CREATIVE ARCADE"}</span>
      {exhibition && <button key="replay-opening" type="button" onClick={replay}>重玩开场 ↺</button>}
    </footer>
  </div>;
}
