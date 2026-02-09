import { LoginForm } from '@/features/auth/login-form';
import { Flex, Typography } from 'antd';

const { Title, Text } = Typography;

export const LoginPage = () => {
    return (
        <Flex justify="center" align="center" style={{ minHeight: '100vh', flexDirection: 'column', background: '#f0f2f5' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ fontFamily: 'Playfair Display', color: '#0B2545', margin: 0 }}>Ray Paradis</Title>
                <Text type="secondary">Back Office Management</Text>
            </div>
            <LoginForm />
        </Flex>
    );
};
