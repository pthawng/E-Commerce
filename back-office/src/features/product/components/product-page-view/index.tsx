import { useState } from 'react';
import { Button, Modal, Space, Typography, message, Descriptions, Tag, Image } from 'antd';
import {
    AppstoreOutlined,
    ReloadOutlined,
    PlusOutlined,
    SearchOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { ProductTable } from '../product-table';
import { ProductForm } from '../product-form';
import { useProductStore } from '../../hooks/store';
import { useProducts, useCreateProduct, useUpdateProduct, useProduct, useDeleteProductMedia, useSetProductThumbnail } from '../../hooks/hooks';
import type { Product } from '@shared';

const { Title, Text } = Typography;

export function ProductPageView() {
    const { filters, setSearch } = useProductStore();
    const [searchValue, setSearchValue] = useState(filters.search || '');

    // Local UI State for Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    // Queries/Mutations
    const { refetch, isFetching } = useProducts(filters);
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteMedia = useDeleteProductMedia();
    const setThumbnail = useSetProductThumbnail();

    // Selected Product Data
    const { data: selectedProduct, isLoading: isLoadingProduct } = useProduct(selectedProductId || '');

    // Handlers
    const handleSearch = () => {
        setSearch(searchValue.trim());
    };

    const handleCreate = async (values: { data: Partial<Product>; images: File[] }) => {
        try {
            await createProduct.mutateAsync(values);
            message.success('Tạo sản phẩm thành công');
            setIsCreateOpen(false);
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Tạo sản phẩm thất bại');
        }
    };

    const handleEdit = async (values: { data: Partial<Product>; images: File[] }) => {
        if (!selectedProductId) return;
        try {
            await updateProduct.mutateAsync({
                id: selectedProductId,
                ...values,
            });
            message.success('Cập nhật sản phẩm thành công');
            setIsEditOpen(false);
            setSelectedProductId(null);
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Cập nhật sản phẩm thất bại');
        }
    };

    const openEditModal = (id: string) => {
        setSelectedProductId(id);
        setIsEditOpen(true);
    };

    const openViewModal = (id: string) => {
        setSelectedProductId(id);
        setIsViewOpen(true);
    };

    const handleDeleteMedia = async (productId: string, mediaId: string) => {
        try {
            await deleteMedia.mutateAsync({ productId, mediaId });
            message.success('Đã xóa ảnh');
        } catch {
            message.error('Xóa ảnh thất bại');
        }
    };

    const handleSetThumbnail = async (productId: string, mediaId: string) => {
        try {
            await setThumbnail.mutateAsync({ productId, mediaId });
            message.success('Đã đặt làm ảnh đại diện');
        } catch {
            message.error('Đặt ảnh đại diện thất bại');
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/60 p-8 rounded-3xl border border-[#D4AF37]/20 backdrop-blur-xl shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-linear-to-br from-[#6D28D9]/5 to-[#D4AF37]/5 rounded-bl-full -z-10"></div>
                <div>
                    <Title level={2} className="mb-1 text-[#1F2937] font-heading font-bold tracking-tight">
                        <Space>
                            <AppstoreOutlined className="text-[#D4AF37]" />
                            Sản phẩm
                        </Space>
                    </Title>
                    <Text className="text-slate-500 text-base">Quản lý kho hàng và danh sách sản phẩm cao cấp</Text>
                </div>
                <Space size="middle">
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="bg-white border-[#D4AF37]/30 text-slate-600 hover:bg-[#FAF8F5] hover:text-[#6D28D9] h-11 px-5 rounded-xl shadow-sm"
                    >
                        Làm mới
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsCreateOpen(true)}
                        className="bg-linear-to-r from-[#6D28D9] to-[#4C1D95] border-none text-white hover:shadow-lg hover:shadow-violet-200 font-medium h-11 px-7 rounded-xl transition-all hover:scale-105"
                    >
                        Tạo sản phẩm
                    </Button>
                </Space>
            </div>

            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <SearchOutlined className="text-[#D4AF37] group-focus-within:text-[#6D28D9] transition-colors text-lg" />
                    </div>
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo tên hoặc mã slug..."
                        className="block w-full pl-12 pr-4 py-3.5 border border-[#D4AF37]/20 rounded-2xl bg-white text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-[#6D28D9]/20 focus:border-[#6D28D9] outline-none transition-all shadow-sm group-hover:shadow-md"
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <div className="absolute inset-y-0 right-2 flex items-center">
                        <Button type="text" onClick={handleSearch} className="text-[#6D28D9]! hover:bg-[#6D28D9]/5! font-medium">Tìm kiếm</Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <ProductTable onEdit={openEditModal} onView={openViewModal} />

            {/* Modals - Kept here for simplicity in FSD container */}
            <Modal
                title={<span className="text-xl font-heading font-bold text-[#1F2937]">Tạo mới sản phẩm</span>}
                open={isCreateOpen}
                centered
                onCancel={() => setIsCreateOpen(false)}
                footer={null}
                width={900}
                destroyOnHidden
            >
                <ProductForm
                    onSubmit={handleCreate}
                    onCancel={() => setIsCreateOpen(false)}
                    loading={createProduct.isPending}
                />
            </Modal>

            <Modal
                title={<span className="text-xl font-heading font-bold text-[#1F2937]">Chỉnh sửa sản phẩm</span>}
                open={isEditOpen}
                centered
                onCancel={() => {
                    setIsEditOpen(false);
                    setSelectedProductId(null);
                }}
                footer={null}
                width={900}
                destroyOnHidden
            >
                {selectedProduct && (
                    <ProductForm
                        initialValues={selectedProduct}
                        onSubmit={handleEdit}
                        onCancel={() => {
                            setIsEditOpen(false);
                            setSelectedProductId(null);
                        }}
                        loading={updateProduct.isPending}
                    />
                )}
            </Modal>

            <Modal
                title={<span className="text-xl font-heading font-bold text-[#1F2937]">Chi tiết sản phẩm</span>}
                open={isViewOpen}
                centered
                onCancel={() => {
                    setIsViewOpen(false);
                    setSelectedProductId(null);
                }}
                footer={null}
                width={900}
                destroyOnHidden
            >
                {isLoadingProduct ? (
                    <div className="p-12 text-center text-slate-400">Đang tải...</div>
                ) : selectedProduct ? (
                    <div className="space-y-8">
                        <Descriptions bordered column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }} className="bg-white">
                            <Descriptions.Item label="Tên (VI)">
                                <span className="text-[#1F2937] font-medium font-serif text-lg">{(selectedProduct.name as Record<string, string>)?.vi || 'N/A'}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Tên (EN)">
                                <span className="text-slate-600 font-medium font-serif text-lg">{(selectedProduct.name as Record<string, string>)?.en || 'N/A'}</span>
                            </Descriptions.Item>
                            <Descriptions.Item label="Slug"><code className="text-[#6D28D9] bg-violet-50 px-2 py-1 rounded">{selectedProduct.slug}</code></Descriptions.Item>
                            <Descriptions.Item label="Trạng thái">
                                <Tag color={selectedProduct.isActive ? 'success' : 'error'} className="px-3 py-1 rounded-full font-bold">
                                    {selectedProduct.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Nổi bật">
                                <Tag color={selectedProduct.isFeatured ? 'gold' : 'default'} className="px-3 py-1 rounded-full font-bold">
                                    {selectedProduct.isFeatured ? 'FEATURED' : 'NORMAL'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="Biến thể">
                                <Tag>{selectedProduct.hasVariants ? 'Có' : 'Không'}</Tag>
                            </Descriptions.Item>
                        </Descriptions>

                        {selectedProduct.media && selectedProduct.media.length > 0 && (
                            <div className="bg-[#FAF8F5] p-6 rounded-2xl border border-[#D4AF37]/10">
                                <Title level={5} className="text-[#1F2937] font-heading mb-4 border-b border-[#D4AF37]/10 pb-2 inline-block">Thư viện ảnh</Title>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    {selectedProduct.media.map((media) => (
                                        <div key={media.id} className="group relative rounded-xl overflow-hidden border border-white shadow-sm hover:shadow-lg transition-all duration-300">
                                            <div className="aspect-square bg-white flex items-center justify-center p-2">
                                                <Image src={media.url} alt="Product" className="w-full! h-full! object-contain!" />
                                            </div>

                                            {/* Overlay actions */}
                                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center gap-3">
                                                {media.isThumbnail ? (
                                                    <Tag color="gold" className="m-0 px-3 py-1 text-xs font-bold shadow-lg ring-2 ring-white/20">THUMBNAIL</Tag>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        className="bg-[#D4AF37] text-white border-none font-bold shadow-lg"
                                                        onClick={() => handleSetThumbnail(selectedProduct.id, media.id)}
                                                        loading={setThumbnail.isPending}
                                                    >
                                                        Set Thumbnail
                                                    </Button>
                                                )}
                                                <Button
                                                    size="small"
                                                    className="bg-white text-red-500 border-red-100 hover:bg-red-50 hover:border-red-200"
                                                    icon={<DeleteOutlined />}
                                                    onClick={() => handleDeleteMedia(selectedProduct.id, media.id)}
                                                    loading={deleteMedia.isPending}
                                                >
                                                    Xóa
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div>Không tìm thấy sản phẩm</div>
                )}
            </Modal>
        </div>
    );
}
