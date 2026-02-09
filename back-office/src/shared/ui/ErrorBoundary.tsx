import { Component, type ReactNode } from 'react';
import { Alert, Button } from 'antd';
import * as tokens from '@/ui/design-tokens';

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: any) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div style={{
                    padding: tokens.spacing.xxl,
                    maxWidth: 600,
                    margin: '0 auto',
                }}>
                    <Alert
                        message="Something went wrong"
                        description={
                            <div>
                                <p style={{ marginBottom: tokens.spacing.md }}>
                                    {this.state.error?.message || 'An unexpected error occurred'}
                                </p>
                                <Button
                                    size="small"
                                    onClick={() => window.location.reload()}
                                >
                                    Reload Page
                                </Button>
                            </div>
                        }
                        type="error"
                        showIcon
                        style={{
                            borderRadius: 4,
                            border: '1px solid #F5EDED',
                            backgroundColor: '#FEF5F5',
                        }}
                    />
                </div>
            );
        }

        return this.props.children;
    }
}

interface ErrorMessageProps {
    title?: string;
    message: string;
    onRetry?: () => void;
}

export function ErrorMessage({ title = 'Error', message, onRetry }: ErrorMessageProps) {
    return (
        <div style={{
            padding: tokens.spacing.xxl,
        }}>
            <Alert
                message={title}
                description={
                    <div>
                        <p style={{ marginBottom: onRetry ? tokens.spacing.md : 0 }}>
                            {message}
                        </p>
                        {onRetry && (
                            <Button size="small" onClick={onRetry}>
                                Try Again
                            </Button>
                        )}
                    </div>
                }
                type="error"
                showIcon
                style={{
                    borderRadius: 4,
                    border: '1px solid #F5EDED',
                    backgroundColor: '#FEF5F5',
                }}
            />
        </div>
    );
}
