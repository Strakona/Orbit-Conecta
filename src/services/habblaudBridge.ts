import { STAGE_META } from '../data/seedData';
import { PROJECT_THEME_ACCENTS, THEME_COUNT } from '../habblaud/client/src/art/theme';
import { hash32 } from '../habblaud/shared/hash';
import type {
  AccountInfo,
  Activity,
  AgentInfo,
  OfficeSnapshot,
  RoomInfo,
  TaskItem,
} from '../habblaud/shared/types';
import { AnonymousPresence, Demand, OrbitState, StageKey } from '../types';
import { isDemandVisibleToStudent } from '../utils/demandVisibility';

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

function parseHexRgb(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function closestThemeIndex(hex: string): number {
  const rgb = parseHexRgb(hex);
  if (!rgb) return 0;
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < PROJECT_THEME_ACCENTS.length; i++) {
    const target = parseHexRgb(PROJECT_THEME_ACCENTS[i]);
    if (!target) continue;
    const dr = rgb[0] - target[0];
    const dg = rgb[1] - target[1];
    const db = rgb[2] - target[2];
    const dist = dr * dr + dg * dg + db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  }
  return bestIdx;
}

/**
 * Resolve um tema de cor único (sem colisões) para cada demanda ativa no mapa 2.5D,
 * partindo da cor primária configurada no projeto.
 */
export function resolveDemandThemeMap(
  demands: Demand[],
): Map<string, { themeIndex: number; accent: string }> {
  const map = new Map<string, { themeIndex: number; accent: string }>();
  const used = new Set<number>();
  const activeDemands = demands.filter(
    (d) => d.status === 'ATIVA' || d.status === 'MODO_TESTE'
  );

  for (let i = 0; i < activeDemands.length; i++) {
    const d = activeDemands[i];
    const preferred = closestThemeIndex(d.artifacts.ui.primaryColor);
    let chosen = preferred;
    if (used.size < THEME_COUNT) {
      for (let offset = 0; offset < THEME_COUNT; offset++) {
        const candidate = (preferred + offset) % THEME_COUNT;
        if (!used.has(candidate)) {
          chosen = candidate;
          break;
        }
      }
      used.add(chosen);
    } else {
      chosen = (preferred + i) % THEME_COUNT;
    }
    map.set(d.id, {
      themeIndex: chosen,
      accent: PROJECT_THEME_ACCENTS[chosen] ?? '#0284C7',
    });
  }

  return map;
}

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
      return { icon: '☕', text: 'No Lounge / Copa do Lab', kind: 'done' };
  }
}

let snapshotRev = 1;

/**
 * Converte o estado reativo do Orbit Conecta para um OfficeSnapshot compatível com o motor 2.5D do Habblaud.
 * Salas entregues oficialmente ("ENTREGUE") são omitidas de `rooms` para que o Habblaud apague as luzes,
 * desmonte a sala e exiba jardins/compactação sem deixar buracos.
 */
export function buildHabblaudSnapshot(
  state: OrbitState,
  options?: { anonymize?: boolean; publicPresence?: AnonymousPresence[] }
): OfficeSnapshot {
  const anonymize = Boolean(options?.anonymize);
  const now = Date.now();
  const isStudentSession = !anonymize && state.session?.role === 'ALUNO';
  const currentStudent = isStudentSession
    ? state.students.find((s) => s.id === state.session?.studentId)
    : undefined;
  const activeDemands = state.demands.filter(
    (d) =>
      (d.status === 'ATIVA' || d.status === 'MODO_TESTE') &&
      (!isStudentSession || isDemandVisibleToStudent(d, currentStudent?.turmaId))
  );
  const themeMap = resolveDemandThemeMap(activeDemands);
  const fallbackRoomId = activeDemands[0]?.id ?? 'sala-demandas';

  const rooms: RoomInfo[] = activeDemands.map((demand, idx) => ({
    id: demand.id,
    name: demand.shortName,
    path: demand.secretaria,
    slot: idx,
    seed: hash32(demand.id),
    themeIndex: themeMap.get(demand.id)?.themeIndex ?? (idx % THEME_COUNT),
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
      path: 'Lab. Inovação / SMED Cianorte',
      slot: 0,
      seed: hash32('sala-demandas'),
      themeIndex: 0,
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

  const agents: AgentInfo[] =
    anonymize && options?.publicPresence && options.publicPresence.length > 0
      ? options.publicPresence.map((p, idx) => {
          const inActiveRoom = activeRoomIds.has(p.location);
          const roomId = inActiveRoom ? p.location : fallbackRoomId;
          const demand = activeDemands.find((d) => d.id === roomId);
          const actInfo = activityForStage(p.activeStage);
          const activity: Activity = {
            id: `act-${p.uuid}-${p.activeStage ?? 'idle'}`,
            kind: actInfo.kind,
            icon: actInfo.icon,
            text: p.handRaised
              ? p.handRaised === 'AJUDA'
                ? '✋ Precisa de ajuda do mentor'
                : '✅ Etapa pronta para avaliar'
              : actInfo.text,
            at: now - 15_000,
          };
          const status: AgentInfo['status'] = p.handRaised
            ? 'waiting'
            : inActiveRoom
            ? 'working'
            : 'idle';

          return {
            id: p.uuid,
            kind: 'main',
            roomId,
            name: p.activeStage ? STAGE_META[p.activeStage].shortLabel : 'Equipe Lab',
            look: p.look ?? (idx % 2 === 0 ? 'm' : 'f'),
            role: p.activeStage ? STAGE_META[p.activeStage].shortLabel : 'Equipe Lab',
            title: demand ? demand.shortName : 'Lounge',
            sessionId: p.uuid,
            account: p.turmaId,
            status,
            waitingFor: p.handRaised ? 'Aguardando mentoria' : undefined,
            activity,
            recent: [activity],
            tasks: [],
            startedAt: now - 600_000,
            lastEventAt: now - 10_000,
            statusSince: now - 120_000,
            stats: { toolCalls: 3, tokensIn: 0, tokensOut: 0, subagents: 0 },
            seed: hash32(p.uuid),
          };
        })
      : state.students.map((stu, idx) => {
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
      detail: anonymize ? undefined : stu.handNote,
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
      name: anonymize
        ? stu.activeStage
          ? STAGE_META[stu.activeStage].shortLabel
          : 'Equipe Lab'
        : stu.name,
      look: idx % 2 === 0 ? 'm' : 'f',
      role: stu.activeStage ? STAGE_META[stu.activeStage].shortLabel : 'Estudante AH/SD',
      title: demand ? demand.shortName : 'Lounge / Sala de Demandas',
      sessionId: stu.uuid,
      account: stu.turmaId,
      status,
      waitingFor:
        stu.handRaised === 'AJUDA'
          ? anonymize
            ? 'Aguardando mentoria'
            : stu.handNote || 'Dúvida na bancada'
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
