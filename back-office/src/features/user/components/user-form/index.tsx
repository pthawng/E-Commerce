import { Form, Input, Switch } from 'antd';
import type { FormInstance } from 'antd';

interface UserFormProps {
    form: FormInstance;
    isEditing?: boolean;
    initialValues?: any;
}

export function UserForm({ form, isEditing, initialValues }: UserFormProps) {
    return (
        <Form form={form} layout="vertical" initialValues={initialValues}>
            <Form.Item
                label="Email"
                name="email"
                rules={[
                    { required: true, message: "Email không được để trống" },
                    { type: "email", message: "Email không hợp lệ" },
                ]}
            >
                <Input placeholder="email@example.com" disabled={isEditing} />
            </Form.Item>

            <Form.Item
                label="Họ tên"
                name="fullName"
                rules={[{ required: true, message: "Họ tên không được để trống" }]}
            >
                <Input placeholder="Nguyễn Văn A" />
            </Form.Item>

            <Form.Item label="Số điện thoại" name="phone">
                <Input placeholder="0123456789" />
            </Form.Item>

            <Form.Item
                label={isEditing ? "Mật khẩu (để trống nếu không đổi)" : "Mật khẩu"}
                name="password"
                rules={
                    isEditing
                        ? [{ min: 6, message: "Mật khẩu tối thiểu 6 ký tự" }]
                        : [
                            { required: true, message: "Mật khẩu không được để trống" },
                            { min: 6, message: "Mật khẩu tối thiểu 6 ký tự" },
                        ]
                }
            >
                <Input.Password placeholder="••••••••" />
            </Form.Item>

            <Form.Item
                label="Kích hoạt"
                name="isActive"
                valuePropName="checked"
                initialValue={true}
            >
                <Switch />
            </Form.Item>

            <Form.Item
                label="Đã xác thực email"
                name="isEmailVerified"
                valuePropName="checked"
            >
                <Switch />
            </Form.Item>
        </Form>
    );
}
