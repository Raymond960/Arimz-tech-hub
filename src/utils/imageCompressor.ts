/**
 * Image Compression, Validation, and Storage Optimization Utility for Shendam Connect
 * Ensures high visual quality, prevents browser memory bottlenecks, and eliminates localStorage quota errors.
 */

export interface ProcessedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  originalSize: number;
  compressedSize: number;
  mimeType: string;
}

const MAX_IMAGE_DIMENSION = 800; // 800px max on longest side for display quality
const MAX_FILE_SIZE_BYTES = 30 * 1024 * 1024; // 30MB maximum file size limit (allows high-res camera photos)
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * Validates file format and size before processing
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No image file selected.' };
  }

  // Validate file size (30MB max)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      error: `File size (${sizeInMB}MB) exceeds maximum limit of 30MB.`
    };
  }

  // Validate format (JPG, PNG, WEBP)
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const isMimeAllowed = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
  const isExtAllowed = ALLOWED_EXTENSIONS.includes(extension);

  if (!isMimeAllowed && !isExtAllowed) {
    return {
      valid: false,
      error: `Invalid file type (${extension || 'unsupported'}). Only JPG, PNG, and WebP images are allowed.`
    };
  }

  return { valid: true };
}

/**
 * Resizes and compresses an image file on an HTML5 canvas
 */
export function compressAndValidateImage(
  file: File,
  maxDimension: number = MAX_IMAGE_DIMENSION
): Promise<ProcessedImageResult> {
  return new Promise((resolve, reject) => {
    // 1. Validate file format and size
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return reject(new Error(validation.error));
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale down to maxDimension preserving aspect ratio
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            // Fallback to raw data URL if canvas context unavailable
            const rawDataUrl = event.target?.result as string;
            return resolve({
              dataUrl: rawDataUrl,
              width: img.width,
              height: img.height,
              originalSize: file.size,
              compressedSize: rawDataUrl.length,
              mimeType: file.type || 'image/jpeg'
            });
          }

          // Clear background for PNG/WebP transparency support
          ctx.clearRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Determine output format & compression quality
          const isTransparent = file.type === 'image/png' || file.type === 'image/webp';
          const outputMimeType = isTransparent ? 'image/webp' : 'image/jpeg';
          const quality = 0.7;

          const dataUrl = canvas.toDataURL(outputMimeType, quality);
          const compressedSizeBytes = Math.round((dataUrl.length * 3) / 4);

          resolve({
            dataUrl,
            width,
            height,
            originalSize: file.size,
            compressedSize: compressedSizeBytes,
            mimeType: outputMimeType
          });
        } catch (err: any) {
          reject(new Error(`Image compression failed: ${err.message || 'Canvas rendering error'}`));
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to decode image file. The file may be corrupted or invalid.'));
      };

      if (typeof event.target?.result === 'string') {
        img.src = event.target.result;
      } else {
        reject(new Error('Failed to read image data from device.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Device file read error. Please re-select the image file.'));
    };

    reader.readAsDataURL(file);
  });
}
