import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { Alert, Button } from 'antd';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
        errorInfo: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error, errorInfo: null };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({
            error,
            errorInfo,
        });
    }

    private handleReset = () => {
        this.setState({
            hasError: false,
            error: null,
            errorInfo: null,
        });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-4">
                    <div className="max-w-2xl w-full">
                        <Alert
                            message="Something went wrong"
                            description={
                                <div className="space-y-4">
                                    <p className="text-slate-600">
                                        {this.state.error?.toString()}
                                    </p>
                                    {this.state.errorInfo && (
                                        <details className="text-xs">
                                            <summary className="cursor-pointer text-slate-500 hover:text-slate-700">
                                                Stack trace
                                            </summary>
                                            <pre className="mt-2 p-4 bg-slate-50 rounded overflow-auto">
                                                {this.state.errorInfo.componentStack}
                                            </pre>
                                        </details>
                                    )}
                                    <Button type="primary" onClick={this.handleReset}>
                                        Try again
                                    </Button>
                                </div>
                            }
                            type="error"
                            showIcon
                        />
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
