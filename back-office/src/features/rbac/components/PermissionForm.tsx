import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Space, Card, message, Spin, Typography } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { usePermissions, useCreatePermission, useUpdatePermission } from '../hooks';
import { PermissionModule } from '../types';
import type { CreatePermissionDTO } from '../types';

const { Text } = Typography;

const MODULE_OPTIONS = Object.values(PermissionModule).map((m) => ({ label: m, value: m }));

export const PermissionForm: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
    const isEditing = !!slug;
    const navigate = useNavigate();
    const [form] = Form.useForm<CreatePermissionDTO>();

    // For editing, look up the permission from the list rather than a separate endpoint
    const { data: permissions, isLoading } = usePermissions();
    const existingPermission = isEditing
        ? permissions?.find((p) => p.action === slug)
        : undefined;

    const createPerm = useCreatePermission();
    const updatePerm = useUpdatePermission();

    useEffect(() => {
        if (existingPermission && isEditing) {
            form.setFieldsValue({
                slug: existingPermission.action ?? '',
                name: existingPermission.name,
                description: existingPermission.description ?? undefined,
                module: existingPermission.module ?? undefined,
            });
        }
    }, [existingPermission, form, isEditing]);

    const onFinish = async (values: CreatePermissionDTO) => {
        try {
            if (isEditing && slug) {
                await updatePerm.mutateAsync({ slug, data: values });
                message.success('Permission updated');
            } else {
                await createPerm.mutateAsync(values);
                message.success('Permission created');
            }
            navigate('/permissions');
        } catch {
            message.error(`Failed to ${isEditing ? 'update' : 'create'} permission`);
        }
    };

    if (isEditing && isLoading) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    }

    return (
        <Card style={{ maxWidth: 600 }} variant="borderless">
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Form.Item
                    name="slug"
                    label="Action Slug"
                    rules={[
                        { required: true, message: 'Required' },
                        {
                            pattern: /^[a-z0-9]+(?:\.[a-z0-9]+)*(?:-[a-z0-9]+)*$/,
                            message: 'Format: module.resource.action (e.g. auth.role.create)',
                        },
                    ]}
                    extra={<Text type="secondary">Immutable after creation. Format: module.resource.action</Text>}
                >
                    <Input
                        placeholder="e.g. auth.role.create"
                        disabled={isEditing}
                        style={{ fontFamily: 'monospace' }}
                    />
                </Form.Item>

                <Form.Item
                    name="name"
                    label="Display Name"
                    rules={[{ required: true, message: 'Required' }]}
                >
                    <Input placeholder="e.g. Create Role" />
                </Form.Item>

                <Form.Item name="module" label="Module">
                    <Select options={MODULE_OPTIONS} placeholder="Select module" allowClear />
                </Form.Item>

                <Form.Item name="description" label="Description">
                    <Input.TextArea rows={3} placeholder="Short description of what this permission grants..." />
                </Form.Item>

                <div style={{ textAlign: 'right' }}>
                    <Space>
                        <Button onClick={() => navigate('/permissions')}>Cancel</Button>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={createPerm.isPending || updatePerm.isPending}
                        >
                            {isEditing ? 'Save Changes' : 'Create Permission'}
                        </Button>
                    </Space>
                </div>
            </Form>
        </Card>
    );
};
