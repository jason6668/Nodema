import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  props!: Props;

  constructor(props: Props) {
    super(props);
  }

  state: State = {
    hasError: false,
    error: null
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                <span className="text-3xl">⚠️</span>
              </div>
              <h2 className="text-xl font-bold text-white">应用加载失败</h2>
              <div className="text-left space-y-2">
                <p className="text-zinc-400 text-sm font-bold">错误信息:</p>
                <p className="text-red-400 text-xs font-mono bg-zinc-950 p-2 rounded overflow-auto max-h-20">
                  {this.state.error?.message || '发生未知错误'}
                </p>
                {this.state.error?.stack && (
                  <>
                    <p className="text-zinc-400 text-sm font-bold mt-2">错误堆栈:</p>
                    <p className="text-zinc-500 text-[10px] font-mono bg-zinc-950 p-2 rounded overflow-auto max-h-32">
                      {this.state.error.stack}
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-bold transition"
              >
                重新加载
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
