import { Modal, Form, Input, Select, Switch, message, Row, Col, Alert, Typography } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUserApi, updateUserApi } from '@/entities/user/api';
import type { CreateUserDto, UpdateUserDto, User } from '@/entities/user/model/types';
import { useEffect } from 'react';
import { LockOutlined, MailOutlined, PhoneOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface UserFormDialogProps {
    visible: boolean;
    onClose: () => void;
    user?: User; // If provided, it's edit mode
}

export const UserFormDialog = ({ visible, onClose, user }: UserFormDialogProps) => {
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const isEditMode = !!user;

    useEffect(() => {
        if (visible) {
            if (isEditMode) {
                form.setFieldsValue(user);
            } else {
                form.resetFields();
            }
        }
    }, [visible, user, form, isEditMode]);

    const mutation = useMutation({
        mutationFn: (data: any) => {
            if (isEditMode) {
                return updateUserApi(user.id, data as UpdateUserDto);
            }
            return createUserApi(data as CreateUserDto);
        },
        onSuccess: () => {
            message.success(`User successfully ${isEditMode ? 'updated' : 'created'}`);
            queryClient.invalidateQueries({ queryKey: ['users'] });
            onClose();
        },
    });

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            mutation.mutate(values);
        } catch (error) {
            // Validation failed automatically highlighted by antd
        }
    };

    return (
        <Modal
            title={
                <div>
                    <Text strong style={{ fontSize: '16px' }}>
                        {isEditMode ? 'Edit User Configuration' : 'Create New User Account'}
                    </Text>
                    <div style={{ fontSize: '13px', color: '#888', fontWeight: 'normal' }}>
                        {isEditMode ? 'Update user roles and details.' : 'Add a new member to the back-office.'}
                    </div>
                </div>
            }
            open={visible}
            onOk={handleSubmit}
            onCancel={onClose}
            confirmLoading={mutation.isPending}
            destroyOnClose
            width={600}
            okText={isEditMode ? 'Save Changes' : 'Create Account'}
            maskClosable={false}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{ isActive: true, role: 'staff' }}
                style={{ marginTop: 24 }}
            >
                {isEditMode && user.role === 'admin' && (
                    <Alert
                        message="Admin privileges"
                        description="Be careful when modifying an Administrator account."
                        type="warning"
                        showIcon
                        style={{ marginBottom: 24 }}
                    />
                )}

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="fullName"
                            label="Full Name"
                            rules={[{ required: true, message: 'Please enter full name' }]}
                        >
                            <Input prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="ex: Ray Paradis" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="email"
                            label="Email Address"
                            rules={[
                                { required: true, message: 'Please enter email' },
                                { type: 'email', message: 'Please enter a valid email' }
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                placeholder="ex: email@example.com"
                                disabled={isEditMode}
                            />
                        </Form.Item>
                    </Col>
                </Row>

                {!isEditMode && (
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item
                                name="password"
                                label="Temporary Password"
                                rules={[
                                    { required: true, message: 'Please enter a password' },
                                    { min: 6, message: 'Password must be at least 6 characters' }
                                ]}
                                help="The user can change this later."
                            >
                                <Input.Password
                                    prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                    placeholder="Minimum 6 characters"
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                )}

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="role"
                            label="System Role"
                            rules={[{ required: true, message: 'Please select a role' }]}
                        >
                            <Select placeholder="Select access level">
                                <Select.Option value="admin">Administrator</Select.Option>
                                <Select.Option value="manager">Manager</Select.Option>
                                <Select.Option value="staff">Staff Member</Select.Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="phone"
                            label="Phone Number"
                        >
                            <Input prefix={<PhoneOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} placeholder="+84 987 654 321" />
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item
                    name="isActive"
                    label="Account Status"
                    valuePropName="checked"
                    help="Inactive accounts cannot log into the system."
                >
                    <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                </Form.Item>
            </Form>
        </Modal>
    );
};
