/**
 * Login Page
 * Trang đăng nhập cho back-office
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Alert, Typography, Space } from 'antd';
import { MailOutlined, LockOutlined, PhoneOutlined, LoginOutlined } from '@ant-design/icons';
import { useLogin } from '@/services/mutations/auth.mutations';
import { useAuthStore } from '@/store/auth.store';
import type { LoginPayload } from '@shared';

const { Title, Text } = Typography;

export default function LoginPage() {
  const navigate = useNavigate();
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const login = useLogin();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Redirect nếu đã login
  if (isAuthenticated) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  const handleSubmit = async (values: LoginPayload) => {
    try {
      await login.mutateAsync(values);
      // Navigate sẽ được xử lý trong mutation onSuccess hoặc useEffect
      navigate('/dashboard', { replace: true });
    } catch (error) {
      // Error được xử lý bởi form
      console.error('Login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Title */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">💎</div>
          <Title level={2} className="!text-amber-100 !mb-2">
            Back Office
          </Title>
          <Text className="text-slate-400">Đăng nhập để tiếp tục</Text>
        </div>

        {/* Login Card */}
        <Card
          className="bg-slate-900/80 backdrop-blur-xl border-amber-500/20 shadow-2xl"
          bodyStyle={{ padding: '2rem' }}
        >
          <Form
            name="login"
            onFinish={handleSubmit}
            layout="vertical"
            size="large"
            autoComplete="off"
          >
            {/* Error Alert */}
            {login.error && (
              <Alert
                message="Đăng nhập thất bại"
                description={
                  login.error instanceof Error
                    ? login.error.message
                    : 'Email/Phone hoặc mật khẩu không đúng'
                }
                type="error"
                showIcon
                closable
                className="mb-6"
              />
            )}

            {/* Login Method Toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-800/50 rounded-lg">
              <button
                type="button"
                onClick={() => setLoginMethod('email')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  loginMethod === 'email'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MailOutlined className="mr-2" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setLoginMethod('phone')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  loginMethod === 'phone'
                    ? 'bg-amber-500/20 text-amber-200 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PhoneOutlined className="mr-2" />
                Số điện thoại
              </button>
            </div>

            {/* Email/Phone Input */}
            <Form.Item
              name={loginMethod}
              rules={[
                {
                  required: true,
                  message: `Vui lòng nhập ${loginMethod === 'email' ? 'email' : 'số điện thoại'}`,
                },
                ...(loginMethod === 'email'
                  ? [
                      {
                        type: 'email' as const,
                        message: 'Email không hợp lệ',
                      },
                    ]
                  : [
                      {
                        pattern: /^[0-9]{10,11}$/,
                        message: 'Số điện thoại phải có 10-11 chữ số',
                      },
                    ]),
              ]}
            >
              <Input
                prefix={
                  loginMethod === 'email' ? (
                    <MailOutlined className="text-amber-400" />
                  ) : (
                    <PhoneOutlined className="text-amber-400" />
                  )
                }
                placeholder={
                  loginMethod === 'email'
                    ? 'Nhập email của bạn'
                    : 'Nhập số điện thoại'
                }
                className="bg-slate-800/50 border-amber-500/20 text-slate-100 placeholder:text-slate-500"
              />
            </Form.Item>

            {/* Password Input */}
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-amber-400" />}
                placeholder="Nhập mật khẩu"
                className="bg-slate-800/50 border-amber-500/20 text-slate-100 placeholder:text-slate-500"
              />
            </Form.Item>

            {/* Submit Button */}
            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                block
                size="large"
                loading={login.isPending}
                icon={<LoginOutlined />}
                className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 border-0 text-white font-semibold h-12 rounded-lg shadow-lg"
              >
                {login.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>
            </Form.Item>
          </Form>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <Space direction="vertical" size="small" className="w-full">
              <Text className="text-slate-400 text-sm">
                Quên mật khẩu?{' '}
                <a
                  href="#"
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  Khôi phục ngay
                </a>
              </Text>
            </Space>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <Text className="text-slate-500 text-sm">
            © 2024 E-Commerce Back Office. All rights reserved.
          </Text>
        </div>
      </div>
    </div>
  );
}

