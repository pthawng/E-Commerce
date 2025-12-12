/**
 * Categories Page
 * CRUD đầy đủ cho quản lý danh mục (tree structure)
 */
import { useState, useMemo, useCallback } from 'react';
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
  Tag,
  Tooltip,
  Typography,
  message,
  Tree,
  Descriptions,
  Select,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { Category } from '@shared';
import { useCategories, useCategory } from '@/services/queries/categories.queries';
import {
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/services/mutations/categories.mutations';

const { Title, Text } = Typography;

function getDisplayName(name: Record<string, string> | null | undefined) {
  if (!name) return 'N/A';
  return name.vi || name.en || Object.values(name)[0] || 'N/A';
}

/**
 * Convert category tree to Ant Design Tree data
 * @param categories - Category tree from API
 * @param onView - Callback khi click view
 * @param onEdit - Callback khi click edit
 * @param onDelete - Callback khi click delete
 * @param isDeleting - Loading state cho delete
 */
function buildTreeData(
  categories: Category[],
  onView: (id: string) => void,
  onEdit: (id: string) => void,
  onDelete: (id: string) => void,
  isDeleting: boolean,
): DataNode[] {
  const map = new Map<string, DataNode>();
  const roots: DataNode[] = [];

  // First pass: create all nodes
  categories.forEach((cat) => {
    const node: DataNode = {
      key: cat.id,
      title: (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span>{getDisplayName(cat.name)}</span>
            <Tag color={cat.isActive ? 'green' : 'red'} className="ml-2">
              {cat.isActive ? 'Active' : 'Inactive'}
            </Tag>
          </div>
          <Space size="small" onClick={(e) => e.stopPropagation()}>
            <Tooltip title="Xem chi tiết">
              <Button size="small" icon={<EyeOutlined />} onClick={() => onView(cat.id)} />
            </Tooltip>
            <Tooltip title="Chỉnh sửa">
              <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(cat.id)} />
            </Tooltip>
            <Popconfirm
              title="Xóa danh mục?"
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true, loading: isDeleting }}
              onConfirm={() => onDelete(cat.id)}
            >
              <Button danger size="small" icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        </div>
      ),
      children: [],
    };
    map.set(cat.id, node);
  });

  // Second pass: build tree
  categories.forEach((cat) => {
    const node = map.get(cat.id)!;
    if (cat.parentId) {
      const parent = map.get(cat.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export default function CategoriesPage() {
  const [includeInactive, setIncludeInactive] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const { data: categories, isLoading, error, refetch } = useCategories(includeInactive);
  const { data: selectedCategory, isLoading: isLoadingCategory } = useCategory(
    selectedCategoryId || '',
  );

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await deleteCategory.mutateAsync(id);
        message.success('Đã xóa danh mục');
      } catch {
        message.error('Xóa danh mục thất bại');
      }
    },
    [deleteCategory],
  );

  const openEditModal = useCallback((id: string) => {
    setSelectedCategoryId(id);
    setIsEditOpen(true);
  }, []);

  const openViewModal = useCallback((id: string) => {
    setSelectedCategoryId(id);
    setIsViewOpen(true);
  }, []);

  const treeData = useMemo(() => {
    if (!categories) return [];
    return buildTreeData(
      categories,
      openViewModal,
      openEditModal,
      handleDelete,
      deleteCategory.isPending,
    );
  }, [categories, deleteCategory.isPending, openViewModal, openEditModal, handleDelete]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      await createCategory.mutateAsync({
        name: {
          vi: values.nameVi,
          ...(values.nameEn ? { en: values.nameEn } : {}),
        },
        slug: values.slug || undefined,
        parentId: values.parentId || null,
        order: values.order ?? 0,
        isActive: values.isActive ?? true,
      });
      message.success('Tạo danh mục thành công');
      setIsCreateOpen(false);
      form.resetFields();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Tạo danh mục thất bại');
    }
  };

  const handleEdit = async () => {
    if (!selectedCategoryId) return;
    try {
      const values = await form.validateFields();
      await updateCategory.mutateAsync({
        id: selectedCategoryId,
        data: {
          name: {
            vi: values.nameVi,
            ...(values.nameEn ? { en: values.nameEn } : {}),
          },
          slug: values.slug || undefined,
          parentId: values.parentId || null,
          order: values.order ?? 0,
          isActive: values.isActive ?? true,
        },
      });
      message.success('Cập nhật danh mục thành công');
      setIsEditOpen(false);
      setSelectedCategoryId(null);
      form.resetFields();
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Cập nhật danh mục thất bại');
    }
  };

  // Flatten categories for parent selection
  const flatCategories = useMemo(() => {
    if (!categories) return [];
    const flatten = (cats: Category[], result: Category[] = []): Category[] => {
      cats.forEach((cat) => {
        result.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children, result);
        }
      });
      return result;
    };
    return flatten(categories);
  }, [categories]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Title level={3} className="mb-1! text-slate-100">
            Danh mục
          </Title>
          <Text type="secondary">Quản lý danh mục sản phẩm (cấu trúc cây)</Text>
        </div>
        <Space>
          <Switch
            checked={includeInactive}
            onChange={setIncludeInactive}
            checkedChildren="Hiện inactive"
            unCheckedChildren="Ẩn inactive"
          />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} disabled={isLoading}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            Tạo danh mục
          </Button>
        </Space>
      </div>

      <Card>
        {error && (
          <Alert
            type="error"
            message="Không thể tải danh mục"
            description={error instanceof Error ? error.message : 'Unknown error'}
            className="mb-4"
          />
        )}

        {isLoading ? (
          <div>Đang tải...</div>
        ) : (
          <Tree showLine defaultExpandAll treeData={treeData} />
        )}
      </Card>

      {/* Create Modal */}
      <Modal
        title="Tạo danh mục mới"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        onOk={handleCreate}
        okText="Tạo"
        confirmLoading={createCategory.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="nameVi"
            label="Tên danh mục (Tiếng Việt)"
            rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
          >
            <Input placeholder="Ví dụ: Điện thoại" />
          </Form.Item>

          <Form.Item name="nameEn" label="Tên danh mục (English)">
            <Input placeholder="Optional: Phones" />
          </Form.Item>

          <Form.Item
            name="slug"
            label="Slug"
            extra="Nếu để trống sẽ tự động tạo từ tên"
            rules={[
              {
                pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
              },
            ]}
          >
            <Input placeholder="dien-thoai" />
          </Form.Item>

          <Form.Item name="parentId" label="Danh mục cha">
            <Select
              placeholder="Chọn danh mục cha (để trống nếu là danh mục gốc)"
              allowClear
              showSearch
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={flatCategories.map((cat) => ({
                value: cat.id,
                label: getDisplayName(cat.name),
              }))}
            />
          </Form.Item>

          <Form.Item name="order" label="Thứ tự hiển thị" initialValue={0}>
            <Input type="number" min={0} />
          </Form.Item>

          <Form.Item name="isActive" label="Đang hoạt động" initialValue={true} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Chỉnh sửa danh mục"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setSelectedCategoryId(null);
        }}
        onOk={handleEdit}
        okText="Cập nhật"
        confirmLoading={updateCategory.isPending}
        destroyOnHidden
      >
        {selectedCategory && (
          <Form
            form={form}
            layout="vertical"
            initialValues={{
              nameVi: (selectedCategory.name as Record<string, string>)?.vi || '',
              nameEn: (selectedCategory.name as Record<string, string>)?.en || '',
              slug: selectedCategory.slug || '',
              parentId: selectedCategory.parentId || undefined,
              order: selectedCategory.order ?? 0,
              isActive: selectedCategory.isActive ?? true,
            }}
          >
            <Form.Item
              name="nameVi"
              label="Tên danh mục (Tiếng Việt)"
              rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
            >
              <Input placeholder="Ví dụ: Điện thoại" />
            </Form.Item>

            <Form.Item name="nameEn" label="Tên danh mục (English)">
              <Input placeholder="Optional: Phones" />
            </Form.Item>

            <Form.Item
              name="slug"
              label="Slug"
              rules={[
                {
                  pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                  message: 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang',
                },
              ]}
            >
              <Input placeholder="dien-thoai" />
            </Form.Item>

            <Form.Item name="parentId" label="Danh mục cha">
              <Select
                placeholder="Chọn danh mục cha (để trống nếu là danh mục gốc)"
                allowClear
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={flatCategories
                  .filter((cat) => cat.id !== selectedCategoryId) // Không cho chọn chính nó
                  .map((cat) => ({
                    value: cat.id,
                    label: getDisplayName(cat.name),
                  }))}
              />
            </Form.Item>

            <Form.Item name="order" label="Thứ tự hiển thị">
              <Input type="number" min={0} />
            </Form.Item>

            <Form.Item name="isActive" label="Đang hoạt động" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        )}
      </Modal>

      {/* View Modal */}
      <Modal
        title="Chi tiết danh mục"
        open={isViewOpen}
        onCancel={() => {
          setIsViewOpen(false);
          setSelectedCategoryId(null);
        }}
        footer={null}
        destroyOnHidden
      >
        {isLoadingCategory ? (
          <div>Đang tải...</div>
        ) : selectedCategory ? (
          <Descriptions bordered column={1}>
            <Descriptions.Item label="Tên (VI)">
              {(selectedCategory.name as Record<string, string>)?.vi || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Tên (EN)">
              {(selectedCategory.name as Record<string, string>)?.en || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Slug">{selectedCategory.slug}</Descriptions.Item>
            <Descriptions.Item label="Danh mục cha">
              {selectedCategory.parentId
                ? (() => {
                    const parent = flatCategories.find((cat) => cat.id === selectedCategory.parentId);
                    return parent ? getDisplayName(parent.name) : selectedCategory.parentId;
                  })()
                : 'Danh mục gốc'}
            </Descriptions.Item>
            <Descriptions.Item label="Thứ tự">{selectedCategory.order}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={selectedCategory.isActive ? 'green' : 'red'}>
                {selectedCategory.isActive ? 'Active' : 'Inactive'}
              </Tag>
            </Descriptions.Item>
            {selectedCategory.children && selectedCategory.children.length > 0 && (
              <Descriptions.Item label="Danh mục con">
                <Space direction="vertical" size="small">
                  {selectedCategory.children.map((child) => (
                    <Tag key={child.id}>{getDisplayName(child.name)}</Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        ) : (
          <div>Không tìm thấy danh mục</div>
        )}
      </Modal>
    </div>
  );
}

