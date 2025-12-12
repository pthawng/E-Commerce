/**
 * Products Page
 * CRUD đầy đủ cho quản lý sản phẩm với upload nhiều ảnh
 */
import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
  Descriptions,
  Image,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { formatCurrency, type ProductSummary, type Product } from '@shared';
import { useProducts, useProduct } from '@/services/queries/products.queries';
import {
  useCreateProduct,
  useDeleteProduct,
  useUpdateProduct,
  useDeleteProductMedia,
  useSetProductThumbnail,
} from '@/services/mutations/products.mutations';
import { ProductForm } from '@/components/product/ProductForm';

const { Title, Text } = Typography;

type FiltersState = {
  page?: number;
  limit?: number;
  search?: string;
};

function getDisplayName(name: Record<string, string> | null | undefined) {
  if (!name) return 'N/A';
  return name.vi || name.en || Object.values(name)[0] || 'N/A';
}

export default function ProductsPage() {
  const [filters, setFilters] = useState<FiltersState>({ page: 1, limit: 10 });
  const [searchValue, setSearchValue] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { data, isLoading, isFetching, error, refetch } = useProducts(filters);
  const { data: selectedProduct, isLoading: isLoadingProduct } = useProduct(
    selectedProductId || '',
  );

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const deleteMedia = useDeleteProductMedia();
  const setThumbnail = useSetProductThumbnail();

  const pagination = useMemo(() => {
    const meta = data?.meta;
    return {
      current: meta?.page ?? filters.page ?? 1,
      pageSize: meta?.limit ?? filters.limit ?? 10,
      total: meta?.total ?? 0,
      showSizeChanger: true,
      showTotal: (total: number, range: [number, number]) =>
        `${range[0]}-${range[1]} / ${total}`,
    };
  }, [data?.meta, filters.page, filters.limit]);

  const handleTableChange = (page: number, pageSize?: number) => {
    setFilters((prev) => ({
      ...prev,
      page,
      limit: pageSize ?? prev.limit,
    }));
  };

  const handleSearch = () => {
    setFilters((prev) => ({
      ...prev,
      page: 1,
      search: searchValue.trim() || undefined,
    }));
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

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct.mutateAsync(id);
      message.success('Đã xóa sản phẩm');
    } catch {
      message.error('Xóa sản phẩm thất bại');
    }
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

  const openEditModal = (id: string) => {
    setSelectedProductId(id);
    setIsEditOpen(true);
  };

  const openViewModal = (id: string) => {
    setSelectedProductId(id);
    setIsViewOpen(true);
  };

  const columns: ColumnsType<ProductSummary> = [
    {
      title: 'Sản phẩm',
      dataIndex: 'name',
      render: (name, record) => (
        <Space>
          <Avatar shape="square" size={48} src={record.thumbnailUrl}>
            {getDisplayName(name)[0]}
          </Avatar>
          <div>
            <div className="font-semibold text-slate-100">{getDisplayName(name)}</div>
            <Text type="secondary" className="text-xs">
              /{record.slug}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Giá hiển thị',
      render: (_, record) => {
        const min = record.displayPriceMin;
        const max = record.displayPriceMax;
        if (min && max) {
          return (
            <Text>
              {formatCurrency(min)} - {formatCurrency(max)}
            </Text>
          );
        }
        if (min) return <Text>{formatCurrency(min)}</Text>;
        return <Text type="secondary">N/A</Text>;
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>{isActive ? 'Active' : 'Inactive'}</Tag>
      ),
    },
    {
      title: 'Nổi bật',
      dataIndex: 'isFeatured',
      render: (isFeatured) => (
        <Tag color={isFeatured ? 'gold' : 'default'}>
          {isFeatured ? 'Featured' : 'Normal'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Xem chi tiết">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => openViewModal(record.id)}
            />
          </Tooltip>

          <Tooltip title="Chỉnh sửa">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => openEditModal(record.id)}
            />
          </Tooltip>

          <Tooltip title="Bật/tắt Active">
            <Switch
              size="small"
              checked={record.isActive}
              loading={updateProduct.isPending}
              onChange={async (checked) => {
                try {
                  await updateProduct.mutateAsync({
                    id: record.id,
                    data: { isActive: checked },
                  });
                  message.success('Cập nhật trạng thái thành công');
                } catch (err) {
                  const description =
                    err instanceof Error ? err.message : 'Cập nhật thất bại';
                  message.error(description);
                }
              }}
            />
          </Tooltip>

          <Popconfirm
            title="Xóa sản phẩm?"
            okText="Xóa"
            cancelText="Hủy"
            okButtonProps={{ danger: true, loading: deleteProduct.isPending }}
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger size="small" icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Title level={3} className="mb-1! text-slate-100">
            Sản phẩm
          </Title>
          <Text type="secondary">Quản lý danh sách sản phẩm với upload nhiều ảnh</Text>
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()} disabled={isFetching}>
            Làm mới
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreateOpen(true)}>
            Tạo sản phẩm
          </Button>
        </Space>
      </div>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên/slug"
            className="flex-1 px-3 py-2 border border-gray-600 rounded bg-gray-800 text-white"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button type="primary" onClick={handleSearch} icon={<SearchOutlined />}>
            Tìm kiếm
          </Button>
        </div>

        {error && (
          <Alert
            type="error"
            message="Không thể tải sản phẩm"
            description={error instanceof Error ? error.message : 'Unknown error'}
            className="mb-4"
          />
        )}

        <Table<ProductSummary>
          rowKey="id"
          dataSource={data?.items || []}
          columns={columns}
          loading={isLoading || isFetching}
          pagination={{
            ...pagination,
            onChange: handleTableChange,
          }}
        />
      </Card>

      {/* Create Modal */}
      <Modal
        title="Tạo sản phẩm mới"
        open={isCreateOpen}
        onCancel={() => setIsCreateOpen(false)}
        footer={null}
        width={800}
        destroyOnHidden
      >
        <ProductForm
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
          loading={createProduct.isPending}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        title="Chỉnh sửa sản phẩm"
        open={isEditOpen}
        onCancel={() => {
          setIsEditOpen(false);
          setSelectedProductId(null);
        }}
        footer={null}
        width={800}
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

      {/* View Modal */}
      <Modal
        title="Chi tiết sản phẩm"
        open={isViewOpen}
        onCancel={() => {
          setIsViewOpen(false);
          setSelectedProductId(null);
        }}
        footer={null}
        width={900}
        destroyOnHidden
      >
        {isLoadingProduct ? (
          <div>Đang tải...</div>
        ) : selectedProduct ? (
          <div className="space-y-4">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Tên (VI)">
                {(selectedProduct.name as Record<string, string>)?.vi || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Tên (EN)">
                {(selectedProduct.name as Record<string, string>)?.en || 'N/A'}
              </Descriptions.Item>
              <Descriptions.Item label="Slug">{selectedProduct.slug}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={selectedProduct.isActive ? 'green' : 'red'}>
                  {selectedProduct.isActive ? 'Active' : 'Inactive'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Nổi bật">
                <Tag color={selectedProduct.isFeatured ? 'gold' : 'default'}>
                  {selectedProduct.isFeatured ? 'Featured' : 'Normal'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Có biến thể">
                <Tag>{selectedProduct.hasVariants ? 'Có' : 'Không'}</Tag>
              </Descriptions.Item>
            </Descriptions>

            {selectedProduct.media && selectedProduct.media.length > 0 && (
              <div>
                <Title level={5}>Ảnh sản phẩm</Title>
                <div className="grid grid-cols-4 gap-4">
                  {selectedProduct.media.map((media) => (
                    <div key={media.id} className="relative">
                      <Image src={media.url} alt="Product" className="w-full rounded" />
                      <div className="mt-2 flex gap-2">
                        {media.isThumbnail && (
                          <Tag color="gold" className="text-xs">
                            Thumbnail
                          </Tag>
                        )}
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDeleteMedia(selectedProduct.id, media.id)}
                          loading={deleteMedia.isPending}
                        >
                          Xóa
                        </Button>
                        {!media.isThumbnail && (
                          <Button
                            size="small"
                            onClick={() => handleSetThumbnail(selectedProduct.id, media.id)}
                            loading={setThumbnail.isPending}
                          >
                            Đặt làm thumbnail
                          </Button>
                        )}
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
