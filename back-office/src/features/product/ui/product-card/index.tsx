import {
    EditOutlined,
    DeleteOutlined,
    EyeOutlined,
    CheckCircleOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '@shared';
import type { ProductSummary } from '@shared';

interface ProductCardProps {
    product: ProductSummary;
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

    return (
        <div className="group relative bg-white rounded-xl border border-[#D4AF37]/30 transition-all duration-300 overflow-hidden hover:shadow-[0_10px_40px_-5px_rgba(109,40,217,0.15)] h-full flex flex-col hover:-translate-y-1">
            {/* Thumbnail Area */}
            <div className="relative aspect-[4/3] w-full bg-[#FAF8F5] overflow-hidden p-4 flex items-center justify-center">
                {product.thumbnailUrl ? (
                    <img
                        src={product.thumbnailUrl}
                        alt={displayName}
                        className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#D4AF37]/40">
                        <span className="text-5xl font-serif font-bold italic">{displayName[0]}</span>
                    </div>
                )}

                {/* Status Badges - Floating */}
                <div className="absolute top-3 left-3 flex flex-col gap-2">
                    {product.isFeatured && (
                        <span className="bg-gradient-to-r from-[#D4AF37] to-[#B76E79] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg tracking-wider">
                            FEATURED
                        </span>
                    )}
                    <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-full shadow-md backdrop-blur-md border ${product.isActive
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-700'
                            }`}
                    >
                        {product.isActive ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                </div>

                {/* Hover Overlay with Actions */}
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                    <button
                        onClick={() => onView(product.id)}
                        className="h-10 w-10 rounded-full bg-white text-[#6D28D9] border border-[#6D28D9]/20 hover:bg-[#6D28D9] hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-75 flex items-center justify-center"
                        title="Xem chi tiết"
                    >
                        <EyeOutlined />
                    </button>

                    <button
                        onClick={() => onEdit(product.id)}
                        className="h-10 w-10 rounded-full bg-white text-[#D4AF37] border border-[#D4AF37]/20 hover:bg-[#D4AF37] hover:text-white transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-100 flex items-center justify-center"
                        title="Chỉnh sửa"
                    >
                        <EditOutlined />
                    </button>

                    <button
                        onClick={() => onToggleActive(product.id, product.isActive)}
                        className={`h-10 w-10 rounded-full bg-white border transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-150 flex items-center justify-center ${product.isActive
                            ? 'text-rose-500 border-rose-200 hover:bg-rose-500 hover:text-white'
                            : 'text-emerald-500 border-emerald-200 hover:bg-emerald-500 hover:text-white'
                            }`}
                        title={product.isActive ? 'Tắt kích hoạt' : 'Kích hoạt'}
                    >
                        {product.isActive ? <StopOutlined /> : <CheckCircleOutlined />}
                    </button>

                    <button
                        onClick={() => onDelete(product.id)}
                        className="h-10 w-10 rounded-full bg-white text-slate-400 border border-slate-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all shadow-lg transform translate-y-4 group-hover:translate-y-0 duration-300 delay-200 flex items-center justify-center"
                        title="Xóa"
                    >
                        <DeleteOutlined />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-1 flex flex-col group-hover:bg-[#FAF8F5]/30 transition-colors">
                <div className="mb-2">
                    <p className="text-[#D4AF37] text-[10px] font-bold tracking-widest uppercase mb-1">Luxury Item</p>
                    <h3 className="text-[#1F2937] font-serif font-bold text-lg leading-tight line-clamp-2" title={displayName}>
                        {displayName}
                    </h3>
                </div>

                <div className="mt-auto pt-3 border-t border-[#D4AF37]/10 flex items-center justify-between">
                    <p className="text-slate-400 text-xs font-mono truncate max-w-[100px] opacity-70">#{product.slug}</p>
                    <div className="text-[#6D28D9] font-bold font-serif text-lg">
                        {minPrice ? (
                            maxPrice && minPrice !== maxPrice ? (
                                <span>{formatCurrency(minPrice)} - {formatCurrency(maxPrice)}</span>
                            ) : (
                                <span>{formatCurrency(minPrice)}</span>
                            )
                        ) : (
                            <span className="text-slate-400 italic text-sm font-sans font-normal">Liên hệ</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
