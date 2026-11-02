import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, RotateCcw, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      copied: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      copied: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem('ferrisforge_user_progress');
      localStorage.removeItem('ferrisforge_app_theme');
      localStorage.removeItem('ferrisforge_layout_mode');
      if (window.location.hash) {
        window.location.hash = '';
      }
    } catch (e) {
      console.error('Failed to reset storage:', e);
    }
    window.location.reload();
  };

  handleCopy = async () => {
    const errorDetails = `Error: ${this.state.error?.message || 'Unknown'}\nStack: ${this.state.error?.stack || ''}\nComponentStack: ${this.state.errorInfo?.componentStack || ''}`;
    try {
      await navigator.clipboard.writeText(errorDetails);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0f1117] text-neutral-200 flex flex-col items-center justify-center p-6 select-none font-sans">
          <div className="w-full max-w-xl bg-[#161822] border border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-100">
                  Workspace Safety Boundary Caught an Error
                </h2>
                <p className="text-xs text-neutral-400">
                  A client-side runtime exception occurred. Your workspace data has been protected.
                </p>
              </div>
            </div>

            <div className="p-3 bg-[#0d0e14] border border-neutral-800/80 rounded-xl font-mono text-xs text-red-400 max-h-48 overflow-auto whitespace-pre-wrap select-text">
              {this.state.error?.message || 'Unknown error occurred in renderer.'}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-800/80">
              <button
                onClick={this.handleReload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#DE3804] hover:bg-[#C23103] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>

              <button
                onClick={this.handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Clean Workspace</span>
              </button>

              <button
                onClick={this.handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded-lg transition-colors cursor-pointer ml-auto"
              >
                {this.state.copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Trace</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
