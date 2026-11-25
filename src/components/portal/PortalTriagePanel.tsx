import React, { useState } from 'react';
import {
  AlertTriangle,
  Archive,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  FileJson,
  Loader2,
  MessageSquarePlus,
  Plus,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
  Trash2,
  Wand2,
  X,
} from 'lucide-react';
import { useOrbit } from '../../context/OrbitContext';
import { STATION_THEME } from '../../data/portalSeedData';
import {
  analyzePortalDemand,
  applyDigitalAdaptation,
  buildClarificationTemplate,
} from '../../services/demandTriageService';
import {
  Demand,
  PortalSubmission,
  PortalSubmissionStatus,
  StageKey,
  ViabilityStatus,
} from '../../types';

interface PortalTriagePanelProps {
  isPublicDemoMode?: boolean;
  onJumpToOrbitRoom?: (demandId: string) => void;
}

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

type FilterKey = 'TODAS' | 'NOVAS' | 'REVISAO' | 'AJUSTE' | 'PRONTAS' | 'ARQUIVADAS';

function matchesFilter(status: PortalSubmissionStatus, filter: FilterKey): boolean {
  if (filter === 'TODAS') return true;
  if (filter === 'NOVAS') return status === 'PENDENTE_TRIAGEM';
  if (filter === 'REVISAO') return status === 'EM_REVISAO';
  if (filter === 'AJUSTE') return status === 'AJUSTE_SOLICITADO';
  if (filter === 'PRONTAS') return status === 'APROVADA_ORBIT';
  return status === 'ARQUIVADA';
}

function viabilityBadge(status: ViabilityStatus): { label: string; cls: string } {
  if (status === 'ALTAMENTE_VIAVEL') {
    return {
      label: 'Altamente Viável (100% Digital)',
      cls: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    };
  }
  if (status === 'VIAVEL_COM_ADAPTACAO') {
    return {
      label: 'Viável com Adaptação',
      cls: 'bg-sky-100 text-sky-900 border-sky-300',
    };
  }
  return {
    label: 'Fora de Escopo (Exige Hardware Físico)',
    cls: 'bg-rose-100 text-rose-900 border-rose-300',
  };
}

export const PortalTriagePanel: React.FC<PortalTriagePanelProps> = ({
  isPublicDemoMode = false,
  onJumpToOrbitRoom,
}) => {
  const {
    state,
    updatePortalSubmissionAnalysis,
    updatePortalSubmissionStatus,
    requestSubmissionClarification,
    approveAndPublishSubmission,
    openDemandRoom,
    pushToast,
  } = useOrbit();

  const [statusFilter, setStatusFilter] = useState<FilterKey>('TODAS');
  const [orgFilter, setOrgFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string>(
    state.portalSubmissions[0]?.id ?? ''
  );

  const [editingStage, setEditingStage] = useState<StageKey | null>(null);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [reanalyzing, setReanalyzing] = useState(false);

  const [clarifyOpen, setClarifyOpen] = useState(false);
  const [clarifyMessage, setClarifyMessage] = useState('');

  const [publishedPackage, setPublishedPackage] = useState<Demand | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);

  const filteredSubmissions = state.portalSubmissions.filter((sub) => {
    if (!matchesFilter(sub.status, statusFilter)) return false;
    const q = orgFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      sub.organization.toLowerCase().includes(q) ||
      sub.title.toLowerCase().includes(q) ||
      sub.protocol.toLowerCase().includes(q)
    );
  });

  const activeSub: PortalSubmission | undefined =
    filteredSubmissions.find((s) => s.id === selectedId) ?? filteredSubmissions[0];

  const handleReanalyze = async () => {
    if (!activeSub || reanalyzing) return;
    setReanalyzing(true);
    const fresh = await analyzePortalDemand({
      apiKey: state.geminiApiKey,
      input: {
        requesterName: activeSub.requesterName,
        requesterRole: activeSub.requesterRole,
        organization: activeSub.organization,
        organizationType: activeSub.organizationType,
        title: activeSub.title,
        problemDescription: activeSub.problemDescription,
        targetAudienceAndImpact: activeSub.targetAudienceAndImpact,
        urgency: activeSub.urgency,
      },
    });
    updatePortalSubmissionAnalysis(activeSub.id, fresh);
    setReanalyzing(false);
  };

  const handleAcceptHardwareAdaptation = () => {
    if (!activeSub) return;
    const adapted = applyDigitalAdaptation(activeSub);
    updatePortalSubmissionAnalysis(activeSub.id, adapted);
  };

  const handleStationFieldEdit = (
    stageKey: StageKey,
    patch: Partial<PortalSubmission['analysis']['stations'][StageKey]>
  ) => {
    if (!activeSub) return;
    updatePortalSubmissionAnalysis(activeSub.id, {
      ...activeSub.analysis,
      stations: {
        ...activeSub.analysis.stations,
        [stageKey]: {
          ...activeSub.analysis.stations[stageKey],
          ...patch,
        },
      },
    });
  };

  const handlePublish = () => {
    if (!activeSub) return;
    const published = approveAndPublishSubmission(activeSub.id);
    if (published) {
      setPublishedPackage(published);
      setCopiedJson(false);
    }
  };

  const handleCopyJson = async () => {
    if (!publishedPackage) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(publishedPackage, null, 2));
      setCopiedJson(true);
      pushToast('JSON copiado!', 'Compatível com o schema Demand do Orbit Conecta.', 'success');
    } catch {
      pushToast('Não foi possível copiar automaticamente', 'Use o botão de download .json.', 'warning');
    }
  };

  const handleDownloadJson = () => {
    if (!publishedPackage) return;
    const blob = new Blob([JSON.stringify(publishedPackage, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${publishedPackage.id}-orbit-conecta.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filterTabs: { key: FilterKey; label: string }[] = [
    { key: 'TODAS', label: `Todas (${state.portalSubmissions.length})` },
    {
      key: 'NOVAS',
      label: `Novas (${state.portalSubmissions.filter((s) => s.status === 'PENDENTE_TRIAGEM').length})`,
    },
    {
      key: 'REVISAO',
      label: `Em Revisão (${state.portalSubmissions.filter((s) => s.status === 'EM_REVISAO').length})`,
    },
    {
      key: 'AJUSTE',
      label: `Ajustes (${state.portalSubmissions.filter((s) => s.status === 'AJUSTE_SOLICITADO').length})`,
    },
    {
      key: 'PRONTAS',
      label: `No Orbit (${state.portalSubmissions.filter((s) => s.status === 'APROVADA_ORBIT').length})`,
    },
    {
      key: 'ARQUIVADAS',
      label: `Arquivadas (${state.portalSubmissions.filter((s) => s.status === 'ARQUIVADA').length})`,
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <input
          value={orgFilter}
          onChange={(e) => setOrgFilter(e.target.value)}
          placeholder="Filtrar por escola, secretaria ou título..."
          className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs w-full sm:w-64"
        />
      </div>

      {/* Main Split: Queue vs Smart Triage Card */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Queue */}
        <div className="xl:col-span-4 space-y-2.5 max-h-[760px] overflow-y-auto pr-1">
          {filteredSubmissions.map((sub) => {
            const vb = viabilityBadge(sub.analysis.viabilityStatus);
            const isSelected = activeSub?.id === sub.id;
            return (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedId(sub.id);
                  setEditingStage(null);
                  setClarifyOpen(false);
                }}
                className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-sky-50/80 border-sky-500 ring-2 ring-sky-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[11px] text-slate-700">
                    {sub.protocol}
                  </span>
                  <span className="text-[11px] font-bold text-slate-700">
                    Score {sub.analysis.viabilityScore}/100
                  </span>
                </div>

                <div className="font-display font-bold text-sm text-slate-900 leading-snug">
                  {sub.title}
                </div>
                <div className="text-[11px] text-slate-600 truncate">{sub.organization}</div>

                <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${vb.cls}`}>
                    {sub.analysis.viabilityStatus === 'FORA_DE_ESCOPO_HARDWARE'
                      ? 'Hardware (Adaptar)'
                      : sub.analysis.viabilityStatus === 'VIAVEL_COM_ADAPTACAO'
                      ? 'Viável c/ Adaptação'
                      : 'Altamente Viável'}
                  </span>

                  <span className="text-[10px] font-semibold text-slate-500">
                    {sub.status === 'APROVADA_ORBIT'
                      ? '✅ No Orbit'
                      : sub.status === 'AJUSTE_SOLICITADO'
                      ? '💬 Ajuste'
                      : sub.status === 'EM_REVISAO'
                      ? '🔎 Revisão'
                      : sub.status === 'ARQUIVADA'
                      ? '📦 Arquivada'
                      : '🆕 Nova'}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredSubmissions.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              Nenhuma demanda encontrada neste filtro.
            </div>
          )}
        </div>

        {/* Detail & AI Triage Panel */}
        <div className="xl:col-span-8">
          {!activeSub ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500">
              Selecione uma demanda na fila à esquerda para revisar a análise da IA.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-5">
              {/* Demand Header */}
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                      {activeSub.protocol}
                    </span>
                    <span className="text-xs font-bold text-sky-700">{activeSub.organization}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                      Urgência: {activeSub.urgency}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-slate-900 mt-2">
                    {activeSub.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Solicitante: <strong>{activeSub.requesterName}</strong> ({activeSub.requesterRole})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleReanalyze}
                  disabled={reanalyzing}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  {reanalyzing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>Reanalisar com Gemini</span>
                </button>
              </div>

              {/* Original Problem + Impact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">Problema Relatado</div>
                  <p className="text-slate-600 leading-relaxed">{activeSub.problemDescription}</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="font-bold text-slate-800 mb-1">Público & Impacto Esperado</div>
                  <p className="text-slate-600 leading-relaxed">
                    {activeSub.targetAudienceAndImpact}
                  </p>
                </div>
              </div>

              {/* AI Feasibility Score Card */}
              <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/60 via-white to-sky-50/60 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display font-bold text-sm text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Parecer de Viabilidade Digital</span>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                        viabilityBadge(activeSub.analysis.viabilityStatus).cls
                      }`}
                    >
                      {viabilityBadge(activeSub.analysis.viabilityStatus).label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-white font-semibold">
                      {activeSub.analysis.mode === 'GEMINI_LIVE' ? 'Gemini 2.5' : 'Simulado'}
                    </span>
                    <span className="px-3 py-1 rounded-xl bg-white border border-indigo-200 font-display font-extrabold text-sm text-indigo-700">
                      {activeSub.analysis.viabilityScore}/100
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeSub.analysis.viabilityRationale}
                </p>
              </div>

              {/* Hardware Out-of-Scope Banner + 1-Click Digital Adaptation */}
              {activeSub.analysis.viabilityStatus === 'FORA_DE_ESCOPO_HARDWARE' && (
                <div className="rounded-2xl border-2 border-rose-300 bg-rose-50 p-4 space-y-3">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-display font-bold text-sm text-rose-950">
                        Publicação Direta Bloqueada — Pedido Exige Hardware Físico
                      </div>
                      <p className="text-xs text-rose-900 mt-0.5">
                        O CEMI 2 trabalha exclusivamente com software web e IA. Aceite a conversão
                        digital sugerida pela IA abaixo ou solicite esclarecimento ao órgão.
                      </p>
                    </div>
                  </div>

                  {activeSub.analysis.hardwareAdaptation && (
                    <div className="bg-white rounded-xl border border-rose-200 p-3.5 space-y-2">
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Wand2 className="w-4 h-4 text-sky-600" />
                        <span>
                          Proposta 100% Digital:{' '}
                          {activeSub.analysis.hardwareAdaptation.suggestedTitle}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700">
                        {activeSub.analysis.hardwareAdaptation.suggestedDescription}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        <strong>Adaptação:</strong>{' '}
                        {activeSub.analysis.hardwareAdaptation.adaptationNotes}
                      </p>
                      <button
                        type="button"
                        onClick={handleAcceptHardwareAdaptation}
                        className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>Aceitar Adaptação 100% Digital (1 Clique)</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 4 Modular Orbit Conecta Stations with Quick Mentor Edit */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-display font-bold text-sm text-slate-900">
                    Fatiamento Automático — 4 Estações do Orbit Conecta
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Clique em "Editar" em qualquer estação para ajustar antes de publicar
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {STAGE_ORDER.map((stageKey) => {
                    const theme = STATION_THEME[stageKey];
                    const plan = activeSub.analysis.stations[stageKey];
                    const isEditing = editingStage === stageKey;

                    return (
                      <div
                        key={stageKey}
                        className={`rounded-2xl border border-l-4 p-4 space-y-2.5 ${theme.cardCls} ${theme.accentBorder}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${theme.badgeCls}`}
                          >
                            {theme.shortLabel} · {theme.label}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setEditingStage(isEditing ? null : stageKey)
                            }
                            className="text-[11px] font-bold text-slate-700 hover:text-slate-950 flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{isEditing ? 'Concluir' : 'Editar'}</span>
                          </button>
                        </div>

                        {isEditing ? (
                          <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-200">
                            <input
                              value={plan.taskTitle}
                              onChange={(e) =>
                                handleStationFieldEdit(stageKey, { taskTitle: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-bold"
                            />
                            <textarea
                              rows={2}
                              value={plan.objective}
                              onChange={(e) =>
                                handleStationFieldEdit(stageKey, { objective: e.target.value })
                              }
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs"
                            />
                            <textarea
                              rows={2}
                              value={plan.technicalDetails}
                              onChange={(e) =>
                                handleStationFieldEdit(stageKey, {
                                  technicalDetails: e.target.value,
                                })
                              }
                              className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px]"
                            />
                            <div className="space-y-1">
                              {plan.checklist.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-1">
                                  <input
                                    value={item}
                                    onChange={(e) => {
                                      const next = [...plan.checklist];
                                      next[idx] = e.target.value;
                                      handleStationFieldEdit(stageKey, { checklist: next });
                                    }}
                                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStationFieldEdit(stageKey, {
                                        checklist: plan.checklist.filter((_, i) => i !== idx),
                                      })
                                    }
                                    className="p-1 text-rose-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <div className="flex items-center gap-1 pt-1">
                                <input
                                  value={newChecklistItem}
                                  onChange={(e) => setNewChecklistItem(e.target.value)}
                                  placeholder="Novo item do checklist..."
                                  className="flex-1 rounded border border-slate-300 px-2 py-1 text-[11px]"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newChecklistItem.trim()) return;
                                    handleStationFieldEdit(stageKey, {
                                      checklist: [...plan.checklist, newChecklistItem.trim()],
                                    });
                                    setNewChecklistItem('');
                                  }}
                                  className="px-2 py-1 rounded bg-slate-900 text-white text-[11px] font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="font-display font-bold text-xs text-slate-900">
                              {plan.taskTitle}
                            </div>
                            <p className="text-[11px] text-slate-700 leading-relaxed">
                              {plan.objective}
                            </p>
                            <p className="text-[11px] text-slate-500">{plan.technicalDetails}</p>
                            <ul className="space-y-1 pt-1">
                              {plan.checklist.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="text-[11px] text-slate-700 flex items-start gap-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Clarification Composer */}
              {clarifyOpen && (
                <div className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-950">
                      Mensagem Cordial para o Solicitante ({activeSub.requesterName})
                    </span>
                    <button
                      type="button"
                      onClick={() => setClarifyOpen(false)}
                      className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    value={clarifyMessage}
                    onChange={(e) => setClarifyMessage(e.target.value)}
                    className="w-full rounded-xl border border-amber-300 bg-white p-3 text-xs"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        requestSubmissionClarification(activeSub.id, clarifyMessage);
                        setClarifyOpen(false);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Enviar ao Protocolo do Solicitante
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await navigator.clipboard.writeText(clarifyMessage);
                        pushToast('Mensagem copiada!', 'Pronta para colar no WhatsApp ou e-mail.', 'info');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-950 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar para WhatsApp</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Mentor Actions Footer */}
              <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setClarifyMessage(buildClarificationTemplate(activeSub));
                      setClarifyOpen((v) => !v);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquarePlus className="w-4 h-4" />
                    <span>Solicitar Esclarecimento</span>
                  </button>

                  {activeSub.status !== 'ARQUIVADA' && (
                    <button
                      type="button"
                      onClick={() => updatePortalSubmissionStatus(activeSub.id, 'ARQUIVADA')}
                      className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      <span>Arquivar</span>
                    </button>
                  )}
                </div>

                {activeSub.linkedDemandId ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const dem = state.demands.find((d) => d.id === activeSub.linkedDemandId);
                        if (dem) setPublishedPackage(dem);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <FileJson className="w-4 h-4" />
                      <span>Ver Pacote JSON</span>
                    </button>
                    {!isPublicDemoMode && (
                      <button
                        type="button"
                        onClick={() => {
                          if (onJumpToOrbitRoom && activeSub.linkedDemandId) {
                            onJumpToOrbitRoom(activeSub.linkedDemandId);
                          } else if (activeSub.linkedDemandId) {
                            openDemandRoom(activeSub.linkedDemandId);
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>Abrir Sala no Orbit Conecta</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={activeSub.analysis.viabilityStatus === 'FORA_DE_ESCOPO_HARDWARE'}
                    onClick={handlePublish}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Rocket className="w-4 h-4" />
                    <span>Aprovar & Gerar Pacote Orbit Conecta</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Published Orbit Conecta JSON Package Modal */}
      {publishedPackage && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B132B] text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileJson className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-display font-bold text-base">
                    Pacote Orbit Conecta Gerado & Publicado!
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Sala "{publishedPackage.shortName}" sincronizada com a Sala de Demandas e Mapa 2.5D
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPublishedPackage(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'JSON Copiado!' : 'Copiar JSON'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="px-3.5 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar .json</span>
                  </button>
                </div>

                {!isPublicDemoMode && (
                  <button
                    type="button"
                    onClick={() => {
                      const targetId = publishedPackage.id;
                      setPublishedPackage(null);
                      openDemandRoom(targetId);
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Entrar na Sala do Orbit Conecta</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              <pre className="rounded-2xl bg-slate-950 text-emerald-200 p-4 text-[11px] font-mono overflow-x-auto max-h-[380px]">
                {JSON.stringify(publishedPackage, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}

      {isPublicDemoMode && (
        <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Modo Demonstração do Mentor ativo:</strong> ao aprovar uma demanda aqui, ela já
            entra automaticamente na Sala de Demandas e no Mapa 2.5D ao fazer login como Aluno ou Professor.
          </span>
        </div>
      )}
    </div>
  );
};
