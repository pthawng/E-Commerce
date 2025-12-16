import { Table, Tag, Space, Tooltip, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RbacRole } from '../../api/queries';

interface RoleListProps {
    roles: RbacRole[];
    isLoading: boolean;
    onEdit: (role: RbacRole) => void;
    onDelete: (slug: string) => void;
    isDeleting: boolean;
    onManagePermissions?: (role: RbacRole) => void;
}

export function RoleList({ roles, isLoading, onEdit, onDelete, isDeleting, onManagePermissions }: RoleListProps) {
    const roleColumns: ColumnsType<RbacRole> = [
        {
            title: 'Slug',
            dataIndex: 'slug',
            render: (slug) => <span className="font-mono text-xs">{slug}</span>,
        },
        {
            title: 'Tên',
            dataIndex: 'name',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            render: (desc) => desc || <span className="text-slate-400">N/A</span>,
        },
        {
            title: 'System',
            dataIndex: 'isSystem',
            render: (isSystem) => (
                <Tag color={isSystem ? 'gold' : 'blue'}>{isSystem ? 'System' : 'Custom'}</Tag>
            ),
        },
        {
            title: 'Users',
            dataIndex: ['_count', 'userRoles'],
            render: (count) => count ?? 0,
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Tooltip title="Chỉnh sửa">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                        />
                    </Tooltip>
                    {onManagePermissions && (
                        <Tooltip title="Gán quyền mặc định">
                            <Button
                                size="small"
                                onClick={() => onManagePermissions(record)}
                            >
                                Quyền
                            </Button>
                        </Tooltip>
                    )}
                    <Popconfirm
                        title="Xóa role?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true, disabled: record.isSystem, loading: isDeleting }}
                        onConfirm={() => onDelete(record.slug)}
                        disabled={record.isSystem}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} disabled={record.isSystem} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Table<RbacRole>
            rowKey="id"
            dataSource={roles}
            columns={roleColumns}
            loading={isLoading}
        />
    );
}
