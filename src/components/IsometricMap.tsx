import React from 'react';
import { Award, ClipboardList, Flower2, Hand, Presentation, Sparkles } from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { Demand, StageKey } from '../types';
import { HabblaudOfficeCanvas } from './HabblaudOfficeCanvas';

interface IsometricMapProps {
  onOpenDemandBoard: () => void;
  onOpenTestAuditorium: (demand: Demand) => void;
}

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

export const IsometricMap: React.FC<IsometricMapProps> = ({
  onOpenDemandBoard,
  onOpenTestAuditorium,
}) => {
  const { state, openDemandRoom, setActiveTab } = useOrbit();

  const openStagesCount = state.demands.reduce((acc, d) => {
    if (d.status === 'ENTREGUE') return acc;
    return acc + STAGE_ORDER.filter((k) => d.stages[k].status === 'DISPONIVEL').length;
  }, 0);

  const testModeDemands = state.demands.filter((d) => d.status === 'MODO_TESTE');
  const deliveredDemands = state.demands.filter((d) => d.status === 'ENTREGUE');
  const activeDemands = state.demands.filter((d) => d.status !== 'ENTREGUE');
  const raisedCount = state.students.filter((s) => s.handRaised !== null).length;

  return (
    <div className="space-y-4">
      {/* Top Action & Status Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-display font-bold text-slate-900 mr-1">
            Escritório Vivo Habblaud · CEMI 2
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sky-50 text-sky-800 border border-sky-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            {activeDemands.length} Salas Ativas
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
            <Hand className="w-3 h-3" />
            Mão Levantada ({raisedCount})
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
            <Flower2 className="w-3 h-3" />
            Jardim da Inovação ({deliveredDemands.length})
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {testModeDemands[0] && (
            <button
              onClick={() => onOpenTestAuditorium(testModeDemands[0])}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm animate-pulse cursor-pointer"
            >
              <Presentation className="w-4 h-4" />
              <span>Auditório · Modo Teste ({testModeDemands[0].shortName})</span>
            </button>
          )}

          <button
            onClick={onOpenDemandBoard}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Sala de Demandas ({openStagesCount} etapas livres)</span>
          </button>
        </div>
      </div>

      {/* Authentic Habblaud 2.5D Pixel Art Canvas */}
      <HabblaudOfficeCanvas onOpenTestAuditorium={onOpenTestAuditorium} />

      {/* Bottom Quick Strip: Active Rooms & Jardins da Inovação */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="text-xs font-bold text-slate-700 mb-2.5">
            Atalho Rápido para Salas Ativas:
          </div>
          <div className="flex flex-wrap gap-2">
            {activeDemands.map((d) => (
              <button
                key={d.id}
                onClick={() => openDemandRoom(d.id)}
                className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-left transition cursor-pointer"
              >
                <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                  <span>{d.shortName}</span>
                  {d.status === 'MODO_TESTE' && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px]">
                      Modo Teste
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-slate-500">{d.secretaria}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-200 p-4 shadow-sm flex flex-col justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
              <Flower2 className="w-4 h-4 text-emerald-600" />
              <span>🌸 Jardins da Inovação ({deliveredDemands.length})</span>
            </div>
            <p className="text-[11px] text-emerald-800 mt-1">
              {deliveredDemands.length > 0
                ? deliveredDemands.map((d) => d.shortName).join(' · ')
                : 'Nenhuma entrega oficial ainda.'}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('VITRINE')}
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Award className="w-3.5 h-3.5" />
            <span>Abrir Vitrine Pública</span>
          </button>
        </div>
      </div>
    </div>
  );
};
