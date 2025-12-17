import { Form, Input, Switch, Select } from 'antd';
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
    return name.vi || name.en || Object.values(name)[0] || 'N/A';
}

/**
 * Helper: Lấy tất cả ID của các con (recursive) của một category
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
    // Filter out current category và tất cả các con của nó (tránh loop)
    const availableParents = useMemo(() => {
        if (!currentCategoryId) return categories;

        const descendantIds = getAllDescendantIds(currentCategoryId, categories);
        return categories.filter(
            (cat) => cat.id !== currentCategoryId && !descendantIds.has(cat.id),
        );
    }, [categories, currentCategoryId]);

    return (
        <Form form={form} layout="vertical" initialValues={initialValues}>
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
                    options={availableParents.map((cat) => ({
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
    );
}
