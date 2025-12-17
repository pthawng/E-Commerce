import { Descriptions, Tag, Space } from 'antd';
import type { Category } from '@shared';

interface CategoryDetailProps {
    category: Category;
    allCategories: Category[]; // For resolving parent name
}

function getDisplayName(name: Record<string, string> | null | undefined) {
    if (!name) return 'N/A';
    return name.vi || name.en || Object.values(name)[0] || 'N/A';
}

export function CategoryDetail({ category, allCategories }: CategoryDetailProps) {
    return (
        <Descriptions bordered column={1}>
            <Descriptions.Item label="Tên (VI)">
                {(category.name as Record<string, string>)?.vi || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Tên (EN)">
                {(category.name as Record<string, string>)?.en || 'N/A'}
            </Descriptions.Item>
            <Descriptions.Item label="Slug"><code className="bg-slate-100 px-2 py-1 rounded text-purple-600">{category.slug}</code></Descriptions.Item>
            <Descriptions.Item label="Danh mục cha">
                {category.parentId
                    ? (() => {
                        const parent = allCategories.find((cat) => cat.id === category.parentId);
                        return parent ? <span className="font-semibold text-slate-700">{getDisplayName(parent.name)}</span> : category.parentId;
                    })()
                    : <span className="italic text-slate-400">Danh mục gốc</span>}
            </Descriptions.Item>
            <Descriptions.Item label="Thứ tự">{category.order}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
                <Tag color={category.isActive ? 'success' : 'error'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                </Tag>
            </Descriptions.Item>
            {category.children && category.children.length > 0 && (
                <Descriptions.Item label="Danh mục con">
                    <Space direction="vertical" size="small">
                        {category.children.map((child) => (
                            <Tag key={child.id}>{getDisplayName(child.name)}</Tag>
                        ))}
                    </Space>
                </Descriptions.Item>
            )}
        </Descriptions>
    );
}
