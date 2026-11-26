import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import {
  Auth,
  getAuth,
  GoogleAuthProvider,
  signInAnonymously,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { Firestore, getFirestore } from 'firebase/firestore';

const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim() ?? '';
const appId = (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim() ?? '';

export const isFirebaseConfigured = Boolean(apiKey && appId);

const firebaseConfig = {
  apiKey,
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim() ||
    'orbit-conecta-smed.firebaseapp.com',
  projectId:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined)?.trim() ||
    'orbit-conecta-smed',
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim() ||
    'orbit-conecta-smed.firebasestorage.app',
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string | undefined)?.trim() ||
    '705964935819',
  appId,
};

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  dbInstance = getFirestore(app);
  authInstance = getAuth(app);
}

export const db = dbInstance;
export const auth = authInstance;

/**
 * Inicia sessão anônima silenciosa no Firebase Auth (quando habilitada no Console)
 * para satisfazer regras LGPD de coleções internas (`students`, `turmas`, `auditLogs`).
 */
export async function ensureFirebaseAuthSession(): Promise<void> {
  if (!authInstance) return;
  if (authInstance.currentUser) return;
  try {
    await signInAnonymously(authInstance);
  } catch {
    // Se Anonymous Auth ainda não estiver ativado no Console, não trava a interface
  }
}

/** Login Google para Administrador/Coordenador (identidade real, diferente da sessão anônima). */
export async function googleSignInPopup(): Promise<User | null> {
  if (!authInstance) return null;
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(authInstance, provider);
  return result.user;
}

/** Encerra qualquer sessão do Firebase (Google ou anônima) ao sair do sistema. */
export async function signOutFirebase(): Promise<void> {
  if (!authInstance) return;
  try {
    await signOut(authInstance);
  } catch {
    // ignore
  }
}