import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Eye,
  Hand,
  Layers,
  Plus,
  Presentation,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { STAGE_META } from '../data/seedData';
import {
  AiArtifact,
  LogicArtifact,
  LogicRule,
  QaArtifact,
  StageKey,
  UiArtifact,
  UiField,
} from '../types';
import { PixelAvatar } from './PixelAvatar';
import { SocraticTutorDrawer } from './SocraticTutorDrawer';
import { UnifiedPreview } from './UnifiedPreview';

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

const SelectOptionsInput: React.FC<{
  options: string[];
  onChange: (nextOptions: string[]) => void;
}> = ({ options, onChange }) => {
  const [text, setText] = useState(() => options.join(', '));

  useEffect(() => {
    const parsed = text
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    const same =
      parsed.length === options.length && parsed.every((val, i) => val === options[i]);
    if (!same) {
      setText(options.join(', '));
    }
    // Only re-sync from props when normalized options change externally
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  const handleChange = (val: string) => {
    setText(val);
    const parsed = val
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    onChange(parsed);
  };

  return (
    <input
      value={text}
      onChange={(e) => handleChange(e.target.value)}
      placeholder="Opções separadas por vírgula"
      className="sm:col-span-3 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
    />
  );
};

export const DemandRoom: React.FC<{ demandId: string }> = ({ demandId }) => {
  const {
    state,
    openDemandRoom,
    claimStage,
    toggleStageChecklistItem,
    updateUiArtifact,
    updateLogicArtifact,
    updateAiArtifact,
    updateQaArtifact,
    raiseHand,
    submitStageForReview,
    pushToast,
  } = useOrbit();

  const demand = state.demands.find((d) => d.id === demandId);
  const isStudent = state.session?.role === 'ALUNO';
  const currentStudent = isStudent
    ? state.students.find((s) => s.id === state.session?.studentId)
    : undefined;

  const defaultStage: StageKey =
    currentStudent?.location === demandId && currentStudent.activeStage
      ? currentStudent.activeStage
      : 'UI_UX';

  const [activeStage, setActiveStage] = useState<StageKey>(defaultStage);
  const [showUnifiedModal, setShowUnifiedModal] = useState(false);
  const [tutorOpen, setTutorOpen] = useState(false);

  // Local editable drafts synced with demand artifacts
  const [uiDraft, setUiDraft] = useState<UiArtifact>(() => demand?.artifacts.ui ?? {
    appTitle: '',
    appSubtitle: '',
    primaryColor: '#0284C7',
    accentColor: '#10B981',
    fields: [],
    infoCards: [],
    ctaLabel: 'Enviar',
  });
  const [logicDraft, setLogicDraft] = useState<LogicArtifact>(
    () => demand?.artifacts.logic ?? { rules: [], defaultMessage: '' }
  );
  const [aiDraft, setAiDraft] = useState<AiArtifact>(
    () =>
      demand?.artifacts.ai ?? {
        assistantName: '',
        persona: '',
        systemInstructions: '',
        greeting: '',
        faqs: [],
      }
  );
  const [qaDraft, setQaDraft] = useState<QaArtifact>(
    () => demand?.artifacts.qa ?? { checklist: [], notes: '' }
  );

  // Help modal input
  const [helpNote, setHelpNote] = useState('');
  const [showHelpBox, setShowHelpBox] = useState(false);

  useEffect(() => {
    if (demand?.artifacts.ui) setUiDraft(demand.artifacts.ui);
  }, [demand?.artifacts.ui]);

  useEffect(() => {
    if (demand?.artifacts.logic) setLogicDraft(demand.artifacts.logic);
  }, [demand?.artifacts.logic]);

  useEffect(() => {
    if (demand?.artifacts.ai) setAiDraft(demand.artifacts.ai);
  }, [demand?.artifacts.ai]);

  useEffect(() => {
    if (demand?.artifacts.qa) setQaDraft(demand.artifacts.qa);
  }, [demand?.artifacts.qa]);

  if (!demand) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
        <p className="text-sm text-slate-600">Demanda não encontrada.</p>
        <button
          onClick={() => openDemandRoom(null)}
          className="mt-4 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
        >
          Voltar ao Mapa
        </button>
      </div>
    );
  }

  const stageObj = demand.stages[activeStage];
  const stageAssignee = state.students.find((s) => s.id === stageObj.assigneeId);
  const roomStudents = state.students.filter((s) => s.location === demand.id);

  const saveAllWorkbenches = () => {
    updateUiArtifact(demand.id, uiDraft);
    updateLogicArtifact(demand.id, logicDraft);
    updateAiArtifact(demand.id, aiDraft);
    updateQaArtifact(demand.id, qaDraft);
  };

  const handleSaveCurrentWorkbench = () => {
    saveAllWorkbenches();
    pushToast('Progresso salvo!', 'Todas as bancadas da sala foram atualizadas.', 'success');
  };

  const handleSubmitForEvaluation = () => {
    if (!currentStudent) return;
    saveAllWorkbenches();
    submitStageForReview(demand.id, activeStage, currentStudent.id);
  };

  // UI Workbench helpers
  const addUiField = () => {
    const newField: UiField = {
      id: `campo_${Date.now().toString(36)}`,
      label: 'Novo Campo',
      type: 'text',
      placeholder: 'Digite aqui...',
    };
    setUiDraft((prev) => ({ ...prev, fields: [...prev.fields, newField] }));
  };

  // Logic Workbench helpers
  const addLogicRule = () => {
    const firstFieldId = uiDraft.fields[0]?.id ?? 'campo';
    const newRule: LogicRule = {
      id: `rule_${Date.now().toString(36)}`,
      fieldId: firstFieldId,
      operator: 'contem',
      value: 'urgente',
      resultTitle: 'Nova Regra Ativada',
      resultMessage: 'Ação orientada automaticamente pelo sistema.',
      severity: 'info',
    };
    setLogicDraft((prev) => ({ ...prev, rules: [...prev.rules, newRule] }));
  };

  // AI Workbench helpers
  const addFaq = () => {
    setAiDraft((prev) => ({
      ...prev,
      faqs: [
        ...prev.faqs,
        {
          id: `faq_${Date.now().toString(36)}`,
          question: 'Qual o horário de atendimento?',
          answer: 'De segunda a sexta, das 08h00 às 17h00.',
        },
      ],
    }));
  };

  const previewDemandSnapshot = {
    ...demand,
    artifacts: {
      ui: uiDraft,
      logic: logicDraft,
      ai: aiDraft,
      qa: qaDraft,
    },
  };

  return (
    <div className="space-y-4">
      {/* Top Room Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => openDemandRoom(null)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
            title="Voltar ao Mapa 2.5D"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                {demand.secretaria}
              </span>
              {demand.status === 'MODO_TESTE' && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold flex items-center gap-1">
                  <Presentation className="w-3 h-3" />
                  Modo Teste Ativo
                </span>
              )}
            </div>
            <h2 className="font-display font-bold text-lg text-slate-900">{demand.title}</h2>
          </div>
        </div>

        {/* Team Avatars in Room + Unified Preview + Socratic Drawer */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 mr-2 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200">
            {roomStudents.map((stu) => (
              <PixelAvatar
                key={stu.id}
                name={stu.name}
                config={stu.avatar}
                size={28}
                handRaised={stu.handRaised}
                showBadgeTag={false}
              />
            ))}
            <span className="text-[11px] text-slate-600 font-medium">
              {roomStudents.length} na sala
            </span>
          </div>

          <button
            onClick={() => setShowUnifiedModal((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Eye className="w-4 h-4" />
            <span>{showUnifiedModal ? 'Ocultar Preview Unificado' : 'Preview Unificado'}</span>
          </button>

          <button
            onClick={() => setTutorOpen((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            <span>Tutores Socráticos IA</span>
          </button>
        </div>
      </div>

      {/* Collective Test Mode Banner */}
      {demand.status === 'MODO_TESTE' && (
        <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Presentation className="w-6 h-6 text-amber-600 shrink-0" />
            <div>
              <div className="font-display font-bold text-sm text-amber-950">
                Modo Teste Coletivo Ativado pelo Professor Mentor!
              </div>
              <p className="text-xs text-amber-800">
                Toda a equipe pode testar o aplicativo compilado no Preview Unificado antes da Entrega Oficial.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowUnifiedModal(true)}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Abrir Simulador Completo
          </button>
        </div>
      )}

      {/* Optional Full Unified Preview Panel */}
      {showUnifiedModal && (
        <div className="space-y-2">
          <UnifiedPreview demand={previewDemandSnapshot} />
        </div>
      )}

      {/* 4 Workbench Tabs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        {STAGE_ORDER.map((key) => {
          const meta = STAGE_META[key];
          const st = demand.stages[key];
          const isCurrent = activeStage === key;
          return (
            <button
              key={key}
              onClick={() => setActiveStage(key)}
              className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
                isCurrent
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold">
                  {meta.bubble} {meta.shortLabel}
                </span>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    st.status === 'APROVADA'
                      ? 'bg-emerald-500 text-white'
                      : st.status === 'EM_REVISAO'
                      ? 'bg-amber-400 text-slate-950'
                      : st.status === 'EM_DESENVOLVIMENTO'
                      ? 'bg-sky-500 text-white'
                      : isCurrent
                      ? 'bg-slate-700 text-slate-200'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {st.status === 'APROVADA'
                    ? 'Aprovada'
                    : st.status === 'EM_REVISAO'
                    ? 'Em Revisão'
                    : st.status === 'EM_DESENVOLVIMENTO'
                    ? 'Em Obra'
                    : 'Disponível'}
                </span>
              </div>
              <div
                className={`text-[11px] mt-1 truncate ${
                  isCurrent ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {meta.workbenchName}
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Workbench Area + Right Checklist/Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Workbench Editor */}
        <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>{STAGE_META[activeStage].workbenchName}</span>
              </h3>
              <p className="text-xs text-slate-600">{stageObj.description}</p>
            </div>

            {stageObj.status === 'DISPONIVEL' && state.session?.role === 'ALUNO' && (
              <button
                onClick={() => claimStage(demand.id, activeStage)}
                className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Assumir Esta Bancada</span>
              </button>
            )}
          </div>

          {stageObj.feedback && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950">
              <strong>Feedback do Professor Mentor:</strong> {stageObj.feedback}
            </div>
          )}

          {/* BANCADA 1: UI_UX */}
          {activeStage === 'UI_UX' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título do Aplicativo
                  </label>
                  <input
                    value={uiDraft.appTitle}
                    onChange={(e) => setUiDraft({ ...uiDraft, appTitle: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Texto do Botão Principal (CTA)
                  </label>
                  <input
                    value={uiDraft.ctaLabel}
                    onChange={(e) => setUiDraft({ ...uiDraft, ctaLabel: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subtítulo explicativo para o cidadão
                </label>
                <input
                  value={uiDraft.appSubtitle}
                  onChange={(e) => setUiDraft({ ...uiDraft, appSubtitle: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cor Primária (Cabeçalho)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={uiDraft.primaryColor}
                      onChange={(e) => setUiDraft({ ...uiDraft, primaryColor: e.target.value })}
                      className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600">{uiDraft.primaryColor}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Cor de Destaque (Botão)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={uiDraft.accentColor}
                      onChange={(e) => setUiDraft({ ...uiDraft, accentColor: e.target.value })}
                      className="w-10 h-9 rounded-lg border border-slate-300 cursor-pointer"
                    />
                    <span className="text-xs font-mono text-slate-600">{uiDraft.accentColor}</span>
                  </div>
                </div>
              </div>

              {/* Fields Builder */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Campos do Formulário</span>
                  <button
                    type="button"
                    onClick={addUiField}
                    className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar Campo</span>
                  </button>
                </div>

                {uiDraft.fields.map((field, idx) => (
                  <div
                    key={field.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                  >
                    <input
                      value={field.label}
                      onChange={(e) => {
                        const next = [...uiDraft.fields];
                        next[idx] = { ...field, label: e.target.value };
                        setUiDraft({ ...uiDraft, fields: next });
                      }}
                      placeholder="Rótulo do campo"
                      className="sm:col-span-5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => {
                        const next = [...uiDraft.fields];
                        next[idx] = {
                          ...field,
                          type: e.target.value as UiField['type'],
                          options: e.target.value === 'select' ? field.options ?? ['Opção A', 'Opção B'] : undefined,
                        };
                        setUiDraft({ ...uiDraft, fields: next });
                      }}
                      className="sm:col-span-3 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs"
                    >
                      <option value="text">Texto</option>
                      <option value="number">Número</option>
                      <option value="select">Lista (Select)</option>
                    </select>
                    {field.type === 'select' ? (
                      <SelectOptionsInput
                        options={field.options ?? []}
                        onChange={(nextOptions) => {
                          const next = [...uiDraft.fields];
                          next[idx] = { ...field, options: nextOptions };
                          setUiDraft({ ...uiDraft, fields: next });
                        }}
                      />
                    ) : (
                      <input
                        value={field.placeholder ?? ''}
                        onChange={(e) => {
                          const next = [...uiDraft.fields];
                          next[idx] = { ...field, placeholder: e.target.value };
                          setUiDraft({ ...uiDraft, fields: next });
                        }}
                        placeholder="Exemplo / dica"
                        className="sm:col-span-3 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        setUiDraft({
                          ...uiDraft,
                          fields: uiDraft.fields.filter((f) => f.id !== field.id),
                        })
                      }
                      className="sm:col-span-1 p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 flex justify-center cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BANCADA 2: LOGICA_REGRAS */}
          {activeStage === 'LOGICA_REGRAS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Regras Condicionais (Se [Entrada] → Então [Resultado])
                </span>
                <button
                  type="button"
                  onClick={addLogicRule}
                  className="px-2.5 py-1 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nova Regra Se/Então</span>
                </button>
              </div>

              {logicDraft.rules.map((rule, idx) => (
                <div
                  key={rule.id}
                  className="p-3.5 rounded-2xl bg-violet-50/40 border border-violet-200 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-bold text-violet-800">SE</span>
                    <select
                      value={rule.fieldId}
                      onChange={(e) => {
                        const next = [...logicDraft.rules];
                        next[idx] = { ...rule, fieldId: e.target.value };
                        setLogicDraft({ ...logicDraft, rules: next });
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                    >
                      {uiDraft.fields.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={rule.operator}
                      onChange={(e) => {
                        const next = [...logicDraft.rules];
                        next[idx] = { ...rule, operator: e.target.value as LogicRule['operator'] };
                        setLogicDraft({ ...logicDraft, rules: next });
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                    >
                      <option value="contem">contém</option>
                      <option value="igual">é igual a</option>
                      <option value="maior_que">é maior que</option>
                      <option value="menor_que">é menor que</option>
                      <option value="nao_vazio">não está vazio</option>
                    </select>

                    {rule.operator !== 'nao_vazio' && (
                      <input
                        value={rule.value}
                        onChange={(e) => {
                          const next = [...logicDraft.rules];
                          next[idx] = { ...rule, value: e.target.value };
                          setLogicDraft({ ...logicDraft, rules: next });
                        }}
                        placeholder="Valor..."
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs w-36"
                      />
                    )}

                    <select
                      value={rule.severity}
                      onChange={(e) => {
                        const next = [...logicDraft.rules];
                        next[idx] = { ...rule, severity: e.target.value as LogicRule['severity'] };
                        setLogicDraft({ ...logicDraft, rules: next });
                      }}
                      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs ml-auto"
                    >
                      <option value="info">Info (Azul)</option>
                      <option value="success">Sucesso (Verde)</option>
                      <option value="warning">Atenção (Amarelo)</option>
                      <option value="urgent">Urgente (Vermelho)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() =>
                        setLogicDraft({
                          ...logicDraft,
                          rules: logicDraft.rules.filter((r) => r.id !== rule.id),
                        })
                      }
                      className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      value={rule.resultTitle}
                      onChange={(e) => {
                        const next = [...logicDraft.rules];
                        next[idx] = { ...rule, resultTitle: e.target.value };
                        setLogicDraft({ ...logicDraft, rules: next });
                      }}
                      placeholder="Título do resultado"
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
                    />
                    <input
                      value={rule.resultMessage}
                      onChange={(e) => {
                        const next = [...logicDraft.rules];
                        next[idx] = { ...rule, resultMessage: e.target.value };
                        setLogicDraft({ ...logicDraft, rules: next });
                      }}
                      placeholder="Mensagem exibida ao cidadão"
                      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                </div>
              ))}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mensagem Padrão (quando nenhuma regra especial for ativada)
                </label>
                <input
                  value={logicDraft.defaultMessage}
                  onChange={(e) => setLogicDraft({ ...logicDraft, defaultMessage: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>
            </div>
          )}

          {/* BANCADA 3: IA_DADOS */}
          {activeStage === 'IA_DADOS' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome do Assistente Municipal
                  </label>
                  <input
                    value={aiDraft.assistantName}
                    onChange={(e) => setAiDraft({ ...aiDraft, assistantName: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Persona / Papel
                  </label>
                  <input
                    value={aiDraft.persona}
                    onChange={(e) => setAiDraft({ ...aiDraft, persona: e.target.value })}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Instruções de Comportamento e Segurança (System Prompt do Projeto)
                </label>
                <textarea
                  rows={3}
                  value={aiDraft.systemInstructions}
                  onChange={(e) => setAiDraft({ ...aiDraft, systemInstructions: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Saudação Inicial
                </label>
                <input
                  value={aiDraft.greeting}
                  onChange={(e) => setAiDraft({ ...aiDraft, greeting: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Base de Perguntas Frequentes (FAQs)
                  </span>
                  <button
                    type="button"
                    onClick={addFaq}
                    className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Adicionar FAQ</span>
                  </button>
                </div>

                {aiDraft.faqs.map((faq, idx) => (
                  <div
                    key={faq.id}
                    className="p-3 rounded-xl bg-emerald-50/40 border border-emerald-200 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={faq.question}
                        onChange={(e) => {
                          const next = [...aiDraft.faqs];
                          next[idx] = { ...faq, question: e.target.value };
                          setAiDraft({ ...aiDraft, faqs: next });
                        }}
                        placeholder="Pergunta do cidadão"
                        className="flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setAiDraft({
                            ...aiDraft,
                            faqs: aiDraft.faqs.filter((f) => f.id !== faq.id),
                          })
                        }
                        className="p-1 text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      value={faq.answer}
                      onChange={(e) => {
                        const next = [...aiDraft.faqs];
                        next[idx] = { ...faq, answer: e.target.value };
                        setAiDraft({ ...aiDraft, faqs: next });
                      }}
                      placeholder="Resposta oficial"
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* BANCADA 4: QA_TESTES */}
          {activeStage === 'QA_TESTES' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-800">
                  Roteiro de Validação do Simulador
                </span>
                {qaDraft.checklist.map((item, idx) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2.5 p-2.5 rounded-xl bg-amber-50/50 border border-amber-200 text-xs cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => {
                        const next = [...qaDraft.checklist];
                        next[idx] = { ...item, checked: !item.checked };
                        setQaDraft({ ...qaDraft, checklist: next });
                      }}
                      className="rounded text-amber-600"
                    />
                    <span className={item.checked ? 'line-through text-slate-500' : 'text-slate-800'}>
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relatório de Testes & Observações
                </label>
                <textarea
                  rows={2}
                  value={qaDraft.notes}
                  onChange={(e) => setQaDraft({ ...qaDraft, notes: e.target.value })}
                  placeholder="Registre quais cenários você testou no simulador abaixo..."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
                />
              </div>

              <UnifiedPreview demand={previewDemandSnapshot} compact />
            </div>
          )}
        </div>

        {/* Right Controls: Checklist + Save + Raise Hand + Submit */}
        <div className="xl:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-display font-bold text-sm text-slate-900">
                Checklist da Etapa
              </span>
              {stageAssignee && (
                <span className="text-[11px] font-semibold text-sky-700">
                  Responsável: {stageAssignee.name.split(' ')[0]}
                </span>
              )}
            </div>

            <div className="space-y-2">
              {stageObj.checklist.map((item) => (
                <label
                  key={item.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={item.done}
                    onChange={() => toggleStageChecklistItem(demand.id, activeStage, item.id)}
                    className="mt-0.5 rounded text-sky-600"
                  />
                  <span className={item.done ? 'line-through text-slate-400' : 'text-slate-700'}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleSaveCurrentWorkbench}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Progresso</span>
              </button>

              {isStudent && currentStudent ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShowHelpBox((v) => !v)}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Hand className="w-4 h-4" />
                    <span>✋ Pedir Ajuda ao Professor</span>
                  </button>

                  {showHelpBox && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <input
                        value={helpNote}
                        onChange={(e) => setHelpNote(e.target.value)}
                        placeholder="Qual é sua dúvida rápida?"
                        className="w-full rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          raiseHand(
                            currentStudent.id,
                            'AJUDA',
                            helpNote || `Dúvida na bancada ${STAGE_META[activeStage].shortLabel}`
                          );
                          setShowHelpBox(false);
                          setHelpNote('');
                        }}
                        className="w-full py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
                      >
                        Levantar Mão na Mesa Central
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSubmitForEvaluation}
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✅ Concluir Etapa e Enviar para Avaliação</span>
                  </button>
                </>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
                  Você está no modo{' '}
                  <strong>{state.session?.role === 'PROFESSOR' ? 'Professor Mentor' : 'Coordenação SMED'}</strong>.
                  Para pedir ajuda ou enviar etapa como estudante, alterne para o perfil{' '}
                  <strong>Aluno</strong> no cabeçalho.
                </div>
              )}
            </div>
          </div>

          {/* Live Mini Preview */}
          {activeStage !== 'QA_TESTES' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                <span>Preview ao Vivo</span>
                <button
                  onClick={() => setShowUnifiedModal(true)}
                  className="text-[11px] text-sky-600 hover:underline cursor-pointer"
                >
                  Expandir
                </button>
              </div>
              <UnifiedPreview demand={previewDemandSnapshot} compact />
            </div>
          )}
        </div>
      </div>

      {/* Socratic AI Tutor Side Drawer */}
      <SocraticTutorDrawer
        isOpen={tutorOpen}
        onClose={() => setTutorOpen(false)}
        demand={demand}
        activeStage={activeStage}
      />
    </div>
  );
};
