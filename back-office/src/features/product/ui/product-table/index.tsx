import { useMemo } from 'react';
import { Empty, Pagination, Alert } from 'antd';
import { ProductCard } from '../product-card';
import { useProductStore } from '../../model/store';
import { useProducts, useDeleteProduct, useUpdateProduct } from '../../model/hooks';
import { Modal, message } from 'antd'; // Use local feedback

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
            title: 'Xóa sản phẩm?',
            content: 'Hành động này không thể hoàn tác.',
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await deleteProduct.mutateAsync(id);
                    message.success('Đã xóa sản phẩm');
                } catch {
                    message.error('Xóa sản phẩm thất bại');
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
            message.success(`Đã ${!currentStatus ? 'kích hoạt' : 'vô hiệu hóa'} sản phẩm`);
        } catch (err) {
            // Safe error handling
            const msg = err instanceof Error ? err.message : 'Cập nhật thất bại';
            message.error(msg);
        }
    };

    if (error) {
        return (
            <Alert
                type="error"
                message="Không thể tải sản phẩm"
                description={error instanceof Error ? error.message : 'Unknown error'}
                className="rounded-xl border-red-200 bg-red-50 text-red-800"
            />
        );
    }

    return (
        <div className="space-y-8">
            <div className="min-h-[400px]">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-xl h-[380px] animate-pulse border border-slate-100 shadow-sm"></div>
                        ))}
                    </div>
                ) : data?.items && data.items.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
                    <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-[#D4AF37]/30">
                        <Empty
                            description={<span className="text-slate-400 font-serif italic">Không tìm thấy sản phẩm nào</span>}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    </div>
                )}
            </div>

            {!isLoading && data?.items && data.items.length > 0 && (
                <div className="flex justify-center pt-8 pb-12">
                    <Pagination
                        current={pagination.current}
                        pageSize={pagination.pageSize}
                        total={pagination.total}
                        onChange={handlePageChange}
                        showSizeChanger
                        showTotal={(total) => <span className="text-slate-500 font-medium">Tổng <span className="text-[#6D28D9] font-bold">{total}</span> sản phẩm</span>}
                        className="custom-pagination font-medium"
                    />
                </div>
            )}
        </div>
    );
}
