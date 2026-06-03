/**
 * Shared product media display policy.
 *
 * Keep this module framework-free so backend, back-office, and storefront can
 * use the same selection semantics without pulling UI or network code.
 */

export const PRODUCT_MEDIA_FALLBACK_URL = "/placeholder.svg";

export type NormalizedMediaType = "image" | "video" | "model_3d" | "unknown";

export type ProductMediaLike = {
  id?: string | null;
  url?: string | null;
  thumbnailUrl?: string | null;
  type?: string | null;
  mimeType?: string | null;
  mediaType?: string | null;
  altText?: unknown;
  isThumbnail?: boolean | null;
  order?: number | null;
};

export type ProductVariantMediaLike = {
  thumbnailUrl?: string | null;
  media?: ProductMediaLike[] | null;
  isDefault?: boolean | null;
  position?: number | null;
};

export type ProductMediaOwnerLike = {
  thumbnailUrl?: string | null;
  media?: ProductMediaLike[] | null;
  variants?: ProductVariantMediaLike[] | null;
};

export type ProductMediaDisplaySource =
  | "primary-thumbnail"
  | "primary-url"
  | "product-thumbnail"
  | "first-image"
  | "variant-thumbnail"
  | "fallback"
  | "video-fallback";

export type ProductMediaDisplay = {
  url: string | null;
  source: ProductMediaDisplaySource;
  mediaType: NormalizedMediaType;
  isFallback: boolean;
  asset?: ProductMediaLike;
};

export type ProductMediaPolicyOptions = {
  fallbackUrl?: string | null;
};

export function getMediaFallback(
  assetType: NormalizedMediaType | string | null | undefined = "image",
  fallbackUrl: string | null = PRODUCT_MEDIA_FALLBACK_URL,
): ProductMediaDisplay {
  return {
    url: fallbackUrl,
    source:
      normalizeMediaType({ type: assetType }) === "video"
        ? "video-fallback"
        : "fallback",
    mediaType: normalizeMediaType({ type: assetType }),
    isFallback: true,
  };
}

export function normalizeMediaType(
  asset?: ProductMediaLike | null,
): NormalizedMediaType {
  const explicitType = normalizeTypeToken(asset?.type);
  if (explicitType) return explicitType;

  const mediaType = asset?.mediaType?.toLowerCase();
  const mimeType = asset?.mimeType?.toLowerCase();
  const url = asset?.url?.toLowerCase() ?? "";
  const combined = `${mediaType ?? ""} ${mimeType ?? ""}`;

  if (combined.includes("image/")) return "image";
  if (combined.includes("video/")) return "video";
  if (url.match(/\.(png|jpe?g|webp|gif|avif|svg)(\?|#|$)/)) return "image";
  if (url.match(/\.(mp4|webm|mov|m4v)(\?|#|$)/)) return "video";
  if (url.match(/\.(glb|gltf|usdz)(\?|#|$)/)) return "model_3d";

  return "unknown";
}

export function isImageMedia(asset?: ProductMediaLike | null): boolean {
  return normalizeMediaType(asset) === "image";
}

export function isVideoMedia(asset?: ProductMediaLike | null): boolean {
  return normalizeMediaType(asset) === "video";
}

export function getPrimaryMedia(
  product?: ProductMediaOwnerLike | null,
): ProductMediaLike | null {
  const media = sortMedia(product?.media);
  return media.find((asset) => asset.isThumbnail) ?? media[0] ?? null;
}

export function getProductThumbnail(
  product?: ProductMediaOwnerLike | null,
  options: ProductMediaPolicyOptions = {},
): ProductMediaDisplay {
  const fallbackUrl =
    options.fallbackUrl === undefined
      ? PRODUCT_MEDIA_FALLBACK_URL
      : options.fallbackUrl;
  const primary = getPrimaryMedia(product);

  if (primary?.thumbnailUrl) {
    return {
      url: primary.thumbnailUrl,
      source: "primary-thumbnail",
      mediaType: normalizeMediaType(primary),
      isFallback: false,
      asset: primary,
    };
  }

  if (primary?.url && isImageMedia(primary)) {
    return {
      url: primary.url,
      source: "primary-url",
      mediaType: "image",
      isFallback: false,
      asset: primary,
    };
  }

  if (product?.thumbnailUrl) {
    return {
      url: product.thumbnailUrl,
      source: "product-thumbnail",
      mediaType: "image",
      isFallback: false,
    };
  }

  const firstImage = sortMedia(product?.media).find(isImageMedia);
  const firstImageUrl = firstImage?.thumbnailUrl ?? firstImage?.url;
  if (firstImageUrl) {
    return {
      url: firstImageUrl,
      source: "first-image",
      mediaType: "image",
      isFallback: false,
      asset: firstImage,
    };
  }

  const variantThumbnail = getDefaultVariant(product)?.thumbnailUrl;
  if (variantThumbnail) {
    return {
      url: variantThumbnail,
      source: "variant-thumbnail",
      mediaType: "image",
      isFallback: false,
    };
  }

  const fallbackType = primary ? normalizeMediaType(primary) : "image";
  return getMediaFallback(fallbackType, fallbackUrl);
}

export function getProductThumbnailUrl(
  product?: ProductMediaOwnerLike | null,
  options: ProductMediaPolicyOptions = {},
): string | null {
  return getProductThumbnail(product, options).url;
}

export function getSecondaryProductMedia(
  product?: ProductMediaOwnerLike | null,
): ProductMediaDisplay | null {
  const media = sortMedia(product?.media).filter(isImageMedia);
  const secondary = media.find((asset) => !asset.isThumbnail) ?? media[1];
  const url = secondary?.thumbnailUrl ?? secondary?.url;

  if (!secondary || !url) {
    return null;
  }

  return {
    url,
    source: "first-image",
    mediaType: "image",
    isFallback: false,
    asset: secondary,
  };
}

export function getProductGalleryMedia(
  product?: ProductMediaOwnerLike | null,
  options: ProductMediaPolicyOptions & {
    variant?: ProductVariantMediaLike | null;
    includeVideo?: boolean;
  } = {},
): ProductMediaDisplay[] {
  const media = sortMedia(product?.media);
  const variantMedia = sortMedia(options.variant?.media);
  const sourceMedia = media.length > 0 ? media : variantMedia;
  const allowedMedia = sourceMedia.filter((asset) =>
    options.includeVideo
      ? isImageMedia(asset) || isVideoMedia(asset)
      : isImageMedia(asset),
  );

  const displays = allowedMedia
    .map((asset): ProductMediaDisplay | null => {
      const url = asset.thumbnailUrl ?? asset.url;
      if (!url) return null;
      return {
        url,
        source: asset.isThumbnail ? "primary-url" : "first-image",
        mediaType: normalizeMediaType(asset),
        isFallback: false,
        asset,
      };
    })
    .filter((display): display is ProductMediaDisplay => Boolean(display));

  if (displays.length > 0) {
    return displays;
  }

  if (sourceMedia[0]) {
    const fallbackUrl =
      options.fallbackUrl === undefined
        ? PRODUCT_MEDIA_FALLBACK_URL
        : options.fallbackUrl;
    return [getMediaFallback(normalizeMediaType(sourceMedia[0]), fallbackUrl)];
  }

  return [getProductThumbnail(product, options)];
}

export function optimizeMediaUrl(
  url: string | null | undefined,
  width?: number,
): string {
  if (!url) return "";
  if (!width) return url;
  if (url.includes("images.unsplash.com") && !/[?&]w=/.test(url)) {
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}w=${width}&q=80&auto=format`;
  }
  return url;
}

export function getMediaAltText(
  asset?: ProductMediaLike | null,
  fallback = "Product media",
) {
  const altText = asset?.altText;
  if (typeof altText === "string" && altText.trim()) return altText;
  if (altText && typeof altText === "object") {
    const record = altText as Record<string, unknown>;
    return (
      (typeof record.vi === "string" && record.vi) ||
      (typeof record.en === "string" && record.en) ||
      Object.values(record).find(
        (item): item is string => typeof item === "string",
      ) ||
      fallback
    );
  }
  return fallback;
}

function sortMedia(media?: ProductMediaLike[] | null): ProductMediaLike[] {
  return [...(media ?? [])].sort((left, right) => {
    const leftOrder =
      typeof left.order === "number" ? left.order : Number.MAX_SAFE_INTEGER;
    const rightOrder =
      typeof right.order === "number" ? right.order : Number.MAX_SAFE_INTEGER;
    return leftOrder - rightOrder;
  });
}

function getDefaultVariant(
  product?: ProductMediaOwnerLike | null,
): ProductVariantMediaLike | null {
  const variants = [...(product?.variants ?? [])].sort((left, right) => {
    const leftPosition =
      typeof left.position === "number"
        ? left.position
        : Number.MAX_SAFE_INTEGER;
    const rightPosition =
      typeof right.position === "number"
        ? right.position
        : Number.MAX_SAFE_INTEGER;
    return leftPosition - rightPosition;
  });

  return variants.find((variant) => variant.isDefault) ?? variants[0] ?? null;
}

function normalizeTypeToken(value?: string | null): NormalizedMediaType | null {
  const normalized = value?.toLowerCase();
  if (
    normalized === "image" ||
    normalized === "video" ||
    normalized === "model_3d"
  ) {
    return normalized;
  }
  return null;
}
