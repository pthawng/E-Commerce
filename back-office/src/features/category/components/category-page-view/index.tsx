import { useState, useMemo, useCallback } from 'react';
import {
    Alert,
    Button,
    Form,
    Modal,
    Switch,
    message,
} from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { CategoryTree } from '../category-tree';
import { CategoryForm } from '../category-form';
import { CategoryDetail } from '../category-detail';
import { useCategories, useCategory } from '../../services/queries';
import { useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../services/mutations';
import type { Category } from '@shared';
import { PageHeader } from '@/shared/ui';
import * as tokens from '@/ui/design-tokens';
import { cardStyle, contentContainerStyle } from '@/ui/styles';

export function CategoryPageView() {
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

    const handleDelete = useCallback(
        async (id: string) => {
            try {
                await deleteCategory.mutateAsync(id);
                message.success('Category deleted');
            } catch (err: unknown) {
                const errorMessage =
                    (err as { response?: { data?: { message?: string }; message?: string }; message?: string })
                        ?.response?.data?.message ||
                    (err as { message?: string })?.message ||
                    'Failed to delete category';
                message.error(errorMessage);
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
            message.success('Category created successfully');
            setIsCreateOpen(false);
            form.resetFields();
        } catch (err: unknown) {
            const errorMessage =
                (err as { response?: { data?: { message?: string }; message?: string }; message?: string })
                    ?.response?.data?.message ||
                (err as { message?: string })?.message ||
                'Failed to create category';
            message.error(errorMessage);
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
            message.success('Category updated successfully');
            setIsEditOpen(false);
            setSelectedCategoryId(null);
            form.resetFields();
        } catch (err: unknown) {
            const errorMessage =
                (err as { response?: { data?: { message?: string }; message?: string }; message?: string })
                    ?.response?.data?.message ||
                (err as { message?: string })?.message ||
                'Failed to update category';
            message.error(errorMessage);
        }
    };

    return (
        <div>
            <PageHeader
                title="Category Management"
                subtitle="Manage product categories and hierarchy"
                actions={
                    <>
                        <Switch
                            checked={includeInactive}
                            onChange={setIncludeInactive}
                            checkedChildren="Show Inactive"
                            unCheckedChildren="Hide Inactive"
                        />
                        <Button icon={<ReloadOutlined />} onClick={() => refetch()} disabled={isLoading}>
                            Refresh
                        </Button>
                        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
                            Add Category
                        </Button>
                    </>
                }
            />

            {error && (
                <div style={{ padding: `0 ${tokens.spacing.xxl}px`, marginBottom: tokens.spacing.lg }}>
                    <Alert
                        type="error"
                        message="Error Loading Categories"
                        description={error instanceof Error ? error.message : 'Unknown error'}
                        showIcon
                    />
                </div>
            )}

            <div style={contentContainerStyle}>
                <div style={cardStyle}>
                    {isLoading ? (
                        <div style={{ padding: tokens.spacing.xl, textAlign: 'center', color: tokens.neutral.textTertiary }}>
                            Loading categories...
                        </div>
                    ) : (
                        <CategoryTree
                            categories={categories || []}
                            onView={openViewModal}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                            isDeleting={deleteCategory.isPending}
                        />
                    )}
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                title="Create Category"
                open={isCreateOpen}
                centered
                onCancel={() => {
                    setIsCreateOpen(false);
                    form.resetFields();
                }}
                onOk={handleCreate}
                okText="Create"
                confirmLoading={createCategory.isPending}
                destroyOnClose
                width={600}
            >
                <CategoryForm form={form} categories={flatCategories} />
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Edit Category"
                open={isEditOpen}
                centered
                onCancel={() => {
                    setIsEditOpen(false);
                    setSelectedCategoryId(null);
                    form.resetFields();
                }}
                onOk={handleEdit}
                okText="Update"
                confirmLoading={updateCategory.isPending}
                destroyOnClose
                width={600}
            >
                {selectedCategory && (
                    <CategoryForm
                        key={selectedCategoryId} // Force re-render when category changes
                        form={form}
                        categories={flatCategories}
                        currentCategoryId={selectedCategoryId}
                        initialValues={{
                            nameVi: (selectedCategory.name as Record<string, string>)?.vi || '',
                            nameEn: (selectedCategory.name as Record<string, string>)?.en || '',
                            slug: selectedCategory.slug || '',
                            parentId: selectedCategory.parentId || undefined,
                            order: selectedCategory.order ?? 0,
                            isActive: selectedCategory.isActive ?? true,
                        }}
                    />
                )}
            </Modal>

            {/* View Modal */}
            <Modal
                title="Category Details"
                open={isViewOpen}
                centered
                onCancel={() => {
                    setIsViewOpen(false);
                    setSelectedCategoryId(null);
                }}
                footer={null}
                destroyOnClose
            >
                {isLoadingCategory ? (
                    <div style={{ padding: tokens.spacing.md, textAlign: 'center' }}>Loading...</div>
                ) : selectedCategory ? (
                    <CategoryDetail category={selectedCategory} allCategories={flatCategories} />
                ) : (
                    <div style={{ padding: tokens.spacing.md, textAlign: 'center', color: tokens.action.error }}>
                        Category not found
                    </div>
                )}
            </Modal>
        </div>
    );
}
