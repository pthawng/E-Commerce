/**
 * RBAC Admin Page
 * CRUD Roles & Permissions (đồng bộ với BE /admin/rbac)
 */
import { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Tabs,
  Tooltip,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import {
  useRbacRoles,
  useRbacPermissions,
  type RbacRole,
  type RbacPermission,
} from '@/services/queries/rbac.queries';
import {
  useCreateRole,
  useUpdateRole,
  useDeleteRole,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
} from '@/services/mutations/rbac.mutations';

export default function RbacPage() {
  const [roleForm] = Form.useForm();
  const [permissionForm] = Form.useForm();
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RbacRole | null>(null);
  const [editingPermission, setEditingPermission] = useState<RbacPermission | null>(null);

  const {
    data: roles,
    isLoading: rolesLoading,
    error: rolesError,
    refetch: refetchRoles,
  } = useRbacRoles();
  const {
    data: permissions,
    isLoading: permsLoading,
    error: permsError,
    refetch: refetchPerms,
  } = useRbacPermissions();

  const createRole = useCreateRole();
  const updateRole = useUpdateRole();
  const deleteRole = useDeleteRole();
  const createPermission = useCreatePermission();
  const updatePermission = useUpdatePermission();
  const deletePermission = useDeletePermission();

  const handleOpenCreateRole = () => {
    setEditingRole(null);
    roleForm.resetFields();
    setIsRoleModalOpen(true);
  };

  const handleOpenEditRole = (role: RbacRole) => {
    setEditingRole(role);
    roleForm.setFieldsValue({
      slug: role.slug,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
    });
    setIsRoleModalOpen(true);
  };

  const handleSubmitRole = async () => {
    try {
      const values = await roleForm.validateFields();
      if (editingRole) {
        await updateRole.mutateAsync({
          slug: editingRole.slug,
          data: {
            name: values.name,
            description: values.description,
          },
        });
        message.success('Cập nhật role thành công');
      } else {
        await createRole.mutateAsync({
          slug: values.slug,
          name: values.name,
          description: values.description,
          isSystem: values.isSystem,
        });
        message.success('Tạo role thành công');
      }
      setIsRoleModalOpen(false);
      setEditingRole(null);
      roleForm.resetFields();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi khi lưu role');
    }
  };

  const handleDeleteRole = async (role: RbacRole) => {
    try {
      await deleteRole.mutateAsync(role.slug);
      message.success('Đã xóa role');
    } catch {
      message.error('Xóa role thất bại');
    }
  };

  const handleOpenCreatePermission = () => {
    setEditingPermission(null);
    permissionForm.resetFields();
    setIsPermissionModalOpen(true);
  };

  const handleOpenEditPermission = (permission: RbacPermission) => {
    setEditingPermission(permission);
    permissionForm.setFieldsValue({
      slug: permission.slug,
      name: permission.name,
      description: permission.description,
      module: permission.module,
      action: permission.action,
    });
    setIsPermissionModalOpen(true);
  };

  const handleSubmitPermission = async () => {
    try {
      const values = await permissionForm.validateFields();
      if (editingPermission) {
        await updatePermission.mutateAsync({
          slug: editingPermission.slug,
          data: {
            name: values.name,
            description: values.description,
            module: values.module,
            action: values.action,
          },
        });
        message.success('Cập nhật permission thành công');
      } else {
        await createPermission.mutateAsync({
          slug: values.slug,
          name: values.name,
          description: values.description,
          module: values.module,
          action: values.action,
        });
        message.success('Tạo permission thành công');
      }
      setIsPermissionModalOpen(false);
      setEditingPermission(null);
      permissionForm.resetFields();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Lỗi khi lưu permission');
    }
  };

  const handleDeletePermission = async (permission: RbacPermission) => {
    try {
      await deletePermission.mutateAsync(permission.slug);
      message.success('Đã xóa permission');
    } catch {
      message.error('Xóa permission thất bại');
    }
  };

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
              onClick={() => handleOpenEditRole(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa role?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, disabled: record.isSystem, loading: deleteRole.isPending }}
            onConfirm={() => handleDeleteRole(record)}
            disabled={record.isSystem}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={record.isSystem} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const permissionColumns: ColumnsType<RbacPermission> = [
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
              onClick={() => handleOpenEditPermission(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Xóa permission?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deletePermission.isPending }}
            onConfirm={() => handleDeletePermission(record)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">RBAC Admin</h1>
          <p className="text-slate-400">Quản lý roles và permissions, đồng bộ backend.</p>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => { refetchRoles(); refetchPerms(); }}>
            Làm mới
          </Button>
        </Space>
      </div>

      {rolesError || permsError ? (
        <Alert
          type="error"
          message="Không thể tải dữ liệu RBAC"
          description={
            rolesError
              ? String(rolesError)
              : permsError
                ? String(permsError)
                : 'Unknown error'
          }
        />
      ) : null}

      <Tabs
        items={[
          {
            key: 'roles',
            label: 'Roles',
            children: (
              <Card
                title="Roles"
                extra={
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreateRole}>
                    Thêm role
                  </Button>
                }
              >
                <Table<RbacRole>
                  rowKey="id"
                  dataSource={roles || []}
                  columns={roleColumns}
                  loading={rolesLoading}
                />
              </Card>
            ),
          },
          {
            key: 'permissions',
            label: 'Permissions',
            children: (
              <Card
                title="Permissions"
                extra={
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleOpenCreatePermission}
                  >
                    Thêm permission
                  </Button>
                }
              >
                <Table<RbacPermission>
                  rowKey="id"
                  dataSource={permissions || []}
                  columns={permissionColumns}
                  loading={permsLoading}
                />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={editingRole ? 'Chỉnh sửa role' : 'Tạo role'}
        open={isRoleModalOpen}
        onCancel={() => {
          setIsRoleModalOpen(false);
          setEditingRole(null);
          roleForm.resetFields();
        }}
        onOk={handleSubmitRole}
        confirmLoading={createRole.isPending || updateRole.isPending}
        destroyOnHidden
      >
        <Form form={roleForm} layout="vertical">
          {!editingRole && (
            <Form.Item
              name="slug"
              label="Slug"
              rules={[
                { required: true, message: 'Vui lòng nhập slug' },
                {
                  pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                  message: 'Slug chỉ được chứa chữ thường, số, dấu gạch ngang',
                },
              ]}
            >
              <Input placeholder="vd: admin" />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="Tên role"
            rules={[{ required: true, message: 'Vui lòng nhập tên role' }]}
          >
            <Input placeholder="vd: Administrator" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn" />
          </Form.Item>
          {!editingRole && (
            <Form.Item name="isSystem" label="System role" valuePropName="checked">
              <Switch />
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={editingPermission ? 'Chỉnh sửa permission' : 'Tạo permission'}
        open={isPermissionModalOpen}
        onCancel={() => {
          setIsPermissionModalOpen(false);
          setEditingPermission(null);
          permissionForm.resetFields();
        }}
        onOk={handleSubmitPermission}
        confirmLoading={createPermission.isPending || updatePermission.isPending}
        destroyOnHidden
      >
        <Form form={permissionForm} layout="vertical">
          {!editingPermission && (
            <Form.Item
              name="slug"
              label="Slug"
              rules={[
                { required: true, message: 'Vui lòng nhập slug' },
                {
                  pattern: /^[a-z0-9]+(?:\\.[a-z0-9]+)*(?:-[a-z0-9]+)*$/,
                  message: 'Slug chỉ được chứa chữ thường, số, dấu chấm và dấu gạch ngang',
                },
              ]}
            >
              <Input placeholder="vd: rbac.manage" />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label="Tên permission"
            rules={[{ required: true, message: 'Vui lòng nhập tên permission' }]}
          >
            <Input placeholder="vd: Quản lý RBAC" />
          </Form.Item>
          <Form.Item name="module" label="Module">
            <Input placeholder="vd: SYSTEM" />
          </Form.Item>
          <Form.Item name="action" label="Action">
            <Input placeholder="vd: MANAGE" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

