import { useMemo } from 'react';
import { Tree, Space, Tooltip, Button, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined, FolderOutlined, FolderOpenOutlined, FileOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { Category } from '@shared';
import { StatusBadge } from '@/shared/ui';
import * as tokens from '@/ui/design-tokens';

interface CategoryTreeProps {
    categories: Category[];
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    isDeleting?: boolean;
}

function getDisplayName(name: Record<string, string> | null | undefined) {
    if (!name) return 'N/A';
    return name.en || name.vi || Object.values(name)[0] || 'N/A';
}

export function CategoryTree({ categories, onView, onEdit, onDelete, isDeleting = false }: CategoryTreeProps) {

    const treeData = useMemo(() => {
        if (!categories) return [];

        const buildTree = (cats: Category[]): DataNode[] => {
            return cats.map(cat => ({
                key: cat.id,
                title: (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: `${tokens.spacing.xs}px ${tokens.spacing.sm}px`,
                        borderRadius: tokens.component.borderRadius.sm,
                    }}
                        className="group" // for hover effects on actions
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: tokens.spacing.sm }}>
                            <span style={{ fontWeight: 500, color: tokens.neutral.textPrimary }}>
                                {getDisplayName(cat.name)}
                            </span>
                            <StatusBadge
                                status={cat.isActive ? 'active' : 'inactive'}
                                label={cat.isActive ? 'Active' : 'Hidden'}
                            />
                        </div>
                        <Space size={4} style={{ opacity: 0, transition: 'opacity 0.2s' }} className="group-hover:opacity-100">
                            <Tooltip title="View Details">
                                <Button
                                    size="small"
                                    type="text"
                                    icon={<EyeOutlined />}
                                    onClick={(e) => { e.stopPropagation(); onView(cat.id); }}
                                    style={{ color: tokens.action.primary }}
                                />
                            </Tooltip>
                            <Tooltip title="Edit Category">
                                <Button
                                    size="small"
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={(e) => { e.stopPropagation(); onEdit(cat.id); }}
                                    style={{ color: tokens.action.secondary }}
                                />
                            </Tooltip>
                            <Popconfirm
                                title="Delete this category?"
                                description="This action cannot be undone."
                                okText="Delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true, loading: isDeleting }}
                                onConfirm={(e) => { e?.stopPropagation(); onDelete(cat.id); }}
                                onCancel={(e) => e?.stopPropagation()}
                            >
                                <Button
                                    size="small"
                                    type="text"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </Popconfirm>
                        </Space>
                    </div>
                ),
                icon: ({ expanded }: { expanded: boolean }) =>
                    cat.children?.length ? (expanded ? <FolderOpenOutlined /> : <FolderOutlined />) : <FileOutlined />,
                children: cat.children ? buildTree(cat.children) : [],
            }));
        };

        return buildTree(categories);
    }, [categories, onView, onEdit, onDelete, isDeleting]);

    return (
        <Tree
            showIcon
            showLine={{ showLeafIcon: false }}
            defaultExpandAll
            treeData={treeData}
            style={{
                backgroundColor: 'transparent',
                fontFamily: tokens.typography.fontFamily.sans,
            }}
            blockNode
            selectable={false}
        />
    );
}
