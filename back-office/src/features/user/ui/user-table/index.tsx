import { useMemo } from 'react';
import { Table, Tag, Space, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import type { User } from '@shared';

interface UserTableProps {
    users: User[];
    isLoading: boolean;
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number, limit: number) => void;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

export function UserTable({
    users,
    isLoading,
    page,
    limit,
    total,
    onPageChange,
    onEdit,
    onDelete,
}: UserTableProps) {
    const columns: ColumnsType<User> = useMemo(
        () => [
            {
                title: 'Email',
                dataIndex: 'email',
                key: 'email',
            },
            {
                title: 'Họ tên',
                dataIndex: 'fullName',
                key: 'fullName',
            },
            {
                title: 'SĐT',
                dataIndex: 'phone',
                key: 'phone',
                render: (value?: string) => value || '-',
            },
            {
                title: 'Kích hoạt',
                dataIndex: 'isActive',
                key: 'isActive',
                render: (value: boolean) =>
                    value ? <Tag color="green">Active</Tag> : <Tag color="red">Inactive</Tag>,
            },
            {
                title: 'Xác thực email',
                dataIndex: 'isEmailVerified',
                key: 'isEmailVerified',
                render: (value: boolean) =>
                    value ? <Tag color="blue">Verified</Tag> : <Tag>Unverified</Tag>,
            },
            {
                title: 'Tạo lúc',
                dataIndex: 'createdAt',
                key: 'createdAt',
                render: (value: string | Date) => dayjs(value).format('DD/MM/YYYY HH:mm'),
            },
            {
                title: 'Hành động',
                key: 'actions',
                render: (_, record) => (
                    <Space>
                        <Button type="link" onClick={() => onEdit(record)}>
                            Sửa
                        </Button>
                        <Button type="link" danger onClick={() => onDelete(record)}>
                            Xóa
                        </Button>
                    </Space>
                ),
            },
        ],
        [onEdit, onDelete],
    );

    return (
        <Table<User>
            rowKey="id"
            loading={isLoading}
            columns={columns}
            dataSource={users}
            pagination={{
                current: page,
                pageSize: limit,
                total: total,
                onChange: onPageChange,
            }}
        />
    );
}
