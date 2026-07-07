// src/utils/cloudinary.ts

/**
 * Injects a Cloudinary transformation string into a delivery URL so images
 * are cropped/resized on Cloudinary's end to match a target aspect ratio,
 * instead of relying on CSS object-fit (which can crop unpredictably or
 * leave whitespace depending on the source image's original shape).
 *
 * Safe no-op for any URL that isn't a Cloudinary delivery URL (e.g. a
 * placeholder or externally hosted image) — those pass through unchanged.
 */
export function cloudinaryTransform(url: string, transformation: string): string {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', `/upload/${transformation}/`);
}

// Standard transform for product card images — matches the 4:5 (width:height)
// card aspect ratio used across ProductCard, QuickViewModal, etc.
export const CARD_IMAGE_TRANSFORM = 'c_lfill,g_auto,ar_4:5,q_auto,f_auto';

export function toCardImage(url: string): string {
  return cloudinaryTransform(url, CARD_IMAGE_TRANSFORM);
}
