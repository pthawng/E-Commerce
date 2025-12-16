import { Button, Card, Form, Input, message } from 'antd';
import { useLogin } from '@/features/auth/api/mutations';
import { useNavigate } from 'react-router-dom';
import type { LoginPayload } from '@shared';

export default function LoginPage() {
    const navigate = useNavigate();
    const { mutate: login, isPending } = useLogin();
    const [form] = Form.useForm();

    const onFinish = (values: LoginPayload) => {
        login(values, {
            onSuccess: () => {
                message.success('Đăng nhập thành công');
                navigate('/');
            },
            onError: (error: any) => {
                message.error(error.message || 'Đăng nhập thất bại');
            },
        });
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <Card className="w-full max-w-[400px] shadow-lg" title="Back Office Login">
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    autoComplete="off"
                >
                    <Form.Item
                        label="Email / Phone"
                        name="email"
                        rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
                    >
                        <Input placeholder="admin@example.com" disabled={isPending} />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password placeholder="******" disabled={isPending} />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={isPending} block>
                            Đăng nhập
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
}
