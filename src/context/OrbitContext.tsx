import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_DEMANDS,
  INITIAL_STUDENTS,
  INITIAL_TURMAS,
  STAGE_META,
} from '../data/seedData';
import {
  AiArtifact,
  AuditLogEntry,
  Demand,
  HandRaisedType,
  LogicArtifact,
  OrbitState,
  QaArtifact,
  Role,
  StageKey,
  ToastMessage,
  UiArtifact,
} from '../types';

const STORAGE_KEY = 'orbit_conecta_state_v1';

const createInitialState = (): OrbitState => ({
  session: null,
  turmas: INITIAL_TURMAS,
  students: INITIAL_STUDENTS,
  demands: INITIAL_DEMANDS,
  auditLogs: INITIAL_AUDIT_LOGS,
  geminiApiKey: '',
  highContrast: false,
  viewMode: 'MAP',
  activeDemandId: null,
  activeTab: 'LAB',
});

function loadState(): OrbitState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as Partial<OrbitState>;
    const fallback = createInitialState();
    return {
      ...fallback,
      ...parsed,
      turmas: parsed.turmas?.length ? parsed.turmas : fallback.turmas,
      students: parsed.students?.length ? parsed.students : fallback.students,
      demands: parsed.demands?.length ? parsed.demands : fallback.demands,
      auditLogs: parsed.auditLogs ?? fallback.auditLogs,
    };
  } catch {
    return createInitialState();
  }
}

interface OrbitContextValue {
  state: OrbitState;
  toasts: ToastMessage[];
  dismissToast: (id: string) => void;
  pushToast: (title: string, description?: string, type?: ToastMessage['type']) => void;
  loginAsStudent: (studentId: string, pin: string) => boolean;
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
}

const OrbitContext = createContext<OrbitContextValue | null>(null);

export const OrbitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<OrbitState>(() => loadState());
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
    setState((prev) => ({ ...prev, activeTab, activeDemandId: activeTab === 'LAB' ? prev.activeDemandId : null }));
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
    });
    pushToast('Dados demo restaurados!', 'Todas as demandas e avatares voltaram ao estado inicial.', 'info');
  };

  const claimStage = (demandId: string, stageKey: StageKey, explicitStudentId?: string) => {
    const studentId = explicitStudentId ?? state.session?.studentId ?? state.students[0].id;
    const targetDemand = state.demands.find((d) => d.id === demandId);
    if (!targetDemand) return;

    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => {
        if (d.id !== demandId) return d;
        return {
          ...d,
          stages: {
            ...d.stages,
            [stageKey]: {
              ...d.stages[stageKey],
              status: 'EM_DESENVOLVIMENTO',
              assigneeId: studentId,
              feedback: undefined,
            },
          },
        };
      }),
      students: prev.students.map((s) =>
        s.id === studentId
          ? {
              ...s,
              location: demandId,
              activeStage: stageKey,
              activityBubble: STAGE_META[stageKey].bubble,
              handRaised: null,
              handNote: undefined,
            }
          : s
      ),
      activeTab: 'LAB',
      activeDemandId: demandId,
    }));

    pushToast(
      `Etapa ${STAGE_META[stageKey].shortLabel} assumida!`,
      `Seu avatar caminhou para a sala "${targetDemand.shortName}".`,
      'success'
    );
  };

  const toggleStageChecklistItem = (demandId: string, stageKey: StageKey, itemId: string) => {
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => {
        if (d.id !== demandId) return d;
        const stage = d.stages[stageKey];
        return {
          ...d,
          stages: {
            ...d.stages,
            [stageKey]: {
              ...stage,
              checklist: stage.checklist.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item
              ),
            },
          },
        };
      }),
    }));
  };

  const updateUiArtifact = (demandId: string, ui: UiArtifact) => {
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) =>
        d.id === demandId ? { ...d, artifacts: { ...d.artifacts, ui } } : d
      ),
    }));
  };

  const updateLogicArtifact = (demandId: string, logic: LogicArtifact) => {
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) =>
        d.id === demandId ? { ...d, artifacts: { ...d.artifacts, logic } } : d
      ),
    }));
  };

  const updateAiArtifact = (demandId: string, ai: AiArtifact) => {
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) =>
        d.id === demandId ? { ...d, artifacts: { ...d.artifacts, ai } } : d
      ),
    }));
  };

  const updateQaArtifact = (demandId: string, qa: QaArtifact) => {
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) =>
        d.id === demandId ? { ...d, artifacts: { ...d.artifacts, qa } } : d
      ),
    }));
  };

  const raiseHand = (studentId: string, type: Exclude<HandRaisedType, null>, note?: string) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId ? { ...s, handRaised: type, handNote: note } : s
      ),
    }));
    pushToast(
      type === 'AJUDA' ? '✋ Mão levantada para dúvida!' : '✅ Etapa enviada para avaliação!',
      'Seu avatar foi até a mesa central da sala para chamar o Professor Mentor.',
      type === 'AJUDA' ? 'warning' : 'success'
    );
  };

  const clearHand = (studentId: string) => {
    setState((prev) => ({
      ...prev,
      students: prev.students.map((s) =>
        s.id === studentId ? { ...s, handRaised: null, handNote: undefined } : s
      ),
    }));
  };

  const submitStageForReview = (demandId: string, stageKey: StageKey, studentId: string) => {
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => {
        if (d.id !== demandId) return d;
        return {
          ...d,
          stages: {
            ...d.stages,
            [stageKey]: {
              ...d.stages[stageKey],
              status: 'EM_REVISAO',
              assigneeId: d.stages[stageKey].assigneeId ?? studentId,
              submittedAt: new Date().toISOString(),
            },
          },
        };
      }),
      students: prev.students.map((s) =>
        s.id === studentId
          ? {
              ...s,
              location: demandId,
              activeStage: stageKey,
              handRaised: 'AVALIACAO',
              handNote: `Etapa ${STAGE_META[stageKey].shortLabel} concluída e pronta para avaliação.`,
            }
          : s
      ),
    }));
    pushToast(
      '✅ Etapa concluída e enviada!',
      'Mão levantada na mesa central. Troque para Professor Mentor para avaliar.',
      'success'
    );
  };

  const approveStage = (demandId: string, stageKey: StageKey, badgeName?: string) => {
    const demand = state.demands.find((d) => d.id === demandId);
    const assigneeId = demand?.stages[stageKey].assigneeId;
    const badge = badgeName ?? `${STAGE_META[stageKey].shortLabel} · ${demand?.shortName ?? 'SMED'}`;

    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => {
        if (d.id !== demandId) return d;
        return {
          ...d,
          stages: {
            ...d.stages,
            [stageKey]: {
              ...d.stages[stageKey],
              status: 'APROVADA',
              approvedAt: new Date().toISOString(),
              feedback: undefined,
            },
          },
        };
      }),
      students: prev.students.map((s) => {
        if (s.id !== assigneeId) return s;
        const nextBadges = s.badges.includes(badge) ? s.badges : [...s.badges, badge];
        return {
          ...s,
          handRaised: null,
          handNote: undefined,
          badges: nextBadges,
          location: 'LOUNGE',
          activityBubble: '☕ Lounge',
        };
      }),
    }));

    pushToast(`Etapa ${STAGE_META[stageKey].shortLabel} aprovada!`, `Badge "${badge}" concedida.`, 'success');
  };

  const returnStageWithFeedback = (demandId: string, stageKey: StageKey, feedback: string) => {
    const demand = state.demands.find((d) => d.id === demandId);
    const assigneeId = demand?.stages[stageKey].assigneeId;

    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => {
        if (d.id !== demandId) return d;
        return {
          ...d,
          stages: {
            ...d.stages,
            [stageKey]: {
              ...d.stages[stageKey],
              status: 'EM_DESENVOLVIMENTO',
              feedback,
            },
          },
        };
      }),
      students: prev.students.map((s) =>
        s.id === assigneeId ? { ...s, handRaised: null, handNote: undefined } : s
      ),
    }));

    pushToast('Feedback enviado ao estudante', 'A etapa voltou para ajustes na bancada.', 'warning');
  };

  const activateTestMode = (demandId: string) => {
    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) =>
        d.id === demandId ? { ...d, status: 'MODO_TESTE' } : d
      ),
    }));
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

    setState((prev) => ({
      ...prev,
      demands: prev.demands.map((d) => {
        if (d.id !== demandId) return d;
        const nextStages = { ...d.stages };
        (Object.keys(nextStages) as StageKey[]).forEach((k) => {
          if (nextStages[k].status !== 'APROVADA' && nextStages[k].assigneeId) {
            nextStages[k] = {
              ...nextStages[k],
              status: 'APROVADA',
              approvedAt: new Date().toISOString(),
            };
          }
        });
        return {
          ...d,
          status: 'ENTREGUE',
          deliveredAt: new Date().toISOString(),
          stages: nextStages,
        };
      }),
      students: prev.students.map((s) => {
        if (!contributorIds.has(s.id) && s.location !== demandId) return s;
        const entregaBadge = `Entrega Oficial: ${target.shortName}`;
        return {
          ...s,
          location: 'LOUNGE',
          activityBubble: '☕ Lounge',
          handRaised: null,
          handNote: undefined,
          badges: contributorIds.has(s.id) && !s.badges.includes(entregaBadge)
            ? [...s.badges, entregaBadge]
            : s.badges,
        };
      }),
    }));

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
          primaryColor: '#0284C7',
          accentColor: '#10B981',
          ctaLabel: 'Enviar Consulta',
          fields: [
            { id: 'entrada_principal', label: 'Informação principal', type: 'text', placeholder: 'Digite aqui...' },
          ],
          infoCards: [
            { id: `${id}-card`, title: input.secretaria, description: 'Atendimento digital municipal — Cianorte/PR', icon: 'Building2' },
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

    pushToast('Nova demanda cadastrada!', `"${input.title}" já está aberta na Sala de Demandas.`, 'success');
  };

  const setGeminiApiKey = (geminiApiKey: string) => {
    setState((prev) => ({ ...prev, geminiApiKey: geminiApiKey.trim() }));
    pushToast(
      geminiApiKey.trim() ? 'Chave Gemini BYOK salva!' : 'Chave Gemini removida',
      geminiApiKey.trim()
        ? 'Os Tutores Socráticos e Estúdios de IA usarão gemini-2.5-flash ao vivo.'
        : 'Modo simulado inteligente reativado.',
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
  };

  return (
    <OrbitContext.Provider
      value={{
        state,
        toasts,
        dismissToast,
        pushToast,
        loginAsStudent,
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
