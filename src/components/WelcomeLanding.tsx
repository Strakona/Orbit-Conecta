import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Eye,
  EyeOff,
  Flower2,
  Lock,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { OfficeStore } from '../habblaud/client/src/net/store';
import { createWorld } from '../habblaud/client/src/world';
import type { WorldApi } from '../habblaud/client/src/world/api';
import { buildHabblaudSnapshot } from '../services/habblaudBridge';
import { isDemoMode } from '../utils/demoMode';

export type PublicPortalTab = 'SUBMISSION' | 'PROTOCOL' | 'SHOWCASE';

interface WelcomeLandingProps {
  onEnterPortal: (tab: PublicPortalTab) => void;
  onOpenLabLogin: () => void;
}

export const WelcomeLanding: React.FC<WelcomeLandingProps> = ({
  onEnterPortal,
  onOpenLabLogin,
}) => {
  const { state, publicPresence, syncStatus } = useOrbit();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const storeRef = useRef<OfficeStore | null>(null);
  const worldRef = useRef<WorldApi | null>(null);

  const [peekOffice, setPeekOffice] = useState(false);
  const demo = isDemoMode();

  const activeRoomsCount = state.demands.filter((d) => d.status !== 'ENTREGUE').length;
  const deliveredCount = state.demands.filter((d) => d.status === 'ENTREGUE').length;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const store = new OfficeStore();
    storeRef.current = store;
    const world = createWorld(canvas, store);
    worldRef.current = world;

    world.setOptions({
      showNames: false,
      bubbles: 'all',
      liveliness: 'lively',
      followSelected: false,
      dayNight: true,
      daylight: 'auto',
      theme: 'none',
    });

    store.push(
      buildHabblaudSnapshot(state, { anonymize: true, publicPresence })
    );

    return () => {
      world.destroy();
      worldRef.current = null;
      storeRef.current = null;
    };
    // Mount once; snapshots update reactively in the effect below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (storeRef.current) {
      storeRef.current.push(
        buildHabblaudSnapshot(state, { anonymize: true, publicPresence })
      );
    }
  }, [state.demands, state.students, state.turmas, publicPresence]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0B132B] flex flex-col">
      {/* Full-bleed Anonymized Habblaud 2.5D Pixel Art Office */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block select-none"
      />

      {/* Soft Vignette Overlay */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          peekOffice
            ? 'opacity-10 bg-slate-950/30'
            : 'opacity-100 bg-gradient-to-b from-[#0B132B]/75 via-[#0B132B]/55 to-[#0B132B]/85'
        }`}
      />

      {/* Floating Top Bar */}
      <header className="relative z-20 px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3.5 py-1.5 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/15 text-sky-200 text-xs font-semibold flex items-center gap-2 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>SMED Cianorte · CEMI 2</span>
          </div>

          {demo && (
            <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-bold shadow">
              Modo Apresentação (?demo=1)
            </span>
          )}
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border backdrop-blur-md ${
              syncStatus === 'ONLINE_FIREBASE'
                ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200'
                : syncStatus === 'CONNECTING'
                ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                : 'bg-slate-900/75 border-white/15 text-slate-300'
            }`}
          >
            {syncStatus === 'ONLINE_FIREBASE'
              ? '🟢 Nuvem Firebase Online'
              : syncStatus === 'CONNECTING'
              ? '🔵 Conectando Firebase...'
              : '🟡 Modo Local'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPeekOffice((v) => !v)}
            className="px-3.5 py-2 rounded-xl bg-slate-950/75 hover:bg-slate-900 text-slate-100 border border-white/20 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
          >
            {peekOffice ? (
              <>
                <EyeOff className="w-3.5 h-3.5 text-sky-300" />
                <span>Mostrar Boas-Vindas</span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-sky-300" />
                <span>Ver Escritório</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onOpenLabLogin}
            className="px-4 py-2 rounded-xl bg-sky-500/90 hover:bg-sky-500 text-white border border-sky-300/40 backdrop-blur-md text-xs font-bold flex items-center gap-1.5 shadow-lg transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Acesso CEMI 2</span>
          </button>
        </div>
      </header>

      {/* Centered Glassmorphism Welcome Card */}
      <main className="relative z-20 flex-1 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
        <AnimatePresence mode="wait">
          {!peekOffice && (
            <motion.div
              key="welcome-card"
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 14, scale: 0.97 }}
              transition={{ duration: 0.28 }}
              className="pointer-events-auto w-full max-w-3xl rounded-3xl bg-slate-950/70 backdrop-blur-xl border border-white/20 shadow-[0_24px_80px_rgba(2,6,23,0.75)] p-7 sm:p-11 text-center text-white space-y-6"
            >
              <div className="flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-sky-500/30">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.18em] text-sky-300">
                  Laboratório de Inovação Pedagógica e Altas Habilidades
                </span>
              </div>

              <div className="space-y-3">
                <h1 className="font-display font-extrabold text-4xl sm:text-6xl tracking-tight text-white drop-shadow-sm">
                  Orbit Conecta
                </h1>
                <p className="text-sm sm:text-base text-slate-200 max-w-2xl mx-auto leading-relaxed">
                  A fábrica pública de aplicativos web e soluções com Inteligência Artificial das{' '}
                  <strong className="text-white">Turmas AH/SD de Cianorte</strong>. Ao fundo,
                  acompanhe as salas de demandas municipais ganhando vida em tempo real.
                </p>
              </div>

              {/* Non-PII Live Counters */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                <span className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-200 font-semibold">
                  {activeRoomsCount} {activeRoomsCount === 1 ? 'Sala Ativa' : 'Salas Ativas'}
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 font-semibold flex items-center gap-1.5">
                  <Flower2 className="w-3.5 h-3.5" />
                  <span>{deliveredCount} Projetos na Vitrine</span>
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 font-semibold">
                  100% Software Web & IA
                </span>
              </div>

              {/* 3 Primary Public Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onEnterPortal('SUBMISSION')}
                  className="sm:col-span-1 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-500/25 flex flex-col items-center justify-center gap-1 transition cursor-pointer group"
                >
                  <span className="flex items-center gap-1.5">
                    <PlusCircle className="w-4 h-4" />
                    <span>Enviar Demanda</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </span>
                  <span className="text-[11px] font-normal text-sky-100">
                    Escolas e Secretarias
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onEnterPortal('SHOWCASE')}
                  className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-emerald-300" />
                    <span>Vitrine Pública ({deliveredCount})</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-300">
                    Testar soluções prontas
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onEnterPortal('PROTOCOL')}
                  className="py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-sm flex flex-col items-center justify-center gap-1 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-amber-300" />
                    <span>Consultar Protocolo</span>
                  </span>
                  <span className="text-[11px] font-normal text-slate-300">
                    Acompanhar pedido
                  </span>
                </button>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-300/90">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Visualização pública 100% anonimizada em conformidade com a LGPD e o ECA.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Floating Pill when admiring the office */}
      {peekOffice && (
        <div className="relative z-20 pb-5 px-4 flex justify-center">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950/85 backdrop-blur-md border border-white/20 text-white flex flex-wrap items-center gap-3 shadow-2xl text-xs">
            <span className="text-slate-200">
              Visualizando o escritório 2.5D ao vivo (identidades protegidas)
            </span>
            <button
              type="button"
              onClick={() => onEnterPortal('SUBMISSION')}
              className="px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold cursor-pointer"
            >
              Enviar Demanda
            </button>
            <button
              type="button"
              onClick={() => setPeekOffice(false)}
              className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-semibold cursor-pointer"
            >
              Voltar ao Cartão
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
