import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_DEMANDS,
  INITIAL_STUDENTS,
  INITIAL_TURMAS,
  STAGE_META,
} from '../data/seedData';
import { INITIAL_PORTAL_SUBMISSIONS } from '../data/portalSeedData';
import { PROJECT_THEME_ACCENTS } from '../habblaud/client/src/art/theme';
import { ensureFirebaseAuthSession, isFirebaseConfigured } from '../lib/firebase';
import {
  buildOrbitDemandFromSubmission,
  PortalAnalysisInput,
} from '../services/demandTriageService';
import {
  ensureInitialFirestoreSeed,
  resetAllFirestoreDemo,
  resetPortalFirestoreDemo,
  subscribePrivateFirestore,
  subscribePublicFirestore,
  syncAuditLogToFirestore,
  syncDemandToFirestore,
  syncPortalSubmissionToFirestore,
  syncStudentToFirestore,
  toAnonymousPresence,
  verifyStudentBadgeInFirestore,
} from '../services/firestoreSync';
import {
  AiArtifact,
  AnonymousPresence,
  AuditLogEntry,
  Demand,
  DemandAiAnalysis,
  HandRaisedType,
  LogicArtifact,
  OrbitState,
  PortalSubmission,
  PortalSubmissionStatus,
  QaArtifact,
  Role,
  StageKey,
  Student,
  SyncStatus,
  ToastMessage,
  UiArtifact,
} from '../types';
import { STAFF_PASSCODES } from '../utils/demoMode';

const STORAGE_KEY = 'orbit_conecta_state_v1';

const createInitialState = (): OrbitState => ({
  session: null,
  turmas: INITIAL_TURMAS,
  students: INITIAL_STUDENTS,
  demands: INITIAL_DEMANDS,
  portalSubmissions: INITIAL_PORTAL_SUBMISSIONS,
  auditLogs: INITIAL_AUDIT_LOGS,
  geminiApiKey: '',
  highContrast: false,
  viewMode: 'MAP',
  activeDemandId: null,
  activeTab: 'LAB',
});

function migrateDemandScreens(demand: Demand): Demand {
  if (demand.artifacts?.ui?.screens && demand.artifacts.ui.screens.length > 0) {
    return demand;
  }
  const seed = INITIAL_DEMANDS.find((s) => s.id === demand.id);
  const seedScreens = seed?.artifacts.ui.screens;
  if (seedScreens && seedScreens.length > 0) {
    const firstScreen = {
      ...seedScreens[0],
      fields: demand.artifacts.ui.fields ?? seedScreens[0].fields,
      infoCards: demand.artifacts.ui.infoCards ?? seedScreens[0].infoCards,
      ctaLabel: demand.artifacts.ui.ctaLabel ?? seedScreens[0].ctaLabel,
    };
    const nextLogic =
      demand.id === 'dem-meio-ambiente'
        ? {
            ...demand.artifacts.logic,
            rules: demand.artifacts.logic.rules.map((r) =>
              r.id === 'r-eco-1' && !r.targetScreenId
                ? { ...r, targetScreenId: 'scr-eco-ecopontos' }
                : r,
            ),
          }
        : demand.artifacts.logic;
    return {
      ...demand,
      artifacts: {
        ...demand.artifacts,
        ui: {
          ...demand.artifacts.ui,
          navigationStyle:
            demand.artifacts.ui.navigationStyle ?? seed?.artifacts.ui.navigationStyle ?? 'tabs',
          screens: [firstScreen, ...seedScreens.slice(1)],
        },
        logic: nextLogic,
      },
    };
  }
  return demand;
}

function loadState(): OrbitState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<OrbitState>;
    const fallback = createInitialState();
    const rawDemands = parsed.demands?.length ? parsed.demands : fallback.demands;
    const rawStudents = parsed.students?.length ? parsed.students : fallback.students;
    return {
      ...fallback,
      ...parsed,
      turmas: parsed.turmas?.length ? parsed.turmas : fallback.turmas,
      students: rawStudents.map((stu, idx) => {
        const seedStu = fallback.students.find((f) => f.id === stu.id);
        return {
          ...stu,
          badgeCode:
            stu.badgeCode ??
            seedStu?.badgeCode ??
            `ORB-${String(idx + 1).padStart(2, '0')}`,
        };
      }),
      demands: rawDemands.map(migrateDemandScreens),
      portalSubmissions: parsed.portalSubmissions?.length
        ? parsed.portalSubmissions
        : fallback.portalSubmissions,
      auditLogs: parsed.auditLogs ?? fallback.auditLogs,
    };
  } catch {
    return createInitialState();
  }
}

interface OrbitContextValue {
  state: OrbitState;
  syncStatus: SyncStatus;
  publicPresence: AnonymousPresence[];
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  pushToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  loginAsStudent: (studentId: string, pin: string) => boolean;
  loginAsStudentByBadge: (badgeCode: string, pin: string) => Promise<boolean>;
  loginAsStaffWithCode: (role: Exclude<Role, 'ALUNO'>, passcode: string) => boolean;
  loginAsRole: (role: Exclude<Role, 'ALUNO'>) => void;
  switchDemoRole: (role: Role) => void;
  logout: () => void;
  setViewMode: (mode: 'MAP' | 'CARDS') => void;
  setActiveTab: (tab: OrbitState['activeTab']) => void;
  openDemandRoom: (demandId: string | null) => void;
  toggleHighContrast: () => void;
  resetDemoData: () => void;
  claimStage: (demandId: string, stageKey: StageKey, studentId?: string) => void;
  toggleStageChecklistItem: (demandId: string, stageKey: StageKey, itemId: string) => void;
  updateUiArtifact: (demandId: string, ui: UiArtifact) => void;
  updateLogicArtifact: (demandId: string, logic: LogicArtifact) => void;
  updateAiArtifact: (demandId: string, ai: AiArtifact) => void;
  updateQaArtifact: (demandId: string, qa: QaArtifact) => void;
  raiseHand: (studentId: string, type: Exclude<HandRaisedType, null>, note?: string) => void;
  clearHand: (studentId: string) => void;
  submitStageForReview: (demandId: string, stageKey: StageKey, studentId: string) => void;
  approveStage: (demandId: string, stageKey: StageKey, badgeName?: string) => void;
  returnStageWithFeedback: (demandId: string, stageKey: StageKey, feedback: string) => void;
  activateTestMode: (demandId: string) => void;
  deliverDemandOfficially: (demandId: string) => void;
  createDemand: (input: {
    title: string;
    shortName: string;
    secretaria: string;
    description: string;
    icon: string;
    requiredStages: StageKey[];
  }) => void;
  setGeminiApiKey: (key: string) => void;
  addAuditLog: (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  submitPortalDemand: (input: PortalAnalysisInput, analysis: DemandAiAnalysis) => PortalSubmission;
  updatePortalSubmissionAnalysis: (submissionId: string, analysis: DemandAiAnalysis) => void;
  updatePortalSubmissionStatus: (submissionId: string, status: PortalSubmissionStatus) => void;
  requestSubmissionClarification: (submissionId: string, message: string) => void;
  replyToSubmissionClarification: (
    submissionId: string,
    replyMessage: string,
    updatedAnalysis?: DemandAiAnalysis
  ) => void;
  approveAndPublishSubmission: (submissionId: string) => Demand | null;
  resetPortalDemoData: () => void;
}

const OrbitContext = createContext<OrbitContextValue | null>(null);

export const OrbitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OrbitState>(() => loadState());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isFirebaseConfigured ? 'CONNECTING' : 'OFFLINE_LOCAL'
  );
  const [publicPresence, setPublicPresence] = useState<AnonymousPresence[]>(() =>
    INITIAL_STUDENTS.map((s, idx) => toAnonymousPresence(s, idx))
  );
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore storage quota errors
    }
  }, [state]);

  useEffect(() => {
    if (state.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
  }, [state.highContrast]);

  // Public Firestore sync (demands, portalSubmissions, anonymized presence)
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setSyncStatus('OFFLINE_LOCAL');
      return;
    }

    void ensureInitialFirestoreSeed();
    const unsubscribe = subscribePublicFirestore({
      onDemands: (demands) => {
        setState((prev) => ({
          ...prev,
          demands: demands.map(migrateDemandScreens),
        }));
      },
      onPortalSubmissions: (portalSubmissions) => {
        setState((prev) => ({ ...prev, portalSubmissions }));
      },
      onPresence: (presence) => {
        setPublicPresence(presence);
      },
      onStatus: setSyncStatus,
    });

    return unsubscribe;
  }, []);

  // Private Firestore sync (ONLY subscribed when authenticated inside CEMI 2)
  useEffect(() => {
    if (!isFirebaseConfigured || !state.session) return;
    let active = true;
    let unsubPrivate: (() => void) | undefined;

    void ensureFirebaseAuthSession().then(() => {
      if (!active) return;
      unsubPrivate = subscribePrivateFirestore({
        onTurmas: (turmas) => setState((prev) => ({ ...prev, turmas })),
        onStudents: (students) => setState((prev) => ({ ...prev, students })),
        onAuditLogs: (auditLogs) => setState((prev) => ({ ...prev, auditLogs })),
      });
    });

    return () => {
      active = false;
      unsubPrivate?.();
    };
  }, [state.session?.role, state.session?.studentId]);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const pushToast = (
    title: string,
    description?: string,
    type: ToastMessage['type'] = 'info'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const loginAsStudent = (studentId: string, pin: string): boolean => {
    const student = state.students.find((s) => s.id === studentId);
    if (!student || student.pin !== pin) return false;
    setState((prev) => ({
      ...prev,
      session: { role: 'ALUNO', studentId: student.id, name: student.name },
      activeTab: 'LAB',
      activeDemandId: null,
    }));
    pushToast(`Bem-vindo(a), ${student.name}!`, 'Explore o Mapa 2.5D ou clique na Sala de Demandas.', 'success');
    return true;
  };

  const loginAsStudentByBadge = async (
    badgeCode: string,
    pin: string
  ): Promise<boolean> => {
    const normalized = badgeCode.trim().toUpperCase();
    let student: Student | undefined = state.students.find(
      (s) => s.badgeCode.toUpperCase() === normalized && s.pin === pin
    );

    if (isFirebaseConfigured) {
      const remoteMatch = await verifyStudentBadgeInFirestore(normalized, pin);
      if (remoteMatch) {
        student = remoteMatch;
      }
    }

    if (!student) return false;

    setState((prev) => ({
      ...prev,
      students: prev.students.some((s) => s.id === student!.id)
        ? prev.students.map((s) => (s.id === student!.id ? student! : s))
        : [...prev.students, student!],
      session: { role: 'ALUNO', studentId: student!.id, name: student!.name },
      activeTab: 'LAB',
      activeDemandId: null,
    }));
    pushToast(`Bem-vindo(a), ${student.name}!`, 'Explore o Mapa 2.5D ou clique na Sala de Demandas.', 'success');
    return true;
  };

  const loginAsStaffWithCode = (
    role: Exclude<Role, 'ALUNO'>,
    passcode: string
  ): boolean => {
    if (passcode.trim().toUpperCase() !== STAFF_PASSCODES[role].toUpperCase()) {
      return false;
    }
    loginAsRole(role);
    return true;
  };

  const loginAsRole = (role: Exclude<Role, 'ALUNO'>) => {
    setState((prev) => ({
      ...prev,
      session: {
        role,
        name: role === 'PROFESSOR' ? 'Prof. Mentor Ricardo (CEMI 2)' : 'Coord. Mariana (SMED)',
      },
      activeTab: role === 'PROFESSOR' ? 'PROFESSOR' : 'COORDENADOR',
      activeDemandId: null,
    }));
    pushToast(
      role === 'PROFESSOR' ? 'Painel do Professor Mentor ativo' : 'Painel da Coordenação SMED ativo',
      undefined,
      'success'
    );
  };

  const switchDemoRole = (role: Role) => {
    if (role === 'ALUNO') {
      const demoStudent = state.students[0];
      setState((prev) => ({
        ...prev,
        session: {
          role: 'ALUNO',
          studentId: demoStudent.id,
          name: demoStudent.name,
        },
        activeTab: 'LAB',
      }));
      pushToast(`Modo Demonstração: Aluno (${demoStudent.name})`, 'Pronto para testar o Pull System.', 'info');
      return;
    }
    setState((prev) => ({
      ...prev,
      session: {
        role,
        name: role === 'PROFESSOR' ? 'Prof. Mentor Ricardo (CEMI 2)' : 'Coord. Mariana (SMED)',
      },
      activeTab: role === 'PROFESSOR' ? 'PROFESSOR' : 'COORDENADOR',
      activeDemandId: null,
    }));
    pushToast(
      `Modo Demonstração: ${role === 'PROFESSOR' ? 'Professor Mentor' : 'Coordenador SMED'}`,
      undefined,
      'info'
    );
  };

  const logout = () => {
    setState((prev) => ({
      ...prev,
      session: null,
      activeDemandId: null,
      activeTab: 'LAB',
    }));
  };

  const setViewMode = (viewMode: 'MAP' | 'CARDS') => {
    setState((prev) => ({ ...prev, viewMode }));
  };

  const setActiveTab = (activeTab: OrbitState['activeTab']) => {
    setState((prev) => ({
      ...prev,
      activeTab,
      activeDemandId: activeTab === 'LAB' ? prev.activeDemandId : null,
    }));
  };

  const openDemandRoom = (demandId: string | null) => {
    setState((prev) => ({ ...prev, activeTab: 'LAB', activeDemandId: demandId }));
  };

  const toggleHighContrast = () => {
    setState((prev) => ({ ...prev, highContrast: !prev.highContrast }));
  };

  const resetDemoData = () => {
    const fresh = createInitialState();
    localStorage.removeItem(STORAGE_KEY);
    setState({
      ...fresh,
      session: state.session,
      geminiApiKey: state.geminiApiKey,
    });
    void resetAllFirestoreDemo();
    pushToast('Dados demo restaurados!', 'Todas as demandas e avatares voltaram ao estado inicial.', 'info');
  };

  const claimStage = (demandId: string, stageKey: StageKey, explicitStudentId?: string) => {
    const studentId = explicitStudentId ?? state.session?.studentId ?? state.students[0].id;
    const targetDemand = state.demands.find((d) => d.id === demandId);
    if (!targetDemand) return;

    const updatedDemand: Demand = {
      ...targetDemand,
      stages: {
        ...targetDemand.stages,
        [stageKey]: {
          ...targetDemand.stages[stageKey],
          status: 'EM_DESENVOLVIMENTO',
          assigneeId: studentId,
          feedback: undefined,
        },
      },
    };

    const idx = state.students.findIndex((s) => s.id === studentId);
    const targetStudent = idx >= 0 ? state.students[idx] : undefined;
    const updatedStudent = targetStudent
      ? {
          ...targetStudent,
          location: demandId,
          activeStage: stageKey,
          activityBubble: STAGE_META[stageKey].bubble,
          handRaised: null,
          handNote: undefined,
        }
      : undefined;

    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => (d.id === demandId ? updatedDemand : d)),
      students: prev.students.map((s) =>
        s.id === studentId && updatedStudent ? updatedStudent : s
      ),
      activeTab: 'LAB',
      activeDemandId: demandId,
    }));

    void syncDemandToFirestore(updatedDemand);
    if (updatedStudent) void syncStudentToFirestore(updatedStudent, idx);

    pushToast(
      `Etapa ${STAGE_META[stageKey].shortLabel} assumida!`,
      `Seu avatar caminhou para a sala "${targetDemand.shortName}".`,
      'success'
    );
  };

  const toggleStageChecklistItem = (demandId: string, stageKey: StageKey, itemId: string) => {
    const target = state.demands.find((d) => d.id === demandId);
    if (!target) return;
    const stage = target.stages[stageKey];
    const updated: Demand = {
      ...target,
      stages: {
        ...target.stages,
        [stageKey]: {
          ...stage,
          checklist: stage.checklist.map((item) =>
            item.id === itemId ? { ...item, done: !item.done } : item
          ),
        },
      },
    };

    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => (d.id === demandId ? updated : d)),
    }));
    void syncDemandToFirestore(updated);
  };

  const updateUiArtifact = (demandId: string, ui: UiArtifact) => {
    const target = state.demands.find((d) => d.id === demandId);
    if (!target) return;
    const updated: Demand = { ...target, artifacts: { ...target.artifacts, ui } };
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => (d.id === demandId ? updated : d)),
    }));
    void syncDemandToFirestore(updated);
  };

  const updateLogicArtifact = (demandId: string, logic: LogicArtifact) => {
    const target = state.demands.find((d) => d.id === demandId);
    if (!target) return;
    const updated: Demand = { ...target, artifacts: { ...target.artifacts, logic } };
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => (d.id === demandId ? updated : d)),
    }));
    void syncDemandToFirestore(updated);
  };

  const updateAiArtifact = (demandId: string, ai: AiArtifact) => {
    const target = state.demands.find((d) => d.id === demandId);
    if (!target) return;
    const updated: Demand = { ...target, artifacts: { ...target.artifacts, ai } };
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => (d.id === demandId ? updated : d)),
    }));
    void syncDemandToFirestore(updated);
  };

  const updateQaArtifact = (demandId: string, qa: QaArtifact) => {
    const target = state.demands.find((d) => d.id === demandId);
    if (!target) return;
    const updated: Demand = { ...target, artifacts: { ...target.artifacts, qa } };
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => (d.id === demandId ? updated : d)),
    }));
    void syncDemandToFirestore(updated);
  };

  const raiseHand = (studentId: string, type: Exclude<HandRaisedType, null>, note?: string) => {
    const idx = state.students.findIndex((s) => s.id === studentId);
    if (idx < 0) return;
    const updatedStudent: Student = { ...state.students[idx], handRaised: type, handNote: note };
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === studentId ? updatedStudent : s)),
    }));
    void syncStudentToFirestore(updatedStudent, idx);
    pushToast(
      type === 'AJUDA' ? '✋ Mão levantada para dúvida!' : '✅ Etapa enviada para avaliação!',
      'Seu avatar foi até a mesa central da sala para chamar o Professor Mentor.',
      type === 'AJUDA' ? 'warning' : 'success'
    );
  };

  const clearHand = (studentId: string) => {
    const idx = state.students.findIndex((s) => s.id === studentId);
    if (idx < 0) return;
    const updatedStudent: Student = {
      ...state.students[idx],
      handRaised: null,
      handNote: undefined,
    };
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) => (s.id === studentId ? updatedStudent : s)),
    }));
    void syncStudentToFirestore(updatedStudent, idx);
  };

  const submitStageForReview = (demandId: string, stageKey: StageKey, studentId: string) => {
    const targetDemand = state.demands.find((d) => d.id === demandId);
    const idx = state.students.findIndex((s) => s.id === studentId);
    const updatedDemand: Demand | undefined = targetDemand
      ? {
          ...targetDemand,
          stages: {
            ...targetDemand.stages,
            [stageKey]: {
              ...targetDemand.stages[stageKey],
              status: 'EM_REVISAO',
              assigneeId: targetDemand.stages[stageKey].assigneeId ?? studentId,
              submittedAt: new Date().toISOString(),
            },
          },
        }
      : undefined;
    const updatedStudent: Student | undefined =
      idx >= 0
        ? {
            ...state.students[idx],
            location: demandId,
            activeStage: stageKey,
            handRaised: 'AVALIACAO',
            handNote: `Etapa ${STAGE_META[stageKey].shortLabel} concluída e pronta para avaliação.`,
          }
        : undefined;

    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) =>
        d.id === demandId && updatedDemand ? updatedDemand : d
      ),
      students: prev.students.map((s) =>
        s.id === studentId && updatedStudent ? updatedStudent : s
      ),
    }));

    if (updatedDemand) void syncDemandToFirestore(updatedDemand);
    if (updatedStudent) void syncStudentToFirestore(updatedStudent, idx);

    pushToast(
      '✅ Etapa concluída e enviada!',
      'Mão levantada na mesa central. Troque para Professor Mentor para avaliar.',
      'success'
    );
  };

  const approveStage = (demandId: string, stageKey: StageKey, badgeName?: string) => {
    const demand = state.demands.find((d) => d.id === demandId);
    if (!demand) return;
    const assigneeId = demand.stages[stageKey].assigneeId;
    const badge = badgeName ?? `${STAGE_META[stageKey].shortLabel} · ${demand.shortName}`;

    const updatedDemand: Demand = {
      ...demand,
      stages: {
        ...demand.stages,
        [stageKey]: {
          ...demand.stages[stageKey],
          status: 'APROVADA',
          approvedAt: new Date().toISOString(),
          feedback: undefined,
        },
      },
    };

    const idx = state.students.findIndex((s) => s.id === assigneeId);
    const targetStu = idx >= 0 ? state.students[idx] : undefined;
    const updatedStudent: Student | undefined = targetStu
      ? {
          ...targetStu,
          handRaised: null,
          handNote: undefined,
          badges: targetStu.badges.includes(badge)
            ? targetStu.badges
            : [...targetStu.badges, badge],
          location: 'LOUNGE',
          activityBubble: '☕ Lounge',
        }
      : undefined;

    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => (d.id === demandId ? updatedDemand : d)),
      students: prev.students.map((s) =>
        s.id === assigneeId && updatedStudent ? updatedStudent : s
      ),
    }));

    void syncDemandToFirestore(updatedDemand);
    if (updatedStudent) void syncStudentToFirestore(updatedStudent, idx);

    pushToast(`Etapa ${STAGE_META[stageKey].shortLabel} aprovada!`, `Badge "${badge}" concedida.`, 'success');
  };

  const returnStageWithFeedback = (demandId: string, stageKey: StageKey, feedback: string) => {
    const demand = state.demands.find((d) => d.id === demandId);
    if (!demand) return;
    const assigneeId = demand.stages[stageKey].assigneeId;

    const updatedDemand: Demand = {
      ...demand,
      stages: {
        ...demand.stages,
        [stageKey]: {
          ...demand.stages[stageKey],
          status: 'EM_DESENVOLVIMENTO',
          feedback,
        },
      },
    };
    const idx = state.students.findIndex((s) => s.id === assigneeId);
    const updatedStudent: Student | undefined =
      idx >= 0
        ? { ...state.students[idx], handRaised: null, handNote: undefined }
        : undefined;

    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => (d.id === demandId ? updatedDemand : d)),
      students: prev.students.map((s) =>
        s.id === assigneeId && updatedStudent ? updatedStudent : s
      ),
    }));

    void syncDemandToFirestore(updatedDemand);
    if (updatedStudent) void syncStudentToFirestore(updatedStudent, idx);

    pushToast('Feedback enviado ao estudante', 'A etapa voltou para ajustes na bancada.', 'warning');
  };

  const activateTestMode = (demandId: string) => {
    const target = state.demands.find((d) => d.id === demandId);
    if (!target) return;
    const updated: Demand = { ...target, status: 'MODO_TESTE' };
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => (d.id === demandId ? updated : d)),
    }));
    void syncDemandToFirestore(updated);
    pushToast(
      'Modo Teste ativado na sala!',
      'O Auditório de Pitches foi iluminado para testes coletivos da turma.',
      'success'
    );
  };

  const deliverDemandOfficially = (demandId: string) => {
    const target = state.demands.find((d) => d.id === demandId);
    if (!target) return;

    const contributorIds = new Set(
      (Object.values(target.stages) as Demand['stages'][StageKey][])
        .map((st) => st.assigneeId)
        .filter((id): id is string => Boolean(id))
    );

    const nextStages = { ...target.stages };
    (Object.keys(nextStages) as StageKey[]).forEach((k) => {
      if (nextStages[k].status !== 'APROVADA' && nextStages[k].assigneeId) {
        nextStages[k] = {
          ...nextStages[k],
          status: 'APROVADA',
          approvedAt: new Date().toISOString(),
        };
      }
    });

    const updatedDemand: Demand = {
      ...target,
      status: 'ENTREGUE',
      deliveredAt: new Date().toISOString(),
      stages: nextStages,
    };

    const updatedStudents = state.students.map((s) => {
      if (!contributorIds.has(s.id) && s.location !== demandId) return s;
      const entregaBadge = `Entrega Oficial: ${target.shortName}`;
      return {
        ...s,
        location: 'LOUNGE',
        activityBubble: '☕ Lounge' as const,
        handRaised: null,
        handNote: undefined,
        badges:
          contributorIds.has(s.id) && !s.badges.includes(entregaBadge)
            ? [...s.badges, entregaBadge]
            : s.badges,
      };
    });

    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => (d.id === demandId ? updatedDemand : d)),
      students: updatedStudents,
    }));

    void syncDemandToFirestore(updatedDemand);
    updatedStudents.forEach((s, idx) => {
      if (contributorIds.has(s.id) || state.students[idx]?.location === demandId) {
        void syncStudentToFirestore(s, idx);
      }
    });

    pushToast(
      `🌸 Entrega Oficial: ${target.shortName}!`,
      'A sala transformou-se em Jardim da Inovação e o sistema entrou na Vitrine Pública.',
      'success'
    );
  };

  const createDemand = (input: {
    title: string;
    shortName: string;
    secretaria: string;
    description: string;
    icon: string;
    requiredStages: StageKey[];
  }) => {
    const id = `dem-${Date.now().toString(36)}`;
    const makeStage = (key: StageKey, title: string, description: string, checkLabel: string) => ({
      key,
      title,
      description,
      required: input.requiredStages.includes(key),
      status: 'DISPONIVEL' as const,
      assigneeId: null,
      checklist: [{ id: `${id}-${key}-1`, label: checkLabel, done: false }],
    });

    const usedColors = new Set(
      state.demands
        .filter((d) => d.status !== 'ENTREGUE')
        .map((d) => d.artifacts.ui.primaryColor.trim().toUpperCase())
    );
    const uniquePrimaryColor =
      PROJECT_THEME_ACCENTS.find((c) => !usedColors.has(c.toUpperCase())) ??
      PROJECT_THEME_ACCENTS[state.demands.length % PROJECT_THEME_ACCENTS.length] ??
      '#0284C7';

    const newDemand: Demand = {
      id,
      title: input.title,
      shortName: input.shortName || input.title.slice(0, 18),
      secretaria: input.secretaria,
      description: input.description,
      icon: input.icon || 'Sparkles',
      status: 'ATIVA',
      createdAt: new Date().toISOString(),
      stages: {
        UI_UX: makeStage('UI_UX', 'Interface & Telas', 'Projetar tela principal, cores e formulário.', 'Definir campos essenciais e contraste'),
        LOGICA_REGRAS: makeStage('LOGICA_REGRAS', 'Lógica & Regras', 'Criar regras Se/Então para decisões do app.', 'Configurar ao menos 1 regra condicional'),
        IA_DADOS: makeStage('IA_DADOS', 'IA & Conteúdo (Gemini)', 'Configurar persona, instruções e FAQs do assistente.', 'Testar pergunta real no Estúdio IA'),
        QA_TESTES: makeStage('QA_TESTES', 'Qualidade & Testes', 'Executar testes ponta a ponta no simulador.', 'Validar fluxo completo sem erros'),
      },
      artifacts: {
        ui: {
          appTitle: input.shortName || input.title,
          appSubtitle: input.description,
          primaryColor: uniquePrimaryColor,
          accentColor: '#10B981',
          navigationStyle: 'tabs',
          ctaLabel: 'Enviar Consulta',
          fields: [
            { id: 'entrada_principal', label: 'Informação principal', type: 'text', placeholder: 'Digite aqui...' },
          ],
          infoCards: [],
          screens: [
            {
              id: `${id}-scr-1`,
              name: 'Início',
              title: input.shortName || input.title,
              subtitle: input.description,
              fields: [
                { id: 'entrada_principal', label: 'Informação principal', type: 'text', placeholder: 'Digite aqui...' },
              ],
              infoCards: [],
              ctaLabel: 'Enviar Consulta',
            },
            {
              id: `${id}-scr-2`,
              name: 'Informações',
              title: `Sobre — ${input.shortName || input.title}`,
              subtitle: `Orientações e canais oficiais da ${input.secretaria}.`,
              fields: [],
              infoCards: [
                { id: `${id}-card`, title: input.secretaria, description: 'Atendimento digital municipal — Cianorte/PR', icon: 'Building2' },
              ],
              ctaLabel: 'Voltar ao Início',
              ctaTargetScreenId: `${id}-scr-1`,
            },
          ],
        },
        logic: {
          rules: [
            {
              id: `${id}-r1`,
              fieldId: 'entrada_principal',
              operator: 'nao_vazio',
              value: '',
              resultTitle: 'Solicitação Processada',
              resultMessage: 'Seus dados foram analisados com sucesso pelo sistema municipal.',
              severity: 'success',
            },
          ],
          defaultMessage: 'Preencha o campo principal para receber uma orientação.',
        },
        ai: {
          assistantName: `Guia ${input.shortName}`,
          persona: `Assistente digital oficial da ${input.secretaria} de Cianorte.`,
          systemInstructions: 'Responda com clareza, educação e foco em serviços públicos municipais.',
          greeting: `Olá! Como posso ajudar você em "${input.title}"?`,
          faqs: [],
        },
        qa: {
          checklist: [{ id: `${id}-qa1`, label: 'Testar envio do formulário e resposta da IA', checked: false }],
          notes: '',
        },
      },
    };

    setState((prev) => ({
      ...prev,
      demands: [newDemand, ...prev.demands],
    }));
    void syncDemandToFirestore(newDemand);

    pushToast('Nova demanda cadastrada!', `"${input.title}" já está aberta na Sala de Demandas.`, 'success');
  };

  const setGeminiApiKey = (geminiApiKey: string) => {
    setState((prev) => ({ ...prev, geminiApiKey: geminiApiKey.trim() }));
    pushToast(
      geminiApiKey.trim() ? 'Chave Gemini BYOK salva!' : 'Chave Gemini removida',
      geminiApiKey.trim()
        ? 'Os Tutores Socráticos e Estúdios de IA usarão gemini-2.5-flash ao vivo.'
        : 'Modo simulado/proxy restaurado.',
      'success'
    );
  };

  const addAuditLog = (entry: Omit<AuditLogEntry, 'id' | 'timestamp'>) => {
    const newEntry: AuditLogEntry = {
      ...entry,
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      auditLogs: [newEntry, ...prev.auditLogs],
    }));
    void syncAuditLogToFirestore(newEntry);
  };

  const submitPortalDemand = (
    input: PortalAnalysisInput,
    analysis: DemandAiAnalysis
  ): PortalSubmission => {
    const num = 105 + state.portalSubmissions.length;
    const protocol = `SMED-2026-${String(num).padStart(4, '0')}`;
    const now = new Date().toISOString();
    const newSub: PortalSubmission = {
      id: `psub-${Date.now().toString(36)}`,
      protocol,
      requesterName: input.requesterName,
      requesterRole: input.requesterRole,
      organization: input.organization,
      organizationType: input.organizationType,
      title: input.title,
      problemDescription: input.problemDescription,
      targetAudienceAndImpact: input.targetAudienceAndImpact,
      urgency: input.urgency,
      status: 'PENDENTE_TRIAGEM',
      createdAt: now,
      updatedAt: now,
      analysis,
      clarifications: [],
    };
    setState((prev) => ({
      ...prev,
      portalSubmissions: [newSub, ...prev.portalSubmissions],
    }));
    void syncPortalSubmissionToFirestore(newSub);
    pushToast(
      `Demanda enviada! Protocolo ${protocol}`,
      'A IA analisou sua solicitação e a encaminhou para triagem no CEMI 2.',
      'success'
    );
    return newSub;
  };

  const updatePortalSubmissionAnalysis = (
    submissionId: string,
    analysis: DemandAiAnalysis
  ) => {
    const target = state.portalSubmissions.find((s) => s.id === submissionId);
    if (!target) return;
    const updated: PortalSubmission = {
      ...target,
      analysis,
      updatedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      portalSubmissions: prev.portalSubmissions.map((s) =>
        s.id === submissionId ? updated : s
      ),
    }));
    void syncPortalSubmissionToFirestore(updated);
    pushToast('Análise atualizada!', 'As alterações do Mentor foram salvas na demanda.', 'info');
  };

  const updatePortalSubmissionStatus = (
    submissionId: string,
    status: PortalSubmissionStatus
  ) => {
    const target = state.portalSubmissions.find((s) => s.id === submissionId);
    if (!target) return;
    const updated: PortalSubmission = {
      ...target,
      status,
      updatedAt: new Date().toISOString(),
    };
    setState((prev) => ({
      ...prev,
      portalSubmissions: prev.portalSubmissions.map((s) =>
        s.id === submissionId ? updated : s
      ),
    }));
    void syncPortalSubmissionToFirestore(updated);
  };

  const requestSubmissionClarification = (submissionId: string, message: string) => {
    const clean = message.trim();
    const target = state.portalSubmissions.find((s) => s.id === submissionId);
    if (!clean || !target) return;
    const now = new Date().toISOString();
    const updated: PortalSubmission = {
      ...target,
      status: 'AJUSTE_SOLICITADO',
      updatedAt: now,
      clarifications: [
        ...target.clarifications,
        {
          id: `clr-${Date.now().toString(36)}`,
          author: 'MENTOR',
          message: clean,
          timestamp: now,
        },
      ],
    };
    setState((prev) => ({
      ...prev,
      portalSubmissions: prev.portalSubmissions.map((s) =>
        s.id === submissionId ? updated : s
      ),
    }));
    void syncPortalSubmissionToFirestore(updated);
    pushToast(
      'Solicitação de esclarecimento registrada!',
      'O solicitante já pode responder diretamente na Consulta de Protocolo.',
      'warning'
    );
  };

  const replyToSubmissionClarification = (
    submissionId: string,
    replyMessage: string,
    updatedAnalysis?: DemandAiAnalysis
  ) => {
    const clean = replyMessage.trim();
    const target = state.portalSubmissions.find((s) => s.id === submissionId);
    if (!clean || !target) return;
    const now = new Date().toISOString();
    const updated: PortalSubmission = {
      ...target,
      status: 'EM_REVISAO',
      updatedAt: now,
      analysis: updatedAnalysis ?? target.analysis,
      clarifications: [
        ...target.clarifications,
        {
          id: `clr-${Date.now().toString(36)}`,
          author: 'SOLICITANTE',
          message: clean,
          timestamp: now,
        },
      ],
    };
    setState((prev) => ({
      ...prev,
      portalSubmissions: prev.portalSubmissions.map((s) =>
        s.id === submissionId ? updated : s
      ),
    }));
    void syncPortalSubmissionToFirestore(updated);
    pushToast(
      'Resposta enviada ao CEMI 2!',
      'Seu protocolo retornou para revisão do Mentor.',
      'success'
    );
  };

  const approveAndPublishSubmission = (submissionId: string): Demand | null => {
    const sub = state.portalSubmissions.find((s) => s.id === submissionId);
    if (!sub) return null;
    if (sub.analysis.viabilityStatus === 'FORA_DE_ESCOPO_HARDWARE') {
      pushToast(
        'Adaptação necessária antes de publicar',
        'Aceite a versão 100% digital ou solicite esclarecimento ao solicitante.',
        'warning'
      );
      return null;
    }

    const existing = sub.linkedDemandId
      ? state.demands.find((d) => d.id === sub.linkedDemandId)
      : undefined;
    const built = existing ?? buildOrbitDemandFromSubmission(sub);
    const now = new Date().toISOString();
    const updatedSub: PortalSubmission = {
      ...sub,
      status: 'APROVADA_ORBIT',
      linkedDemandId: built.id,
      updatedAt: now,
    };

    setState((prev) => {
      const alreadyExists = prev.demands.some((d) => d.id === built.id);
      return {
        ...prev,
        demands: alreadyExists ? prev.demands : [built, ...prev.demands],
        portalSubmissions: prev.portalSubmissions.map((s) =>
          s.id === submissionId ? updatedSub : s
        ),
      };
    });

    void syncDemandToFirestore(built);
    void syncPortalSubmissionToFirestore(updatedSub);

    pushToast(
      `Publicado no Orbit Conecta: ${built.shortName}!`,
      'A nova sala já aparece no escritório 2.5D e na Sala de Demandas.',
      'success'
    );
    return built;
  };

  const resetPortalDemoData = () => {
    setState((prev) => ({
      ...prev,
      portalSubmissions: INITIAL_PORTAL_SUBMISSIONS,
    }));
    void resetPortalFirestoreDemo();
    pushToast(
      'Exemplos do Portal restaurados!',
      'Os protocolos de demonstração de Cianorte foram recarregados.',
      'info'
    );
  };

  return (
    <OrbitContext.Provider
      value={{
        state,
        syncStatus,
        publicPresence,
        toasts,
        dismissToast,
        pushToast,
        loginAsStudent,
        loginAsStudentByBadge,
        loginAsStaffWithCode,
        loginAsRole,
        switchDemoRole,
        logout,
        setViewMode,
        setActiveTab,
        openDemandRoom,
        toggleHighContrast,
        resetDemoData,
        claimStage,
        toggleStageChecklistItem,
        updateUiArtifact,
        updateLogicArtifact,
        updateAiArtifact,
        updateQaArtifact,
        raiseHand,
        clearHand,
        submitStageForReview,
        approveStage,
        returnStageWithFeedback,
        activateTestMode,
        deliverDemandOfficially,
        createDemand,
        setGeminiApiKey,
        addAuditLog,
        submitPortalDemand,
        updatePortalSubmissionAnalysis,
        updatePortalSubmissionStatus,
        requestSubmissionClarification,
        replyToSubmissionClarification,
        approveAndPublishSubmission,
        resetPortalDemoData,
      }}
    >
      {children}
    </OrbitContext.Provider>
  );
};

export function useOrbit(): OrbitContextValue {
  const ctx = useContext(OrbitContext);
  if (!ctx) throw new Error('useOrbit deve ser usado dentro de OrbitProvider');
  return ctx;
}
