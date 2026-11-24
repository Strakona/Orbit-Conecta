import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Eye,
  Flower2,
  GraduationCap,
  Hand,
  MessageSquareWarning,
  Presentation,
  RotateCcw,
  Sparkles,
  X,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { STAGE_META } from '../data/seedData';
import { Demand, StageKey } from '../types';
import { PixelAvatar } from './PixelAvatar';
import { UnifiedPreview } from './UnifiedPreview';

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

export const ProfessorPanel: React.FC = () => {
  const {
    state,
    clearHand,
    approveStage,
    returnStageWithFeedback,
    activateTestMode,
    deliverDemandOfficially,
    openDemandRoom,
  } = useOrbit();

  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(state.turmas[0]?.id ?? 'turma-1');
  const [inspectTarget, setInspectTarget] = useState<{
    demand: Demand;
    stageKey: StageKey;
  } | null>(null);
  const [feedbackInput, setFeedbackInput] = useState('');
  const [badgeInput, setBadgeInput] = useState('');

  const turmaStudents = useMemo(
    () => state.students.filter((s) => s.turmaId === selectedTurmaId),
    [state.students, selectedTurmaId]
  );

  const helpAlerts = state.students.filter((s) => s.handRaised === 'AJUDA');
  const reviewQueue: { demand: Demand; stageKey: StageKey; studentName: string }[] = [];

  state.demands.forEach((d) => {
    STAGE_ORDER.forEach((k) => {
      if (d.stages[k].status === 'EM_REVISAO') {
        const stu = state.students.find((s) => s.id === d.stages[k].assigneeId);
        reviewQueue.push({
          demand: d,
          stageKey: k,
          studentName: stu?.name ?? 'Estudante',
        });
      }
    });
  });

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">
              Painel do Professor Mentor — CEMI 2
            </h2>
            <p className="text-xs text-slate-600">
              Monitoramento síncrono da turma do dia, fila prioritária de Mão Levantada, Modo Teste e Entrega Oficial.
            </p>
          </div>
        </div>

        <select
          id="professor-turma-select"
          name="turmaId"
          aria-label="Selecionar turma"
          value={selectedTurmaId}
          onChange={(e) => setSelectedTurmaId(e.target.value)}
          className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
        >
          {state.turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} · {t.schedule}
            </option>
          ))}
        </select>
      </div>

      {/* Priority Queue: Help vs Ready for Evaluation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Help Requests */}
        <div className="bg-white rounded-2xl border border-amber-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-amber-950 flex items-center gap-2">
              <Hand className="w-4 h-4 text-amber-600" />
              <span>Dúvidas Urgentes ({helpAlerts.length})</span>
            </h3>
            <span className="text-[11px] text-amber-700 font-medium">Prioridade Alta</span>
          </div>

          {helpAlerts.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">
              Nenhum pedido de ajuda ativo no momento.
            </p>
          ) : (
            <div className="space-y-2.5">
              {helpAlerts.map((stu) => {
                const demand = state.demands.find((d) => d.id === stu.location);
                return (
                  <div
                    key={stu.id}
                    className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5">
                      <PixelAvatar name={stu.name} config={stu.avatar} size={36} showBadgeTag={false} />
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {stu.name}{' '}
                          <span className="font-normal text-slate-600">
                            em {demand?.shortName ?? stu.location}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900">
                          {stu.handNote ?? 'Solicitou apoio na bancada.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {demand && (
                        <button
                          onClick={() => openDemandRoom(demand.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 text-[11px] font-semibold cursor-pointer"
                        >
                          Ir à Sala
                        </button>
                      )}
                      <button
                        onClick={() => clearHand(stu.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-bold cursor-pointer"
                      >
                        Atendido
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stages Ready for Evaluation */}
        <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-sm text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Etapas Prontas para Avaliar ({reviewQueue.length})</span>
            </h3>
            <span className="text-[11px] text-emerald-700 font-medium">Avaliação Pedagógica</span>
          </div>

          {reviewQueue.length === 0 ? (
            <p className="text-xs text-slate-500 py-3">
              Nenhuma etapa aguardando revisão agora.
            </p>
          ) : (
            <div className="space-y-2.5">
              {reviewQueue.map(({ demand, stageKey, studentName }) => (
                <div
                  key={`${demand.id}-${stageKey}`}
                  className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {demand.shortName} · {STAGE_META[stageKey].shortLabel}
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Entregue por <strong>{studentName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setInspectTarget({ demand, stageKey });
                        setBadgeInput(`${STAGE_META[stageKey].shortLabel} · ${demand.shortName}`);
                        setFeedbackInput('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Avaliar Artefato</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Turma do Dia Synchronous Monitor */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h3 className="font-display font-bold text-base text-slate-900">
          Monitoramento Síncrono — {state.turmas.find((t) => t.id === selectedTurmaId)?.name} (
          {turmaStudents.length} {turmaStudents.length === 1 ? 'aluno ativo' : 'alunos ativos'})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {turmaStudents.map((stu) => {
            const dem = state.demands.find((d) => d.id === stu.location);
            return (
              <div
                key={stu.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <PixelAvatar
                    name={stu.name}
                    config={stu.avatar}
                    size={36}
                    handRaised={stu.handRaised}
                    showBadgeTag={false}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{stu.name}</div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {dem ? dem.shortName : 'Lounge / Lobby'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-200/80">
                  <span className="font-semibold text-sky-700">
                    {stu.activeStage ? STAGE_META[stu.activeStage].shortLabel : 'Livre'}
                  </span>
                  <span className="text-slate-500">
                    {stu.badges.length} {stu.badges.length === 1 ? 'badge' : 'badges'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Demand Lifecycle Management: Modo Teste & Entrega Oficial */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900">
            Ciclo de Vida das Salas — Modo Teste & Entrega Oficial
          </h3>
          <p className="text-xs text-slate-600">
            Após aprovar as etapas principais, ative o Modo Teste coletivo e realize a Entrega Oficial para transformar a sala em Jardim da Inovação.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.demands.map((demand) => {
            const approvedCount = STAGE_ORDER.filter(
              (k) => demand.stages[k].status === 'APROVADA'
            ).length;
            const isDelivered = demand.status === 'ENTREGUE';
            const isTestMode = demand.status === 'MODO_TESTE';

            return (
              <div
                key={demand.id}
                className="rounded-2xl border border-slate-200 p-4 bg-slate-50 flex flex-col justify-between gap-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-500">
                        {demand.secretaria}
                      </span>
                      <h4 className="font-display font-bold text-sm text-slate-900">
                        {demand.title}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white border border-slate-200 text-slate-700">
                      {approvedCount}/4 aprovadas
                    </span>
                  </div>

                  {/* Stage Mini Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {STAGE_ORDER.map((k) => {
                      const st = demand.stages[k];
                      return (
                        <button
                          key={k}
                          onClick={() => {
                            setInspectTarget({ demand, stageKey: k });
                            setBadgeInput(`${STAGE_META[k].shortLabel} · ${demand.shortName}`);
                          }}
                          className={`px-2 py-1 rounded-lg text-[10px] font-semibold border cursor-pointer ${
                            st.status === 'APROVADA'
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-900'
                              : st.status === 'EM_REVISAO'
                              ? 'bg-amber-100 border-amber-300 text-amber-900'
                              : 'bg-white border-slate-200 text-slate-600'
                          }`}
                        >
                          {STAGE_META[k].shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200">
                  {isDelivered ? (
                    <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                      <Flower2 className="w-4 h-4" />
                      Entrega Oficial concluída (Jardim da Inovação ativo)
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => activateTestMode(demand.id)}
                        disabled={isTestMode}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                          isTestMode
                            ? 'bg-amber-200 text-amber-900 cursor-default'
                            : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                        }`}
                      >
                        <Presentation className="w-3.5 h-3.5" />
                        <span>{isTestMode ? 'Modo Teste Ativo' : 'Ativar Modo Teste na Sala'}</span>
                      </button>

                      <button
                        onClick={() => deliverDemandOfficially(demand.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Realizar Entrega Oficial</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pedagogical Evaluation Modal */}
      {inspectTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Avaliação Pedagógica"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="bg-[#0B132B] text-white px-5 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-sky-300 font-bold">
                  Avaliação Pedagógica
                </span>
                <h3 className="font-display font-bold text-base">
                  {inspectTarget.demand.title} — {STAGE_META[inspectTarget.stageKey].workbenchName}
                </h3>
              </div>
              <button
                onClick={() => setInspectTarget(null)}
                aria-label="Fechar avaliação pedagógica"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Artifact Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="font-bold text-slate-800">Artefato produzido na bancada:</div>
                {inspectTarget.stageKey === 'UI_UX' && (
                  <pre className="whitespace-pre-wrap text-[11px] bg-white p-3 rounded-xl border border-slate-200">
                    {JSON.stringify(inspectTarget.demand.artifacts.ui, null, 2)}
                  </pre>
                )}
                {inspectTarget.stageKey === 'LOGICA_REGRAS' && (
                  <pre className="whitespace-pre-wrap text-[11px] bg-white p-3 rounded-xl border border-slate-200">
                    {JSON.stringify(inspectTarget.demand.artifacts.logic, null, 2)}
                  </pre>
                )}
                {inspectTarget.stageKey === 'IA_DADOS' && (
                  <pre className="whitespace-pre-wrap text-[11px] bg-white p-3 rounded-xl border border-slate-200">
                    {JSON.stringify(inspectTarget.demand.artifacts.ai, null, 2)}
                  </pre>
                )}
                {inspectTarget.stageKey === 'QA_TESTES' && (
                  <pre className="whitespace-pre-wrap text-[11px] bg-white p-3 rounded-xl border border-slate-200">
                    {JSON.stringify(inspectTarget.demand.artifacts.qa, null, 2)}
                  </pre>
                )}
              </div>

              <UnifiedPreview demand={inspectTarget.demand} compact />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
                  <label htmlFor="professor-badge-input" className="block text-xs font-bold text-emerald-950">
                    Badge de Conquista
                  </label>
                  <input
                    id="professor-badge-input"
                    name="badgeName"
                    value={badgeInput}
                    onChange={(e) => setBadgeInput(e.target.value)}
                    className="w-full rounded-xl border border-emerald-300 bg-white px-3 py-1.5 text-xs"
                  />
                  <button
                    onClick={() => {
                      approveStage(inspectTarget.demand.id, inspectTarget.stageKey, badgeInput);
                      setInspectTarget(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Award className="w-4 h-4" />
                    <span>Aprovar Etapa (+Badge)</span>
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
                  <label htmlFor="professor-feedback-input" className="block text-xs font-bold text-amber-950 flex items-center gap-1">
                    <MessageSquareWarning className="w-3.5 h-3.5" />
                    <span>Devolver com Feedback Formativo</span>
                  </label>
                  <input
                    id="professor-feedback-input"
                    name="feedback"
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Ex.: Adicione uma regra para casos urgentes..."
                    className="w-full rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs"
                  />
                  <button
                    onClick={() => {
                      returnStageWithFeedback(
                        inspectTarget.demand.id,
                        inspectTarget.stageKey,
                        feedbackInput || 'Revise os itens do checklist e teste novamente no Preview.'
                      );
                      setInspectTarget(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Devolver com Feedback</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
