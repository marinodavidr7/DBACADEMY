/**
 * storageService.ts
 * Handles file uploads to Firebase Storage for course materials.
 */
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
import { storage } from '../firebase';
import type { CourseMaterial, CourseMaterialType } from '../types';

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
 * Upload a file to Firebase Storage under:
 *   courses/{courseId}/lessons/{lessonId}/{timestamp}_{filename}
 *
 * Returns a CourseMaterial object ready to be stored in Firestore/state.
 */
export async function uploadCourseMaterial(
  courseId: string,
  lessonId: string,
  file: File,
  onProgress?: UploadProgressCallback
): Promise<CourseMaterial> {
  const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `courses/${courseId}/lessons/${lessonId}/${Date.now()}_${sanitized}`;
  const fileRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(fileRef, file, {
      contentType: file.type,
      customMetadata: {
        originalName: file.name,
        courseId,
        lessonId,
      },
    });

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
          reject(e);
        }
      }
    );
  });
}

/**
 * Delete a material from Firebase Storage.
 * Silently ignores "not found" errors.
 */
export async function deleteCourseMaterial(url: string): Promise<void> {
  try {
    // Convert download URL to storage ref
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
  } catch (err: unknown) {
    // Ignore "object-not-found" so UI stays consistent
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
  type: CourseMaterialType = 'other'
): CourseMaterial {
  return {
    id: `mat_ext_${Date.now().toString(36)}`,
    name,
    url,
    type,
    sizeByte: 0,
    uploadedAt: new Date().toISOString(),
  };
}
