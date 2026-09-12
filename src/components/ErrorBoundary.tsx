import { Component, type ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (!this.state.failed) return this.props.children;
    return <section role="alert" className="carbon-sheet p-6">
      <h1 className="font-display text-2xl">This page could not load</h1>
      <p className="my-4">Please reload to try again. Your comparison is saved in the address bar.</p>
      <button className="file-cta" onClick={() => window.location.reload()}>Reload page</button>
      <a className="ml-6" href="/">Return home</a>
    </section>;
  }
}
