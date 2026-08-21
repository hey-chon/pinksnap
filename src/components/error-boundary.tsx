import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
} from 'react';

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  FallbackComponent?: ComponentType<ErrorFallbackProps>;
  
  resetKey?: unknown;
}

interface ErrorBoundaryState {
  error: Error | null;
}

function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'string') {
    return new Error(value);
  }
  try {
    return new Error(JSON.stringify(value));
  } catch {
    return new Error(String(value));
  }
}

function DefaultFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#f8f7ff] p-6">
      <div className="max-w-lg w-full text-center">
        <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-2xl bg-primary text-2xl font-black text-white shadow-lg shadow-primary/25">
          PS
        </div>
        <h1 className="text-xl font-black tracking-tight text-[#201b2c]">
          PinkSnap needs a reset
        </h1>
        <p className="mt-2 text-sm text-[#201b2c]/65">
          The booth hit an unexpected snag. Your local gallery is still on this device.
        </p>
        {/* messages can carry the fucking responses and other internal shit. */}
        {import.meta.env.DEV ? (
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-white/75 p-3 text-left text-xs text-[#201b2c]/75">
            {error.message || String(error)}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={resetError}
          data-testid="button-reset-error"
          className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-black text-white shadow-md shadow-primary/20 hover:brightness-105"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return { error: toError(error) };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error(
      'ErrorBoundary caught an error:',
      toError(error),
      info.componentStack,
    );
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    if (
      this.state.error !== null &&
      prevProps.resetKey !== this.props.resetKey
    ) {
      this.resetError();
    }
  }

  resetError = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    if (error === null) {
      return this.props.children;
    }
    const Fallback = this.props.FallbackComponent ?? DefaultFallback;
    return <Fallback error={error} resetError={this.resetError} />;
  }
}
