/**
 * Error Boundary Component
 * Bắt lỗi React để tránh crash toàn bộ app
 */
import { Component } from 'react';
import type { ReactNode } from 'react';
import { Alert, Button, Card } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card
          style={{
            margin: '20px',
            maxWidth: '600px',
          }}
        >
          <Alert
            message="Đã xảy ra lỗi"
            description={
              <div>
                <p>
                  <strong>Error:</strong> {this.state.error?.message || 'Unknown error'}
                </p>
                {this.state.error?.stack && (
                  <details style={{ marginTop: 12 }}>
                    <summary style={{ cursor: 'pointer', marginBottom: 8 }}>Stack trace</summary>
                    <pre
                      style={{
                        background: '#f5f5f5',
                        padding: 12,
                        borderRadius: 4,
                        fontSize: 12,
                        overflow: 'auto',
                        maxHeight: 200,
                      }}
                    >
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            }
            type="error"
            showIcon
            action={
              <Button
                icon={<ReloadOutlined />}
                onClick={this.handleReset}
                type="primary"
              >
                Thử lại
              </Button>
            }
          />
        </Card>
      );
    }

    return this.props.children;
  }
}

