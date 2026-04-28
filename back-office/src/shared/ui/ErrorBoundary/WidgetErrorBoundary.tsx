import React, { Component, ErrorInfo, ReactNode } from "react";
import { ErrorFallback } from "./ErrorFallback";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Widget Uncaught Error:", error, errorInfo);
    // Here you would typically log to a service like Sentry or LogRocket
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error || undefined}
          resetErrorBoundary={this.handleReset}
          title={this.props.fallbackTitle}
        />
      );
    }

    return this.props.children;
  }
}
