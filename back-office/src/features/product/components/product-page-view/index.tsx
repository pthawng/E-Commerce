import { useState } from 'react';
import { Button, Modal, Input, message, Descriptions, Tag, Image, Tabs } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { ProductTable } from '../product-table';
import { ProductForm } from '../product-form';
import { VariantTable } from '../variant-table';
import type { Product } from '@shared';
import { useProductStore } from '../../hooks/store';
import { useProducts, useCreateProduct, useUpdateProduct, useProduct, useDeleteProductMedia, useSetProductThumbnail } from '../../hooks/hooks';
import type { CreateProductDTO } from '../../services/create-product';
import { PageHeader, FilterBar } from '@/shared/ui';
import { contentContainerStyle, cardStyle, headingStyles } from '@/ui/styles';

const { Search } = Input;

export function ProductPageView() {
    const { filters, setSearch } = useProductStore();
    const [searchValue, setSearchValue] = useState(filters.search || '');

    // Local UI State for Modals
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

    // Queries/Mutations
    const { data, refetch, isFetching } = useProducts(filters);
    const createProduct = useCreateProduct();
    const updateProduct = useUpdateProduct();
    const deleteMedia = useDeleteProductMedia();
    const setThumbnail = useSetProductThumbnail();

    // Selected Product Data
    const { data: selectedProduct, isLoading: isLoadingProduct } = useProduct(selectedProductId || '');

    // Handlers
    const handleSearch = (value: string) => {
        setSearch(value.trim());
    };

    const handleCreate = async (values: { data: CreateProductDTO; images: File[] }) => {
        try {
            await createProduct.mutateAsync(values);
            message.success('Product created successfully');
            setIsCreateOpen(false);
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Failed to create product');
        }
    };

    const handleEdit = async (values: { data: Partial<CreateProductDTO>; images: File[] }) => {
        if (!selectedProductId) return;
        try {
            await updateProduct.mutateAsync({
                id: selectedProductId,
                ...values,
            });
            message.success('Product updated successfully');
            setIsEditOpen(false);
            setSelectedProductId(null);
        } catch (err) {
            message.error(err instanceof Error ? err.message : 'Failed to update product');
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
            message.success('Image deleted');
        } catch {
            message.error('Failed to delete image');
        }
    };

    const handleSetThumbnail = async (productId: string, mediaId: string) => {
        try {
            await setThumbnail.mutateAsync({ productId, mediaId });
            message.success('Thumbnail set');
        } catch {
            message.error('Failed to set thumbnail');
        }
    };

    return (
        <div>
            {/* Page Header */}
            <PageHeader
                title="Products"
                subtitle={`${data?.meta?.total || 0} products`}
                actions={
                    <>
                        <Button size="small" onClick={() => refetch()} disabled={isFetching}>
                            Refresh
                        </Button>
                        <Button type="primary" size="small" onClick={() => setIsCreateOpen(true)}>
                            Create Product
                        </Button>
                    </>
                }
            />

            {/* Filters */}
            <FilterBar>
                <Search
                    placeholder="Search products..."
                    allowClear
                    onSearch={handleSearch}
                    style={{ width: 280 }}
                    size="middle"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
            </FilterBar>

            {/* Content */}
            <div style={contentContainerStyle}>
                <div style={cardStyle}>
                    <ProductTable onEdit={openEditModal} onView={openViewModal} />
                </div>
            </div>

            {/* Create Modal */}
            <Modal
                title="Create Product"
                open={isCreateOpen}
                centered
                onCancel={() => setIsCreateOpen(false)}
                footer={null}
                width={900}
                destroyOnClose
            >
                <ProductForm
                    onSubmit={handleCreate}
                    onCancel={() => setIsCreateOpen(false)}
                    loading={createProduct.isPending}
                />
            </Modal>

            {/* Edit Modal */}
            <Modal
                title="Edit Product"
                open={isEditOpen}
                centered
                onCancel={() => {
                    setIsEditOpen(false);
                    setSelectedProductId(null);
                }}
                footer={null}
                width={900}
                destroyOnClose
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

            {/* View Modal */}
            <Modal
                title="Product Details"
                open={isViewOpen}
                centered
                onCancel={() => {
                    setIsViewOpen(false);
                    setSelectedProductId(null);
                }}
                footer={null}
                width={960}
                destroyOnClose
            >
                {isLoadingProduct ? (
                    <div style={{ padding: '60px 0', textAlign: 'center', color: '#999' }}>Loading...</div>
                ) : selectedProduct ? (
                    <Tabs
                        defaultActiveKey="general"
                        items={[
                            {
                                key: 'general',
                                label: 'General Info',
                                children: (
                                    <div>
                                        <Descriptions
                                            bordered
                                            column={{ xxl: 2, xl: 2, lg: 2, md: 1, sm: 1, xs: 1 }}
                                            labelStyle={{
                                                fontSize: 13,
                                                fontWeight: 500,
                                                color: '#666',
                                            }}
                                            contentStyle={{
                                                fontSize: 14,
                                                color: '#1A1A1A',
                                            }}
                                        >
                                            <Descriptions.Item label="Name (VI)">
                                                {(selectedProduct.name as Record<string, string>)?.vi || 'N/A'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Name (EN)">
                                                {(selectedProduct.name as Record<string, string>)?.en || 'N/A'}
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Slug">
                                                <code style={{
                                                    fontSize: 13,
                                                    color: '#666',
                                                    backgroundColor: '#F8F8F8',
                                                    padding: '2px 6px',
                                                    borderRadius: 3,
                                                }}>
                                                    {selectedProduct.slug}
                                                </code>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Status">
                                                <Tag color={selectedProduct.isActive ? 'success' : 'default'}>
                                                    {selectedProduct.isActive ? 'Active' : 'Inactive'}
                                                </Tag>
                                            </Descriptions.Item>
                                            <Descriptions.Item label="Featured">
                                                <Tag color={selectedProduct.isFeatured ? 'warning' : 'default'}>
                                                    {selectedProduct.isFeatured ? 'Featured' : 'Normal'}
                                                </Tag>
                                            </Descriptions.Item>
                                        </Descriptions>
                                    </div>
                                ),
                            },
                            {
                                key: 'variants',
                                label: 'Variants',
                                children: <VariantTable product={selectedProduct as Product} />,
                            },
                            {
                                key: 'media',
                                label: 'Images',
                                children:
                                    selectedProduct.media && selectedProduct.media.length > 0 ? (
                                        <div style={{
                                            padding: 16,
                                            backgroundColor: '#FAFAFA',
                                            borderRadius: 4,
                                        }}>
                                            <h4 style={{
                                                ...headingStyles.cardTitle,
                                                marginBottom: 16,
                                            }}>
                                                Image Gallery
                                            </h4>
                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                                                gap: 16,
                                            }}>
                                                {selectedProduct.media.map((media) => (
                                                    <div
                                                        key={media.id}
                                                        style={{
                                                            position: 'relative',
                                                            borderRadius: 4,
                                                            overflow: 'hidden',
                                                            border: '1px solid #F0F0F0',
                                                            backgroundColor: '#FFFFFF',
                                                        }}
                                                    >
                                                        <div style={{
                                                            aspectRatio: '1',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            padding: 8,
                                                        }}>
                                                            <Image
                                                                src={media.url}
                                                                alt="Product"
                                                                style={{
                                                                    width: '100%',
                                                                    height: '100%',
                                                                    objectFit: 'contain',
                                                                }}
                                                            />
                                                        </div>
                                                        <div style={{
                                                            padding: 8,
                                                            borderTop: '1px solid #F0F0F0',
                                                            display: 'flex',
                                                            gap: 8,
                                                            justifyContent: 'space-between',
                                                        }}>
                                                            {media.isThumbnail ? (
                                                                <Tag style={{ margin: 0, fontSize: 11 }}>
                                                                    Thumbnail
                                                                </Tag>
                                                            ) : (
                                                                <Button
                                                                    size="small"
                                                                    onClick={() => handleSetThumbnail(selectedProduct.id, media.id)}
                                                                    loading={setThumbnail.isPending}
                                                                    style={{ fontSize: 12 }}
                                                                >
                                                                    Set
                                                                </Button>
                                                            )}
                                                            <Button
                                                                size="small"
                                                                danger
                                                                icon={<DeleteOutlined />}
                                                                onClick={() => handleDeleteMedia(selectedProduct.id, media.id)}
                                                                loading={deleteMedia.isPending}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ padding: '60px 0', textAlign: 'center', color: '#999' }}>
                                            No images
                                        </div>
                                    ),
                            },
                        ]}
                    />
                ) : (
                    <div style={{ padding: '60px 0', textAlign: 'center', color: '#999' }}>
                        Product not found
                    </div>
                )}
            </Modal>
        </div>
    );
}
