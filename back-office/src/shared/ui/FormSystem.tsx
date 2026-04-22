import React from 'react';
import {
    Form, Input, InputNumber, Select, Switch, DatePicker,
    Typography, Card, Space, Row, Col, Button, Upload
} from 'antd';
import { InboxOutlined } from '@ant-design/icons';


const { Title, Text } = Typography;

export type FormFieldType = 'text' | 'number' | 'currency' | 'select' | 'toggle' | 'date' | 'textarea' | 'media-upload' | 'password';

// Standard Validation Presets
export const ValidationRules = {
    required: (label: string) => ({ required: true, message: `${label} is required` }),
    email: { type: 'email' as const, message: 'Please enter a valid email' },
    phone: { pattern: /^[0-9+-\s()]*$/, message: 'Please enter a valid phone number' },
    slug: { pattern: /^[a-z0-9-]+$/, message: 'Slug must contain only lowercase letters, numbers, and dashes' },
    price: { type: 'number' as const, min: 0, message: 'Price cannot be negative' }
};

export interface FormFieldSchema {
    name: string;
    label: string;
    type: FormFieldType;
    required?: boolean;
    colSpan?: number;
    options?: { label: string; value: any }[];
    placeholder?: string;
    rules?: any[];
    extraProps?: any;
}

export interface FormSectionSchema {
    title: string;
    description?: string;
    fields: FormFieldSchema[];
}

// ─── Luxury Form Components ────────────────────────────────────────────────

interface LuxuryFormProps {
    sections: FormSectionSchema[];
    initialValues?: any;
    onFinish: (values: any) => void;
    loading?: boolean;
    onCancel?: () => void;
    submitText?: string;
    /**
     * Principal Hardening: Layout Mode
     * 'viewport': Fixed to bottom of screen (default for main pages)
     * 'container': Sticky to bottom of form container (default for Modals/Drawers)
     */
    layoutMode?: 'viewport' | 'container';
}

export const LuxuryForm: React.FC<LuxuryFormProps> = ({
    sections,
    initialValues,
    onFinish,
    loading,
    onCancel,
    submitText = 'Save Changes',
    layoutMode = 'viewport'
}) => {
    const [form] = Form.useForm();

    const renderField = (field: FormFieldSchema) => {
        const commonProps = {
            placeholder: field.placeholder,
            disabled: loading,
            style: { width: '100%' },
            ...field.extraProps
        };

        switch (field.type) {
            case 'number': return <InputNumber {...commonProps} />;
            case 'currency': return <InputNumber {...commonProps} prefix="₫" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />;
            case 'select': return <Select {...commonProps} options={field.options} dropdownStyle={{ borderRadius: 'var(--radius-sm)' }} />;
            case 'toggle': return <Switch disabled={loading} />;
            case 'date': return <DatePicker {...commonProps} />;
            case 'textarea': return <Input.TextArea {...commonProps} rows={4} />;
            case 'password': return <Input.Password {...commonProps} />;
            case 'media-upload':
                return (
                    <Upload.Dragger
                        {...commonProps}
                        name="file"
                        multiple={false}
                        beforeUpload={() => false}
                    >
                        <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                        <p className="ant-upload-text">Click or drag image to upload</p>
                    </Upload.Dragger>
                );
            default: return <Input {...commonProps} />;
        }
    };

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            onFinish={onFinish}
            requiredMark={false}
            style={{
                position: 'relative',
                paddingBottom: layoutMode === 'viewport' ? '100px' : '0'
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {sections.map((section, idx) => (
                    <FormSection key={idx} title={section.title} description={section.description}>
                        <Row gutter={[24, 16]}>
                            {section.fields.map((field) => (
                                <Col key={field.name} span={field.colSpan || 12}>
                                    <Form.Item
                                        name={field.name}
                                        label={<Text strong style={{ fontSize: '12px', color: 'var(--color-neutral-600)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{field.label}</Text>}
                                        rules={[
                                            ...(field.required ? [ValidationRules.required(field.label)] : []),
                                            ...(field.rules || [])
                                        ]}
                                        valuePropName={field.type === 'toggle' ? 'checked' : field.type === 'media-upload' ? 'fileList' : 'value'}
                                        getValueFromEvent={(e) => {
                                            if (field.type === 'media-upload') {
                                                return Array.isArray(e) ? e : e?.fileList;
                                            }
                                            return e;
                                        }}
                                    >
                                        {renderField(field)}
                                    </Form.Item>
                                </Col>
                            ))}
                        </Row>
                    </FormSection>
                ))}
            </div>

            <FormActionBar
                onCancel={onCancel}
                submitText={submitText}
                loading={loading}
                layoutMode={layoutMode}
            />
        </Form>
    );
};

// ─── Layout Components ─────────────────────────────────────────────────────

export const FormSection: React.FC<{ title: string; description?: string; children: React.ReactNode }> = ({
    title, description, children
}) => (
    <Card
        bordered={false}
        style={{ borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)' }}
        styles={{
            header: { borderBottom: '1px solid var(--color-neutral-100)', padding: '16px 24px' },
            body: { padding: '24px' }
        }}
        title={
            <Space direction="vertical" size={2}>
                <Title level={5} style={{ margin: 0, color: 'var(--color-primary)', fontSize: '16px' }}>{title}</Title>
                {description && <Text type="secondary" style={{ fontSize: '12px', fontWeight: 400 }}>{description}</Text>}
            </Space>
        }
    >
        {children}
    </Card>
);

interface FormActionBarProps {
    onCancel?: () => void;
    submitText: string;
    loading?: boolean;
    layoutMode?: 'viewport' | 'container';
}

export const FormActionBar: React.FC<FormActionBarProps> = ({
    onCancel, submitText, loading, layoutMode = 'viewport'
}) => {
    const isViewport = layoutMode === 'viewport';

    return (
        <div style={{
            position: isViewport ? 'fixed' : 'sticky',
            bottom: 0,
            right: 0,
            left: isViewport ? 'var(--sidebar-width)' : 0,
            background: 'var(--color-background-surface-alpha, rgba(255, 255, 255, 0.8))',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--color-border-subtle)',
            padding: '16px 40px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            zIndex: isViewport ? 'var(--z-action-bar)' : 100,
            boxShadow: isViewport ? 'var(--shadow-lg-inverse)' : '0 -4px 12px rgba(0,0,0,0.03)',
            transition: 'left var(--sidebar-transition)',
            marginTop: isViewport ? 0 : '32px',
            marginLeft: isViewport ? 0 : '-24px',
            marginRight: isViewport ? 0 : '-24px',
            borderBottomLeftRadius: isViewport ? 0 : 'var(--radius-md)',
            borderBottomRightRadius: isViewport ? 0 : 'var(--radius-md)'
        }}>
            <Space size={16}>
                {onCancel && (
                    <Button onClick={onCancel} disabled={loading} type="text" style={{ fontWeight: 500 }}>
                        Cancel
                    </Button>
                )}
                <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    style={{
                        height: '40px',
                        padding: '0 32px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--color-primary)',
                        border: 'none',
                        fontWeight: 600,
                        boxShadow: 'var(--shadow-md)'
                    }}
                >
                    {submitText}
                </Button>
            </Space>
        </div>
    );
};
