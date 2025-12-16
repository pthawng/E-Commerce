import { Table, Space, Tooltip, Button, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import type { RbacPermission } from '../../api/queries';

interface PermissionListProps {
    permissions: RbacPermission[];
    isLoading: boolean;
    onEdit: (permission: RbacPermission) => void;
    onDelete: (slug: string) => void;
    isDeleting: boolean;
}

export function PermissionList({ permissions, isLoading, onEdit, onDelete, isDeleting }: PermissionListProps) {
    const permissionColumns: ColumnsType<RbacPermission> = [
        {
            title: 'Slug',
            dataIndex: 'action',
            render: (action) => <span className="font-mono text-xs">{action}</span>,
        },
        {
            title: 'Tên',
            dataIndex: 'name',
        },
        {
            title: 'Module',
            dataIndex: 'module',
            render: (module) => module || <span className="text-slate-400">N/A</span>,
        },
        {
            title: 'Action',
            dataIndex: 'action',
            render: (action) => action || <span className="text-slate-400">N/A</span>,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            render: (desc) => desc || <span className="text-slate-400">N/A</span>,
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
                    <Popconfirm
                        title="Xóa permission?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true, loading: isDeleting }}
                        onConfirm={() => onDelete(record.action)}
                    >
                        <Button size="small" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <Table<RbacPermission>
            rowKey="id"
            dataSource={permissions}
            columns={permissionColumns}
            loading={isLoading}
        />
    );
}
