import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Eye,
  Maximize2,
  Moon,
  Presentation,
  Sun,
  SunMoon,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { STAGE_META } from '../data/seedData';
import { OfficeStore } from '../habblaud/client/src/net/store';
import { createWorld } from '../habblaud/client/src/world';
import type { DaylightMode, Selection, WorldApi, WorldOptions } from '../habblaud/client/src/world/api';
import { buildHabblaudSnapshot } from '../services/habblaudBridge';
import { Demand, StageKey } from '../types';
import { PixelAvatar } from './PixelAvatar';

interface HabblaudOfficeCanvasProps {
  onOpenTestAuditorium: (demand: Demand) => void;
}

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

export const HabblaudOfficeCanvas: React.FC<HabblaudOfficeCanvasProps> = ({
  onOpenTestAuditorium,
}) => {
  const { state, openDemandRoom } = useOrbit();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const storeRef = useRef<OfficeStore | null>(null);
  const worldRef = useRef<WorldApi | null>(null);

  const [selection, setSelection] = useState<Selection>(null);
  const [daylight, setDaylight] = useState<DaylightMode>('auto');
  const [bubbles, setBubbles] = useState<WorldOptions['bubbles']>('all');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const store = new OfficeStore();
    storeRef.current = store;
    const world = createWorld(canvas, store);
    worldRef.current = world;

    world.setOptions({
      showNames: true,
      bubbles: 'all',
      liveliness: 'lively',
      followSelected: false,
      dayNight: true,
      daylight: 'auto',
      theme: 'none',
    });

    const offSelect = world.onSelect((sel) => {
      setSelection(sel);
    });

    store.push(buildHabblaudSnapshot(state));

    return () => {
      offSelect();
      world.destroy();
      worldRef.current = null;
      storeRef.current = null;
    };
    // Mount once; snapshots are pushed reactively in the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.push(buildHabblaudSnapshot(state));
    }
  }, [state.demands, state.students, state.turmas]);

  const cycleDaylight = () => {
    const next: DaylightMode =
      daylight === 'auto' ? 'day' : daylight === 'day' ? 'night' : 'auto';
    setDaylight(next);
    worldRef.current?.setOptions({ daylight: next });
  };

  const toggleBubbles = () => {
    const next: WorldOptions['bubbles'] =
      bubbles === 'all' ? 'important' : bubbles === 'important' ? 'none' : 'all';
    setBubbles(next);
    worldRef.current?.setOptions({ bubbles: next });
  };

  const selectedDemand =
    selection?.type === 'room'
      ? state.demands.find((d) => d.id === selection.id)
      : undefined;

  const selectedStudent =
    selection?.type === 'agent'
      ? state.students.find((s) => s.id === selection.id)
      : undefined;

  const studentRoom = selectedStudent
    ? state.demands.find((d) => d.id === selectedStudent.location)
    : undefined;

  return (
    <div className="relative rounded-3xl border-2 border-slate-300 bg-[#0B132B] overflow-hidden shadow-xl">
      {/* Habblaud Native 2.5D Pixel Art Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-[520px] sm:h-[600px] block select-none"
      />

      {/* Top-Left HUD Badge */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none flex flex-wrap items-center gap-2">
        <span className="px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-slate-700 text-white text-xs font-semibold shadow-lg">
          Motor Habblaud 2.5D · CEMI 2 / SMED Cianorte
        </span>
        <span className="hidden md:inline-block px-2.5 py-1 rounded-xl bg-slate-950/80 border border-sky-400/50 text-sky-100 text-[11px] font-medium backdrop-blur-md shadow-lg">
          Clique em uma sala ou avatar · Arraste para mover · Roda do mouse para zoom
        </span>
      </div>

      {/* Top-Right Camera & Lighting Controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-wrap items-center gap-1.5">
        <button
          onClick={cycleDaylight}
          title="Alternar Iluminação (Auto / Dia / Noite)"
          className="px-2.5 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 backdrop-blur-md cursor-pointer"
        >
          {daylight === 'day' ? (
            <Sun className="w-3.5 h-3.5 text-amber-300" />
          ) : daylight === 'night' ? (
            <Moon className="w-3.5 h-3.5 text-sky-300" />
          ) : (
            <SunMoon className="w-3.5 h-3.5 text-emerald-300" />
          )}
          <span className="hidden sm:inline">
            {daylight === 'auto' ? 'Auto' : daylight === 'day' ? 'Dia' : 'Noite'}
          </span>
        </button>

        <button
          onClick={toggleBubbles}
          title="Alternar Balões de Atividade"
          className="px-2.5 py-1.5 rounded-xl bg-slate-950/85 hover:bg-slate-900 text-white border border-slate-700 text-xs font-semibold flex items-center gap-1 backdrop-blur-md cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-sky-300" />
          <span className="hidden sm:inline">
            Balões: {bubbles === 'all' ? 'Todos' : bubbles === 'important' ? 'Alertas' : 'Off'}
          </span>
        </button>

        <div className="inline-flex rounded-xl bg-slate-950/85 border border-slate-700 backdrop-blur-md overflow-hidden">
          <button
            onClick={() => worldRef.current?.zoomBy(1.25)}
            title="Aproximar Zoom"
            aria-label="Aproximar Zoom"
            className="p-2 text-slate-200 hover:bg-slate-800 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => worldRef.current?.zoomBy(0.8)}
            title="Afastar Zoom"
            aria-label="Afastar Zoom"
            className="p-2 text-slate-200 hover:bg-slate-800 border-l border-slate-700 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => worldRef.current?.overview()}
            title="Visão Geral do Prédio"
            aria-label="Visão Geral do Prédio"
            className="p-2 text-slate-200 hover:bg-slate-800 border-l border-slate-700 cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Bottom-Left Selected Room Card */}
      {selectedDemand && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-[390px] z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-2xl space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                {selectedDemand.secretaria}
              </span>
              <h4 className="font-display font-bold text-sm text-slate-900">
                {selectedDemand.title}
              </h4>
            </div>
            <button
              onClick={() => worldRef.current?.select(null)}
              className="text-xs text-slate-500 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-100 cursor-pointer"
            >
              Fechar
            </button>
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {STAGE_ORDER.map((k) => {
              const st = selectedDemand.stages[k];
              return (
                <div
                  key={k}
                  className={`p-1.5 rounded-lg border text-center text-[10px] ${
                    st.status === 'APROVADA'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : st.status === 'EM_REVISAO'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : st.status === 'EM_DESENVOLVIMENTO'
                      ? 'bg-sky-50 border-sky-200 text-sky-800'
                      : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <div className="font-bold">{STAGE_META[k].shortLabel}</div>
                  <div className="truncate">
                    {st.status === 'APROVADA'
                      ? 'Aprovada'
                      : st.status === 'EM_REVISAO'
                      ? 'Revisão'
                      : st.status === 'EM_DESENVOLVIMENTO'
                      ? 'Em obra'
                      : 'Livre'}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openDemandRoom(selectedDemand.id)}
              className="flex-1 py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Entrar na Sala (4 Bancadas)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            {selectedDemand.status === 'MODO_TESTE' && (
              <button
                onClick={() => onOpenTestAuditorium(selectedDemand)}
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>Testar</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom-Left Selected Student Card */}
      {selectedStudent && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:w-[360px] z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 p-4 shadow-2xl space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <PixelAvatar
                name={selectedStudent.name}
                config={selectedStudent.avatar}
                size={38}
                handRaised={selectedStudent.handRaised}
                showBadgeTag={false}
              />
              <div>
                <h4 className="font-display font-bold text-sm text-slate-900">
                  {selectedStudent.name}
                </h4>
                <div className="text-[11px] text-slate-600">
                  {state.turmas.find((t) => t.id === selectedStudent.turmaId)?.name} ·{' '}
                  {selectedStudent.activeStage
                    ? STAGE_META[selectedStudent.activeStage].shortLabel
                    : 'Lounge / Lobby'}
                </div>
              </div>
            </div>
            <button
              onClick={() => worldRef.current?.select(null)}
              className="text-xs text-slate-500 hover:text-slate-900 px-2 py-0.5 rounded bg-slate-100 cursor-pointer"
            >
              Fechar
            </button>
          </div>

          {selectedStudent.handNote && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950">
              <strong>Alerta:</strong> {selectedStudent.handNote}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">
              {selectedStudent.badges.length}{' '}
              {selectedStudent.badges.length === 1 ? 'badge conquistada' : 'badges conquistadas'}
            </span>
            {studentRoom && (
              <button
                onClick={() => openDemandRoom(studentRoom.id)}
                className="py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Ir para {studentRoom.shortName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
