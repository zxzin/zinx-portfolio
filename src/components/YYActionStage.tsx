import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../lib/motion";
import type { YYActionId } from "../content/portfolio";
import actions from "../vendor/yy/actions.json";
import "./YYActionStage.css";

export function YYActionStage({ action }: { action: YYActionId }) {
  const root = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(() => document.visibilityState === "visible");
  const [paused, setPaused] = useState(false);
  const [replay, setReplay] = useState(0);
  const reduced = useReducedMotion();
  const current = actions[action];
  const running = inView && visible && !paused && !reduced;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.15 });
    if (root.current) observer.observe(root.current);
    const onVisibility = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  function restart() {
    setPaused(false);
    setReplay(value => value + 1);
  }

  return (
    <div className="yy-action-stage" ref={root} data-running={running} data-reduced={reduced}>
      <div className="yy-action-topline" aria-hidden="true">
        <span><i />YY · MOTION</span>
        <span>{reduced ? "STILL" : paused ? "PAUSED" : "PLAY"}</span>
      </div>
      <button type="button" className="yy-action-trigger" aria-label={`重播 YY ${current.label}`} onClick={restart} disabled={reduced}>
        <span className="yy-action-art" data-action={action} data-state={current.state}>
          <style>{current.css}</style>
          <span className="yy-action-drawing" key={`${action}-${replay}-${reduced}`} aria-hidden="true"
            dangerouslySetInnerHTML={{ __html: reduced ? current.stillSvg : current.svg }} />
        </span>
      </button>
      <div className="yy-action-controls">
        <span>{reduced ? "YY 的小动作" : "点击 YY，再来一次"}</span>
        <button type="button" onClick={() => setPaused(value => !value)} disabled={reduced}
          aria-label={reduced ? "YY 动效已减少" : paused ? `继续 YY ${current.label}` : `暂停 YY ${current.label}`}
          aria-pressed={paused || reduced}>
          <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true">
            {paused || reduced ? <path d="M4 2 14 8 4 14Z" fill="currentColor" /> : <path d="M3 2H6V14H3ZM10 2H13V14H10Z" fill="currentColor" />}
          </svg>
          {reduced ? "静态展示" : paused ? "继续" : "暂停"}
        </button>
      </div>
    </div>
  );
}
