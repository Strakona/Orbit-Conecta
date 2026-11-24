import React from 'react';
import { ArrowRight, CheckCircle2, ClipboardList, Clock, Hand, Sparkles, X } from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { STAGE_META } from '../data/seedData';
import { StageKey, StageStatus } from '../types';
import { PixelAvatar } from './PixelAvatar';

interface DemandBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

const STATUS_BADGE: Record<StageStatus, { label: string; cls: string }> = {
  DISPONIVEL: {
    label: 'Disponível',
    cls: 'bg-sky-100 text-sky-800 border-sky-200',
  },
  EM_DESENVOLVIMENTO: {
    label: 'Em Desenvolvimento',
    cls: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  EM_REVISAO: {
    label: 'Em Revisão',
    cls: 'bg-amber-100 text-amber-800 border-amber-200',
  },
  APROVADA: {
    label: 'Aprovada',
    cls: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
};

export const DemandBoardModal: React.FC<DemandBoardModalProps> = ({ isOpen, onClose }) => {
  const { state, claimStage, openDemandRoom } = useOrbit();

  if (!isOpen) return null;

  const isStudent = state.session?.role === 'ALUNO';
  const activeDemands = state.demands.filter((d) => d.status !== 'ENTREGUE');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sala de Demandas Municipais"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
    >
      <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0B132B] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">
                Sala de Demandas Municipais — Pull System
              </h2>
              <p className="text-xs text-slate-300">
                Escolha autonomamente qualquer etapa disponível para caminhar até o escritório da demanda.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Demands List */}
        <div className="p-5 overflow-y-auto space-y-5 bg-slate-50">
          {activeDemands.map((demand) => (
            <div
              key={demand.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-700">
                    {demand.secretaria}
                  </span>
                  <h3 className="font-display font-bold text-lg text-slate-900">
                    {demand.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 max-w-3xl">{demand.description}</p>
                </div>

                <button
                  onClick={() => {
                    openDemandRoom(demand.id);
                    onClose();
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Visitar Sala</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4 Modular Stages */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                {STAGE_ORDER.map((stageKey) => {
                  const stage = demand.stages[stageKey];
                  const meta = STAGE_META[stageKey];
                  const badge = STATUS_BADGE[stage.status];
                  const assignee = state.students.find((s) => s.id === stage.assigneeId);

                  return (
                    <div
                      key={stageKey}
                      className={`rounded-xl border p-3.5 flex flex-col justify-between gap-3 ${
                        stage.status === 'DISPONIVEL'
                          ? 'bg-sky-50/50 border-sky-200'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-xs font-bold ${meta.color}`}>
                            {meta.bubble} {meta.shortLabel}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.cls}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                          {stage.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/70">
                        {assignee ? (
                          <div className="flex items-center gap-2">
                            <PixelAvatar
                              name={assignee.name}
                              config={assignee.avatar}
                              size={28}
                              showBadgeTag={false}
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-slate-800 truncate">
                                {assignee.name}
                              </div>
                              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                {stage.status === 'APROVADA' ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                    <span>Concluída</span>
                                  </>
                                ) : stage.status === 'EM_REVISAO' ? (
                                  <>
                                    <Hand className="w-3 h-3 text-amber-600" />
                                    <span>Aguardando Mentor</span>
                                  </>
                                ) : (
                                  <>
                                    <Clock className="w-3 h-3 text-sky-600" />
                                    <span>Em produção</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : isStudent ? (
                          <button
                            onClick={() => {
                              claimStage(demand.id, stageKey);
                              onClose();
                            }}
                            className="w-full py-2 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Assumir Etapa</span>
                          </button>
                        ) : (
                          <div className="text-[11px] font-medium text-slate-500 text-center py-1.5">
                            Etapa disponível ({state.session?.role === 'PROFESSOR' ? 'visão Mentor' : 'visão Gestão'})
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
