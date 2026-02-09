import { Form, Input, Switch, Select, InputNumber } from 'antd';
import type { FormInstance } from 'antd';
import type { Category } from '@shared';
import { useMemo } from 'react';

interface CategoryFormProps {
    form: FormInstance;
    categories: Category[]; // Flattened list for parent selection
    currentCategoryId?: string | null;
    initialValues?: Record<string, unknown>;
}

function getDisplayName(name: Record<string, string> | null | undefined) {
    if (!name) return 'N/A';
    return name.en || name.vi || Object.values(name)[0] || 'N/A';
}

/**
 * Helper: Get all descendant IDs (recursive) of a category to prevent circular parent selection
 */
function getAllDescendantIds(categoryId: string, categories: Category[]): Set<string> {
    const result = new Set<string>();
    const findChildren = (parentId: string) => {
        categories.forEach((cat) => {
            if (cat.parentId === parentId) {
                result.add(cat.id);
                findChildren(cat.id); // Recursive
            }
        });
    };
    findChildren(categoryId);
    return result;
}

export function CategoryForm({ form, categories, currentCategoryId, initialValues }: CategoryFormProps) {
    // Filter out current category and all its descendants to avoid loops
    const availableParents = useMemo(() => {
        if (!currentCategoryId) return categories;

        const descendantIds = getAllDescendantIds(currentCategoryId, categories);
        return categories.filter(
            (cat) => cat.id !== currentCategoryId && !descendantIds.has(cat.id),
        );
    }, [categories, currentCategoryId]);

    return (
        <Form
            form={form}
            layout="vertical"
            initialValues={initialValues}
            requiredMark="optional"
        >
            <Form.Item
                name="nameVi"
                label="Category Name (Vietnamese)"
                rules={[{ required: true, message: 'Please enter category name' }]}
            >
                <Input placeholder="e.g. Điện thoại" />
            </Form.Item>

            <Form.Item name="nameEn" label="Category Name (English)">
                <Input placeholder="e.g. Mobile Phones" />
            </Form.Item>

            <Form.Item
                name="slug"
                label="Slug"
                extra="Leave empty to auto-generate from name"
                rules={[
                    {
                        pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                        message: 'Slug can only contain lowercase letters, numbers, and hyphens',
                    },
                ]}
            >
                <Input placeholder="dien-thoai" />
            </Form.Item>

            <Form.Item name="parentId" label="Parent Category">
                <Select
                    placeholder="Select parent category (leave empty for root)"
                    allowClear
                    showSearch
                    filterOption={(input, option) =>
                        (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                    }
                    options={availableParents.map((cat) => ({
                        value: cat.id,
                        label: getDisplayName(cat.name),
                    }))}
                />
            </Form.Item>

            <Form.Item name="order" label="Display Order">
                <InputNumber min={0} style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item name="isActive" label="Active Status" valuePropName="checked">
                <Switch />
            </Form.Item>
        </Form>
    );
}
