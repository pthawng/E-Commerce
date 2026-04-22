import React, { useMemo } from 'react';
import { Table, Tag, Typography, Badge, Image, Card, Space, Button, Divider, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { EllipsisOutlined } from '@ant-design/icons';
import type { ColumnsType, TableProps } from 'antd/es/table';
import dayjs from 'dayjs';
import { usePermission } from '@/entities/user/hooks';

const { Text } = Typography;

export type ColumnType =
    | 'id'
    | 'text'
    | 'currency'
    | 'currency-range'
    | 'date'
    | 'status-badge'
    | 'image'
    | 'thumbnail-info'
    | 'boolean'
    | 'featured'
    | 'actions'
    | 'number';

export interface RowActionConfig<T> {
    key: string;
    label: string;
    icon?: React.ReactNode;
    onClick: (record: T) => void;
    danger?: boolean;
    disabled?: boolean;
    requiredPermission?: string;
    confirm?: {
        title: string;
        content?: string;
    };
}

export interface ColumnSchema<T> {
    key: keyof T | string;
    title: string;
    type: ColumnType;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
    sorter?: boolean;
    requiredPermission?: string;
    renderOptions?: {
        statusMap?: Record<string, { color: string; bg: string; border?: string }>;
        dateFormat?: string;
        currencyCode?: string;
        subKey?: string;
        imageKey?: string;
        minKey?: string;
        maxKey?: string;
        /**
         * Principal Hardening: Actions are now configuration-driven.
         * Raw JSX injection is prohibited to ensure architectural integrity.
         */
        actions?: (record: T) => RowActionConfig<T>[];
    };
}

export interface BulkAction<T> {
    key: string;
    label: string;
    icon?: React.ReactNode;
    requiredPermission?: string;
    onClick: (selectedRows: T[]) => void;
    danger?: boolean;
}

interface LuxuryTableProps<T> extends Omit<TableProps<T>, 'columns'> {
    schema: ColumnSchema<T>[];
    onRowClick?: (record: T) => void;
    selectedRowId?: string;
    onPageChange?: (page: number, pageSize: number) => void;
    bulkActions?: BulkAction<T>[];
    getRowPriority?: (record: T) => 'high' | 'medium' | 'low' | undefined;
    strict?: boolean;
}

export function LuxuryTable<T extends { id: string | number }>({
    schema,
    dataSource,
    loading,
    pagination,
    onRowClick,
    selectedRowId,
    onPageChange,
    bulkActions,
    getRowPriority,
    strict,
    ...rest
}: LuxuryTableProps<T>) {
    const { can } = usePermission();

    const getValue = (obj: any, path: string) => {
        return path.split(/[.[\]]/).filter(Boolean).reduce((acc, part) => acc && acc[part], obj);
    };

    const getStatusStyle = (val: any, statusMap?: Record<string, { color: string; bg: string; border?: string }>) => {
        const stringVal = String(val);
        if (statusMap && statusMap[stringVal]) return statusMap[stringVal];

        const status = stringVal.toLowerCase();
        if (['completed', 'delivered', 'active', 'success'].includes(status))
            return {
                color: 'var(--color-status-success-text)',
                bg: 'var(--color-status-success-bg)',
                border: 'var(--color-status-success-border)'
            };
        if (['pending', 'confirmed', 'processing', 'warning'].includes(status))
            return {
                color: 'var(--color-status-warning-text)',
                bg: 'var(--color-status-warning-bg)',
                border: 'var(--color-status-warning-border)'
            };
        if (['cancelled', 'failed', 'inactive', 'error'].includes(status))
            return {
                color: 'var(--color-status-error-text)',
                bg: 'var(--color-status-error-bg)',
                border: 'var(--color-status-error-border)'
            };
        if (['shipping', 'info'].includes(status))
            return {
                color: 'var(--color-status-info-text)',
                bg: 'var(--color-status-info-bg)',
                border: 'var(--color-status-info-border)'
            };

        return {
            color: 'var(--color-neutral-600)',
            bg: 'var(--color-neutral-100)',
            border: 'transparent'
        };
    };

    const columns: ColumnsType<T> = useMemo(() => {
        return schema
            .filter(col => !col.requiredPermission || can(col.requiredPermission))
            .map((col) => {
                const dataIndex = typeof col.key === 'string' && col.key.includes('.')
                    ? col.key.split('.')
                    : col.key;

                const baseCol: any = {
                    title: col.title,
                    dataIndex,
                    key: col.key as string,
                    width: col.width,
                    align: col.align,
                    sorter: col.sorter,
                };

                switch (col.type) {
                    case 'id':
                        baseCol.render = (val: string, record: T) => {
                            const displayVal = val || getValue(record, col.key as string);
                            const idStr = String(displayVal);
                            const truncated = idStr.length > 12 ? `${idStr.substring(0, 6)}...${idStr.substring(idStr.length - 4)}` : idStr;
                            return (
                                <Text strong style={{
                                    color: 'var(--color-primary)',
                                    letterSpacing: '0.04em',
                                    fontSize: '12px',
                                    fontFamily: 'monospace'
                                }}>
                                    #{truncated.toUpperCase()}
                                </Text>
                            );
                        };
                        break;

                    case 'currency':
                        baseCol.render = (val: number, record: T) => {
                            const displayVal = val !== undefined && val !== null ? val : getValue(record, col.key as string);
                            const currencyCode = col.renderOptions?.currencyCode || 'VND';
                            const locale = currencyCode === 'USD' ? 'en-US' : 'vi-VN';
                            const isHighValue = displayVal > 5000000;
                            return (
                                <Text strong style={{
                                    color: isHighValue ? 'var(--color-neutral-900)' : 'var(--color-neutral-700)',
                                    fontSize: isHighValue ? '15px' : '14px',
                                    fontWeight: isHighValue ? 700 : 500
                                }}>
                                    {displayVal !== undefined && displayVal !== null ? new Intl.NumberFormat(locale, {
                                        style: 'currency',
                                        currency: currencyCode
                                    }).format(displayVal) : '—'}
                                </Text>
                            );
                        };
                        break;

                    case 'date':
                        baseCol.render = (val: string, record: T) => {
                            const displayVal = val || getValue(record, col.key as string);
                            return (
                                <Text style={{ color: 'var(--color-neutral-500)', fontSize: '13px' }}>
                                    {displayVal ? dayjs(displayVal).format(col.renderOptions?.dateFormat || 'DD MMM, YYYY HH:mm') : '—'}
                                </Text>
                            );
                        };
                        break;

                    case 'status-badge':
                        baseCol.render = (val: string, record: T) => {
                            const displayVal = val || getValue(record, col.key as string);
                            const style = getStatusStyle(displayVal, col.renderOptions?.statusMap);
                            return (
                                <Tag
                                    style={{
                                        color: style.color,
                                        background: style.bg,
                                        border: `1px solid ${style.border}`,
                                        borderRadius: '6px',
                                        padding: '2px 10px',
                                        fontWeight: 700,
                                        fontSize: '10px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}
                                >
                                    {String(displayVal ?? '—').toUpperCase().replace('_', ' ')}
                                </Tag>
                            );
                        };
                        break;

                    case 'currency-range':
                        baseCol.render = (_: any, record: T) => {
                            const min = getValue(record, col.renderOptions?.minKey || 'minPrice') || 0;
                            const max = getValue(record, col.renderOptions?.maxKey || 'maxPrice');
                            const currencyCode = col.renderOptions?.currencyCode || 'VND';
                            const locale = currencyCode === 'USD' ? 'en-US' : 'vi-VN';
                            const formatter = new Intl.NumberFormat(locale, {
                                style: 'currency',
                                currency: currencyCode
                            });
                            return (
                                <Text strong style={{ color: 'var(--color-neutral-900)', fontSize: '14px' }}>
                                    {formatter.format(min)}
                                    {max && max > min && ` - ${formatter.format(max)}`}
                                </Text>
                            );
                        };
                        break;

                    case 'thumbnail-info':
                        baseCol.render = (val: any, record: T) => {
                            const imageSrc = getValue(record, col.renderOptions?.imageKey || 'imageUrl');
                            const subKey = col.renderOptions?.subKey;
                            const subValue = subKey ? getValue(record, subKey) : null;
                            const displayName = typeof val === 'object' ? (val.vi || val.en || '—') : val;

                            return (
                                <Space>
                                    {imageSrc ? (
                                        <Image
                                            src={imageSrc}
                                            width={40}
                                            height={40}
                                            style={{ objectFit: 'cover', borderRadius: 'var(--radius-xs)' }}
                                            preview={false}
                                        />
                                    ) : (
                                        <div style={{ width: 40, height: 40, background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-xs)' }} />
                                    )}
                                    <Space orientation="vertical" size={0}>
                                        <Text strong style={{ fontSize: '13px', color: 'var(--color-neutral-900)' }}>
                                            {displayName}
                                        </Text>
                                        {subValue && (
                                            <Text type="secondary" style={{ fontSize: '11px', fontFamily: 'monospace' }}>
                                                {subValue}
                                            </Text>
                                        )}
                                    </Space>
                                </Space>
                            );
                        };
                        break;

                    case 'image':
                        baseCol.render = (val: string | string[]) => {
                            const src = Array.isArray(val) ? val[0] : val;
                            return src ? (
                                <Image
                                    src={src}
                                    width={48}
                                    height={48}
                                    style={{ objectFit: 'cover', borderRadius: 'var(--radius-xs)', border: '1px solid var(--color-neutral-100)' }}
                                />
                            ) : (
                                <div style={{ width: 48, height: 48, background: 'var(--color-neutral-50)', borderRadius: 'var(--radius-xs)' }} />
                            );
                        };
                        break;

                    case 'featured':
                        baseCol.render = (val: boolean) => val ? (
                            <Tag color="gold" style={{ borderRadius: '100px', fontSize: '10px' }}>FEATURED</Tag>
                        ) : null;
                        break;

                    case 'boolean':
                        baseCol.render = (val: boolean) => (
                            <Badge status={val ? 'success' : 'default'} text={val ? 'Yes' : 'No'} />
                        );
                        break;

                    case 'number':
                        baseCol.render = (val: number) => (
                            <Text style={{ color: 'var(--color-neutral-900)', fontFamily: 'monospace' }}>
                                {val !== undefined && val !== null ? val.toLocaleString() : '—'}
                            </Text>
                        );
                        break;

                    case 'actions':
                        baseCol.render = (_: any, record: T) => {
                            const rowActions = col.renderOptions?.actions?.(record) || [];
                            const visibleActions = rowActions.filter(a => !a.requiredPermission || can(a.requiredPermission));

                            if (visibleActions.length === 0) return null;
                            if (visibleActions.length <= 2) {
                                return (
                                    <Space split={<Divider type="vertical" />} className="row-actions">
                                        {visibleActions.map(action => (
                                            <Button
                                                key={action.key}
                                                type="link"
                                                size="small"
                                                danger={action.danger}
                                                disabled={action.disabled}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    action.onClick(record);
                                                }}
                                                style={{ padding: 0 }}
                                            >
                                                {action.label}
                                            </Button>
                                        ))}
                                    </Space>
                                );
                            }

                            const items: MenuProps['items'] = visibleActions.map(action => ({
                                key: action.key,
                                label: action.label,
                                icon: action.icon,
                                danger: action.danger,
                                disabled: action.disabled,
                                onClick: ({ domEvent }) => {
                                    domEvent.stopPropagation();
                                    action.onClick(record);
                                }
                            }));

                            return (
                                <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
                                    <Button
                                        type="text"
                                        icon={<EllipsisOutlined />}
                                        onClick={e => e.stopPropagation()}
                                    />
                                </Dropdown>
                            );
                        };
                        break;

                    default:
                        baseCol.render = (val: any) => (
                            <Text style={{ color: 'var(--color-neutral-900)' }}>
                                {val || '—'}
                            </Text>
                        );
                }
                return baseCol;
            });
    }, [schema, can]);

    const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([]);

    const rowSelection = useMemo(() => ({
        selectedRowKeys,
        onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
        columnWidth: 48,
    }), [selectedRowKeys]);

    return (
        <Card
            bordered={false}
            style={{
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative'
            }}
            styles={{ body: { padding: 0 } }}
        >
            {selectedRowKeys.length > 0 && bulkActions && (
                <div style={{
                    position: 'fixed',
                    bottom: 32,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    height: 56,
                    background: 'var(--color-primary)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 24px',
                    justifyContent: 'space-between',
                    zIndex: 1000,
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.4)',
                    animation: 'slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    minWidth: '500px'
                }}>
                    <Space size={24}>
                        <Text style={{ color: '#fff', fontWeight: 600 }}>
                            {selectedRowKeys.length} selected
                        </Text>
                        <Divider type="vertical" style={{ background: 'rgba(255,255,255,0.2)', height: 24 }} />
                        <Space size={12}>
                            {bulkActions.map((action) => (
                                <Button
                                    key={action.key}
                                    type="text"
                                    onClick={() => action.onClick(
                                        (dataSource || []).filter(item => selectedRowKeys.includes(item.id))
                                    )}
                                    style={{ color: '#fff', fontWeight: 500 }}
                                >
                                    {action.label}
                                </Button>
                            ))}
                        </Space>
                    </Space>
                    <Button type="text" onClick={() => setSelectedRowKeys([])} style={{ color: 'rgba(255,255,255,0.6)' }}>
                        Dismiss
                    </Button>
                </div>
            )}

            <Table
                {...rest}
                columns={columns}
                dataSource={dataSource}
                loading={loading}
                rowKey="id"
                rowSelection={rowSelection}
                virtual
                scroll={{ x: 'max-content', y: 600 }}
                onRow={(record) => {
                    const priority = getRowPriority?.(record);
                    const priorityColor = priority === 'high' ? 'var(--color-status-error-text)' : priority === 'medium' ? 'var(--color-status-warning-text)' : 'transparent';

                    return {
                        onClick: (e) => {
                            if ((e.target as any).closest('.ant-table-selection-column')) return;
                            if ((e.target as any).closest('.ant-btn')) return;
                            if ((e.target as any).closest('.ant-dropdown-trigger')) return;
                            onRowClick?.(record);
                        },
                        style: {
                            cursor: onRowClick ? 'pointer' : 'default',
                            borderLeft: `4px solid ${selectedRowId === String(record.id) ? 'var(--color-secondary)' : priorityColor}`,
                            background: selectedRowId === String(record.id) ? 'var(--table-row-selected-bg)' : 'transparent'
                        },
                        className: `luxury-table-row ${selectedRowId === String(record.id) ? 'active' : ''}`
                    };
                }}
                pagination={pagination && {
                    ...pagination,
                    showSizeChanger: true,
                    position: ['bottomRight'],
                    size: 'small',
                    style: { padding: '16px 24px' }
                }}
                className="luxury-table"
            />
        </Card>
    );
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    .luxury-table .ant-table-thead > tr > th {
        white-space: nowrap !important;
        background: var(--color-neutral-50) !important;
        font-weight: 700 !important;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-size: 11px;
    }
    .luxury-table .ant-table-cell {
        white-space: nowrap !important;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .luxury-table-row:hover {
        background: var(--table-row-hover-bg) !important;
    }
`;
document.head.appendChild(style);
