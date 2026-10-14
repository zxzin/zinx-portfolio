import { Component } from "react";
import type { ReactNode } from "react";

/** Keep optional media failures local to the exhibit. */
export class MediaBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? (this.props.fallback ?? null) : this.props.children; }
}
