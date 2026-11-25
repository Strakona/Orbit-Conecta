import {
  collection,
  deleteDoc,
  doc,
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
  INITIAL_STAFF_MEMBERS,
  INITIAL_STUDENTS,
  INITIAL_TURMAS,
} from '../data/seedData';
import { db, ensureFirebaseAuthSession } from '../lib/firebase';
import {
  AnonymousPresence,
  AuditLogEntry,
  Demand,
  PortalSubmission,
  StaffMember,
  Student,
  SyncStatus,
  Turma,
} from '../types';
import { isDemoMode } from '../utils/demoMode';

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

let turmasSeedPromise: Promise<void> | null = null;

/**
 * Em produção limpa (/), garante apenas a estrutura base das 4 Turmas AH/SD vazias,
 * caso a coleção `turmas` ainda esteja vazia. Nunca grava alunos, equipe ou demandas demo.
 */
export async function ensureProductionTurmasInFirestore(): Promise<void> {
  if (isDemoMode()) return;
  const firestore = db;
  if (!firestore) return;
  if (turmasSeedPromise) return turmasSeedPromise;

  turmasSeedPromise = (async () => {
    try {
      await ensureFirebaseAuthSession();
      const snap = await getDocs(collection(firestore, 'turmas'));
      if (!snap.empty) return;

      const batch = writeBatch(firestore);
      INITIAL_TURMAS.forEach((t) => {
        batch.set(doc(firestore, 'turmas', t.id), stripUndefined(t));
      });
      await batch.commit();
    } catch {
      // ignore offline or rule errors
    }
  })();

  return turmasSeedPromise;
}

/**
 * Remove do Firestore todos os documentos conhecidos do conjunto de demonstração (?demo=1),
 * caso tenham sido semeados por versões anteriores.
 */
export async function purgeDemoDocsFromFirestore(): Promise<number> {
  if (isDemoMode()) return 0;
  const firestore = db;
  if (!firestore) return 0;

  try {
    await ensureFirebaseAuthSession();
    const batch = writeBatch(firestore);
    let count = 0;

    INITIAL_DEMANDS.forEach((d) => {
      batch.delete(doc(firestore, 'demands', d.id));
      count += 1;
    });
    INITIAL_PORTAL_SUBMISSIONS.forEach((p) => {
      batch.delete(doc(firestore, 'portalSubmissions', p.id));
      count += 1;
    });
    INITIAL_STUDENTS.forEach((s) => {
      batch.delete(doc(firestore, 'students', s.id));
      batch.delete(doc(firestore, 'presence', s.uuid));
      count += 2;
    });
    INITIAL_STAFF_MEMBERS.forEach((m) => {
      batch.delete(doc(firestore, 'staffMembers', m.id));
      count += 1;
    });
    INITIAL_AUDIT_LOGS.forEach((a) => {
      batch.delete(doc(firestore, 'auditLogs', a.id));
      count += 1;
    });
    batch.delete(doc(firestore, 'meta', 'seed_v1'));
    count += 1;

    await batch.commit();
    return count;
  } catch {
    return 0;
  }
}

/**
 * Listeners públicos (LGPD): escutam APENAS demandas, protocolos e presença anonimizada.
 * No modo ?demo=1 nunca conecta ao Firebase para manter isolamento total.
 */
export function subscribePublicFirestore(handlers: {
  onDemands: (demands: Demand[]) => void;
  onPortalSubmissions: (subs: PortalSubmission[]) => void;
  onPresence: (presence: AnonymousPresence[]) => void;
  onStatus: (status: SyncStatus) => void;
}): () => void {
  const firestore = db;
  if (isDemoMode() || !firestore) {
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
  onStaffMembers: (staff: StaffMember[]) => void;
  onAuditLogs: (logs: AuditLogEntry[]) => void;
}): () => void {
  const firestore = db;
  if (isDemoMode() || !firestore) return () => {};
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
      const list = snap.docs.map((d) => d.data() as Student);
      list.sort((a, b) => a.badgeCode.localeCompare(b.badgeCode));
      handlers.onStudents(list);
    })
  );

  unsubs.push(
    onSnapshot(collection(firestore, 'staffMembers'), (snap) => {
      const list = snap.docs.map((d) => d.data() as StaffMember);
      list.sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
      handlers.onStaffMembers(list);
    })
  );

  unsubs.push(
    onSnapshot(collection(firestore, 'auditLogs'), (snap) => {
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
  if (isDemoMode()) return null;
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
  if (isDemoMode()) return;
  const firestore = db;
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'demands', demand.id), stripUndefined(demand));
  } catch {
    // ignore offline errors
  }
}

export async function syncStudentToFirestore(student: Student, idx = 0): Promise<void> {
  if (isDemoMode()) return;
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
  if (isDemoMode()) return;
  const firestore = db;
  if (!firestore) return;
  try {
    await setDoc(doc(firestore, 'portalSubmissions', sub.id), stripUndefined(sub));
  } catch {
    // ignore offline errors
  }
}

export async function verifyStaffAccessInFirestore(
  role: 'PROFESSOR' | 'COORDENADOR',
  accessCode: string
): Promise<StaffMember | null> {
  if (isDemoMode()) return null;
  const firestore = db;
  if (!firestore) return null;
  try {
    await ensureFirebaseAuthSession();
    const normalized = accessCode.trim().toUpperCase();
    const q = query(
      collection(firestore, 'staffMembers'),
      where('role', '==', role)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    for (const docSnap of snap.docs) {
      const m = docSnap.data() as StaffMember;
      if (m.accessCode.trim().toUpperCase() === normalized) {
        return m;
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function deleteStudentFromFirestore(student: Student): Promise<void> {
  if (isDemoMode()) return;
  const firestore = db;
  if (!firestore) return;
  try {
    await ensureFirebaseAuthSession();
    await Promise.all([
      deleteDoc(doc(firestore, 'students', student.id)),
      deleteDoc(doc(firestore, 'presence', student.uuid)),
    ]);
  } catch {
    // ignore
  }
}

export async function syncStaffMemberToFirestore(member: StaffMember): Promise<void> {
  if (isDemoMode()) return;
  const firestore = db;
  if (!firestore) return;
  try {
    await ensureFirebaseAuthSession();
    await setDoc(doc(firestore, 'staffMembers', member.id), stripUndefined(member));
  } catch {
    // ignore
  }
}

export async function deleteStaffMemberFromFirestore(staffId: string): Promise<void> {
  if (isDemoMode()) return;
  const firestore = db;
  if (!firestore) return;
  try {
    await ensureFirebaseAuthSession();
    await deleteDoc(doc(firestore, 'staffMembers', staffId));
  } catch {
    // ignore
  }
}

export async function syncAuditLogToFirestore(entry: AuditLogEntry): Promise<void> {
  if (isDemoMode()) return;
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
  if (isDemoMode()) return;
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
    INITIAL_STAFF_MEMBERS.forEach((m) =>
      batch.set(doc(firestore, 'staffMembers', m.id), stripUndefined(m))
    );
    INITIAL_AUDIT_LOGS.forEach((a) =>
      batch.set(doc(firestore, 'auditLogs', a.id), stripUndefined(a))
    );
    await batch.commit();
  } catch {
    // ignore
  }
}

export async function resetPortalFirestoreDemo(): Promise<void> {
  if (isDemoMode()) return;
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
