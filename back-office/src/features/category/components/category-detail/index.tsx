import { Descriptions, Tag, Space } from 'antd';
import type { Category } from '@shared';
import * as tokens from '@/ui/design-tokens';
import { StatusBadge } from '@/shared/ui';

interface CategoryDetailProps {
    category: Category;
    allCategories: Category[]; // For resolving parent name
}

function getDisplayName(name: Record<string, string> | null | undefined) {
    if (!name) return 'N/A';
    return name.en || name.vi || Object.values(name)[0] || 'N/A';
}

export function CategoryDetail({ category, allCategories }: CategoryDetailProps) {
    return (
        <Descriptions
            bordered
            column={1}
            labelStyle={{ width: '180px', color: tokens.neutral.textSecondary, fontWeight: 500 }}
            contentStyle={{ color: tokens.neutral.textPrimary }}
        >
            <Descriptions.Item label="Name (Vietnamese)">
                {(category.name as Record<string, string>)?.vi || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Name (English)">
                {(category.name as Record<string, string>)?.en || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="Slug">
                <span style={{
                    fontFamily: tokens.typography.fontFamily.mono,
                    fontSize: tokens.typography.fontSize.sm,
                    color: tokens.neutral.textSecondary,
                    background: tokens.neutral.surfaceHover,
                    padding: '2px 6px',
                    borderRadius: 4
                }}>
                    {category.slug}
                </span>
            </Descriptions.Item>
            <Descriptions.Item label="Parent Category">
                {category.parentId
                    ? (() => {
                        const parent = allCategories.find((cat) => cat.id === category.parentId);
                        return parent ? (
                            <span style={{ fontWeight: 500 }}>{getDisplayName(parent.name)}</span>
                        ) : category.parentId;
                    })()
                    : <span style={{ color: tokens.neutral.textTertiary, fontStyle: 'italic' }}>Root Category</span>}
            </Descriptions.Item>
            <Descriptions.Item label="Display Order">{category.order}</Descriptions.Item>
            <Descriptions.Item label="Status">
                <StatusBadge
                    status={category.isActive ? 'active' : 'inactive'}
                    label={category.isActive ? 'Active' : 'Inactive'}
                />
            </Descriptions.Item>
            {category.children && category.children.length > 0 && (
                <Descriptions.Item label="Subcategories">
                    <Space size={[0, 8]} wrap>
                        {category.children.map((child) => (
                            <Tag key={child.id} style={{ margin: 0 }}>
                                {getDisplayName(child.name)}
                            </Tag>
                        ))}
                    </Space>
                </Descriptions.Item>
            )}
        </Descriptions>
    );
}
