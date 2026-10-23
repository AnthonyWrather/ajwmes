import { getApps, getApp, initializeApp } from 'firebase/app';
import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  UploadTaskSnapshot,
  StorageReference
} from 'firebase/storage';
import { firebaseConfig } from './firebaseConfig';

// Safely obtain Firebase app without circular dependency
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Safely resolve the storage bucket URL
const resolvedBucket = firebaseConfig.storageBucket?.trim();
const storageBucketUrl = resolvedBucket
  ? (resolvedBucket.startsWith('gs://') ? resolvedBucket : `gs://${resolvedBucket}`)
  : undefined;

// Initialize Firebase Storage instance
export const storage = getStorage(firebaseApp, storageBucketUrl);

// Track cloud storage availability status to avoid repeated network timeouts
let cloudStorageStatus: 'checking' | 'supported' | 'unsupported' = 'checking';

export interface UploadedPanelImage {
  id: string;
  name: string;
  originalName: string;
  url: string;
  storagePath: string;
  sizeBytes: number;
  formattedSize: string;
  contentType: string;
  uploadedAt: string;
  jobReference?: string;
  vesselName?: string;
  notes?: string;
}

export interface UploadProgressInfo {
  progress: number; // 0 to 100
  bytesTransferred: number;
  totalBytes: number;
  state: 'running' | 'paused' | 'success' | 'canceled' | 'error';
  fileName: string;
}

export interface UploadImageOptions {
  jobReference?: string;
  vesselName?: string;
  category?: 'existing_panel' | 'mounting_cavity' | 'cad_export' | 'chat_attachment' | 'general';
  onProgress?: (info: UploadProgressInfo) => void;
  customMetadata?: Record<string, string>;
}

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/svg+xml',
  'image/gif',
  'image/bmp'
];

/**
 * Format bytes into human-readable string (KB, MB)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Sanitize filename to prevent storage path errors
 */
export function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
    .replace(/_+/g, '_');
}

/**
 * Validate image file type and size constraints
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File is too large (${formatFileSize(file.size)}). Maximum allowed size is 25 MB.`
    };
  }

  // Check type or extension
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.type.toLowerCase());
  const hasImageExtension = /\.(jpg|jpeg|png|webp|heic|heif|svg|gif|bmp)$/i.test(file.name);

  if (!isAllowedMime && !hasImageExtension) {
    return {
      valid: false,
      error: 'Unsupported file format. Please upload JPG, PNG, WEBP, HEIC, or SVG images.'
    };
  }

  return { valid: true };
}

/**
 * Read file as raw DataURL
 */
function readFileAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
}

/**
 * Client-side canvas compression for vessel and switch panel photos
 * Downscales images to max 1280px on longest dimension and compresses to JPEG 0.8
 * Produces lightweight ~100-250KB data URLs that comfortably fit into Firestore documents
 */
export async function fileToOptimizedDataUrl(
  file: File | Blob,
  maxWidth = 1280,
  maxHeight = 1280,
  quality = 0.8
): Promise<{ dataUrl: string; sizeBytes: number; formattedSize: string }> {
  // If SVG or tiny icon, read directly
  if (file.type === 'image/svg+xml') {
    const rawData = await readFileAsDataUrl(file);
    return {
      dataUrl: rawData,
      sizeBytes: file.size,
      formattedSize: formatFileSize(file.size)
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (typeof window === 'undefined' || typeof Image === 'undefined') {
        resolve({
          dataUrl: rawDataUrl,
          sizeBytes: file.size,
          formattedSize: formatFileSize(file.size)
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: rawDataUrl,
            sizeBytes: file.size,
            formattedSize: formatFileSize(file.size)
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedDataUrl = canvas.toDataURL(mime, quality);
        const approxBytes = Math.round((compressedDataUrl.length * 3) / 4);

        resolve({
          dataUrl: compressedDataUrl,
          sizeBytes: approxBytes,
          formattedSize: formatFileSize(approxBytes)
        });
      };
      img.onerror = () => {
        resolve({
          dataUrl: rawDataUrl,
          sizeBytes: file.size,
          formattedSize: formatFileSize(file.size)
        });
      };
      img.src = rawDataUrl;
    };
    reader.onerror = () => {
      resolve({
        dataUrl: '',
        sizeBytes: 0,
        formattedSize: '0 B'
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a switch panel photo.
 * Tries Firebase Cloud Storage with a fast 2.5s timeout.
 * If Cloud Storage bucket is unprovisioned, throws 404, or times out,
 * seamlessly falls back to optimized client-side compressed storage and returns immediately.
 */
export async function uploadSwitchPanelImage(
  file: File,
  options?: UploadImageOptions
): Promise<UploadedPanelImage> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file');
  }

  const timestamp = Date.now();
  const sanitized = sanitizeFileName(file.name);
  const categoryFolder = options?.category || 'existing_panel';
  const jobFolder = options?.jobReference ? sanitizeFileName(options.jobReference) : 'inquiries';
  const storagePath = `switch_panels/${jobFolder}/${categoryFolder}/${timestamp}_${sanitized}`;

  // Notify initial progress
  if (options?.onProgress) {
    options.onProgress({
      progress: 25,
      bytesTransferred: Math.round(file.size * 0.25),
      totalBytes: file.size,
      state: 'running',
      fileName: file.name
    });
  }

  // Pre-generate optimized data URL immediately (instant, robust client fallback)
  const optimized = await fileToOptimizedDataUrl(file);

  if (options?.onProgress) {
    options.onProgress({
      progress: 60,
      bytesTransferred: Math.round(file.size * 0.6),
      totalBytes: file.size,
      state: 'running',
      fileName: file.name
    });
  }

  // Attempt Firebase Cloud Storage with a strict 2.5-second timeout
  const tryCloudStorage = async (): Promise<string> => {
    if (cloudStorageStatus === 'unsupported' || !storageBucketUrl) {
      throw new Error('Cloud Storage not configured');
    }

    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        jobReference: options?.jobReference || 'pending',
        vesselName: options?.vesselName || 'unspecified',
        category: categoryFolder,
        ...(options?.customMetadata || {})
      }
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        try {
          uploadTask.cancel();
        } catch {
          // ignore
        }
        cloudStorageStatus = 'unsupported';
        reject(new Error('Cloud storage timed out'));
      }, 2500);

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = 60 + ((snapshot.bytesTransferred / snapshot.totalBytes) * 35);
          if (options?.onProgress) {
            options.onProgress({
              progress: Math.min(95, Math.round(progress)),
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state,
              fileName: file.name
            });
          }
        },
        (error) => {
          clearTimeout(timer);
          cloudStorageStatus = 'unsupported';
          reject(error);
        },
        async () => {
          clearTimeout(timer);
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            cloudStorageStatus = 'supported';
            resolve(downloadUrl);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  let finalUrl = optimized.dataUrl;
  let finalPath = storagePath;

  try {
    const cloudUrl = await tryCloudStorage();
    finalUrl = cloudUrl;
  } catch (err) {
    console.warn('[Storage] Firebase Cloud Storage bucket unavailable; stored locally & synced with Firestore:', err);
    finalPath = `local_panels/${jobFolder}/${timestamp}_${sanitized}`;
  }

  if (options?.onProgress) {
    options.onProgress({
      progress: 100,
      bytesTransferred: file.size,
      totalBytes: file.size,
      state: 'success',
      fileName: file.name
    });
  }

  return {
    id: `img-${timestamp}-${Math.floor(Math.random() * 1000)}`,
    name: sanitized,
    originalName: file.name,
    url: finalUrl,
    storagePath: finalPath,
    sizeBytes: optimized.sizeBytes || file.size,
    formattedSize: optimized.formattedSize || formatFileSize(file.size),
    contentType: file.type || 'image/jpeg',
    uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    jobReference: options?.jobReference,
    vesselName: options?.vesselName
  };
}

/**
 * Upload multiple switch panel images sequentially with progress tracking
 */
export async function uploadMultiplePanelImages(
  files: File[],
  options?: UploadImageOptions
): Promise<UploadedPanelImage[]> {
  const results: UploadedPanelImage[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const image = await uploadSwitchPanelImage(file, {
      ...options,
      onProgress: (info) => {
        if (options?.onProgress) {
          const overallProgress = Math.round(((i + info.progress / 100) / files.length) * 100);
          options.onProgress({
            ...info,
            progress: overallProgress
          });
        }
      }
    });
    results.push(image);
  }
  return results;
}

/**
 * Delete a switch panel image
 */
export async function deleteSwitchPanelImage(storagePathOrUrl: string): Promise<boolean> {
  if (!storagePathOrUrl) return false;

  // Local data URLs and local paths require no network deletion
  if (
    storagePathOrUrl.startsWith('data:') || 
    storagePathOrUrl.startsWith('local_') ||
    storagePathOrUrl.startsWith('/assets/') ||
    storagePathOrUrl.startsWith('assets/')
  ) {
    return true;
  }

  if (cloudStorageStatus === 'unsupported') {
    return true;
  }

  try {
    const targetRef = ref(storage, storagePathOrUrl);
    await deleteObject(targetRef);
    return true;
  } catch (error) {
    console.warn('Failed to delete image from Firebase Storage:', error);
    return false;
  }
}

/**
 * Upload an SVG or CAD preview as an image file directly
 */
export async function uploadSvgAsStorageImage(
  svgString: string,
  fileName: string,
  options?: UploadImageOptions
): Promise<UploadedPanelImage> {
  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const file = new File([blob], fileName.endsWith('.svg') ? fileName : `${fileName}.svg`, {
    type: 'image/svg+xml'
  });

  return uploadSwitchPanelImage(file, {
    ...options,
    category: 'cad_export'
  });
}

/**
 * Check if a URL is hosted on Firebase Storage
 */
export function isFirebaseStorageUrl(url: string): boolean {
  if (!url) return false;
  return url.includes('firebasestorage.googleapis.com') || url.includes('.appspot.com') || url.includes('firebasestorage.app');
}

export interface UploadedCatalogImage {
  url: string;
  storagePath: string;
  fileName: string;
  sizeBytes: number;
  formattedSize: string;
  contentType: string;
}

/**
 * Upload a product image when creating or maintaining catalog items
 */
export async function uploadCatalogItemImage(
  file: File,
  itemId?: string,
  onProgress?: (info: UploadProgressInfo) => void
): Promise<UploadedCatalogImage> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid file format or size');
  }

  const timestamp = Date.now();
  const sanitized = sanitizeFileName(file.name);
  const itemFolder = itemId ? sanitizeFileName(itemId) : 'new_items';
  const storagePath = `catalog_items/${itemFolder}/${timestamp}_${sanitized}`;

  const optimized = await fileToOptimizedDataUrl(file);

  const tryCloud = async (): Promise<string> => {
    if (cloudStorageStatus === 'unsupported' || !storageBucketUrl) {
      throw new Error('Cloud Storage not configured');
    }

    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
        itemId: itemId || 'unassigned',
        type: 'catalog_hardware_item'
      }
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => {
        try { uploadTask.cancel(); } catch {}
        cloudStorageStatus = 'unsupported';
        reject(new Error('Cloud storage timed out'));
      }, 2500);

      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) {
            onProgress({
              progress: Math.min(100, Math.round(progress)),
              bytesTransferred: snapshot.bytesTransferred,
              totalBytes: snapshot.totalBytes,
              state: snapshot.state,
              fileName: file.name
            });
          }
        },
        (error) => {
          clearTimeout(timer);
          cloudStorageStatus = 'unsupported';
          reject(error);
        },
        async () => {
          clearTimeout(timer);
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            cloudStorageStatus = 'supported';
            resolve(url);
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  };

  try {
    const cloudUrl = await tryCloud();
    return {
      url: cloudUrl,
      storagePath,
      fileName: file.name,
      sizeBytes: file.size,
      formattedSize: formatFileSize(file.size),
      contentType: file.type || 'image/jpeg'
    };
  } catch (error) {
    console.warn('[Storage] Catalog image stored locally with instant Firestore persistence:', error);
    return {
      url: optimized.dataUrl,
      storagePath: `local_catalog/${timestamp}_${sanitized}`,
      fileName: file.name,
      sizeBytes: optimized.sizeBytes || file.size,
      formattedSize: optimized.formattedSize || formatFileSize(file.size),
      contentType: file.type || 'image/jpeg'
    };
  }
}

/**
 * Delete a catalog item image
 */
export async function deleteCatalogItemImage(storagePathOrUrl?: string): Promise<boolean> {
  if (!storagePathOrUrl) return false;

  // Protect bundled preset photos in /assets/images
  if (
    storagePathOrUrl.startsWith('/assets/') || 
    storagePathOrUrl.startsWith('assets/') ||
    storagePathOrUrl.startsWith('/src/assets/')
  ) {
    return true;
  }

  // Handle local data URLs
  if (storagePathOrUrl.startsWith('data:') || storagePathOrUrl.startsWith('local_')) {
    return true;
  }

  if (cloudStorageStatus === 'unsupported') {
    return true;
  }

  try {
    const targetRef = ref(storage, storagePathOrUrl);
    await deleteObject(targetRef);
    return true;
  } catch (error) {
    console.warn('Failed to delete catalog item image from Firebase Storage:', error);
    return false;
  }
}
