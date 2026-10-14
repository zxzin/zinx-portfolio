import { useRef, useState } from "react";
import type { CSSProperties, PointerEvent } from "react";
import { assetPath } from "../ZinxPortfolio";
import type { Exhibit } from "../lib/exhibition-model";
import { constrainCapture } from "../lib/arcade-physics";
import { YYCompanion, type YYOutfit } from "./YYCompanion";
import { FloralAccent } from "./FloralAccent";
import "./coin-play.css";

type Pulse = (frequency: number, duration?: number) => void;

function YYPlay({ pulse }: { pulse: Pulse }) {
  const [outfit, setOutfit] = useState<YYOutfit>("daily");
  const outfits: { id: YYOutfit; label: string }[] = [{ id: "daily", label: "出门走走" }, { id: "scarf", label: "红围巾" }, { id: "hat", label: "小黄帽" }];
  return <div className="coin-play-yy">
    <div className="play-podium"><span className="play-podium-coin" aria-hidden="true">YY</span>
      <YYCompanion outfit={outfit} idleDance={false} onInteract={() => pulse(660, .12)} />
    </div>
    <p className="play-instruction">点点歪歪，看看它的小动作。</p>
    <div className="play-controls" aria-label="YY 穿搭">{outfits.map(item => <button key={item.id} aria-pressed={outfit === item.id} onClick={() => { setOutfit(item.id); pulse(480); }}>{item.label}</button>)}</div>
  </div>;
}

function CapturePlay({ pulse }: { pulse: Pulse }) {
  const surface = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; left: number; top: number; width: number; height: number } | null>(null);
  const [position, setPosition] = useState({ x: 25, y: 24 });
  const [captured, setCaptured] = useState(false);
  const start = (event: PointerEvent<HTMLButtonElement>) => {
    const bounds = surface.current?.getBoundingClientRect();
    if (!bounds || captured) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, left: position.x, top: position.y, width: bounds.width, height: bounds.height };
  };
  return <div className="capture-play">
    <div ref={surface} className="capture-surface" data-captured={captured}>
      <div className="capture-diorama" aria-hidden="true"><i className="capture-stage-coin">Z</i><FloralAccent /><img src={assetPath("/brand/yy-base-v13.svg")} alt="" draggable={false} /><span>把这一刻框起来。</span></div>
      <button className="capture-frame" style={{ left: position.x + "%", top: position.y + "%" }} aria-label="移动取景框，可用方向键调整位置" aria-disabled={captured}
        onPointerDown={start} onPointerMove={event => {
          const d = drag.current;
          if (d) setPosition(constrainCapture({ x: d.left + (event.clientX - d.x) / d.width * 100, y: d.top + (event.clientY - d.y) / d.height * 100 }));
        }} onPointerUp={event => { drag.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => { drag.current = null; }}
        onKeyDown={event => {
          const offset = { ArrowLeft: [-2, 0], ArrowRight: [2, 0], ArrowUp: [0, -2], ArrowDown: [0, 2] }[event.key];
          if (!offset || captured) return;
          event.preventDefault(); setPosition(current => constrainCapture({ x: current.x + offset[0], y: current.y + offset[1] }));
        }}><i /><i /><i /><i /><span>{captured ? "已定格 ✓" : "拖动取景"}</span></button>
    </div>
    <p className="play-instruction" role="status">{captured ? "这一格，留住了。" : "拖一拖，把喜欢的画面框进来。"}</p>
    <div className="play-controls"><button aria-pressed={captured} onClick={() => { drag.current = null; setCaptured(value => !value); pulse(captured ? 380 : 880, .09); }}>{captured ? "重新取景" : "定格这一帧"}</button></div>
    <small className="play-disclaimer">取景交互小样 · 不会录制你的屏幕</small>
  </div>;
}

const sampleTasks = ["剪一段视频", "画一个小表情", "做个小工具"];
function TasksPlay({ work, pulse }: { work: Exhibit; pulse: Pulse }) {
  const [tidy, setTidy] = useState(false), [done, setDone] = useState<number[]>([]);
  return <div className="tasks-play">
    {work.emblem && <img className="play-monkey" src={assetPath(work.emblem.src)} alt="Monkex" />}
    <div className="play-task-stack" data-tidy={tidy}>{sampleTasks.map((title, index) => <button key={title} style={{ "--task-index": index, "--task-tilt": `${(index - 1) * -7}deg` } as CSSProperties}
      aria-pressed={done.includes(index)} onClick={() => { setDone(current => current.includes(index) ? current.filter(id => id !== index) : [...current, index]); pulse(500 + index * 100); }}>
      <i aria-hidden="true">{done.includes(index) ? "✓" : "○"}</i><span>{title}</span><small>{done.includes(index) ? "完成" : "进行中"}</small>
    </button>)}</div>
    <p className="play-instruction" role="status">{done.length === 3 ? "漂亮，今天的事都搞定了。" : tidy ? "排好了。点一下，完成一件。" : "有点乱？让小猴子收拾一下。"}</p>
    <div className="play-controls"><button onClick={() => { setTidy(value => !value); pulse(460, .1); }}>{tidy ? "再打乱" : "整理一下"}</button></div>
    <small className="play-disclaimer">示例任务 · 不会读取或修改真实任务</small>
  </div>;
}

function DiaryPlay({ pulse }: { pulse: Pulse }) {
  const [memory, setMemory] = useState(0);
  const moments = [{ icon: "☕", title: "一起喝咖啡", note: "一杯咖啡，聊了好久。" }, { icon: "✿", title: "慢慢散步", note: "今天走了很远，还是不想回家。" }, { icon: "▷", title: "看场电影", note: "片尾字幕结束，我们才起身。" }];
  return <div className="diary-play"><div className="play-memory" key={memory}><span aria-hidden="true">{moments[memory].icon}</span><small>今天，记住这个瞬间</small><strong>{moments[memory].title}</strong><p>{moments[memory].note}</p><i aria-hidden="true">♥</i></div>
    <p className="play-instruction">挑一个，留下今天的小记。</p>
    <div className="play-controls">{moments.map((item, index) => <button key={item.title} aria-pressed={memory === index} onClick={() => { setMemory(index); pulse(520 + index * 90); }}>{item.title}</button>)}</div>
    <small className="play-disclaimer">记录交互小样 · 示例内容不保存</small>
  </div>;
}

/** Small product demos share the main exhibit stage and its media lifecycle. */
export function CoinExperience({ work, pulse }: { work: Exhibit; pulse: Pulse }) {
  return <div className="coin-experience" data-play={work.preview?.play}>
    {work.preview?.play === "yy" && <YYPlay pulse={pulse} />}
    {work.preview?.play === "capture" && <CapturePlay pulse={pulse} />}
    {work.preview?.play === "tasks" && <TasksPlay work={work} pulse={pulse} />}
    {work.preview?.play === "diary" && <DiaryPlay pulse={pulse} />}
  </div>;
}
