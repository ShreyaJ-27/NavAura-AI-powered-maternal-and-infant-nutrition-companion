export const ACCEPTED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_IMAGE_BYTES = 20 * 1024 * 1024; // 20 MB

export async function validateImageFile(file: File): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (!file) {
    return { ok: false, reason: 'No file provided.' };
  }

  if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, reason: 'Please upload a JPG, PNG, or WebP image.' };
  }

  if (file.size <= 0) {
    return { ok: false, reason: 'The uploaded file is empty.' };
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, reason: 'Image is too large. Please upload an image under 20 MB.' };
  }

  // Server-safe magic byte check (no browser APIs)
  try {
    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer.slice(0, 16));
    const header = Array.from(bytes)
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');

    // JPEG: ffd8ff, PNG: 89504e47, WebP: 52494646...57454250
    const validStarts = ['ffd8ff', '89504e47', '52494646'];
    const isLikelyImage = validStarts.some(
      (prefix) => header.startsWith(prefix) || header.includes(prefix)
    );

    if (!isLikelyImage) {
      return { ok: false, reason: 'The uploaded file does not look like a valid image.' };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'The uploaded image appears to be corrupted or unreadable.' };
  }
}
