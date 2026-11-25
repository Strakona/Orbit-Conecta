import { Demand } from '../types';

/**
 * Determina se uma demanda pode ser visualizada e assumida por estudantes de uma turma.
 * Demandas em 'AGUARDANDO_PROFESSOR' ficam ocultas dos alunos até o Professor Mentor
 * selecionar as turmas e liberar a produção.
 */
export function isDemandVisibleToStudent(
  demand: Demand,
  studentTurmaId?: string
): boolean {
  if (demand.status === 'AGUARDANDO_PROFESSOR') {
    return false;
  }
  if (!studentTurmaId) {
    return true;
  }
  if (!demand.releasedTurmaIds || demand.releasedTurmaIds.length === 0) {
    return true;
  }
  return demand.releasedTurmaIds.includes(studentTurmaId);
}
