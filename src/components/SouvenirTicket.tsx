import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { visibleExhibits } from "../content/exhibition";
import { assetPath } from "../ZinxPortfolio";
import { type GalleryVisit, TICKET_LIMIT, ticketDate } from "../lib/gallery-visit";
import { createTicketImage } from "../lib/ticket-image";
import { useReducedMotion } from "../lib/motion";
import { TicketArtwork } from "./TicketArtwork";
import "./souvenir-ticket.css";

export function SouvenirTicket({ visit, onToggle, onClose, onOpenWork }: {
  visit: GalleryVisit; onToggle: (id: string) => void; onClose: () => void; onOpenWork: (id: string) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null), print = useRef<SVGSVGElement>(null);
  const downloadUrl = useRef<string | null>(null), alive = useRef(true);
  const [saving, setSaving] = useState(false), [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(visit.picks.length === 0);
  const [compact, setCompact] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  const [exported, setExported] = useState<{ url: string; signature: string } | null>(null);
  const signature = JSON.stringify([visit.picks, visit.date, compact]);
  const snapshot = useRef(signature);
  useEffect(() => { snapshot.current = signature; }, [signature]);
  const reduced = useReducedMotion();
  const works = visit.picks.flatMap(id => visibleExhibits.filter(work => work.id === id));
  useEffect(() => {
    const query = window.matchMedia("(max-width: 700px)");
    const update = () => setCompact(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    alive.current = true;
    return () => { alive.current = false; if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current); };
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    element.showModal();
    const context = gsap.context(() => {
      if (!reduced) gsap.from(".souvenir-print", { y: 24, rotation: -1.4, opacity: 0, duration: .5, ease: "power3.out", clearProps: "transform,opacity" });
    }, element);
    return () => { context.revert(); element.close(); };
  }, [reduced]);
  const download = async () => {
    if (!works.length || saving || !print.current) return;
    setSaving(true); setNotice("");
    try {
      const blob = await createTicketImage(print.current);
      if (!alive.current || snapshot.current !== signature) return;
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
      downloadUrl.current = URL.createObjectURL(blob);
      setExported({ url: downloadUrl.current, signature });
      const link = document.createElement("a");
      link.href = downloadUrl.current; link.download = "ZINX-参观票-" + ticketDate(visit.date) + ".png";
      link.click(); setNotice("图片已生成");
    } catch { if (alive.current) setNotice("图片生成失败，请重试"); }
    finally { if (alive.current) setSaving(false); }
  };
  return <dialog ref={dialog} className="souvenir-dialog" aria-labelledby="souvenir-title" onCancel={event => { event.preventDefault(); onClose(); }}>
    <header className="souvenir-header"><div><span>ZINX / COLLECTION</span><h2 id="souvenir-title">参观票</h2></div><button onClick={onClose} aria-label="关闭纪念票">返回展厅 <span aria-hidden="true">×</span></button></header>
    <div className="souvenir-print"><TicketArtwork svgRef={print} works={works} date={visit.date} compact={compact} /></div>
    <div className="ticket-toolbar">
      <button className="ticket-edit-toggle" aria-expanded={editing} aria-controls="ticket-editor" onClick={() => setEditing(value => !value)}>选择作品 <span>{works.length}/{TICKET_LIMIT}</span><i aria-hidden="true">{editing ? "−" : "+"}</i></button>
      <button className="ticket-save" disabled={!works.length || saving} onClick={() => void download()}><span>{saving ? "正在生成" : "保存图片"}</span><i aria-hidden="true">↓</i></button>
    </div>
    {editing && <div id="ticket-editor" className="ticket-editor">
      <div className="ticket-selection" aria-label="已选作品">{works.map(work => <div key={work.id}>
        <button className="ticket-revisit" aria-label={"再看 " + work.title} onClick={() => onOpenWork(work.id)}>{work.title} ↗</button>
        <button className="ticket-remove" aria-label={"从票根移除 " + work.title} onClick={() => { onToggle(work.id); setNotice(""); }}>×</button>
      </div>)}</div>
      <div className="ticket-catalog">{visibleExhibits.map(work => <button key={work.id} aria-pressed={visit.picks.includes(work.id)} disabled={!visit.picks.includes(work.id) && works.length >= TICKET_LIMIT}
        onClick={() => { onToggle(work.id); setNotice(""); }}>{work.emblem && <img src={assetPath(work.emblem.src)} data-treatment={work.emblem.treatment} alt="" />}<span>{work.title}</span><i aria-hidden="true">{visit.picks.includes(work.id) ? "✓" : "+"}</i></button>)}</div>
    </div>}
    <p className="ticket-notice" role="status">{notice}</p>
    {exported?.signature === signature && <a className="ticket-export" href={exported.url} target="_blank" rel="noreferrer" aria-label="打开纪念票大图"><img src={exported.url} alt="生成的作品乐园参观票" /><span>打开图片 ↗</span></a>}
  </dialog>;
}
