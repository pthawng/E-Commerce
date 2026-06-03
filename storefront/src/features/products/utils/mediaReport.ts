import axiosClient from "@/services/axiosClient";

const reportedMedia = new Set<string>();

export function reportBrokenProductMedia(
  productId?: string | null,
  mediaUrl?: string | null,
) {
  if (!productId || !mediaUrl) return;

  const key = `${productId}:${mediaUrl}`;
  if (reportedMedia.has(key)) return;
  reportedMedia.add(key);

  axiosClient
    .post("/products/report-media-issue", {
      productId,
      mediaUrl,
    })
    .catch(() => {
      // Broken-media reporting must never break the storefront path.
    });
}
