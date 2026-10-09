import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  listAll,
  UploadTaskSnapshot,
  StorageReference
} from 'firebase/storage';
import { app } from './firebase';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase Storage with the configured storage bucket
export const storage = getStorage(
  app, 
  firebaseConfig.storageBucket ? `gs://${firebaseConfig.storageBucket}` : undefined
);

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
  state: 'running' | 'paused' | 'success' | 'error';
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
 * Upload a single user-uploaded switch panel image to Firebase Storage
 * Replaces ephemeral blob URLs and localStorage with permanent cloud storage
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

  // Structured Storage Path: switch_panels/{jobFolder}/{categoryFolder}/{timestamp}_{sanitized}
  const storagePath = `switch_panels/${jobFolder}/${categoryFolder}/${timestamp}_${sanitized}`;
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

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      'state_changed',
      (snapshot: UploadTaskSnapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (options?.onProgress) {
          options.onProgress({
            progress: Math.min(100, Math.round(progress)),
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            state: snapshot.state as any,
            fileName: file.name
          });
        }
      },
      (error) => {
        console.error('Firebase Storage upload failed:', error);
        let userMessage = 'Failed to upload image to Firebase Storage.';
        if (error.code === 'storage/unauthorized') {
          userMessage = 'Permission denied to upload to Firebase Storage.';
        } else if (error.code === 'storage/canceled') {
          userMessage = 'Upload was cancelled.';
        } else if (error.code === 'storage/retry-limit-exceeded') {
          userMessage = 'Network connection timed out. Please check your internet connection.';
        }
        reject(new Error(`${userMessage} (${error.message})`));
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          const uploadedResult: UploadedPanelImage = {
            id: `img-${timestamp}-${Math.floor(Math.random() * 1000)}`,
            name: sanitized,
            originalName: file.name,
            url: downloadUrl,
            storagePath,
            sizeBytes: file.size,
            formattedSize: formatFileSize(file.size),
            contentType: file.type || 'image/jpeg',
            uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
            jobReference: options?.jobReference,
            vesselName: options?.vesselName
          };
          resolve(uploadedResult);
        } catch (urlError) {
          console.error('Failed to get download URL from Firebase Storage:', urlError);
          reject(new Error('Image uploaded but failed to retrieve public download URL.'));
        }
      }
    );
  });
}

/**
 * Upload multiple switch panel images sequentially with individual progress tracking
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
          // Adjust overall progress weighted by file index
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
 * Delete a switch panel image from Firebase Storage
 */
export async function deleteSwitchPanelImage(storagePathOrUrl: string): Promise<boolean> {
  if (!storagePathOrUrl) return false;

  try {
    let targetRef: StorageReference;
    if (storagePathOrUrl.startsWith('http://') || storagePathOrUrl.startsWith('https://')) {
      // Decode Firebase Storage URL
      targetRef = ref(storage, storagePathOrUrl);
    } else {
      // Plain path
      targetRef = ref(storage, storagePathOrUrl);
    }

    await deleteObject(targetRef);
    return true;
  } catch (error) {
    console.warn('Failed to delete image from Firebase Storage (may have already been deleted):', error);
    return false;
  }
}

/**
 * Upload an SVG or CAD preview as an image file directly to Firebase Storage
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
  return url.includes('firebasestorage.googleapis.com') || url.includes('.appspot.com');
}
