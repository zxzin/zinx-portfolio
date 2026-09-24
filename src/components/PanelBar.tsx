import type { ReactNode } from "react";

/** Shared window chrome; brackets are decoration, every action retains a plain-language label. */
export function PanelBar({ code, children, end }: { code: string; children: ReactNode; end?: ReactNode }) {
  return <div className="zx-panel-bar"><span className="zx-panel-code" aria-hidden="true">[{code}]</span><span className="zx-panel-title">{children}</span>{end && <span className="zx-panel-end">{end}</span>}</div>;
}
