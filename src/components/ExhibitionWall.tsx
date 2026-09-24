import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { exhibition, visibleExhibits } from "../content/exhibition";
import { routeFromHash, type ScreenRect } from "../lib/arcade-state";
import { useReducedMotion } from "../lib/motion";
import { ExhibitDialog } from "./ExhibitDialog";
import { PanelBar } from "./PanelBar";
import { ProjectCard } from "./ProjectCard";
import { profile } from "../content/profile";
import "./exhibition.css";

export default function ExhibitionWall({ pulse, onSection, onReplay }: { pulse: (frequency: number, duration?: number) => void; onSection: (id: string) => void; onReplay: () => void }) {
  const root = useRef<HTMLElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const trigger = useRef<HTMLButtonElement | null>(null);
  const dealTimeline = useRef<gsap.core.Timeline | null>(null);
  const dealtCards = useRef<HTMLElement[]>([]);
  const [dealing, setDealing] = useState(false);
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set());
  const reveal = (id: string) => setRevealed(previous => new Set([...previous, id]));
  const allRevealed = visibleExhibits.every(item => revealed.has(item.id));
  const reduced = useReducedMotion();
  const [activeGroup, setActiveGroup] = useState(exhibition[0]?.id ?? "");
  const [selection, setSelection] = useState<{ id: string; origin?: ScreenRect } | null>(() => {
    const id = routeFromHash(location.hash).open;
    return id ? { id } : null;
  });
  const [visited, setVisited] = useState<Set<string>>(() => new Set(selection ? [selection.id] : []));
  const remember = useCallback((id: string) => setVisited(previous => new Set([...previous, id])), []);
  const viewedCount = visibleExhibits.filter(item => visited.has(item.id)).length;
  const work = visibleExhibits.find(item => item.id === selection?.id);
  const unavailable = selection && !work;
  const clearDeal = useCallback(() => {
    dealTimeline.current?.kill(); dealTimeline.current = null;
    gsap.set(dealtCards.current, { clearProps: "transform,opacity" });
    dealtCards.current = [];
  }, []);
  useEffect(() => () => clearDeal(), [clearDeal]);
  useEffect(() => { if (reduced) clearDeal(); }, [reduced, clearDeal]);
  const redeal = () => {
    if (dealing && !reduced) return;
    clearDeal();
    setRevealed(new Set());
    const section = root.current?.querySelector<HTMLElement>(`[data-group="${activeGroup}"]`);
    if (!section) return;
    section.scrollIntoView({ block: "start", behavior: "instant" });
    const cards = [...section.querySelectorAll<HTMLElement>(".wall-exhibit")];
    if (!cards.length) return;
    pulse(340, .08);
    if (reduced) { cards[0].querySelector<HTMLButtonElement>(".project-card")?.focus({ preventScroll: true }); return; }
    setDealing(true); dealtCards.current = cards;
    const bounds = section.getBoundingClientRect();
    const offsets = cards.map(card => {
      const r = card.getBoundingClientRect();
      return { x: bounds.left + bounds.width / 2 - r.left - r.width / 2, y: bounds.top + 140 - r.top - r.height / 2 };
    });
    dealTimeline.current = gsap.timeline({ onInterrupt: () => setDealing(false), onComplete: () => { clearDeal(); setDealing(false); } })
      .to(cards, { x: (i: number) => offsets[i].x, y: (i: number) => offsets[i].y,
        scale: .3, rotation: (i: number) => (i - (cards.length - 1) / 2) * 5,
        duration: .3, stagger: { each: .035, from: "end" }, ease: "power2.inOut" })
      .to(cards, { x: 0, y: 0, rotation: 0, scale: 1, duration: .55, stagger: .09, ease: "power3.out" });
  };
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const keyboard = (event: KeyboardEvent) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key) || event.altKey || event.metaKey || event.ctrlKey) return;
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>('.project-card');
      if (!target) return;
      const cards = [...element.querySelectorAll<HTMLButtonElement>('.project-card')];
      const current = cards.indexOf(target);
      const index = event.key === 'Home' ? 0 : event.key === 'End' ? cards.length - 1 : Math.max(0, Math.min(cards.length - 1, current + (event.key === 'ArrowRight' ? 1 : -1)));
      event.preventDefault(); cards[index]?.focus({ preventScroll: true }); cards[index]?.scrollIntoView({ block: 'nearest' });
      if (index !== current) pulse(380, .045);
    };
    element.addEventListener('keydown', keyboard);
    return () => element.removeEventListener('keydown', keyboard);
  }, [pulse]);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    if (!routeFromHash(location.hash).open) heading.current?.focus({ preventScroll: true });
    const context = gsap.context(() => {
      if (!reduced) {
        gsap.from(".exhibition-intro", { y: 10, opacity: 0, duration: .4, ease: "power3.out", clearProps: "transform,opacity" });
        const cards = element.querySelectorAll<HTMLElement>(".exhibition-section:first-of-type .wall-exhibit");
        gsap.from(cards, {
          x: (_i, target: HTMLElement) => innerWidth * .5 - target.getBoundingClientRect().left - target.offsetWidth / 2,
          y: (_i, target: HTMLElement) => innerHeight * .28 - target.getBoundingClientRect().top,
          rotation: (i: number) => (i - 1) * 7, scale: .32, opacity: 0,
          duration: .85, stagger: .11, delay: .08, ease: "power3.out", clearProps: "transform,opacity",
        });
      }
    }, element);
    const observer = new IntersectionObserver(entries => {
      const candidate = entries.filter(entry => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (candidate) { const id = (candidate.target as HTMLElement).dataset.group!; setActiveGroup(id); onSection(id); }
    }, { root: element, rootMargin: "-15% 0px -65% 0px", threshold: 0 });
    element.querySelectorAll("[data-group]").forEach(section => observer.observe(section));
    const sectionAliases: Record<string, string> = { products: "software", systems: "practice", archive: "selected", "selected-work": "selected", about: "about" };
    const initialGroup = sectionAliases[routeFromHash(location.hash).section ?? ""];
    if (initialGroup && !routeFromHash(location.hash).open) element.querySelector("#exhibition-" + initialGroup)?.scrollIntoView({ block: "start" });
    return () => { context.revert(); observer.disconnect(); };
  }, [reduced, onSection]);
  useEffect(() => {
    const restoreRoute = () => {
      const id = routeFromHash(location.hash).open;
      setSelection(id ? { id } : null);
      if (id) remember(id);
      if (location.hash === "#about") root.current?.querySelector("#exhibition-about")?.scrollIntoView({ block: "start" });
    };
    window.addEventListener("hashchange", restoreRoute);
    window.addEventListener("popstate", restoreRoute);
    return () => { window.removeEventListener("hashchange", restoreRoute); window.removeEventListener("popstate", restoreRoute); };
  }, [remember]);
  const open = (id: string, target: HTMLButtonElement) => {
    clearDeal(); setDealing(false);
    const rect = target.getBoundingClientRect();
    trigger.current = target;
    setSelection({ id, origin: { x: rect.x, y: rect.y, width: rect.width, height: rect.height } });
    remember(id);
    history.pushState({ exhibit: id }, "", "#case-" + id);
    pulse(560, .12);
  };
  const close = useCallback(() => {
    setSelection(null);
    history.replaceState(null, "", "#hub");
  }, []);
  const returnFocus = useCallback(() => {
    trigger.current?.scrollIntoView({ block: "nearest" });
    trigger.current?.focus({ preventScroll: true });
  }, []);
  const navigate = (direction: -1 | 1) => {
    const index = visibleExhibits.findIndex(item => item.id === selection?.id);
    const next = visibleExhibits[index + direction];
    if (!next) return;
    trigger.current = root.current?.querySelector<HTMLButtonElement>(`[data-exhibit="${next.id}"] .exhibit-open`) ?? null;
    setSelection({ id: next.id }); remember(next.id);
    history.replaceState({ exhibit: next.id }, "", "#case-" + next.id);
    pulse(520);
  };
  return <>
    <nav className="exhibition-navigation" aria-label="展览章节">
      {exhibition.map(section => <button key={section.id} type="button" aria-current={activeGroup === section.id ? "location" : undefined}
        onClick={() => { root.current?.querySelector("#exhibition-" + section.id)?.scrollIntoView({ behavior: reduced ? "instant" : "smooth", block: "start" }); pulse(320); }}>
        <small aria-hidden="true">{section.suit ?? "♠"}</small>{section.title}<span>{section.works.length}</span>
      </button>)}
      <span className="exhibition-progress" aria-live="polite">已看 <b>{viewedCount} / {visibleExhibits.length}</b><span aria-hidden="true">{visibleExhibits.map(item => <i key={item.id} data-lit={visited.has(item.id)} />)}</span></span>
    </nav>
    <main ref={root} className="exhibition-scroll" aria-label="作品金币展台" data-case-open={Boolean(work)}>
      <div className="exhibition-inner">
        {unavailable && <p className="exhibition-notice" role="status">这件作品暂未展出，可以先看看下面的作品。</p>}
        <header className="exhibition-intro">
          <h1 ref={heading} tabIndex={-1}>作品</h1>
          <span className="table-key-hint">悬停翻面 <kbd>Enter</kbd> 打开</span>
          <button className="redeal-button" type="button" disabled={dealing && !reduced} onClick={redeal}><span aria-hidden="true">◉</span>{dealing && !reduced ? "归位中" : "重新散币"}</button>
        </header>
        {exhibition.map(section => <section className="exhibition-section" id={"exhibition-" + section.id} key={section.id} data-group={section.id}>
          <header className="exhibition-section-head"><span aria-hidden="true">{section.suit ?? "♠"}</span><h2>{section.title}</h2><small>{section.works.length} 枚</small></header>
          {section.layout === "index" ? <div className="exhibition-index">{section.works.map((item, index) => <button key={item.id} type="button" onClick={event => open(item.id, event.currentTarget)} aria-label={"查看 " + item.title}><small>{String(index + 1).padStart(2, "0")}</small><b>{item.title}</b><span>{item.subtitle}</span><i>↗</i></button>)}</div>
            : <div className={"exhibition-grid layout-" + section.layout}>{section.works.map(item => <ProjectCard key={item.id} work={item} suit={section.suit ?? "♠"} number={visibleExhibits.indexOf(item) + 1} viewed={visited.has(item.id)} revealed={revealed.has(item.id)} onReveal={reveal} onOpen={open} />)}</div>}
        </section>)}
        <section id="exhibition-about" className="exhibition-about" aria-labelledby="about-title">
          <PanelBar code="ZINX">关于我</PanelBar>
          <div><h2 id="about-title">Zinx</h2><p>产品设计、AI 开发、视频创作。</p><a href={profile.github} target="_blank" rel="noreferrer">GitHub ↗</a></div>
        </section>
        <footer className="exhibition-end"><a href="#top" onClick={event => { event.preventDefault(); onReplay(); }}>重玩开场 ↺</a></footer>
      </div>
    </main>
    {!work && <div className="coin-flip-dock"><span>悬停翻面 · 点击查看</span><button type="button" aria-pressed={allRevealed} onClick={() => { setRevealed(allRevealed ? new Set() : new Set(visibleExhibits.map(item => item.id))); pulse(720, .09); }}>{allRevealed ? "全部收回" : "一键翻开"}<span aria-hidden="true"> ↻</span></button></div>}
    {work && <ExhibitDialog key={work.id} work={work} origin={selection?.origin} onClose={close} returnFocus={returnFocus} pulse={pulse} navigation={{ index: visibleExhibits.indexOf(work), total: visibleExhibits.length, onNavigate: navigate }} />}
  </>;
}
