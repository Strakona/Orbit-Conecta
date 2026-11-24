import { STAGE_META } from '../data/seedData';
import { hash32 } from '../habblaud/shared/hash';
import type {
  AccountInfo,
  Activity,
  AgentInfo,
  OfficeSnapshot,
  RoomInfo,
  TaskItem,
} from '../habblaud/shared/types';
import { OrbitState, StageKey } from '../types';

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

const TURMA_COLORS: Record<string, { short: string; color: string }> = {
  'turma-1': { short: 'T1', color: '#38BDF8' },
  'turma-2': { short: 'T2', color: '#A78BFA' },
  'turma-3': { short: 'T3', color: '#34D399' },
  'turma-4': { short: 'T4', color: '#FBBF24' },
};

function activityForStage(stageKey?: StageKey): { icon: string; text: string; kind: Activity['kind'] } {
  switch (stageKey) {
    case 'UI_UX':
      return { icon: '🎨', text: 'Criando telas e UI acessível', kind: 'write' };
    case 'LOGICA_REGRAS':
      return { icon: '💻', text: 'Programando regras Se/Então', kind: 'edit' };
    case 'IA_DADOS':
      return { icon: '🤖', text: 'Treinando assistente Gemini', kind: 'think' };
    case 'QA_TESTES':
      return { icon: '🧪', text: 'Testando fluxo no simulador', kind: 'test' };
    default:
      return { icon: '☕', text: 'No Lounge / Copa CEMI 2', kind: 'done' };
  }
}

let snapshotRev = 1;

/**
 * Converte o estado reativo do Orbit Conecta para um OfficeSnapshot compatível com o motor 2.5D do Habblaud.
 * Salas entregues oficialmente ("ENTREGUE") são omitidas de `rooms` para que o Habblaud apague as luzes,
 * desmonte a sala e exiba jardins/compactação sem deixar buracos.
 */
export function buildHabblaudSnapshot(state: OrbitState): OfficeSnapshot {
  const now = Date.now();
  const activeDemands = state.demands.filter((d) => d.status !== 'ENTREGUE');
  const fallbackRoomId = activeDemands[0]?.id ?? 'sala-demandas';

  const rooms: RoomInfo[] = activeDemands.map((demand, idx) => ({
    id: demand.id,
    name: demand.shortName,
    path: demand.secretaria,
    slot: idx,
    seed: hash32(demand.id),
    createdAt: Date.parse(demand.createdAt) || now - 300_000,
    ...(demand.status === 'MODO_TESTE'
      ? {
          effect: {
            kind: 'party' as const,
            text: `Modo Teste Ativo: ${demand.shortName}`,
            at: now,
            until: now + 60_000,
          },
        }
      : {}),
  }));

  if (rooms.length === 0) {
    rooms.push({
      id: 'sala-demandas',
      name: 'Sala de Demandas',
      path: 'CEMI 2 / SMED Cianorte',
      slot: 0,
      seed: hash32('sala-demandas'),
      createdAt: now - 300_000,
    });
  }

  const activeRoomIds = new Set(rooms.map((r) => r.id));

  const accounts: AccountInfo[] = state.turmas.map((turma) => {
    const meta = TURMA_COLORS[turma.id] ?? { short: 'AH', color: '#38BDF8' };
    return {
      id: turma.id,
      short: meta.short,
      name: turma.name,
      color: meta.color,
      configDir: turma.schedule,
      sessions: state.students.filter((s) => s.turmaId === turma.id).length,
      usageStatus: 'ok',
    };
  });

  const agents: AgentInfo[] = state.students.map((stu, idx) => {
    const inActiveRoom = activeRoomIds.has(stu.location);
    const roomId = inActiveRoom ? stu.location : fallbackRoomId;
    const demand = activeDemands.find((d) => d.id === roomId);

    const tasks: TaskItem[] = demand
      ? STAGE_ORDER.map((k) => {
          const st = demand.stages[k];
          return {
            id: `${demand.id}-${k}`,
            title: STAGE_META[k].label,
            status:
              st.status === 'APROVADA'
                ? 'completed'
                : st.status === 'EM_DESENVOLVIMENTO' || st.status === 'EM_REVISAO'
                ? 'in_progress'
                : 'pending',
            activeForm: STAGE_META[k].workbenchName,
          };
        })
      : [];

    const actInfo = activityForStage(stu.activeStage);
    const activity: Activity = {
      id: `act-${stu.id}-${stu.activeStage ?? 'idle'}`,
      kind: actInfo.kind,
      icon: actInfo.icon,
      text: stu.handRaised
        ? stu.handRaised === 'AJUDA'
          ? '✋ Precisa de ajuda do mentor'
          : '✅ Etapa pronta para avaliar'
        : actInfo.text,
      detail: stu.handNote,
      at: now - 15_000,
    };

    const status: AgentInfo['status'] = stu.handRaised
      ? 'waiting'
      : inActiveRoom
      ? 'working'
      : 'idle';

    return {
      id: stu.id,
      kind: 'main',
      roomId,
      name: stu.name,
      look: idx % 2 === 0 ? 'm' : 'f',
      role: stu.activeStage ? STAGE_META[stu.activeStage].shortLabel : 'Estudante AH/SD',
      title: demand ? demand.shortName : 'Lounge / Sala de Demandas',
      sessionId: stu.uuid,
      account: stu.turmaId,
      status,
      waitingFor:
        stu.handRaised === 'AJUDA'
          ? stu.handNote || 'Dúvida na bancada'
          : stu.handRaised === 'AVALIACAO'
          ? 'Avaliar etapa concluída'
          : undefined,
      activity,
      recent: [activity],
      tasks,
      startedAt: now - 600_000,
      lastEventAt: now - 10_000,
      statusSince: now - 120_000,
      stats: {
        toolCalls: stu.badges.length * 4 + 3,
        tokensIn: 0,
        tokensOut: 0,
        subagents: 0,
      },
      seed: hash32(stu.uuid),
    };
  });

  return {
    rev: snapshotRev++,
    serverTime: now,
    rooms,
    agents,
    accounts,
    meta: {
      demo: true,
      sources: [],
      startedAt: now - 600_000,
      version: 'orbit-conecta-1.0.0',
    },
  };
}
