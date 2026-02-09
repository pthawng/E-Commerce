import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Form, Card, Alert } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/entities/user';
import { loginApi } from '@/entities/user/api';
import { useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { message } from 'antd';
import { showErrorOnce } from '@/shared/api/responseHandler';

// Schema Validation
const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormInputs = z.infer<typeof loginSchema>;

export const LoginForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const { control, handleSubmit, formState: { errors } } = useForm<LoginFormInputs>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    });


    const onSubmit = async (data: LoginFormInputs) => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const response = await loginApi(data);
            login(response);
            message.success('Login successful! Redirecting...');

            // Short delay to let user see success message
            setTimeout(() => {
                const from = (location.state as any)?.from?.pathname || '/dashboard';
                navigate(from, { replace: true });
            }, 500);

        } catch (error: any) {
            console.error('Login failed:', error);
            const msg = error.response?.data?.message || error.message || 'Login failed';
            showErrorOnce(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card
            title="Welcome Back"
            variant="borderless"
            style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
            {errorMsg && <Alert message={errorMsg} type="error" showIcon style={{ marginBottom: 16 }} />}

            <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
                <Form.Item
                    label="Email"
                    validateStatus={errors.email ? 'error' : ''}
                    help={errors.email?.message}
                >
                    <Controller
                        name="email"
                        control={control}
                        render={({ field }) => (
                            <Input
                                {...field}
                                prefix={<UserOutlined />}
                                placeholder="admin@example.com"
                                size="large"
                            />
                        )}
                    />
                </Form.Item>

                <Form.Item
                    label="Password"
                    validateStatus={errors.password ? 'error' : ''}
                    help={errors.password?.message}
                >
                    <Controller
                        name="password"
                        control={control}
                        render={({ field }) => (
                            <Input.Password
                                {...field}
                                prefix={<LockOutlined />}
                                placeholder="******"
                                size="large"
                            />
                        )}
                    />
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        size="large"
                        loading={loading}
                        style={{ fontWeight: 600 }}
                    >
                        Sign In
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};
