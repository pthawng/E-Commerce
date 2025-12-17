import { useMemo } from 'react';
import { Tree, Space, Tooltip, Button, Tag, Popconfirm } from 'antd';
import { EyeOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { Category } from '@shared';

interface CategoryTreeProps {
    categories: Category[];
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    isDeleting?: boolean;
}

function getDisplayName(name: Record<string, string> | null | undefined) {
    if (!name) return 'N/A';
    return name.vi || name.en || Object.values(name)[0] || 'N/A';
}

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
                <div className="flex items-center justify-between w-full group">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-700">{getDisplayName(cat.name)}</span>
                        <Tag color={cat.isActive ? 'green' : 'red'} className="ml-2 text-[10px] uppercase font-bold">
                            {cat.isActive ? 'Active' : 'Inactive'}
                        </Tag>
                    </div>
                    <Space size="small" onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip title="Xem chi tiết">
                            <Button size="small" type="text" icon={<EyeOutlined className="text-blue-500" />} onClick={() => onView(cat.id)} />
                        </Tooltip>
                        <Tooltip title="Chỉnh sửa">
                            <Button size="small" type="text" icon={<EditOutlined className="text-amber-500" />} onClick={() => onEdit(cat.id)} />
                        </Tooltip>
                        {/* Prevent delete action from expanding/collapsing tree */}
                        <div onClick={(e) => e.stopPropagation()}>
                            <Popconfirm
                                title="Xóa danh mục?"
                                description="Hành động này không thể hoàn tác"
                                okText="Xóa"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true, loading: isDeleting }}
                                onConfirm={() => onDelete(cat.id)}
                            >
                                <Button size="small" type="text" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                        </div>
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

export function CategoryTree({ categories, onView, onEdit, onDelete, isDeleting = false }: CategoryTreeProps) {
    const treeData = useMemo(() => {
        if (!categories) return [];
        return buildTreeData(categories, onView, onEdit, onDelete, isDeleting);
    }, [categories, onView, onEdit, onDelete, isDeleting]);

    return (
        <Tree
            showLine={{ showLeafIcon: false }}
            defaultExpandAll
            treeData={treeData}
            className="p-2 py-4"
            blockNode
        />
    );
}
