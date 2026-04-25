import React, { useState } from 'react';
import {
    Typography,
    Card,
    Row,
    Col,
    Avatar,
    Button,
    Form,
    Input,
    Space,
    Tabs,
    Tag,
    Divider,
    App,
    Upload,
    Tooltip,
    List,
    Skeleton
} from 'antd';
import {
    UserOutlined,
    EditOutlined,
    CameraOutlined,
    MailOutlined,
    PhoneOutlined,
    SafetyCertificateOutlined,
    KeyOutlined,
    HistoryOutlined,
    IdcardOutlined,
    GlobalOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/features/auth/model/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { profileApi } from '@/shared/api/profileApi';

import { useTranslation } from 'react-i18next';

const { Title, Text, Paragraph } = Typography;

export const ProfilePage: React.FC = () => {
    const { t } = useTranslation();
    const { user, setAuth, accessToken, refreshToken } = useAuthStore();
    const { message, notification } = App.useApp();
    const queryClient = useQueryClient();
    const [form] = Form.useForm();
    const [isEditing, setIsEditing] = useState(false);

    // -------------------------------------------------------------------------
    // DATA FETCHING
    // -------------------------------------------------------------------------
    const { data: profile, isLoading } = useQuery({
        queryKey: ['profile-me'],
        queryFn: profileApi.getMe,
    });

    // Sync store and form with fresh profile data (stable sync)
    React.useEffect(() => {
        if (profile) {
            // Hydrate the form immediately when data arrives
            form.setFieldsValue(profile);

            const currentUser = useAuthStore.getState().user;
            if (currentUser) {
                // Determine if we actually need to sync (avoiding infinite loops)
                const hasChanges =
                    profile.nickName !== currentUser.nickName ||
                    profile.avatarUrl !== currentUser.avatarUrl ||
                    profile.fullName !== currentUser.fullName ||
                    profile.bio !== currentUser.bio;

                if (hasChanges) {
                    setAuth({ ...currentUser, ...profile }, accessToken!, refreshToken!);
                }
            }
        }
    }, [profile, setAuth, accessToken, refreshToken, form]);

    // -------------------------------------------------------------------------
    // MUTATIONS
    // -------------------------------------------------------------------------
    const updateProfileMutation = useMutation({
        mutationFn: profileApi.updateProfile,
        onSuccess: (data) => {
            message.success(t('profile.update_success', { defaultValue: 'Profile updated successfully' }));
            setIsEditing(false);
            queryClient.setQueryData(['profile-me'], data);
            if (user) {
                setAuth({ ...user, ...data }, accessToken!, refreshToken!);
            }
        },
        onError: (error: any) => {
            notification.error({
                message: t('profile.update_failed', { defaultValue: 'Update Failed' }),
                description: error.response?.data?.message || t('profile.update_error', { defaultValue: 'Could not update profile' })
            });
        }
    });

    // -------------------------------------------------------------------------
    // HANDLERS
    // -------------------------------------------------------------------------
    const handleUpdate = async () => {
        try {
            const values = await form.validateFields();
            updateProfileMutation.mutate(values);
        } catch (e) {
            // Validation failed
        }
    };

    if (isLoading) {
        return (
            <div style={{ padding: 24 }}>
                <Skeleton avatar active paragraph={{ rows: 4 }} />
                <Divider />
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    const currentProfile = profile || user;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{ padding: '0 0 40px 0' }}
        >
            {/* Header / Identity Bar */}
            <div style={{
                height: 240,
                background: `url('https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&q=80&w=2000') center/cover no-repeat`,
                borderRadius: '0 0 24px 24px',
                position: 'relative',
                marginBottom: 80,
                boxShadow: 'inset 0 0 100px rgba(0,0,0,0.5)'
            }}>
                <div style={{
                    position: 'absolute',
                    bottom: -60,
                    left: 40,
                    display: 'flex',
                    alignItems: 'flex-end',
                    gap: 24
                }}>
                    <div style={{ position: 'relative' }}>
                        <Avatar
                            size={120}
                            src={currentProfile?.avatarUrl}
                            icon={<UserOutlined />}
                            style={{
                                border: '4px solid #fff',
                                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                                backgroundColor: '#f0f0f0'
                            }}
                        />
                        <Upload showUploadList={false} className="avatar-uploader">
                            <Button
                                shape="circle"
                                icon={<CameraOutlined />}
                                style={{
                                    position: 'absolute',
                                    bottom: 4,
                                    right: 4,
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                                }}
                            />
                        </Upload>
                    </div>
                    <div style={{ paddingBottom: 8 }}>
                        <Title level={2} style={{
                            margin: 0,
                            color: '#fff',
                            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
                            fontWeight: 700
                        }}>
                            {currentProfile?.fullName || user?.fullName || 'User'}
                        </Title>
                        <Space>
                            <Tag color="gold" icon={<SafetyCertificateOutlined />}>
                                {currentProfile?.roles?.[0] || t('profile.member', { defaultValue: 'Member' })}
                            </Tag>
                            <Text style={{
                                color: 'rgba(255,255,255,0.9)',
                                textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                                fontWeight: 500
                            }}>
                                <ClockCircleOutlined /> {t('profile.joined', { defaultValue: 'Joined' })} {currentProfile?.createdAt ? new Date(currentProfile.createdAt).toLocaleDateString() : 'N/A'}
                            </Text>
                        </Space>
                    </div>
                </div>
                <div style={{ position: 'absolute', bottom: 20, right: 40 }}>
                    {!isEditing ? (
                        <Button
                            type="primary"
                            icon={<EditOutlined />}
                            onClick={() => {
                                setIsEditing(true);
                                form.setFieldsValue(currentProfile);
                            }}
                            style={{ borderRadius: 8 }}
                        >
                            {t('profile.edit_profile')}
                        </Button>
                    ) : (
                        <Space>
                            <Button onClick={() => setIsEditing(false)}>{t('profile.cancel')}</Button>
                            <Button
                                type="primary"
                                loading={updateProfileMutation.isPending}
                                onClick={handleUpdate}
                                style={{ borderRadius: 8 }}
                            >
                                {t('profile.save_changes')}
                            </Button>
                        </Space>
                    )}
                </div>
            </div>

            <Row gutter={24} style={{ padding: '0 40px' }}>
                {/* Left Column: Details */}
                <Col xs={24} lg={16}>
                    <Card style={{ borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <Tabs defaultActiveKey="1" items={[
                            {
                                key: '1',
                                label: <Space><IdcardOutlined />{t('profile.basic_info')}</Space>,
                                children: (
                                    <Form
                                        form={form}
                                        layout="vertical"
                                        disabled={!isEditing}
                                        style={{ marginTop: 16 }}
                                    >
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="fullName" label={t('profile.full_name')} rules={[{ required: true }]}>
                                                    <Input prefix={<UserOutlined />} placeholder={t('profile.full_name')} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="nickName" label={t('profile.nickname')}>
                                                    <Input placeholder={t('profile.nickname')} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item name="email" label={t('profile.email')} rules={[{ type: 'email' }]}>
                                                    <Input prefix={<MailOutlined />} placeholder={t('profile.email')} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item name="phone" label={t('profile.phone')}>
                                                    <Input prefix={<PhoneOutlined />} placeholder={t('profile.phone')} />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Form.Item name="bio" label={t('profile.bio')}>
                                            <Input.TextArea rows={4} placeholder="..." />
                                        </Form.Item>
                                    </Form>
                                )
                            },
                            {
                                key: '2',
                                label: <Space><HistoryOutlined />{t('profile.activity_log')}</Space>,
                                children: (
                                    <div style={{ marginTop: 16 }}>
                                        <List
                                            itemLayout="horizontal"
                                            dataSource={[
                                                { title: 'Update Profile', date: '2 hours ago', desc: 'Changed nickname to Johnny' },
                                                { title: 'Login detected', date: '5 hours ago', desc: 'Secure login from Chrome / Windows' },
                                                { title: 'Password changed', date: '3 days ago', desc: 'Account security updated successfully' },
                                            ]}
                                            renderItem={(item) => (
                                                <List.Item>
                                                    <List.Item.Meta
                                                        avatar={<Avatar icon={<HistoryOutlined />} />}
                                                        title={<Text strong>{item.title}</Text>}
                                                        description={
                                                            <Space direction="vertical" size={0}>
                                                                <Text type="secondary">{item.date}</Text>
                                                                <Text>{item.desc}</Text>
                                                            </Space>
                                                        }
                                                    />
                                                </List.Item>
                                            )}
                                        />
                                    </div>
                                )
                            }
                        ]} />
                    </Card>
                </Col>

                {/* Right Column: Security & Stats */}
                <Col xs={24} lg={8}>
                    <Card
                        title={<Space><SafetyCertificateOutlined />{t('profile.security_status')}</Space>}
                        style={{ borderRadius: 16, marginBottom: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    >
                        <Space direction="vertical" style={{ width: '100%' }} size={16}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">{t('profile.email_verified')}</Text>
                                <Tag color={currentProfile?.isEmailVerified ? 'green' : 'red'}>
                                    {currentProfile?.isEmailVerified ? t('profile.verified') : t('profile.not_verified')}
                                </Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary">{t('profile.2fa_status')}</Text>
                                <Tag color="default">{t('profile.not_configured')}</Tag>
                            </div>
                            <Divider style={{ margin: '8px 0' }} />
                            <Button block icon={<KeyOutlined />}>{t('profile.change_password')}</Button>
                            <Button block ghost type="primary" icon={<GlobalOutlined />}>{t('profile.security_settings')}</Button>
                        </Space>
                    </Card>

                    <Card
                        title={<Space><GlobalOutlined />{t('profile.preferences')}</Space>}
                        style={{ borderRadius: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                    >
                        <Paragraph type="secondary">
                            {t('profile.preferences_sync_note', { defaultValue: 'Your preferences (language, theme) are synced across all your devices.' })}
                        </Paragraph>
                        <Button type="link" style={{ padding: 0 }}>{t('profile.view_all_preferences')}</Button>
                    </Card>
                </Col>
            </Row>
        </motion.div>
    );
};
