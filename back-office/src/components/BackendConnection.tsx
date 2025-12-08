/**
 * Backend Connection Test Component
 * Component để test kết nối với backend
 */
import { useState } from 'react';
import { Card, Button, Alert, Spin, Typography, Space, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { apiGet } from '@/services/apiClient';
import { API_ENDPOINTS, getApiBaseUrl } from '@shared';

const { Title, Text, Paragraph } = Typography;

interface ConnectionStatus {
  status: 'idle' | 'testing' | 'success' | 'error';
  message?: string;
  details?: {
    url: string;
    statusCode?: number;
    response?: unknown;
    error?: string;
  };
}

export default function BackendConnection() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    status: 'idle',
  });

  const testConnection = async () => {
    setConnectionStatus({ status: 'testing' });

    try {
      const baseUrl = getApiBaseUrl();
      const testUrl = `${baseUrl}${API_ENDPOINTS.USERS.ME}`;

      // Test 1: Check if backend is reachable
      const response = await apiGet(API_ENDPOINTS.USERS.ME);

      setConnectionStatus({
        status: 'success',
        message: 'Kết nối backend thành công!',
        details: {
          url: testUrl,
          statusCode: 200,
          response: response,
        },
      });
    } catch (error: unknown) {
      const apiError = error as { statusCode?: number; message?: string };
      setConnectionStatus({
        status: 'error',
        message: apiError.message || 'Không thể kết nối đến backend',
        details: {
          url: `${getApiBaseUrl()}${API_ENDPOINTS.USERS.ME}`,
          statusCode: apiError.statusCode,
          error: String(error),
        },
      });
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus.status) {
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
      case 'testing':
        return <Spin size="large" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus.status) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'testing':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Card
      title={
        <Space>
          <span>Backend Connection Status</span>
          {connectionStatus.status !== 'idle' && (
            <Tag color={getStatusColor()}>
              {connectionStatus.status === 'testing'
                ? 'Testing...'
                : connectionStatus.status === 'success'
                  ? 'Connected'
                  : 'Disconnected'}
            </Tag>
          )}
        </Space>
      }
      extra={
        <Button
          icon={<ReloadOutlined />}
          onClick={testConnection}
          loading={connectionStatus.status === 'testing'}
        >
          Test Connection
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        {/* Status Display */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          {getStatusIcon()}
          {connectionStatus.status === 'idle' && (
            <Paragraph type="secondary" style={{ marginTop: 16 }}>
              Click "Test Connection" để kiểm tra kết nối với backend
            </Paragraph>
          )}
          {connectionStatus.message && (
            <Alert
              message={connectionStatus.message}
              type={connectionStatus.status === 'success' ? 'success' : 'error'}
              showIcon
              style={{ marginTop: 16 }}
            />
          )}
        </div>

        {/* Connection Details */}
        {connectionStatus.details && (
          <div>
            <Title level={5}>Connection Details:</Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div>
                <Text strong>API Base URL: </Text>
                <Text code>{getApiBaseUrl()}</Text>
              </div>
              <div>
                <Text strong>Test Endpoint: </Text>
                <Text code>{connectionStatus.details.url}</Text>
              </div>
              {connectionStatus.details.statusCode !== undefined && (
                <div>
                  <Text strong>Status Code: </Text>
                  <Tag color={connectionStatus.details.statusCode === 200 ? 'success' : 'error'}>
                    {connectionStatus.details.statusCode}
                  </Tag>
                </div>
              )}
              {connectionStatus.details.error && (
                <Alert
                  message="Error Details"
                  description={<pre style={{ fontSize: 12 }}>{String(connectionStatus.details.error)}</pre>}
                  type="error"
                  showIcon
                />
              )}
              {connectionStatus.details.response !== undefined && (
                <div>
                  <Text strong>Response: </Text>
                  <pre
                    style={{
                      background: '#f5f5f5',
                      padding: 12,
                      borderRadius: 4,
                      fontSize: 12,
                      maxHeight: 200,
                      overflow: 'auto',
                    }}
                  >
                    {String(JSON.stringify(connectionStatus.details.response, null, 2))}
                  </pre>
                </div>
              )}
            </Space>
          </div>
        )}
      </Space>
    </Card>
  );
}

