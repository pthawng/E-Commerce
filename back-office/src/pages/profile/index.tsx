import React from 'react';
import { UserOutlined, HomeOutlined, SecurityScanOutlined, EditOutlined, KeyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { Row, Col, Typography, Descriptions, Button, Divider, Modal, Form, Input, message, Upload } from 'antd';
import { PageContainer } from '@/app/layout/PageContainer';
import { SectionBlock, UserAvatar } from '@/shared/ui';
import { colors } from '@/shared/design-system/colors';
import { useAuthStore } from '@/entities/user/model/authStore';
import { updateUserApi } from '@/entities/user/api';
import { uploadFileApi } from '@/shared/api/storage.api';

const { Title, Text } = Typography;

export const ProfilePage = () => {
    const user = useAuthStore((state) => state.user);
    const updateUserStore = useAuthStore((state) => state.updateUser);

    const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
    const [isPassModalOpen, setIsPassModalOpen] = React.useState(false);
    const [form] = Form.useForm();
    const [passForm] = Form.useForm();
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);

    const handleUpdateProfile = async (values: any) => {
        if (!user?.id) return;
        setLoading(true);
        try {
            await updateUserApi(user.id, values);
            updateUserStore(values);
            message.success('Profile updated successfully');
            setIsEditModalOpen(false);
        } catch (error) {
            message.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleAvatarUpload = async (info: any) => {
        const { file } = info;
        if (!user?.id) return;

        setUploading(true);
        try {
            // AntD Upload gives us the file object in different ways depending on how it's called
            const fileToUpload = file.originFileObj || file;
            const response = await uploadFileApi(fileToUpload, 'avatars');

            // 2. Update user profile with new avatar URL
            await updateUserApi(user.id, { avatarUrl: response.url });
            updateUserStore({ avatarUrl: response.url });

            message.success('Avatar updated successfully');
        } catch (error) {
            console.error('Upload Error:', error);
            message.error('Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleChangePassword = async (_values: any) => {
        setLoading(true);
        // Simulate API call for password change
        setTimeout(() => {
            message.success('Password changed successfully');
            setIsPassModalOpen(false);
            passForm.resetFields();
            setLoading(false);
        }, 1000);
    };

    return (
        <PageContainer
            breadcrumbItems={[
                { title: <Link to="/dashboard"><HomeOutlined /></Link> },
                { title: 'Account' },
                { title: 'Profile' },
            ]}
        >
            <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                    <SectionBlock noPadding>
                        <div style={{
                            padding: '40px 24px',
                            textAlign: 'center',
                            background: `linear-gradient(180deg, ${colors.neutral[50]} 0%, white 100%)`,
                            borderRadius: '16px 16px 0 0'
                        }}>
                            <div style={{ position: 'relative', display: 'inline-block' }}>
                                <UserAvatar
                                    size={120}
                                    src={user?.avatarUrl || undefined}
                                    fullName={user?.fullName}
                                    style={{
                                        border: `4px solid white`,
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                                        marginBottom: '20px',
                                    }}
                                />
                                <Upload
                                    showUploadList={false}
                                    customRequest={handleAvatarUpload}
                                    accept="image/*"
                                >
                                    <Button
                                        shape="circle"
                                        icon={<EditOutlined />}
                                        size="small"
                                        loading={uploading}
                                        style={{
                                            position: 'absolute',
                                            bottom: '25px',
                                            right: '5px',
                                            background: colors.secondary.main,
                                            color: 'white',
                                            border: 'none',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                        }}
                                    />
                                </Upload>
                            </div>
                            <Title level={4} style={{ marginBottom: '4px' }}>{user?.fullName || 'Administrator'}</Title>
                            <Text type="secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                {user?.email} {user?.isEmailVerified && <CheckCircleOutlined style={{ color: colors.success.main, fontSize: '12px' }} />}
                            </Text>
                        </div>
                        <div style={{ padding: '24px' }}>
                            <Button
                                block
                                type="primary"
                                shape="round"
                                size="large"
                                icon={<EditOutlined />}
                                onClick={() => {
                                    form.setFieldsValue({
                                        fullName: user?.fullName,
                                        phone: user?.phone
                                    });
                                    setIsEditModalOpen(true);
                                }}
                            >
                                Edit Profile
                            </Button>
                        </div>
                    </SectionBlock>
                </Col>

                <Col xs={24} lg={16}>
                    <SectionBlock>
                        <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserOutlined /> Personal Information
                        </Title>
                        <Divider style={{ margin: '16px 0 24px 0' }} />
                        <Descriptions
                            column={1}
                            styles={{ label: { color: colors.neutral[500], width: '160px' } }}
                        >
                            <Descriptions.Item label="Full Name">{user?.fullName || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Email Address">{user?.email || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Phone Number">{user?.phone || '—'}</Descriptions.Item>
                            <Descriptions.Item label="Account Type">
                                <Text strong style={{ color: colors.secondary.main }}>{user?.role?.toUpperCase() || 'STAFF'}</Text>
                            </Descriptions.Item>
                        </Descriptions>
                    </SectionBlock>

                    <div style={{ height: '24px' }} />

                    <SectionBlock>
                        <Title level={5} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <SecurityScanOutlined /> Security & Credentials
                        </Title>
                        <Divider style={{ margin: '16px 0 24px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <Text strong style={{ display: 'block' }}>Password</Text>
                                <Text type="secondary">Last changed 3 months ago</Text>
                            </div>
                            <Button
                                type="default"
                                shape="round"
                                icon={<KeyOutlined />}
                                onClick={() => setIsPassModalOpen(true)}
                            >
                                Change Password
                            </Button>
                        </div>
                    </SectionBlock>
                </Col>
            </Row>

            {/* Edit Profile Modal */}
            <Modal
                title="Edit Personal Information"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={loading}
                destroyOnHidden
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    style={{ marginTop: '20px' }}
                >
                    <Form.Item
                        name="fullName"
                        label="Full Name"
                        rules={[{ required: true, message: 'Please enter your full name' }]}
                    >
                        <Input placeholder="Enter full name" />
                    </Form.Item>
                    <Form.Item
                        name="phone"
                        label="Phone Number"
                    >
                        <Input placeholder="Enter phone number" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* Change Password Modal */}
            <Modal
                title="Change Password"
                open={isPassModalOpen}
                onCancel={() => setIsPassModalOpen(false)}
                onOk={() => passForm.submit()}
                confirmLoading={loading}
                destroyOnHidden
            >
                <Form
                    form={passForm}
                    layout="vertical"
                    onFinish={handleChangePassword}
                    style={{ marginTop: '20px' }}
                >
                    <Form.Item
                        name="currentPassword"
                        label="Current Password"
                        rules={[{ required: true, message: 'Required' }]}
                    >
                        <Input.Password placeholder="••••••••" />
                    </Form.Item>
                    <Form.Item
                        name="newPassword"
                        label="New Password"
                        rules={[{ required: true, message: 'Required' }, { min: 8, message: 'Minimum 8 characters' }]}
                    >
                        <Input.Password placeholder="••••••••" />
                    </Form.Item>
                    <Form.Item
                        name="confirmPassword"
                        label="Confirm New Password"
                        dependencies={['newPassword']}
                        rules={[
                            { required: true, message: 'Required' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('newPassword') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('Passwords do not match'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="••••••••" />
                    </Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    );
};

export default ProfilePage;
