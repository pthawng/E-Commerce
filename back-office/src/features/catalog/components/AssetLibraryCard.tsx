import { useState } from "react";
import { Panel } from "@/components/ui-kit";
import { getMediaAltText, isImageMedia, isVideoMedia, optimizeMediaUrl } from "@shared";
import { FileText, Image, Layers } from "lucide-react";
import type { CatalogProductDetail } from "../api/catalog.api";

type CatalogAsset = NonNullable<CatalogProductDetail["media"]>[number] & {
  mediaType?: string;
  mimeType?: string;
};

function AssetItemCard({ asset, productName }: { asset: CatalogAsset; productName?: string }) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Nhận diện loại asset dựa trên cả type (không phân biệt hoa thường) và mimeType/mediaType
  const isImage = isImageMedia(asset);

  const isVideo = isVideoMedia(asset);

  // Tối ưu hóa URL Unsplash về kích thước preview w=400
  const optimizedUrl = optimizeMediaUrl(asset.url, 400);
  const altText = getMediaAltText(asset, productName || "Product asset");

  // Bảo mật: Nếu sau này sử dụng Supabase/S3 private, cần dùng signed URL hoặc proxy endpoint ở backend.
  return (
    <div className="relative aspect-square rounded-md border border-border bg-surface overflow-hidden flex flex-col justify-between p-2 group">
      {/* Fallback Icon mờ hoặc hiển thị khi lỗi / đang tải */}
      {(hasError || isLoading || (!isImage && !isVideo)) && (
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none bg-surface-raised">
          {isImage ? (
            <Image className="h-8 w-8 text-gold" />
          ) : isVideo ? (
            <Layers className="h-8 w-8 text-info" />
          ) : (
            <FileText className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
      )}

      {/* Hiển thị hình ảnh */}
      {isImage && asset.url && !hasError && (
        <img
          src={optimizedUrl}
          alt={altText}
          className={`absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          loading="lazy"
        />
      )}

      {/* Hiển thị video */}
      {isVideo && asset.url && !hasError && (
        <video
          src={asset.url}
          className={`absolute inset-0 h-full w-full object-cover ${
            isLoading ? "opacity-0" : "opacity-100"
          }`}
          muted
          playsInline
          preload="metadata"
          loop
          onLoadedData={() => setIsLoading(false)}
          onError={() => {
            setHasError(true);
            setIsLoading(false);
          }}
          onMouseEnter={(e) => {
            if (!isLoading && !hasError) e.currentTarget.play().catch(() => {});
          }}
          onMouseLeave={(e) => {
            if (!isLoading && !hasError) e.currentTarget.pause();
          }}
        />
      )}

      {/* Lớp phủ gradient để dễ nhìn chữ (chỉ khi load thành công ảnh/video) */}
      {(isImage || isVideo) && asset.url && !hasError && !isLoading && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/45 pointer-events-none z-1" />
      )}

      {/* Thông tin đè lên ảnh */}
      <div className="relative z-10 flex items-start justify-between pointer-events-none">
        <span className="rounded bg-black/50 backdrop-blur-sm px-1.5 py-0.5 text-[8px] uppercase tracking-wider text-white font-medium">
          {asset.type}
        </span>
        <span
          className={`text-[8px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm ${
            asset.isThumbnail ? "bg-gold text-black font-extrabold" : "bg-black/50 text-white"
          }`}
        >
          {asset.isThumbnail ? "MAIN" : "ALT"}
        </span>
      </div>

      <div className="relative z-10">
        <a
          href={asset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block truncate text-[9px] text-white/90 font-medium hover:underline hover:text-gold cursor-pointer"
        >
          {asset.url}
        </a>
      </div>
    </div>
  );
}

export function AssetLibraryCard({ product }: { product?: CatalogProductDetail }) {
  const assets = product?.media ?? [];

  return (
    <Panel
      title="Premium media assets"
      subtitle={product ? `${product.name} visuals` : "Chọn một sản phẩm"}
    >
      <div className="grid grid-cols-3 gap-2">
        {assets.length ? (
          assets.map((asset) => (
            <AssetItemCard key={asset.id} asset={asset} productName={product?.name} />
          ))
        ) : (
          <div className="col-span-3 rounded-md border border-dashed border-border p-6 text-center text-[12px] text-muted-foreground">
            Chưa có asset trong thư viện.
          </div>
        )}
      </div>
    </Panel>
  );
}
