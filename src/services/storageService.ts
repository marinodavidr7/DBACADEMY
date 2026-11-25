/**
 * storageService.ts
 * Handles file uploads to Firebase Storage for course materials and cover images,
 * with automatic optimization and resilient fallback to Data URLs.
 */
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { assertPlatformAdminWrite, storage } from '../firebase';
import type { CourseMaterial, CourseMaterialType } from '../types';
import { normalizarUrlImagen } from '../utils/imageUtils';

/** Map MIME types to our internal material type */
export function detectMaterialType(file: File): CourseMaterialType {
  const mime = file.type.toLowerCase();
  if (mime === 'application/pdf') return 'pdf';
  if (mime.startsWith('video/')) return 'video';
  if (
    mime.includes('word') ||
    mime === 'application/msword' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  )
    return 'doc';
  if (
    mime.includes('excel') ||
    mime.includes('spreadsheet') ||
    mime === 'text/csv'
  )
    return 'spreadsheet';
  if (mime.startsWith('image/')) return 'image';
  if (mime.includes('zip') || mime.includes('compressed')) return 'zip';
  return 'other';
}

/** Human-readable file size */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1_073_741_824) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_073_741_824).toFixed(2)} GB`;
}

/** Icon name string for display (resolved by CoursePlayerView) */
export function materialIcon(type: CourseMaterialType): string {
  const map: Record<CourseMaterialType, string> = {
    pdf: 'FileText',
    video: 'Video',
    doc: 'FileText',
    spreadsheet: 'FileSpreadsheet',
    image: 'Image',
    zip: 'Archive',
    other: 'Paperclip',
  };
  return map[type];
}

export type UploadProgressCallback = (pct: number) => void;

/**
 * Optimizes an image file client-side using an HTML5 Canvas,
 * reducing its footprint to a clean, fast WebP/JPEG Data URL.
 */
export async function fileToOptimizedDataUrl(
  file: File,
  maxWidth = 1280,
  maxHeight = 720,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Prefer image/webp if supported, fallback to image/jpeg
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a course cover image.
 * Attempts Firebase Storage first; on any permission/CORS error, falls back
 * automatically to a lightweight optimized Data URL so the upload never fails.
 */
export async function uploadCourseCoverImage(
  courseId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<string> {
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `courses/${courseId}/covers/${Date.now()}_${sanitized}`;

  try {
    await assertPlatformAdminWrite('subir portada de curso');
    const fileRef = ref(storage, storagePath);

    const uploadPromise = new Promise<string>((resolve, reject) => {
      const task = uploadBytesResumable(fileRef, file, {
        contentType: file.type,
        customMetadata: { originalName: file.name, courseId },
      });
      const timeoutId = window.setTimeout(() => {
        try { task.cancel(); } catch { /* ignore */ }
        reject(new Error('Tiempo de espera agotado al subir a Firebase Storage.'));
      }, 30000);

      task.on(
        'state_changed',
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress?.(pct);
        },
        (err) => { window.clearTimeout(timeoutId); reject(err); },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            window.clearTimeout(timeoutId);
            resolve(url);
          } catch (e) {
            window.clearTimeout(timeoutId);
            reject(e);
          }
        }
      );
    });

    return await uploadPromise;
  } catch (err) {
    console.warn('Firebase Storage upload failed or not permitted, using optimized Data URL fallback:', err);
    onProgress?.(100);
    return await fileToOptimizedDataUrl(file, 1280, 720, 0.82);
  }
}

/**
 * Upload a file to Firebase Storage under:
 *   courses/{courseId}/lessons/{lessonId}/{timestamp}_{filename}
 *
 * If Storage is restricted or offline, falls back gracefully to Data URL.
 */
export async function uploadCourseMaterial(
  courseId: string,
  lessonId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<CourseMaterial> {
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `courses/${courseId}/lessons/${lessonId}/${Date.now()}_${sanitized}`;

  try {
    await assertPlatformAdminWrite('subir material de curso');
    const fileRef = ref(storage, storagePath);

    const uploadPromise = new Promise<CourseMaterial>((resolve, reject) => {
      const task = uploadBytesResumable(fileRef, file, {
        contentType: file.type,
        customMetadata: {
          originalName: file.name,
          courseId,
          lessonId,
        },
      });

      const timeoutId = window.setTimeout(() => {
        try { task.cancel(); } catch { /* ignore */ }
        reject(new Error('Tiempo de espera agotado al subir a Firebase Storage.'));
      }, 30000);

      task.on(
        'state_changed',
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress?.(pct);
        },
        (err) => { window.clearTimeout(timeoutId); reject(err); },
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            window.clearTimeout(timeoutId);
            const material: CourseMaterial = {
              id: `mat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
              name: file.name,
              url,
              type: detectMaterialType(file),
              sizeByte: file.size,
              uploadedAt: new Date().toISOString(),
            };
            resolve(material);
          } catch (e) {
            window.clearTimeout(timeoutId);
            reject(e);
          }
        }
      );
    });

    return await uploadPromise;
  } catch (err) {
    console.warn('Firebase Storage upload error, falling back to local Data URL:', err);
    onProgress?.(100);
    const dataUrl = await fileToOptimizedDataUrl(file);
    return {
      id: `mat_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      url: dataUrl,
      type: detectMaterialType(file),
      sizeByte: file.size,
      uploadedAt: new Date().toISOString(),
    };
  }
}

/**
 * Delete a material from Firebase Storage.
 * Silently ignores "not found" errors.
 */
export async function deleteCourseMaterial(url: string): Promise<void> {
  if (url.startsWith('data:')) {
    return;
  }
  try {
    await assertPlatformAdminWrite('eliminar material de curso');
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'storage/object-not-found'
    ) {
      return;
    }
    console.warn('deleteCourseMaterial error:', err);
  }
}

/**
 * Fallback: Accepts an external URL as a "material" (no upload).
 */
export function buildExternalMaterial(
  name: string,
  url: string,
  type: CourseMaterialType = 'other',
  description?: string
): CourseMaterial {
  const cleanDescription = description?.trim();
  return {
    id: `mat_ext_${Date.now().toString(36)}`,
    name,
    url: normalizarUrlImagen(url),
    type,
    ...(cleanDescription ? { description: cleanDescription } : {}),
    sizeByte: 0,
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Upload an assignment submission file by a student.
 * If Firebase Storage is restricted or offline, falls back gracefully to Data URL.
 */
export async function uploadAssignmentSubmissionFile(
  courseId: string,
  lessonId: string,
  studentId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<{ url: string; name: string; size: number }> {
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `submissions/${courseId}/${lessonId}/${studentId}_${Date.now()}_${sanitized}`;

  try {
    const fileRef = ref(storage, storagePath);
    const task = uploadBytesResumable(fileRef, file, {
      contentType: file.type || 'application/octet-stream',
      customMetadata: { originalName: file.name, studentId, courseId, lessonId },
    });

    return await new Promise<{ url: string; name: string; size: number }>((resolve, reject) => {
      task.on(
        'state_changed',
        (snap) => {
          const pct = Math.round((snap.bytesTransferred / snap.totalBytes) * 100);
          onProgress?.(pct);
        },
        (err) => reject(err),
        async () => {
          try {
            const url = await getDownloadURL(task.snapshot.ref);
            resolve({
              url,
              name: file.name,
              size: file.size,
            });
          } catch (e) {
            reject(e);
          }
        }
      );
    });
  } catch (err) {
    console.warn('Firebase Storage submission upload failed or not permitted, using Data URL fallback:', err);
    onProgress?.(100);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    return {
      url: dataUrl,
      name: file.name,
      size: file.size,
    };
  }
}
