import {
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@shared';
import type { ProductSummary, ProductMedia } from '@shared';

interface ProductCardProps {
    product: ProductSummary & { media?: ProductMedia[] };
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onToggleActive: (id: string, currentStatus: boolean) => void;
}

function getDisplayName(name: Record<string, string> | null | undefined) {
    if (!name) return 'N/A';
    return name.vi || name.en || Object.values(name)[0] || 'N/A';
}

export function ProductCard({
    product,
    onView,
    onEdit,
    onDelete,
    onToggleActive,
}: ProductCardProps) {
    const displayName = getDisplayName(product.name);
    const minPrice = product.displayPriceMin;
    const maxPrice = product.displayPriceMax;
    const thumbnailUrl =
        product.thumbnailUrl ||
        product.media?.find((m) => m.isThumbnail)?.url ||
        product.media?.[0]?.url;

    return (
        <div style={{
            position: 'relative',
            backgroundColor: '#FFFFFF',
            borderRadius: 4,
            border: '1px solid #E5E5E5',
            transition: 'all 0.15s ease',
            overflow: 'hidden',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
        }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                e.currentTarget.style.borderColor = '#D0D0D0';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = '#E5E5E5';
            }}
        >
            {/* Thumbnail Area */}
            <div style={{
                position: 'relative',
                aspectRatio: '4/3',
                width: '100%',
                backgroundColor: '#FAFAFA',
                overflow: 'hidden',
                padding: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={displayName}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                ) : (
                    <div style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#CCC',
                    }}>
                        <span style={{ fontSize: 48, fontWeight: 600 }}>{displayName[0]}</span>
                    </div>
                )}

                {/* Status Badge */}
                <div style={{
                    position: 'absolute',
                    top: 8,
                    left: 8,
                }}>
                    <span style={{
                        fontSize: 11,
                        fontWeight: 500,
                        padding: '3px 10px',
                        borderRadius: 3,
                        backgroundColor: product.isActive ? '#EDF5ED' : '#F5EDED',
                        color: product.isActive ? '#5A7A5A' : '#8C5A5A',
                        border: `1px solid ${product.isActive ? '#D5E5D5' : '#E6D5D5'}`,
                    }}>
                        {product.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                {product.isFeatured && (
                    <div style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                    }}>
                        <span style={{
                            fontSize: 11,
                            fontWeight: 500,
                            padding: '3px 10px',
                            borderRadius: 3,
                            backgroundColor: '#F5F0E8',
                            color: '#8B7355',
                            border: '1px solid #E8DCC8',
                        }}>
                            Featured
                        </span>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div style={{
                padding: 16,
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                borderTop: '1px solid #F0F0F0',
            }}>
                <div style={{ marginBottom: 12 }}>
                    <h3 style={{
                        color: '#1A1A1A',
                        fontSize: 14,
                        fontWeight: 500,
                        margin: 0,
                        lineHeight: 1.4,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                    }} title={displayName}>
                        {displayName}
                    </h3>
                </div>

                <div style={{
                    marginTop: 'auto',
                    paddingTop: 12,
                    borderTop: '1px solid #F5F5F5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <p style={{
                        color: '#999',
                        fontSize: 12,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 100,
                    }}>
                        {product.slug}
                    </p>
                    <div style={{
                        color: '#1A1A1A',
                        fontWeight: 600,
                        fontSize: 14,
                    }}>
                        {minPrice ? (
                            maxPrice && minPrice !== maxPrice ? (
                                <span>{formatCurrency(minPrice)} - {formatCurrency(maxPrice)}</span>
                            ) : (
                                <span>{formatCurrency(minPrice)}</span>
                            )
                        ) : (
                            <span style={{ color: '#999', fontStyle: 'italic', fontSize: 13, fontWeight: 400 }}>Contact</span>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div style={{
                    marginTop: 12,
                    display: 'flex',
                    gap: 8,
                }}>
                    <button
                        onClick={() => onView(product.id)}
                        style={{
                            flex: 1,
                            height: 28,
                            fontSize: 12,
                            border: '1px solid #E5E5E5',
                            borderRadius: 3,
                            backgroundColor: '#FFFFFF',
                            color: '#666',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FAFAFA';
                            e.currentTarget.style.borderColor = '#D0D0D0';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#E5E5E5';
                        }}
                        title="View"
                    >
                        <EyeOutlined />
                    </button>

                    <button
                        onClick={() => onEdit(product.id)}
                        style={{
                            flex: 1,
                            height: 28,
                            fontSize: 12,
                            border: '1px solid #E5E5E5',
                            borderRadius: 3,
                            backgroundColor: '#FFFFFF',
                            color: '#666',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FAFAFA';
                            e.currentTarget.style.borderColor = '#D0D0D0';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#E5E5E5';
                        }}
                        title="Edit"
                    >
                        <EditOutlined />
                    </button>

                    <button
                        onClick={() => onToggleActive(product.id, product.isActive)}
                        style={{
                            flex: 1,
                            height: 28,
                            fontSize: 12,
                            border: '1px solid #E5E5E5',
                            borderRadius: 3,
                            backgroundColor: '#FFFFFF',
                            color: '#666',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FAFAFA';
                            e.currentTarget.style.borderColor = '#D0D0D0';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#E5E5E5';
                        }}
                        title={product.isActive ? 'Deactivate' : 'Activate'}
                    >
                        {product.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                    </button>

                    <button
                        onClick={() => onDelete(product.id)}
                        style={{
                            height: 28,
                            width: 28,
                            fontSize: 12,
                            border: '1px solid #E5E5E5',
                            borderRadius: 3,
                            backgroundColor: '#FFFFFF',
                            color: '#999',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#FEF5F5';
                            e.currentTarget.style.borderColor = '#F5EDED';
                            e.currentTarget.style.color = '#A85C5C';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#E5E5E5';
                            e.currentTarget.style.color = '#999';
                        }}
                        title="Delete"
                    >
                        <DeleteOutlined />
                    </button>
                </div>
            </div>
        </div>
    );
}
