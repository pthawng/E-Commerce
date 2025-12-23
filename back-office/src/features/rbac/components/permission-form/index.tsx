import { Form, Input } from 'antd';
import type { FormInstance } from 'antd';

interface PermissionFormProps {
    form: FormInstance;
    isEditing?: boolean;
    initialValues?: any;
}

export function PermissionForm({ form, isEditing, initialValues }: PermissionFormProps) {
    return (
        <Form form={form} layout="vertical" initialValues={initialValues}>
            {!isEditing && (
                <Form.Item
                    name="slug"
                    label="Slug"
                    rules={[
                        { required: true, message: 'Vui lòng nhập slug' },
                        {
                            // Ví dụ hợp lệ: "auth.role.read", "product.variant.create"
                            // Chỉ cho phép chữ thường, số, dấu chấm và dấu gạch ngang
                            pattern: /^[a-z0-9]+(?:\.[a-z0-9]+)*(?:-[a-z0-9]+)*$/,
                            message: 'Slug chỉ được chứa chữ thường, số, dấu chấm và dấu gạch ngang',
                        },
                    ]}
                >
                    <Input placeholder="vd: auth.role.read, product.variant.create" />
                </Form.Item>
            )}
            <Form.Item
                name="name"
                label="Tên permission"
                rules={[{ required: true, message: 'Vui lòng nhập tên permission' }]}
            >
                <Input placeholder="vd: Quản lý RBAC" />
            </Form.Item>
            <Form.Item name="module" label="Module">
                <Input placeholder="vd: SYSTEM" />
            </Form.Item>
            <Form.Item name="action" label="Action">
                <Input placeholder="vd: MANAGE" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Mô tả ngắn" />
            </Form.Item>
        </Form>
    );
}
