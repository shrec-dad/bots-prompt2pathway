import React from "react";

export class ErrorBoundary extends React.Component<
  { fallback?: React.ReactNode },
  { hasError: boolean; error?: any }
> {
  constructor(props:any){ super(props); this.state={hasError:false}; }
  static getDerivedStateFromError(error:any){ return {hasError:true, error}; }
  componentDidCatch(err:any, info:any){ console.error("ErrorBoundary", err, info); }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="rounded-xl border bg-white p-4">
          <div className="font-bold">Something went wrong.</div>
          <pre className="text-xs mt-2 whitespace-pre-wrap">
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children as any;
  }
}
