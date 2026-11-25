import React from 'react';
import { ArrowRight, Award, ClipboardList, Flower2, Presentation } from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { STAGE_META } from '../data/seedData';
import { Demand, StageKey } from '../types';
import { PixelAvatar } from './PixelAvatar';

interface CardsOverviewProps {
  onOpenDemandBoard: () => void;
  onOpenTestAuditorium: (demand: Demand) => void;
}

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

export const CardsOverview: React.FC<CardsOverviewProps> = ({
  onOpenDemandBoard,
  onOpenTestAuditorium,
}) => {
  const { state, openDemandRoom, setActiveTab } = useOrbit();

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900">
            Visão Operacional das Salas (Cards)
          </h2>
          <p className="text-xs text-slate-600">
            Acompanhe demandas municipais, etapas disponíveis e avatares conectados em tempo real.
          </p>
        </div>
        <button
          onClick={onOpenDemandBoard}
          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
        >
          <ClipboardList className="w-4 h-4" />
          <span>Sala de Demandas (Pull System)</span>
        </button>
      </div>

      {state.demands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3 shadow-sm">
          <p className="text-sm font-semibold text-slate-800">
            Nenhuma demanda publicada no laboratório ainda.
          </p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Envie uma demanda pelo Portal Público e aprove-a na Triagem, ou cadastre uma nova
            demanda diretamente no Painel da Coordenação.
          </p>
        </div>
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {state.demands.map((demand) => {
          const roomStudents = state.students.filter((s) => s.location === demand.id);
          const isDelivered = demand.status === 'ENTREGUE';
          const isTestMode = demand.status === 'MODO_TESTE';

          return (
            <div
              key={demand.id}
              className={`rounded-2xl border p-5 bg-white shadow-sm flex flex-col justify-between gap-4 ${
                isDelivered
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : isTestMode
                  ? 'border-amber-300 bg-amber-50/30'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                      {demand.secretaria}
                    </span>
                    <h3 className="font-display font-bold text-base text-slate-900 mt-0.5">
                      {demand.title}
                    </h3>
                  </div>

                  {isDelivered ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 shrink-0">
                      <Flower2 className="w-3.5 h-3.5" />
                      Jardim da Inovação
                    </span>
                  ) : isTestMode ? (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1 shrink-0">
                      <Presentation className="w-3.5 h-3.5" />
                      Modo Teste
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 border border-sky-200 text-xs font-bold shrink-0">
                      Ativa
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-2">{demand.description}</p>

                {/* 4 Stages Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {STAGE_ORDER.map((key) => {
                    const stage = demand.stages[key];
                    const assignee = state.students.find((s) => s.id === stage.assigneeId);
                    return (
                      <div
                        key={key}
                        className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-xs"
                      >
                        <div className="font-bold text-slate-800 truncate">
                          {STAGE_META[key].shortLabel}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {stage.status === 'DISPONIVEL'
                            ? 'Disponível'
                            : stage.status === 'EM_DESENVOLVIMENTO'
                            ? 'Em obra'
                            : stage.status === 'EM_REVISAO'
                            ? 'Em revisão'
                            : 'Aprovada'}
                        </div>
                        {assignee && (
                          <div className="text-[10px] text-sky-700 font-medium truncate mt-0.5">
                            {assignee.name.split(' ')[0]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/80">
                <div className="flex items-center gap-2">
                  {roomStudents.map((stu) => (
                    <PixelAvatar
                      key={stu.id}
                      name={stu.name}
                      config={stu.avatar}
                      size={32}
                      handRaised={stu.handRaised}
                    />
                  ))}
                  {roomStudents.length === 0 && (
                    <span className="text-xs text-slate-400">Nenhum avatar na sala</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isTestMode && (
                    <button
                      onClick={() => onOpenTestAuditorium(demand)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-semibold text-xs cursor-pointer"
                    >
                      Testar no Auditório
                    </button>
                  )}
                  {isDelivered ? (
                    <button
                      onClick={() => setActiveTab('VITRINE')}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Ver na Vitrine</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => openDemandRoom(demand.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Entrar na Sala</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
};
