import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type User } from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  initializeFirestore,
  type Firestore,
  type FirestoreSettings,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

function initDb(): Firestore {
  const settings: FirestoreSettings = {
    experimentalAutoDetectLongPolling: true,
    ignoreUndefinedProperties: true,
  };
  try {
    return initializeFirestore(app, settings, firebaseConfig.firestoreDatabaseId);
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = initDb();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const storage = getStorage(app);

export const AUTHORIZED_ADMIN_EMAIL = 'marinodavidr7@gmail.com';

export function isAuthorizedAdminEmail(email?: string | null): boolean {
  return Boolean(email && email.trim().toLowerCase() === AUTHORIZED_ADMIN_EMAIL);
}

export async function assertPlatformAdminWrite(
  actionLabel: string,
  sessionUser?: User | null
): Promise<User> {
  const currentUser = auth.currentUser ?? sessionUser ?? null;
  if (!currentUser) {
    throw new Error(
      `Acceso denegado (${actionLabel}): inicia sesión con la cuenta administradora Marinodavidr7@gmail.com.`
    );
  }
  if (sessionUser && currentUser.uid !== sessionUser.uid) {
    throw new Error(
      `Acceso denegado (${actionLabel}): la sesión activa no coincide con el usuario autenticado.`
    );
  }
  if (!isAuthorizedAdminEmail(currentUser.email)) {
    throw new Error(
      `Permiso denegado (${actionLabel}): solo el correo Marinodavidr7@gmail.com tiene permisos de escritura, edición o eliminación.`
    );
  }

  const tokenResult = await currentUser.getIdTokenResult();
  const claimEmail =
    typeof tokenResult.claims.email === 'string'
      ? tokenResult.claims.email
      : currentUser.email;

  if (!isAuthorizedAdminEmail(claimEmail)) {
    throw new Error(
      `Validación de token denegada (${actionLabel}): solo Marinodavidr7@gmail.com puede modificar o eliminar contenido.`
    );
  }

  return currentUser;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function isFirestoreOfflineError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  const code = (error as { code?: unknown }).code;
  return (
    msg.includes('the client is offline') ||
    msg.includes('backend didn\'t respond') ||
    code === 'unavailable'
  );
}

export async function testConnection(): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    return true;
  }
}

void testConnection();
