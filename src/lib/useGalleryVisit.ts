import { useCallback, useEffect, useState } from "react";
import { visibleExhibits } from "../content/exhibition";
import { readVisit, toggleTicketPick, VISIT_STORAGE_KEY } from "./gallery-visit";

const ids = visibleExhibits.map(work => work.id);
export function useGalleryVisit() {
  const [visit, setVisit] = useState(() => {
    let saved: string | null = null;
    try { saved = sessionStorage.getItem(VISIT_STORAGE_KEY); } catch { /* Private browsing keeps the visit in memory. */ }
    return readVisit(saved, ids);
  });
  useEffect(() => {
    try { sessionStorage.setItem(VISIT_STORAGE_KEY, JSON.stringify(visit)); } catch { /* The current visit remains usable without storage. */ }
  }, [visit]);
  const remember = useCallback((id: string) => {
    if (ids.includes(id)) setVisit(current => current.seen.includes(id) ? current : { ...current, seen: [...current.seen, id] });
  }, []);
  const togglePick = useCallback((id: string) => setVisit(current => ({ ...current, picks: toggleTicketPick(current.picks, id, ids) })), []);
  return { visit, remember, togglePick };
}
