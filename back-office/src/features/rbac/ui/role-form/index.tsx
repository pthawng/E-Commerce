import { Form, Input, Switch } from 'antd';
import type { FormInstance } from 'antd';

interface RoleFormProps {
    form: FormInstance;
    isEditing?: boolean;
    initialValues?: any;
}

export function RoleForm({ form, isEditing, initialValues }: RoleFormProps) {
    return (
        <Form form={form} layout="vertical" initialValues={initialValues}>
            {!isEditing && (
                <Form.Item
                    name="slug"
                    label="Slug"
                    rules={[
                        { required: true, message: 'Vui lòng nhập slug' },
                        {
                            pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                            message: 'Slug chỉ được chứa chữ thường, số, dấu gạch ngang',
                        },
                    ]}
                >
                    <Input placeholder="vd: admin" />
                </Form.Item>
            )}
            <Form.Item
                name="name"
                label="Tên role"
                rules={[{ required: true, message: 'Vui lòng nhập tên role' }]}
            >
                <Input placeholder="vd: Administrator" />
            </Form.Item>
            <Form.Item name="description" label="Mô tả">
                <Input.TextArea rows={3} placeholder="Mô tả ngắn" />
            </Form.Item>
            {!isEditing && (
                <Form.Item name="isSystem" label="System role" valuePropName="checked" initialValue={false}>
                    <Switch />
                </Form.Item>
            )}
        </Form>
    );
}
