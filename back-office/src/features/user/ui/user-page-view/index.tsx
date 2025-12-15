import { useState } from 'react';
import {
    Button,
    Card,
    Form,
    Modal,
    message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { User, PaginatedResponse } from '@shared';
import { UserTable } from '../user-table';
import { UserForm } from '../user-form';
import { useUsers } from '../../api/queries';
import { useCreateUser, useUpdateUser, useDeleteUser } from '../../api/mutations';

type FormValues = {
    email: string;
    fullName: string;
    phone?: string;
    password?: string;
    isActive?: boolean;
    isEmailVerified?: boolean;
};

export function UserPageView() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const { data, isLoading } = useUsers({ page, limit });
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();
    const deleteMutation = useDeleteUser();

    const [form] = Form.useForm<FormValues>();

    const openCreateModal = () => {
        setEditingUser(null);
        // Explicitly reset form fields to default
        form.resetFields();
        // And set specific defaults managed by Form initialValues or here
        form.setFieldsValue({
            isActive: true,
            isEmailVerified: false,
        });
        setIsModalOpen(true);
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        // form.setFieldsValue is handled inside Modal via initialValues or useEffect in UserForm?
        // Actually, Modal destroyOnClose ensures UserForm remounts.
        // passing initialValues prop to UserForm is cleaner.
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            if (editingUser) {
                const payload = { ...values };
                if (!payload.password) {
                    delete payload.password;
                }
                await updateMutation.mutateAsync({ id: editingUser.id, data: payload });
                message.success('Cập nhật user thành công');
            } else {
                await createMutation.mutateAsync(values);
                message.success('Tạo user thành công');
            }
            handleCloseModal();
        } catch (error) {
            if (error instanceof Error) {
                message.error(error.message);
            }
        }
    };

    const handleDelete = async (user: User) => {
        Modal.confirm({
            title: `Xóa user ${user.email}?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await deleteMutation.mutateAsync(user.id);
                    message.success('Đã xóa user');
                } catch (error) {
                    if (error instanceof Error) {
                        message.error(error.message);
                    }
                }
            },
        });
    };

    const paginated = data as PaginatedResponse<User> | undefined;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-slate-800 font-heading">Quản lý User</h1>
                    <p className="text-sm text-slate-500">
                        CRUD user đồng bộ với API backend
                    </p>
                </div>
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} className="bg-gradient-to-r from-amber-500 to-amber-600 border-none">
                    Thêm user
                </Button>
            </div>

            <Card className="shadow-sm rounded-xl border-slate-100">
                <UserTable
                    users={paginated?.items || []}
                    isLoading={isLoading}
                    page={paginated?.meta?.page ?? page}
                    limit={paginated?.meta?.limit ?? limit}
                    total={paginated?.meta?.total ?? 0}
                    onPageChange={(p, l) => {
                        setPage(p);
                        setLimit(l);
                    }}
                    onEdit={openEditModal}
                    onDelete={handleDelete}
                />
            </Card>

            <Modal
                title={<span className="font-heading text-lg">{editingUser ? "Cập nhật user" : "Tạo mới user"}</span>}
                open={isModalOpen}
                onOk={handleSubmit}
                onCancel={handleCloseModal}
                okText={editingUser ? "Lưu" : "Tạo"}
                cancelText="Hủy"
                destroyOnClose
                confirmLoading={createMutation.isPending || updateMutation.isPending}
            >
                <UserForm
                    form={form}
                    isEditing={!!editingUser}
                    initialValues={editingUser ? {
                        email: editingUser.email,
                        fullName: editingUser.fullName,
                        phone: editingUser.phone,
                        isActive: editingUser.isActive,
                        isEmailVerified: editingUser.isEmailVerified,
                    } : {
                        isActive: true,
                        isEmailVerified: false
                    }}
                />
            </Modal>
        </div>
    );
}
