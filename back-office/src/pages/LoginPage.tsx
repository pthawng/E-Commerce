import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, App, ConfigProvider } from 'antd';
import { LockOutlined, UserOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../features/auth/model/authStore';
import api from '../shared/api/apiInstance';
import { motion } from 'framer-motion';

const { Title, Text } = Typography;

export const LoginPage: React.FC = () => {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const { setAuth } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Get redirect path or default to dashboard
    const from = (location.state as any)?.from?.pathname || '/';

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            // High-integrity login endpoint (Admin Portal)
            const response = await api.post('/admin/auth/login', {
                email: values.email,
                password: values.password,
            });

            const { user, tokens } = response.data;

            // Map BE permissions to frontend state
            setAuth(
                {
                    ...user,
                    permissions: user.permissions || [], // Ensure array
                },
                tokens.accessToken,
                tokens.refreshToken
            );

            message.success('Chào mừng bạn trở lại Atelier');
            navigate(from, { replace: true });
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || 'Đăng nhập không thành công';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#f8f9fa',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Background Decorative Element */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '500px',
                height: '500px',
                background: 'radial-gradient(circle, rgba(0,0,0,0.03) 0%, rgba(255,255,255,0) 70%)',
                borderRadius: '50%'
            }} />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
                <Card
                    style={{
                        width: 400,
                        borderRadius: 2, // Sharp Luxury
                        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
                        border: '1px solid #eee'
                    }}
                    styles={{
                        body: { padding: '40px' }
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                        <Title level={2} style={{
                            fontFamily: 'Playfair Display, serif',
                            fontWeight: 700,
                            letterSpacing: '-0.02em',
                            margin: 0
                        }}>
                            RAY PARADIS
                        </Title>
                        <Text type="secondary" style={{ textTransform: 'uppercase', fontSize: '10px', letterSpacing: '0.2em' }}>
                            Digital Atelier Management
                        </Text>
                    </div>

                    <Form
                        name="auth_login"
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                    >
                        <Form.Item
                            name="email"
                            rules={[{ required: true, message: 'Vui lòng nhập Email' }]}
                        >
                            <Input
                                prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="Email"
                                size="large"
                                style={{ borderRadius: 0, height: '48px' }}
                            />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu' }]}
                        >
                            <Input.Password
                                prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
                                placeholder="Mật khẩu"
                                size="large"
                                style={{ borderRadius: 0, height: '48px' }}
                            />
                        </Form.Item>

                        <Form.Item style={{ marginTop: '24px' }}>
                            <Button
                                type="primary"
                                htmlType="submit"
                                block
                                size="large"
                                loading={loading}
                                style={{
                                    borderRadius: 0,
                                    height: '48px',
                                    background: '#000',
                                    borderColor: '#000',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}
                            >
                                BƯỚC VÀO ATELIER <ArrowRightOutlined />
                            </Button>
                        </Form.Item>
                    </Form>

                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                            Yêu cầu hỗ trợ kỹ thuật? <a href="mailto:it@rayparadis.com" style={{ color: '#000', fontWeight: 600 }}>Liên hệ</a>
                        </Text>
                    </div>
                </Card>
            </motion.div>

            {/* Footer Legal */}
            <div style={{ position: 'absolute', bottom: '20px', textAlign: 'center', width: '100%' }}>
                <Text style={{ fontSize: '10px', color: '#bfbfbf' }}>
                    © {new Date().getFullYear()} RAY PARADIS. SECURE ARCHITECTURE L8.
                </Text>
            </div>
        </div>
    );
};
