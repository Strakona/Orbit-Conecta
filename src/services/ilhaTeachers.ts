import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db, ensureFirebaseAuthSession } from '../lib/firebase';
import { isDemoMode } from '../utils/demoMode';

/**
 * Professor de escola (Ilha dos Inventores). Documento em `ilhaTeachers/{email em minúsculas}`.
 * O e-mail é a chave e serve como lista de autorizados na Ilha. Não possui código de acesso ao Orbit.
 */
export interface IlhaTeacher {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  schools: string[];
  createdAt: string;
  linkSentAt?: string;
}

export interface IlhaTeacherInput {
  name: string;
  email: string;
  whatsapp: string;
  schools: string[];
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

/** Mantém só dígitos e acrescenta o DDI 55 quando o número vier sem ele. */
export function normalizeWhatsapp(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10 || digits.length === 11) return `55${digits}`;
  return digits;
}

export function formatWhatsapp(value: string): string {
  const d = value.replace(/\D/g, '');
  const local = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`;
  return value;
}

export function splitSchools(raw: string): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  raw
    .split(/[|;]/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .forEach((s) => {
      const key = s.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      list.push(s);
    });
  return list;
}

export function mergeSchools(a: string[], b: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  [...a, ...b].forEach((s) => {
    const key = s.trim().toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push(s.trim());
  });
  return out;
}

export function buildInviteMessage(teacher: IlhaTeacher, ilhaUrl: string): string {
  const first = teacher.name.trim().split(' ')[0] || 'Professor(a)';
  const link = ilhaUrl
    ? `${ilhaUrl}${ilhaUrl.includes('?') ? '&' : '?'}professor=${encodeURIComponent(teacher.email)}`
    : '(link da Ilha dos Inventores)';
  const schools = teacher.schools.length
    ? `\nEscola(s) vinculada(s): ${teacher.schools.join(', ')}.`
    : '';
  return (
    `Olá, ${first}! Aqui é a coordenação do Laboratório de Inovação (SMED Cianorte).\n\n` +
    `Você foi cadastrado(a) para aplicar a triagem da Ilha dos Inventores com suas turmas.${schools}\n\n` +
    `Acesse: ${link}\n` +
    `Entre com a conta Google do e-mail ${teacher.email}.\n\n` +
    `Qualquer dúvida, fale comigo. Obrigado(a)!`
  );
}

export function buildWhatsappUrl(teacher: IlhaTeacher, ilhaUrl: string): string {
  return `https://wa.me/${normalizeWhatsapp(teacher.whatsapp)}?text=${encodeURIComponent(
    buildInviteMessage(teacher, ilhaUrl)
  )}`;
}

export function buildMailtoUrl(teacher: IlhaTeacher, ilhaUrl: string): string {
  const subject = 'Acesso à Ilha dos Inventores — triagem AH/SD';
  return `mailto:${encodeURIComponent(teacher.email)}?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(buildInviteMessage(teacher, ilhaUrl))}`;
}

export function subscribeIlhaTeachers(onChange: (list: IlhaTeacher[]) => void): Unsubscribe {
  const firestore = db;
  if (isDemoMode() || !firestore) return () => {};
  let unsub: Unsubscribe = () => {};
  let cancelled = false;
  void ensureFirebaseAuthSession().then(() => {
    if (cancelled) return;
    unsub = onSnapshot(
      collection(firestore, 'ilhaTeachers'),
      (snap) => {
        const list = snap.docs.map((d) => d.data() as IlhaTeacher);
        list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
        onChange(list);
      },
      () => onChange([])
    );
  });
  return () => {
    cancelled = true;
    unsub();
  };
}

export async function saveIlhaTeacher(teacher: IlhaTeacher): Promise<void> {
  const firestore = db;
  if (isDemoMode() || !firestore) return;
  await ensureFirebaseAuthSession();
  const clean = JSON.parse(JSON.stringify(teacher)) as IlhaTeacher;
  await setDoc(doc(firestore, 'ilhaTeachers', teacher.id), clean);
}

export async function deleteIlhaTeacher(id: string): Promise<void> {
  const firestore = db;
  if (isDemoMode() || !firestore) return;
  await ensureFirebaseAuthSession();
  await deleteDoc(doc(firestore, 'ilhaTeachers', id));
}

/** Nomes das escolas já existentes na Ilha (coleção `schools`), para sugestão no cadastro. */
export async function fetchIlhaSchoolNames(): Promise<string[]> {
  const firestore = db;
  if (isDemoMode() || !firestore) return [];
  try {
    await ensureFirebaseAuthSession();
    const snap = await getDocs(collection(firestore, 'schools'));
    const names = snap.docs
      .map((d) => (d.data() as { name?: unknown }).name)
      .filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
      .map((n) => n.trim());
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  } catch {
    return [];
  }
}
