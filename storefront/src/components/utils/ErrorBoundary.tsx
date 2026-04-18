import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // Integration point for Sentry:
        // Sentry.captureException(error, { extra: errorInfo });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-background flex items-center justify-center p-6 text-center">
                    <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                            <div className="absolute inset-0 bg-destructive/10 rounded-full animate-pulse" />
                            <AlertTriangle className="w-12 h-12 text-destructive" strokeWidth={1.2} />
                        </div>

                        <div className="space-y-4">
                            <h1 className="font-display text-2xl tracking-luxury text-foreground uppercase">
                                An Unexpected Silence
                            </h1>
                            <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                                Elegance encountered a brief disruption. Our team has been notified.
                            </p>
                        </div>

                        <div className="pt-8">
                            <Button
                                variant="luxury"
                                onClick={this.handleReset}
                                className="group flex items-center gap-3 mx-auto"
                            >
                                <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" strokeWidth={1.2} />
                                <span>Return to Elegance</span>
                            </Button>
                        </div>

                        <div className="pt-12">
                            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/30">
                                Ray Paradis | Timeless Integrity
                            </p>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
