import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import type { CSSProperties, KeyboardEvent, ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  featureCases,
  portfolioLevels,
  portfolioProjects,
  productionSystems,
  selectedProducts,
} from "./content/portfolio";
import type {
  ArchiveKind,
  FeatureCase,
  PortfolioProject,
} from "./content/portfolio";
import { profile } from "./content/profile";
import { PixelMatter, reassemble } from "./components/PixelMatter";
import { YYCompanion } from "./components/YYCompanion";
import { YYActionStage } from "./components/YYActionStage";
import {
  caseStepAt,
  stepProgress,
  STORY_MEDIA,
  wrapIndex,
} from "./lib/navigation";
import { toggleMotion, useReducedMotion } from "./lib/motion";

gsap.registerPlugin(ScrollTrigger);
const galleryProjects = portfolioProjects.filter((project) => project.media);
const kinds: Record<ArchiveKind, string> = {
  PRODUCT: "产品",
  GAME: "游戏",
  SYSTEM: "系统",
  TOOL: "工具",
};
const states: Record<string, string> = {
  SHIPPED: "已上架",
  PUBLIC: "已开源",
  PROTOTYPE: "原型",
  "LOCAL LAB": "本地实验",
  FLAGSHIP: "macOS 应用",
  "RELEASE TRACK": "开发中",
  "LOCAL COMPLETE": "本地版本",
  "PRODUCT LAB": "产品实验",
  "FIELD PROTOTYPE": "原型",
  "IOS BUILD": "iOS 开发版",
  "AGENT PRODUCT": "Agent 实验",
  "GAME LAB": "玩法实验",
  "LOCAL BUILD": "本地版本",
  "R&D ARCHIVE": "研发存档",
  "TOOL LAB": "工具实验",
  "CREATIVE TOOL": "创作工具",
  "PUBLIC + PRIVATE": "公开与自用",
};
function assetPath(path: string) {
  return /^(?:[a-z]+:|\/\/|#)/i.test(path)
    ? path
    : import.meta.env.BASE_URL + path.replace(/^\/+/, "");
}
function Image({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <img
      src={assetPath(src)}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
    />
  );
}
function Pixels() {
  return (
    <span className="signature-pixels" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <span className="pixel-arrow" aria-hidden="true">
      {diagonal ? "↗" : "→"}
    </span>
  );
}
function useMedia(query: string) {
  const subscribe = useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
function SectionTitle({
  number,
  label,
  title,
  children,
}: {
  number: string;
  label: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="section-heading">
      <div className="section-eyebrow">
        <span>{number}</span>
        {label}
      </div>
      <h2>{title}</h2>
      {children ? <p>{children}</p> : null}
    </header>
  );
}
function Tabs({
  labels,
  active,
  onSelect,
  label,
  id,
}: {
  labels: string[];
  active: number;
  onSelect: (index: number) => void;
  label: string;
  id: string;
}) {
  const keys = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const target =
      event.key === "ArrowRight"
        ? wrapIndex(index, 1, labels.length)
        : event.key === "ArrowLeft"
          ? wrapIndex(index, -1, labels.length)
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? labels.length - 1
              : -1;
    if (target < 0) return;
    event.preventDefault();
    onSelect(target);
    const controls =
      event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
        "button",
      );
    controls?.[target]?.focus({ preventScroll: true });
  };
  return (
    <div className="frame-tabs" role="tablist" aria-label={label}>
      {labels.map((text, i) => (
        <button
          type="button"
          role="tab"
          key={text}
          id={`${id}-tab-${i}`}
          aria-controls={`${id}-panel`}
          aria-selected={i === active}
          tabIndex={i === active ? 0 : -1}
          onClick={() => onSelect(i)}
          onKeyDown={(event) => keys(event, i)}
        >
          <span>{String(i + 1).padStart(2, "0")}</span>
          {text}
        </button>
      ))}
    </div>
  );
}
function CaseChapter({
  feature,
  onOpen,
}: {
  feature: FeatureCase;
  onOpen: (
    project: PortfolioProject,
    opener: HTMLElement,
    frame?: number,
  ) => void;
}) {
  const [step, setStep] = useState(0);
  const chapter = useRef<HTMLElement>(null),
    frame = useRef<HTMLDivElement>(null),
    trigger = useRef<ScrollTrigger | null>(null),
    previous = useRef(0);
  const reduced = useReducedMotion(),
    storyViewport = useMedia(STORY_MEDIA);
  const story = storyViewport && !reduced;
  const project = portfolioProjects.find(
    (item) =>
      item.slug === (feature.id === "dating" ? "dating-diary" : feature.id),
  )!;
  const current = feature.steps[step];
  useLayoutEffect(() => {
    if (!story || !chapter.current) return;
    const element = chapter.current,
      sticky = element.querySelector<HTMLElement>(".case-stage")!;
    trigger.current = ScrollTrigger.create({
      trigger: element,
      start: () => `top ${getComputedStyle(sticky).top}`,
      end: () => `+=${Math.max(1, element.offsetHeight - sticky.offsetHeight)}`,
      invalidateOnRefresh: true,
      onUpdate: (self) =>
        setStep(caseStepAt(self.progress, feature.steps.length)),
      onToggle: (self) => {
        if (self.isActive)
          reassemble(
            element.previousElementSibling?.querySelector(".exhibit-frame") ??
              frame.current,
            frame.current,
            feature.accent,
          );
      },
    });
    return () => {
      trigger.current?.kill();
      trigger.current = null;
    };
  }, [story, feature.steps.length, feature.accent]);
  useLayoutEffect(() => {
    if (previous.current === step) return;
    previous.current = step;
    if (reduced || !frame.current) return;
    const element = frame.current;
    reassemble(element, element, feature.accent);
    const context = gsap.context(() => {
      gsap.fromTo(
        element.querySelector(".yy-action-trigger, img"),
        { y: 14, scale: 0.975, opacity: 0.65 },
        { y: 0, scale: 1, opacity: 1, duration: 0.65, ease: "power3.out" },
      );
      gsap.fromTo(
        element,
        { rotationY: -2 },
        { rotationY: 0, duration: 0.8, ease: "power3.out" },
      );
    });
    return () => context.revert();
  }, [step, feature.accent, reduced]);
  const select = (index: number) => {
    if (trigger.current && story) {
      const { start, end } = trigger.current;
      window.scrollTo({
        top: start + (end - start) * stepProgress(index, feature.steps.length),
        behavior: "instant",
      });
      ScrollTrigger.update();
    }
    setStep(index);
  };
  return (
    <article
      ref={chapter}
      id={`case-${feature.id}`}
      className={`case-chapter accent-${feature.accent}`}
      data-case={feature.id}
      data-step={step}
      style={{ "--step-count": feature.steps.length } as CSSProperties}
    >
      <div className="case-stage">
        <div className="case-copy">
          <div className="case-meta">
            <span className="case-number">{feature.number} / 03</span>
            <span className="status-label">
              <i />
              {feature.status}
            </span>
          </div>
          <div>
            <h3>{feature.title}</h3>
            <p className="case-cn">{feature.cn}</p>
          </div>
          <p className="case-thesis">{feature.thesis}</p>
          <dl className="case-facts">
            <div>
              <dt>我的工作</dt>
              <dd>{feature.contribution}</dd>
            </div>
            <div>
              <dt>设计取舍</dt>
              <dd>{feature.decision}</dd>
            </div>
          </dl>
          <div className="case-moment" key={step}>
            <span>
              {String(step + 1).padStart(2, "0")} /{" "}
              {String(feature.steps.length).padStart(2, "0")}
            </span>
            <h4>{current.title}</h4>
            <p>{current.copy}</p>
          </div>
          <button
            type="button"
            className="text-link"
            onClick={(event) => onOpen(project, event.currentTarget, current.yyAction ? 0 : step)}
          >
            展开界面与细节 <Arrow diagonal />
          </button>
        </div>
        <div
          ref={frame}
          className={`exhibit-frame case-visual ${feature.id === "yy" ? "desktop-exhibit" : "phone-exhibit"}`}
        >
          <div className="frame-bar">
            <span>{feature.cn}</span>
            <Pixels />
            <button
              type="button"
              aria-label={`放大 ${feature.cn} 界面`}
              onClick={(event) => onOpen(project, event.currentTarget, current.yyAction ? 0 : step)}
            >
              ↗
            </button>
          </div>
          <div
            className="case-picture"
            id={`${feature.id}-panel`}
            role="tabpanel"
            aria-labelledby={`${feature.id}-tab-${step}`}
            tabIndex={0}
          >
            {current.yyAction ? <YYActionStage key={current.yyAction} action={current.yyAction} /> : <Image
              src={current.image}
              alt={`${feature.cn} · ${current.title}`}
            />}
            <span className="exhibit-coordinate" aria-hidden="true">
              {feature.number}.{String(step + 1).padStart(2, "0")}
            </span>
          </div>
          <Tabs
            id={feature.id}
            labels={feature.steps.map((item) => item.label)}
            active={step}
            onSelect={select}
            label={`${feature.cn} 的${feature.id === "yy" ? "动作" : "功能界面"}`}
          />
        </div>
        <div className="case-scroll-indicator" aria-hidden="true">
          <span>继续滚动</span>
          <div>
            {feature.steps.map((_, i) => (
              <i className={i <= step ? "is-on" : ""} key={i} />
            ))}
          </div>
          <span>↓</span>
        </div>
      </div>
    </article>
  );
}
function projectFrames(project: PortfolioProject) {
  if (project.gallery) return project.gallery;
  const feature = featureCases.find(
    (item) =>
      item.id === (project.slug === "dating-diary" ? "dating" : project.slug),
  );
  return feature
    ? feature.steps.map((item) => ({
        src: item.image,
        title: item.title,
        copy: item.copy,
      }))
    : (project.gallery ?? [
        { src: project.media!.src, title: project.cn, copy: project.copy },
      ]);
}
function ProjectViewer({
  project,
  frameIndex,
  onFrame,
  onClose,
  onMove,
}: {
  project: PortfolioProject;
  frameIndex: number;
  onFrame: (index: number) => void;
  onClose: () => void;
  onMove: (direction: number) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    visual = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const frames = projectFrames(project),
    current = frames[frameIndex] ?? frames[0];
  const position = galleryProjects.findIndex(
    (item) => item.slug === project.slug,
  );
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      element.close();
      document.body.style.overflow = overflow;
    };
  }, []);
  useLayoutEffect(() => {
    const element = visual.current;
    if (!element || reduced) return;
    reassemble(element, element, project.accent);
    const context = gsap.context(() =>
      gsap.fromTo(
        element.querySelector("img"),
        { scale: 0.975, opacity: 0.75 },
        { scale: 1, opacity: 1, duration: 0.45, ease: "power3.out" },
      ),
    );
    return () => context.revert();
  }, [project.slug, frameIndex, project.accent, reduced]);
  useEffect(() => {
    const element = dialog.current!;
    const keys = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Tab") {
        const controls = Array.from(
          element.querySelectorAll<HTMLElement>(
            'button:not([disabled]):not([tabindex="-1"]), a[href], [tabindex="0"]',
          ),
        ).filter((control) => control.getClientRects().length > 0);
        const first = controls[0],
          last = controls.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
        return;
      }
      if ((event.target as HTMLElement).getAttribute("role") === "tab") return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        onMove(event.key === "ArrowRight" ? 1 : -1);
      }
    };
    const backdrop = (event: globalThis.MouseEvent) => {
      if (event.target !== element) return;
      const r = element.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        onClose();
    };
    element.addEventListener("keydown", keys);
    element.addEventListener("click", backdrop);
    return () => {
      element.removeEventListener("keydown", keys);
      element.removeEventListener("click", backdrop);
    };
  }, [onMove, onClose]);
  return (
    <dialog
      ref={dialog}
      className={`project-dialog accent-${project.accent}`}
      aria-labelledby="project-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="dialog-bar">
        <span>
          作品 {String(position + 1).padStart(2, "0")} /{" "}
          {String(galleryProjects.length).padStart(2, "0")}
        </span>
        <span className="status-label">
          <i />
          {states[project.status] ?? project.status}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="dialog-close"
          aria-label="关闭项目详情"
        >
          ×
        </button>
      </div>
      <div className="dialog-body" key={project.slug}>
        <div ref={visual} className="dialog-visual">
          <div
            className="dialog-image"
            id="detail-panel"
            role={frames.length > 1 ? "tabpanel" : undefined}
            aria-labelledby={
              frames.length > 1 ? `detail-tab-${frameIndex}` : undefined
            }
            tabIndex={0}
          >
            <Image
              src={current.src}
              alt={
                current.title === project.cn
                  ? project.cn
                  : `${project.cn} · ${current.title}`
              }
              priority
            />
          </div>
          {frames.length > 1 ? (
            <Tabs
              id="detail"
              labels={frames.map((item) => item.title)}
              active={frameIndex}
              onSelect={onFrame}
              label="浏览作品界面"
            />
          ) : null}
        </div>
        <div className="dialog-copy">
          <span className="eyebrow">{kinds[project.kind]}</span>
          <h2 id="project-title">{project.title}</h2>
          <p className="dialog-cn">{project.cn}</p>
          {frames.length > 1 ? <h3>{current.title}</h3> : null}
          <p>{current.copy}</p>
          {project.decision ? (
            <div className="detail-decision">
              <span>设计取舍</span>
              <p>{project.decision}</p>
            </div>
          ) : null}
          <p className="detail-platform">{project.tags.join(" · ")}</p>
          <div className="dialog-actions">
            {project.links
              ?.filter((link) => !link.href.startsWith("#"))
              .map((link) => (
                <a
                  key={link.href}
                  className="primary-button"
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label === "OPEN REPO" ? "查看代码" : link.label}
                  <Arrow diagonal />
                </a>
              ))}
            <a
              className="text-link"
              href={assetPath(current.src)}
              target="_blank"
              rel="noreferrer"
            >
              查看完整原图 <Arrow diagonal />
            </a>
          </div>
        </div>
      </div>
      <footer className="dialog-nav">
        <button type="button" onClick={() => onMove(-1)}>
          ← 上一件作品
        </button>
        <span>← / → 切换作品 · Esc 关闭</span>
        <button type="button" onClick={() => onMove(1)}>
          下一件作品 →
        </button>
      </footer>
    </dialog>
  );
}
function SystemShowcase() {
  const [active, setActive] = useState(0);
  const frame = useRef<HTMLDivElement>(null),
    video = useRef<HTMLVideoElement>(null);
  const system = productionSystems[active],
    reduced = useReducedMotion();
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduced && !document.hidden)
          element.play().catch(() => {});
        else element.pause();
      },
      { threshold: 0.35 },
    );
    observer.observe(element);
    const pause = () => {
      if (document.hidden) element.pause();
    };
    document.addEventListener("visibilitychange", pause);
    return () => {
      observer.disconnect();
      element.pause();
      document.removeEventListener("visibilitychange", pause);
    };
  }, [active, reduced]);
  return (
    <div className="systems-content">
      <Tabs
        id="system"
        labels={productionSystems.map((item) => item.name)}
        active={active}
        onSelect={(index) => {
          if (index !== active)
            reassemble(
              frame.current,
              frame.current,
              productionSystems[index].accent,
            );
          setActive(index);
        }}
        label="选择工作系统"
      />
      <div
        className={`system-stage accent-${system.accent}`}
        id="system-panel"
        role="tabpanel"
        aria-labelledby={`system-tab-${active}`}
        tabIndex={0}
      >
        <div className="system-copy">
          <span className="eyebrow">{system.name} / SKILL</span>
          <h3>
            {system.title.split("\n").map((line, i) => (
              <span key={i}>{line}</span>
            ))}
          </h3>
          <p>{system.description}</p>
          <dl>
            <div>
              <dt>输入</dt>
              <dd>
                {active === 0 ? "拍摄素材、表达重点" : "项目材料、要求与反馈"}
              </dd>
            </div>
            <div>
              <dt>产出</dt>
              <dd>
                {active === 0
                  ? "剪辑、字幕、动效与成片"
                  : "报告、演示文稿与项目成果"}
              </dd>
            </div>
          </dl>
          <a
            className="text-link"
            href={system.href}
            target="_blank"
            rel="noreferrer"
          >
            查看 {system.name} <Arrow diagonal />
          </a>
        </div>
        <div ref={frame} className="exhibit-frame system-output">
          <div className="frame-bar">
            <span>
              {active === 0 ? "车内办公 · 成片片段" : "RunPro · 作品介绍"}
            </span>
            <Pixels />
          </div>
          <div className="system-media">
            {system.video ? (
              <video
                ref={video}
                src={assetPath(system.video)}
                poster={assetPath(system.poster!)}
                controls
                muted
                loop
                playsInline
                preload="metadata"
                aria-label="VideoPro 车内办公成片"
              />
            ) : (
              <Image src={system.image} alt="RunPro 作品介绍" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default function ZinxPortfolio() {
  const [activeLevel, setActiveLevel] = useState("selected-work"),
    [activeSlug, setActiveSlug] = useState<string | null>(null),
    [viewerFrame, setViewerFrame] = useState(0);
  const [archiveFilter, setArchiveFilter] = useState<"ALL" | ArchiveKind>(
      "ALL",
    ),
    [allArchive, setAllArchive] = useState(false);
  const root = useRef<HTMLDivElement>(null),
    nav = useRef<HTMLElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const systemReduced = useMedia("(prefers-reduced-motion: reduce)");
  useLayoutEffect(() => {
    document.documentElement.dataset.motion = reduced ? "reduced" : "full";
    const raf = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(raf);
  }, [reduced]);
  const featuredSlugs = new Set(["yy", "dating-diary", "shushucity"]);
  const archive = portfolioProjects.filter(
    (item) => !item.selected && !featuredSlugs.has(item.slug),
  );
  const filtered =
      archiveFilter === "ALL"
        ? archive
        : archive.filter((item) => item.kind === archiveFilter),
    visible = allArchive ? filtered : filtered.slice(0, 5);
  const activeProject = galleryProjects.find(
    (item) => item.slug === activeSlug,
  );
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const current = portfolioLevels
        .map((level) => document.getElementById(level.id)!)
        .filter(
          (element) =>
            element.getBoundingClientRect().top <= innerHeight * 0.36,
        )
        .at(-1);
      setActiveLevel(current?.id ?? "selected-work");
      nav.current?.style.setProperty(
        "--read-progress",
        String(
          Math.min(
            1,
            scrollY /
              Math.max(1, document.documentElement.scrollHeight - innerHeight),
          ),
        ),
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);
  useLayoutEffect(() => {
    if (reduced) return;
    const context = gsap.context(() => {
      gsap.from(".hero-copy > *", {
        y: 16,
        duration: 0.7,
        stagger: 0.06,
        ease: "power3.out",
      });
      gsap.from(".hero-exhibit", {
        y: 22,
        rotation: 1,
        duration: 0.9,
        ease: "power3.out",
      });
      // Entrances own transforms only. Static content remains visible.
      gsap.utils.toArray<HTMLElement>(".section-heading").forEach((element) =>
        gsap.from(element, {
          y: 24,
          duration: 0.6,
          ease: "power3.out",
          scrollTrigger: { trigger: element, start: "top 92%", once: true },
        }),
      );
    }, root);
    return () => context.revert();
  }, [reduced]);
  const showProject = (
    project: PortfolioProject,
    element: HTMLElement,
    index = 0,
  ) => {
    opener.current = element;
    setViewerFrame(index);
    setActiveSlug(project.slug);
  };
  const closeProject = () => {
    setActiveSlug(null);
    requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }));
  };
  const moveProject = (direction: number) => {
    const index = wrapIndex(
      galleryProjects.findIndex((item) => item.slug === activeSlug),
      direction,
      galleryProjects.length,
    );
    setViewerFrame(0);
    setActiveSlug(galleryProjects[index].slug);
  };
  return (
    <div ref={root} className="zinx-site">
      <a className="skip-link" href="#selected-work">
        跳到代表作品
      </a>
      <PixelMatter />
      <nav ref={nav} className="site-nav glass-shell" aria-label="主导航">
        <a href="#top" className="wordmark" aria-label="Zinx 首页">
          <Pixels />
          ZINX<span className="wordmark-note">个人作品集</span>
        </a>
        <div className="chapter-links">
          {portfolioLevels.map((level) => (
            <a
              href={`#${level.id}`}
              key={level.id}
              aria-current={activeLevel === level.id ? "location" : undefined}
            >
              <span>{level.number}</span>
              {level.name}
            </a>
          ))}
        </div>
        <a className="nav-contact" href="#about">
          聊聊合作 <Arrow diagonal />
        </a>
      </nav>
      <main>
        <section id="top" className="hero section-shell">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="square-token" />
              AI-NATIVE PRODUCT BUILDER
            </p>
            <h1 aria-label="Zinx" className="hero-wordmark">
              {[..."ZINX"].map((letter) => (
                <span key={letter}>{letter}</span>
              ))}
            </h1>
            <h2>
              把好奇心，
              <br />
              做成作品。
            </h2>
            <p className="hero-intro">
              我是 Zinx。做产品、设计交互，
              <br />
              也用 AI 把想法一步步做出来。
            </p>
            <div className="hero-actions">
              <a className="primary-button" href="#selected-work">
                看看我的作品 <Arrow />
              </a>
              <a className="text-link" href="#about">
                关于我 <Arrow diagonal />
              </a>
            </div>
            <p className="hero-footnote">
              <span>产品</span>
              <i />
              交互
              <i />
              AI 协同开发
              <i />
              内容
            </p>
          </div>
          <div className="hero-exhibit accent-blue">
            <div className="hero-index">
              <span>01 / 03</span>
              <span>YY · 仓鼠歪歪</span>
              <span>macOS</span>
            </div>
            <div className="exhibit-frame hero-frame">
              <div className="frame-bar">
                <span>歪歪之家</span>
                <Pixels />
                <a href="#case-yy" aria-label="查看 YY 作品">
                  ↗
                </a>
              </div>
              <a
                href="#case-yy"
                className="hero-artwork"
                aria-label="进入 YY 作品"
              >
                <Image
                  src="/evidence/yy-wardrobe-real.jpg"
                  alt="YY 歪歪之家 · 衣柜界面"
                  priority
                />
              </a>
              <div className="hero-artifact-caption">
                <span>
                  桌面上的小伙伴，
                  <br />
                  <strong>也有自己的小世界。</strong>
                </span>
                <a
                  href="#case-yy"
                  className="round-button"
                  aria-label="进入 YY 案例"
                >
                  <Arrow />
                </a>
              </div>
            </div>
            <YYCompanion />
            <span className="hero-registration" aria-hidden="true">
              ZX—001
            </span>
          </div>
          <a href="#selected-work" className="hero-scroll">
            <span>往下看看</span>
            <span>↓</span>
          </a>
        </section>
        <section id="selected-work" className="selected-section section-shell">
          <SectionTitle
            number="01"
            label="SELECTED WORK"
            title="从这三件作品开始。"
          >
            一些关于陪伴、记录与表达的尝试。
          </SectionTitle>
          {featureCases.map((feature) => (
            <CaseChapter
              key={feature.id}
              feature={feature}
              onOpen={showProject}
            />
          ))}
        </section>
        <section id="products" className="products-section section-shell">
          <SectionTitle
            number="02"
            label="PRODUCTS & EXPERIMENTS"
            title="还有一些，已经能用。"
          >
            日常工具、小游戏，以及继续探索的产品。
          </SectionTitle>
          <div className="product-grid">
            {selectedProducts.map((project) => (
              <article
                key={project.slug}
                className={`product-card accent-${project.accent} ${project.large ? "is-wide" : ""}`}
              >
                <button
                  type="button"
                  className={`product-preview ${project.slug === "zinxcord" ? "hud-preview" : ""}`}
                  onClick={(event) => showProject(project, event.currentTarget)}
                  aria-label={`打开 ${project.title} 项目详情`}
                >
                  <span className="preview-status">
                    <i />
                    {states[project.status] ?? project.status}
                  </span>
                  <div className="product-image">
                    <Image src={project.media!.src} alt={project.media!.alt} />
                  </div>
                  <span className="preview-open" aria-hidden="true">
                    ↗
                  </span>
                </button>
                <div className="product-copy">
                  <span className="eyebrow">{kinds[project.kind]}</span>
                  <h3>{project.title}</h3>
                  <p className="product-cn">{project.cn}</p>
                  <p>{project.copy}</p>
                  <button
                    type="button"
                    className="text-link"
                    onClick={(event) =>
                      showProject(project, event.currentTarget)
                    }
                  >
                    查看作品 <Arrow diagonal />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
        <section id="archive" className="archive-section section-shell">
          <SectionTitle
            number="03"
            label="EXPLORATIONS"
            title="好奇心还去过这些地方。"
          />
          <div className="archive-filters" aria-label="筛选项目类型">
            {(["ALL", "PRODUCT", "GAME", "SYSTEM", "TOOL"] as const).map(
              (kind) => (
                <button
                  type="button"
                  key={kind}
                  aria-pressed={archiveFilter === kind}
                  onClick={(event) => {
                    setArchiveFilter(kind);
                    reassemble(
                      event.currentTarget,
                      event.currentTarget,
                      "blue",
                    );
                  }}
                >
                  {kind === "ALL" ? "全部" : kinds[kind]}
                  <span>
                    {kind === "ALL"
                      ? archive.length
                      : archive.filter((item) => item.kind === kind).length}
                  </span>
                </button>
              ),
            )}
          </div>
          <div className="archive-list">
            {visible.map((item) => (
              <article
                key={item.slug}
                className={`archive-item accent-${item.accent}`}
              >
                <span className="archive-dot" aria-hidden="true" />
                <h3>
                  {item.title}
                  <small>{item.cn}</small>
                </h3>
                <p>{item.copy}</p>
                <span className="archive-state">
                  {states[item.status] ?? item.status}
                </span>
                {item.media ? (
                  <button
                    type="button"
                    className="round-button"
                    aria-label={`查看 ${item.title}`}
                    onClick={(event) => showProject(item, event.currentTarget)}
                  >
                    <Arrow diagonal />
                  </button>
                ) : null}
              </article>
            ))}
          </div>
          {filtered.length > 5 ? (
            <button
              className="archive-more text-link"
              type="button"
              aria-expanded={allArchive}
              onClick={() => {
                setAllArchive(!allArchive);
                requestAnimationFrame(() => ScrollTrigger.refresh());
              }}
            >
              {allArchive
                ? "收起项目"
                : `展开其余 ${filtered.length - 5} 件项目`}
              <span>{allArchive ? "−" : "+"}</span>
            </button>
          ) : null}
        </section>
        <section id="systems" className="systems-section section-shell">
          <SectionTitle
            number="04"
            label="HOW I WORK"
            title="把做过的事，变成方法。"
          >
            VideoPro 与 RunPro，是我在持续使用和打磨的两套工作系统。
          </SectionTitle>
          <SystemShowcase />
        </section>
        <section id="about" className="about-section section-shell">
          <SectionTitle
            number="05"
            label="A LITTLE ABOUT ME"
            title="你好，我是 Zinx。"
          />
          <div className="about-layout">
            <div className="about-statement">
              <p>
                从一个模糊的念头，
                <br />
                到一个具体的东西。
              </p>
              <span>这是我喜欢做的事。</span>
              <Pixels />
            </div>
            <div className="about-copy">
              <p>
                我的起点是生命科学与医工，后来把工作延伸到产品、交互、开发与视频。很多知识是在项目里补齐的，AI
                是我用来学习和制作的重要工具。
              </p>
              <p>
                我关心一个想法是否值得做，也关心做出来的东西是否好用、好看，能否交付到别人手里。
              </p>
              <div className="collaboration-scope">
                <span>可以一起做</span>
                <strong>AI 产品原型 · 交互与视觉 · 产品演示与内容</strong>
              </div>
              <div className="about-actions">
                {profile.contact ? (
                  <a className="primary-button" href={profile.contact}>
                    {profile.contactLabel}
                    <Arrow diagonal />
                  </a>
                ) : null}
                {profile.resume ? (
                  <a
                    className="text-link"
                    href={assetPath(profile.resume)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    查看简历 <Arrow diagonal />
                  </a>
                ) : null}
                <a
                  className={profile.contact ? "text-link" : "primary-button"}
                  href={profile.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  在 GitHub 找到我 <Arrow diagonal />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="site-footer section-shell">
        <a className="wordmark" href="#top">
          <Pixels />
          ZINX
        </a>
        <span>© 2026 · 继续做点有意思的东西。</span>
        <button
          type="button"
          aria-pressed={reduced}
          disabled={systemReduced}
          onClick={toggleMotion}
        >
          {systemReduced
            ? "系统已减少动效"
            : reduced
              ? "动效已减少"
              : "减少动态效果"}
        </button>
        <a href="#top">回到顶部 ↑</a>
      </footer>
      {activeProject ? (
        <ProjectViewer
          project={activeProject}
          frameIndex={viewerFrame}
          onFrame={setViewerFrame}
          onClose={closeProject}
          onMove={moveProject}
        />
      ) : null}
    </div>
  );
}
