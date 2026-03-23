import React, { useEffect } from 'react';
import { Form, Input, Checkbox, Card, Row, Col, Typography, Button, Space, message, Spin, Divider } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useRole, usePermissions, useCreateRole, useUpdateRole } from '../hooks';
import type { CreateRoleDTO, Permission } from '../types';

const { Title, Text } = Typography;

export const RoleForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const isEditing = !!id;
    const navigate = useNavigate();
    const [form] = Form.useForm<CreateRoleDTO>();

    const { data: role, isLoading: isLoadingRole } = useRole(id);
    const { data: permissions, isLoading: isLoadingPermissions } = usePermissions();
    const createRole = useCreateRole();
    const updateRole = useUpdateRole();

    // Group permissions by module
    const permissionsByModule = React.useMemo(() => {
        if (!permissions) return {};
        return permissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
            const module = perm.module || 'OTHER';
            if (!acc[module]) acc[module] = [];
            acc[module].push(perm);
            return acc;
        }, {} as Record<string, Permission[]>);
    }, [permissions]);

    useEffect(() => {
        if (role && isEditing) {
            form.setFieldsValue({
                name: role.name,
                slug: role.slug,
                description: role.description || undefined,
                permissionIds: role.permissions?.map((p: Permission) => p.id) || []
            });
        }
    }, [role, form, isEditing]);

    const onFinish = async (values: CreateRoleDTO) => {
        try {
            if (isEditing) {
                await updateRole.mutateAsync({ id, data: values });
                message.success('Role updated successfully');
            } else {
                await createRole.mutateAsync(values);
                message.success('Role created successfully');
            }
            navigate('/roles');
        } catch (error) {
            message.error(`Failed to ${isEditing ? 'update' : 'create'} role`);
        }
    };

    if ((isEditing && isLoadingRole) || isLoadingPermissions) {
        return <div style={{ textAlign: 'center', padding: 50 }}><Spin size="large" /></div>;
    }

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{ permissionIds: [] }}
        >
            <Row gutter={24}>
                <Col xs={24} lg={8}>
                    <Card title="Role Details" bordered={false}>
                        <Form.Item
                            name="name"
                            label="Role Name"
                            rules={[{ required: true, message: 'Please enter role name' }]}
                        >
                            <Input placeholder="e.g. Inventory Manager" />
                        </Form.Item>

                        <Form.Item
                            name="slug"
                            label="Slug Identifier"
                            rules={[{ required: true, message: 'Please enter role slug' }]}
                            extra="Used internally for code reference (e.g. inventory-manager)"
                        >
                            <Input placeholder="e.g. inventory-manager" />
                        </Form.Item>

                        <Form.Item
                            name="description"
                            label="Description"
                        >
                            <Input.TextArea rows={4} placeholder="Description of what this role does..." />
                        </Form.Item>
                    </Card>
                </Col>

                <Col xs={24} lg={16}>
                    <Card title="Permissions" bordered={false}>
                        <Form.Item name="permissionIds" valuePropName="value">
                            <Checkbox.Group style={{ width: '100%' }}>
                                {(Object.entries(permissionsByModule) as [string, Permission[]][]).map(([module, perms]) => (
                                    <div key={module} style={{ marginBottom: 24 }}>
                                        <Title level={5} style={{ marginBottom: 12 }}>{module}</Title>
                                        <Row>
                                            {perms.map((p: Permission) => (
                                                <Col xs={24} sm={12} md={8} key={p.id} style={{ marginBottom: 8 }}>
                                                    <Checkbox value={p.id}>
                                                        <Space direction="vertical" size={0}>
                                                            <span>{p.action}</span>
                                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                                {p.name}
                                                            </Text>
                                                        </Space>
                                                    </Checkbox>
                                                </Col>
                                            ))}
                                        </Row>
                                        <Divider style={{ margin: '16px 0' }} />
                                    </div>
                                ))}
                            </Checkbox.Group>
                        </Form.Item>
                    </Card>
                </Col>
            </Row>

            <div style={{ marginTop: 24, textAlign: 'right' }}>
                <Space>
                    <Button onClick={() => navigate('/roles')}>Cancel</Button>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={createRole.isPending || updateRole.isPending}
                    >
                        {isEditing ? 'Save Changes' : 'Create Role'}
                    </Button>
                </Space>
            </div>
        </Form>
    );
};
