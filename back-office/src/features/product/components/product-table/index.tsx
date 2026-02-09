import { useMemo } from 'react';
import { Empty, Pagination, Alert } from 'antd';
import { ProductCard } from '../product-card';
import { useProductStore } from '../../hooks/store';
import { useProducts, useDeleteProduct, useUpdateProduct } from '../../hooks/hooks';
import { Modal, message } from 'antd';

interface ProductTableProps {
    onEdit: (id: string) => void;
    onView: (id: string) => void;
}

export function ProductTable({ onEdit, onView }: ProductTableProps) {
    const { filters, setFilters } = useProductStore();
    const { data, isLoading, error } = useProducts(filters);
    const deleteProduct = useDeleteProduct();
    const updateProduct = useUpdateProduct();

    const pagination = useMemo(() => {
        const meta = data?.meta;
        return {
            current: meta?.page ?? filters.page ?? 1,
            pageSize: meta?.limit ?? filters.limit ?? 12,
            total: meta?.total ?? 0,
        };
    }, [data?.meta, filters.page, filters.limit]);

    const handlePageChange = (page: number, pageSize?: number) => {
        setFilters({ page, limit: pageSize ?? filters.limit });
    };

    const handleDelete = async (id: string) => {
        Modal.confirm({
            title: 'Delete Product?',
            content: 'This action cannot be undone.',
            okText: 'Delete',
            okType: 'danger',
            cancelText: 'Cancel',
            onOk: async () => {
                try {
                    await deleteProduct.mutateAsync(id);
                    message.success('Product deleted');
                } catch {
                    message.error('Failed to delete product');
                }
            },
        });
    };

    const handleToggleActive = async (id: string, currentStatus: boolean) => {
        try {
            await updateProduct.mutateAsync({
                id: id,
                data: { isActive: !currentStatus },
            });
            message.success(`Product ${!currentStatus ? 'activated' : 'deactivated'}`);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Update failed';
            message.error(msg);
        }
    };

    if (error) {
        return (
            <Alert
                type="error"
                message="Failed to load products"
                description={error instanceof Error ? error.message : 'Unknown error'}
                style={{
                    borderRadius: 4,
                    border: '1px solid #F5EDED',
                    backgroundColor: '#FEF5F5',
                }}
            />
        );
    }

    return (
        <div>
            <div style={{ minHeight: 400 }}>
                {isLoading ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: 16,
                    }}>
                        {[...Array(8)].map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    backgroundColor: '#FAFAFA',
                                    borderRadius: 4,
                                    height: 320,
                                    border: '1px solid #F0F0F0',
                                }}
                            />
                        ))}
                    </div>
                ) : data?.items && data.items.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                        gap: 16,
                    }}>
                        {data.items.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onView={onView}
                                onEdit={onEdit}
                                onDelete={handleDelete}
                                onToggleActive={handleToggleActive}
                            />
                        ))}
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '80px 0',
                        backgroundColor: '#FAFAFA',
                        borderRadius: 4,
                        border: '1px dashed #E5E5E5',
                    }}>
                        <Empty
                            description={<span style={{ color: '#999', fontSize: 14 }}>No products found</span>}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    </div>
                )}
            </div>

            {!isLoading && data?.items && data.items.length > 0 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    paddingTop: 24,
                }}>
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showSizeChanger
                        showTotal={(total) => (
                            <span style={{ fontSize: 13, color: '#666' }}>
                                {total} total
                            </span>
                        )}
                    />
                </div>
            )}
        </div>
    );
}
