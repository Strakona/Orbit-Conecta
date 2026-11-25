import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Unsubscribe,
  where,
  writeBatch,
} from 'firebase/firestore';
import { INITIAL_PORTAL_SUBMISSIONS } from '../data/portalSeedData';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_DEMANDS,
  INITIAL_STUDENTS,
  INITIAL_TURMAS,
} from '../data/seedData';
import { db, ensureFirebaseAuthSession } from '../lib/firebase';
import {
  AnonymousPresence,
  AuditLogEntry,
  Demand,
  PortalSubmission,
  Student,
  SyncStatus,
  Turma,
} from '../types';

function stripUndefined<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function toAnonymousPresence(student: Student, idx = 0): AnonymousPresence {
  return {
    id: student.uuid,
    uuid: student.uuid,
    turmaId: student.turmaId,
    location: student.location,
    ...(student.activeStage ? { activeStage: student.activeStage } : {}),
    handRaised: student.handRaised,
    look: idx % 2 === 0 ? 'm' : 'f',
  };
}

let seedPromise: Promise<void> | null = null;

/**
 * Auto-seed inteligente: se o Firestore ainda estiver vazio (sem meta/seed_v1),
 * grava os dados iniciais de Cianorte (demandas, protocolos, turmas, crachás e presença anônima).
 */
export async function ensureInitialFirestoreSeed(): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  if (seedPromise) return seedPromise;

  seedPromise = (async () => {
    try {
      await ensureFirebaseAuthSession();
      const markerRef = doc(firestore, 'meta', 'seed_v1');
      const markerSnap = await getDoc(markerRef);
      if (markerSnap.exists()) return;

      const batch = writeBatch(firestore);

      INITIAL_DEMANDS.forEach((d) => {
        batch.set(doc(firestore, 'demands', d.id), stripUndefined(d));
      });

      INITIAL_PORTAL_SUBMISSIONS.forEach((p) => {
        batch.set(doc(firestore, 'portalSubmissions', p.id), stripUndefined(p));
      });

      INITIAL_STUDENTS.forEach((s, idx) => {
        const presence = toAnonymousPresence(s, idx);
        batch.set(doc(firestore, 'presence', presence.id), stripUndefined(presence));
      });

      INITIAL_TURMAS.forEach((t) => {
        batch.set(doc(firestore, 'turmas', t.id), stripUndefined(t));
      });
      INITIAL_STUDENTS.forEach((s) => {
        batch.set(doc(firestore, 'students', s.id), stripUndefined(s));
      });
      INITIAL_AUDIT_LOGS.forEach((a) => {
        batch.set(doc(firestore, 'auditLogs', a.id), stripUndefined(a));
      });

      batch.set(markerRef, { seededAt: new Date().toISOString(), version: 1 });
      await batch.commit();
    } catch {
      // Caso regras bloqueiem escrita anônima antes do login, ignorar sem travar o app
    }
  })();

  return seedPromise;
}

/**
 * Listeners públicos (LGPD): escutam APENAS demandas, protocolos e presença anonimizada.
 * Nenhum nome de aluno, PIN ou crachá é trafegado aqui.
 */
export function subscribePublicFirestore(handlers: {
  onDemands: (demands: Demand[]) => void;
  onPortalSubmissions: (subs: PortalSubmission[]) => void;
  onPresence: (presence: AnonymousPresence[]) => void;
  onStatus: (status: SyncStatus) => void;
}): () => void {
  const firestore = db;
  if (!firestore) {
    handlers.onStatus('OFFLINE_LOCAL');
    return () => {};
  }

  handlers.onStatus('CONNECTING');
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(
      collection(firestore, 'demands'),
      (snap) => {
        handlers.onStatus('ONLINE_FIREBASE');
        if (snap.empty) return;
        const list = snap.docs.map((d) => d.data() as Demand);
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        handlers.onDemands(list);
      },
      () => handlers.onStatus('OFFLINE_LOCAL')
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'portalSubmissions'),
      (snap) => {
        if (snap.empty) return;
        const list = snap.docs.map((d) => d.data() as PortalSubmission);
        list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        handlers.onPortalSubmissions(list);
      },
      () => {
        // fallback silencioso
      }
    )
  );

  unsubs.push(
    onSnapshot(
      collection(firestore, 'presence'),
      (snap) => {
        if (snap.empty) return;
        handlers.onPresence(snap.docs.map((d) => d.data() as AnonymousPresence));
      },
      () => {
        // fallback silencioso
      }
    )
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Listeners internos CEMI 2: assinados SOMENTE após autenticação do usuário no laboratório.
 */
export function subscribePrivateFirestore(handlers: {
  onTurmas: (turmas: Turma[]) => void;
  onStudents: (students: Student[]) => void;
  onAuditLogs: (logs: AuditLogEntry[]) => void;
}): () => void {
  const firestore = db;
  if (!firestore) return () => {};
  const unsubs: Unsubscribe[] = [];

  unsubs.push(
    onSnapshot(collection(firestore, 'turmas'), (snap) => {
      if (snap.empty) return;
      const list = snap.docs.map((d) => d.data() as Turma);
      list.sort((a, b) => a.id.localeCompare(b.id));
      handlers.onTurmas(list);
    })
  );

  unsubs.push(
    onSnapshot(collection(firestore, 'students'), (snap) => {
      if (snap.empty) return;
      const list = snap.docs.map((d) => d.data() as Student);
      list.sort((a, b) => a.badgeCode.localeCompare(b.badgeCode));
      handlers.onStudents(list);
    })
  );

  unsubs.push(
    onSnapshot(collection(firestore, 'auditLogs'), (snap) => {
      if (snap.empty) return;
      const list = snap.docs.map((d) => d.data() as AuditLogEntry);
      list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      handlers.onAuditLogs(list);
    })
  );

  return () => {
    unsubs.forEach((u) => u());
  };
}

/**
 * Autenticação pontual do aluno por Crachá + PIN sem baixar toda a coleção na tela de login.
 */
export async function verifyStudentBadgeInFirestore(
  badgeCode: string,
  pin: string
): Promise<Student | null> {
  const firestore = db;
  if (!firestore) return null;
  try {
    await ensureFirebaseAuthSession();
    const normalized = badgeCode.trim().toUpperCase();
    const q = query(collection(firestore, 'students'), where('badgeCode', '==', normalized));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const match = snap.docs[0].data() as Student;
    return match.pin === pin ? match : null;
  } catch {
    return null;
  }
}

export async function syncDemandToFirestore(demand: Demand): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'demands', demand.id), stripUndefined(demand));
  } catch {
    // ignore offline errors
  }
}

export async function syncStudentToFirestore(student: Student, idx = 0): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  try {
    await ensureFirebaseAuthSession();
    const presence = toAnonymousPresence(student, idx);
    await Promise.all([
      setDoc(doc(firestore, 'students', student.id), stripUndefined(student)),
      setDoc(doc(firestore, 'presence', presence.id), stripUndefined(presence)),
    ]);
  } catch {
    // ignore offline errors
  }
}

export async function syncPortalSubmissionToFirestore(
  sub: PortalSubmission
): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'portalSubmissions', sub.id), stripUndefined(sub));
  } catch {
    // ignore offline errors
  }
}

export async function syncAuditLogToFirestore(entry: AuditLogEntry): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  try {
    await ensureFirebaseAuthSession();
    await setDoc(doc(firestore, 'auditLogs', entry.id), stripUndefined(entry));
  } catch {
    // ignore offline errors
  }
}

export async function resetAllFirestoreDemo(): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  try {
    await ensureFirebaseAuthSession();
    const batch = writeBatch(firestore);
    INITIAL_DEMANDS.forEach((d) => batch.set(doc(firestore, 'demands', d.id), stripUndefined(d)));
    INITIAL_PORTAL_SUBMISSIONS.forEach((p) =>
      batch.set(doc(firestore, 'portalSubmissions', p.id), stripUndefined(p))
    );
    INITIAL_TURMAS.forEach((t) => batch.set(doc(firestore, 'turmas', t.id), stripUndefined(t)));
    INITIAL_STUDENTS.forEach((s, idx) => {
      batch.set(doc(firestore, 'students', s.id), stripUndefined(s));
      const presence = toAnonymousPresence(s, idx);
      batch.set(doc(firestore, 'presence', presence.id), stripUndefined(presence));
    });
    INITIAL_AUDIT_LOGS.forEach((a) =>
      batch.set(doc(firestore, 'auditLogs', a.id), stripUndefined(a))
    );
    await batch.commit();
  } catch {
    // ignore
  }
}

export async function resetPortalFirestoreDemo(): Promise<void> {
  const firestore = db;
  if (!firestore) return;
  try {
    const batch = writeBatch(firestore);
    INITIAL_PORTAL_SUBMISSIONS.forEach((p) =>
      batch.set(doc(firestore, 'portalSubmissions', p.id), stripUndefined(p))
    );
    await batch.commit();
  } catch {
    // ignore
  }
}
