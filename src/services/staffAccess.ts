import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { useCallback, useEffect, useState } from 'react';
import { auth, db, googleSignInPopup, signOutFirebase } from '../lib/firebase';
import { isDemoMode } from '../utils/demoMode';

export interface StaffIdentity {
  email: string;
  name: string;
  isAdmin: boolean;
  isCoordinator: boolean;
}

export interface CoordinatorRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  createdBy?: string;
}

export interface AdminRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export function normalizeStaffEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Descobre se a conta Google é Administrador ou Coordenador autorizado (coleções admins/coordinators). */
export async function resolveStaffIdentity(user: User): Promise<StaffIdentity | null> {
  const firestore = db;
  if (!firestore || user.isAnonymous || !user.email) return null;
  const email = normalizeStaffEmail(user.email);
  try {
    const adminSnap = await getDoc(doc(firestore, 'admins', email));
    if (adminSnap.exists()) {
      const data = adminSnap.data() as { name?: string };
      return {
        email,
        name: data.name || user.displayName || email,
        isAdmin: true,
        isCoordinator: true,
      };
    }
  } catch {
    // sem permissão: não é administrador
  }
  try {
    const coordSnap = await getDoc(doc(firestore, 'coordinators', email));
    if (coordSnap.exists()) {
      const data = coordSnap.data() as { name?: string };
      return {
        email,
        name: data.name || user.displayName || email,
        isAdmin: false,
        isCoordinator: true,
      };
    }
  } catch {
    // sem permissão: não é coordenador
  }
  return null;
}

/**
 * Entra com Google. Se a conta não estiver autorizada, encerra a sessão e devolve motivo.
 */
export async function signInStaffWithGoogle(): Promise<
  { ok: true; identity: StaffIdentity } | { ok: false; message: string }
> {
  try {
    const user = await googleSignInPopup();
    if (!user) return { ok: false, message: 'Firebase não está configurado neste ambiente.' };
    const identity = await resolveStaffIdentity(user);
    if (!identity) {
      await signOutFirebase();
      return {
        ok: false,
        message: `A conta ${user.email ?? ''} não está autorizada. Peça ao Administrador do sistema para cadastrar seu e-mail como Coordenador.`,
      };
    }
    return { ok: true, identity };
  } catch (err) {
    const code = (err as { code?: string })?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      return { ok: false, message: 'A janela do Google foi fechada antes de concluir o login.' };
    }
    if (code === 'auth/unauthorized-domain') {
      return { ok: false, message: 'Este endereço ainda não está autorizado no Firebase Authentication.' };
    }
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Não foi possível entrar com o Google.',
    };
  }
}

/** Identidade atual de Administrador/Coordenador (null se não houver login Google autorizado). */
export function useStaffIdentity(): {
  identity: StaffIdentity | null;
  checking: boolean;
  signIn: () => Promise<{ ok: boolean; message?: string }>;
} {
  const [identity, setIdentity] = useState<StaffIdentity | null>(null);
  const [checking, setChecking] = useState<boolean>(Boolean(auth) && !isDemoMode());

  useEffect(() => {
    if (!auth || isDemoMode()) {
      setChecking(false);
      return;
    }
    let active = true;
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user || user.isAnonymous) {
        if (active) {
          setIdentity(null);
          setChecking(false);
        }
        return;
      }
      const resolved = await resolveStaffIdentity(user);
      if (active) {
        setIdentity(resolved);
        setChecking(false);
      }
    });
    return () => {
      active = false;
      unsub();
    };
  }, []);

  const signIn = useCallback(async () => {
    const res = await signInStaffWithGoogle();
    if (res.ok) {
      setIdentity(res.identity);
      return { ok: true };
    }
    return { ok: false, message: res.message };
  }, []);

  return { identity, checking, signIn };
}

export function subscribeCoordinators(onChange: (list: CoordinatorRecord[]) => void): Unsubscribe {
  const firestore = db;
  if (!firestore || isDemoMode()) return () => {};
  return onSnapshot(
    collection(firestore, 'coordinators'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as CoordinatorRecord);
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      onChange(list);
    },
    () => onChange([])
  );
}

export function subscribeAdmins(onChange: (list: AdminRecord[]) => void): Unsubscribe {
  const firestore = db;
  if (!firestore || isDemoMode()) return () => {};
  return onSnapshot(
    collection(firestore, 'admins'),
    (snap) => {
      const list = snap.docs.map((d) => d.data() as AdminRecord);
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
      onChange(list);
    },
    () => onChange([])
  );
}

export async function saveCoordinator(input: {
  name: string;
  email: string;
  createdBy: string;
}): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  const email = normalizeStaffEmail(input.email);
  const record: CoordinatorRecord = {
    id: email,
    email,
    name: input.name.trim(),
    createdAt: new Date().toISOString(),
    createdBy: input.createdBy,
  };
  await setDoc(doc(firestore, 'coordinators', email), record);
}

export async function deleteCoordinator(email: string): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  await deleteDoc(doc(firestore, 'coordinators', normalizeStaffEmail(email)));
}
