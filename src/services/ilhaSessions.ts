import { collection, getDocs } from 'firebase/firestore';
import { db, ensureFirebaseAuthSession } from '../lib/firebase';
import { isDemoMode } from '../utils/demoMode';

export type IlhaPerformanceLevel =
  | 'Indicativo Alto de AH/SD'
  | 'Potencial em Destaque'
  | 'Desenvolvimento Esperado'
  | 'Acompanhamento Sugerido'
  | 'Em Andamento'
  | string;

export interface IlhaSessionSummary {
  id: string;
  studentName: string;
  schoolName: string;
  className: string;
  grade: string;
  status: 'em_andamento' | 'concluida' | string;
  performanceLevel: IlhaPerformanceLevel;
  overallScore: number | null;
  updatedAt?: string;
}

const PROXIMITY_RANK: Record<string, number> = {
  'Indicativo Alto de AH/SD': 0,
  'Potencial em Destaque': 1,
  'Desenvolvimento Esperado': 2,
  'Acompanhamento Sugerido': 3,
  'Em Andamento': 4,
};

function parseScore(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return Math.round(raw);
  }
  return null;
}

/**
 * Busca sessões de triagem da Ilha dos Inventores armazenadas na coleção `sessions`
 * do Firebase unificado (`orbit-conecta-smed`), ordenadas por proximidade AH/SD.
 */
export async function fetchIlhaSessions(): Promise<IlhaSessionSummary[]> {
  if (isDemoMode() || !db) return [];

  await ensureFirebaseAuthSession();
  const snap = await getDocs(collection(db, 'sessions'));

  const items: IlhaSessionSummary[] = [];
  snap.forEach((docSnap) => {
    const data = docSnap.data() as Record<string, unknown>;
    const studentName = typeof data.studentName === 'string' ? data.studentName.trim() : '';
    if (!studentName) return;

    const scores =
      data.scores && typeof data.scores === 'object'
        ? (data.scores as Record<string, unknown>)
        : null;

    items.push({
      id: docSnap.id,
      studentName,
      schoolName: typeof data.schoolName === 'string' && data.schoolName.trim() ? data.schoolName.trim() : 'Escola não informada',
      className: typeof data.className === 'string' && data.className.trim() ? data.className.trim() : 'Turma',
      grade: typeof data.grade === 'string' && data.grade.trim() ? data.grade.trim() : '-',
      status: typeof data.status === 'string' ? data.status : 'em_andamento',
      performanceLevel:
        typeof data.performanceLevel === 'string' && data.performanceLevel.trim()
          ? data.performanceLevel.trim()
          : 'Em Andamento',
      overallScore: parseScore(scores?.overall),
      updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : undefined,
    });
  });

  items.sort((a, b) => {
    const rankA = PROXIMITY_RANK[a.performanceLevel] ?? 5;
    const rankB = PROXIMITY_RANK[b.performanceLevel] ?? 5;
    if (rankA !== rankB) return rankA - rankB;

    const scoreA = a.overallScore ?? -1;
    const scoreB = b.overallScore ?? -1;
    if (scoreA !== scoreB) return scoreB - scoreA;

    return a.studentName.localeCompare(b.studentName, 'pt-BR');
  });

  return items;
}
