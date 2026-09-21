import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State;

  constructor(props: Props) {
    super(props);
    this.props = props;
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Shendam Connect] Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    try {
      window.location.reload();
    } catch {
      // fallback
    }
  };

  private handleResetCache = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#020B18] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-[#0B2D5C] border border-[#FFC928]/40 flex items-center justify-center mb-6 shadow-xl">
            <span className="text-2xl font-bold text-[#FFC928]">S</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-sm text-[#9BAABD] max-w-md mb-6 leading-relaxed">
            Shendam Connect encountered a temporary loading error. Please refresh or reset your local cache to continue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 rounded-xl bg-[#0878D1] hover:bg-[#0A5DB1] text-white text-sm font-semibold transition-colors shadow-md"
            >
              Reload Application
            </button>
            <button
              onClick={this.handleResetCache}
              className="px-5 py-2.5 rounded-xl bg-[#0B2D5C] hover:bg-[#08254D] border border-white/10 text-[#D5DCE8] text-sm font-semibold transition-colors"
            >
              Clear Cache & Reload
            </button>
          </div>
          {this.state.error && (
            <div className="mt-8 p-3 rounded-lg bg-black/40 border border-white/5 text-xs text-red-400 font-mono max-w-lg text-left overflow-auto max-h-32">
              {this.state.error.message || String(this.state.error)}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
