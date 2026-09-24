import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { gsap } from "gsap";
import {
  caseProcesses,
  featureCases,
  portfolioProjects,
  productionSystems,
} from "./content/portfolio";
import type { ArchiveKind, PortfolioProject } from "./content/portfolio";
import { wrapIndex } from "./lib/navigation";
import { useReducedMotion } from "./lib/motion";
import { type ScreenRect } from "./lib/arcade-state";
import "./components/project-detail.css";

const galleryProjects = portfolioProjects.filter((project) => project.media);
export const kinds: Record<ArchiveKind, string> = {
  PRODUCT: "产品",
  GAME: "游戏",
  SYSTEM: "系统",
  TOOL: "工具",
};
export const states: Record<string, string> = {
  SHIPPED: "已上架",
  PUBLIC: "已开源",
  "PUBLIC PREVIEW": "公开预览版",
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
export function assetPath(path: string) {
  return /^(?:[a-z]+:|\/\/|#)/i.test(path)
    ? path
    : import.meta.env.BASE_URL + path.replace(/^\/+/, "");
}
export function Image({
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
export function Pixels() {
  return (
    <span className="signature-pixels" aria-hidden="true">
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
export function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <span className="pixel-arrow" aria-hidden="true">
      {diagonal ? "↗" : "→"}
    </span>
  );
}
export function SectionTitle({
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
export function Tabs({
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
export function ProjectViewer({
  project,
  frameIndex,
  onFrame,
  onClose,
  onMove,
  origin,
  closing = false,
}: {
  project: PortfolioProject;
  frameIndex: number;
  onFrame: (index: number) => void;
  onClose: () => void;
  onMove?: (direction: number) => void;
  origin?: ScreenRect;
  closing?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null),
    visual = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const frames = projectFrames(project),
    current = frames[frameIndex] ?? frames[0];
  const collection = galleryProjects;
  const position = collection.findIndex(
    (item) => item.slug === project.slug,
  );
  const feature = featureCases.find(
    (item) =>
      (item.id === "dating" ? "dating-diary" : item.id) === project.slug,
  );
  const process = feature ? caseProcesses[feature.id] : null;
  const decision = feature?.decision ?? project.decision;
  useEffect(() => {
    const element = dialog.current!;
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const r = element.getBoundingClientRect();
    const animation = origin && origin.width > 10 && !reduced ? gsap.fromTo(element, {
      x: origin.x + origin.width / 2 - r.left - r.width / 2,
      y: origin.y + origin.height / 2 - r.top - r.height / 2,
      scaleX: origin.width / r.width, scaleY: origin.height / r.height, opacity: .6,
    }, { x: 0, y: 0, scaleX: 1, scaleY: 1, opacity: 1, duration: .42, ease: "power3.out" }) : null;
    return () => {
      animation?.kill();
      element.close();
      document.body.style.overflow = overflow;
    };
  }, [origin, reduced]);
  useEffect(() => {
    const element = dialog.current;
    if (!closing || !element || !origin || reduced) return;
    const r = element.getBoundingClientRect();
    const animation = gsap.to(element, {
      x: origin.x + origin.width / 2 - r.left - r.width / 2,
      y: origin.y + origin.height / 2 - r.top - r.height / 2,
      scaleX: origin.width / r.width, scaleY: origin.height / r.height, opacity: .15,
      duration: .34, ease: "power3.in",
    });
    return () => { animation.kill(); };
  }, [closing, origin, reduced]);
  useLayoutEffect(() => {
    const element = visual.current;
    if (!element || reduced) return;
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
      if (onMove && (event.key === "ArrowLeft" || event.key === "ArrowRight")) {
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
          {String(collection.length).padStart(2, "0")}
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
          {feature && <p className="dialog-summary">{feature.description}</p>}
          {frames.length > 1 ? <h3>{current.title}</h3> : null}
          <p>{current.copy}</p>
          {feature && process && (
            <dl className="detail-facts">
              <div>
                <dt>想解决的问题</dt>
                <dd>{process.problem}</dd>
              </div>
              <div>
                <dt>我的工作</dt>
                <dd>{feature.contribution}</dd>
              </div>
              <div>
                <dt>当前状态</dt>
                <dd>{feature.status}</dd>
              </div>
            </dl>
          )}
          {decision ? (
            <div className="detail-decision">
              <span>设计取舍</span>
              <p>{decision}</p>
            </div>
          ) : null}
          <p className="detail-platform">{project.tags.join(" · ")}</p>
          {process && (
            <div className="detail-process">
              {process.stages.map((stage, i) => (
                <div key={stage}>
                  <b>{["SIGNAL", "SYSTEM", "BUILD", "PROOF"][i]}</b>
                  <p>{stage}</p>
                </div>
              ))}
            </div>
          )}
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
        {onMove ? <><button type="button" onClick={() => onMove(-1)}>
          ← 上一件作品
        </button>
        <span>← / → 切换作品 · Esc 关闭</span>
        <button type="button" onClick={() => onMove(1)}>
          下一件作品 →
        </button></> : <><span>Esc 返回 · 继续看看其他作品</span><button type="button" onClick={onClose}>返回街机 ↙</button></>}
      </footer>
    </dialog>
  );
}
export function SystemShowcase() {
  const [active, setActive] = useState(0);
  const video = useRef<HTMLVideoElement>(null);
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
        onSelect={setActive}
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
        <div className="exhibit-frame system-output">
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
