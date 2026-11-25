import React from 'react';
import {
  Award,
  ClipboardCheck,
  Contrast,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Map,
  RotateCcw,
  Settings,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { Role } from '../types';

export const Header: React.FC = () => {
  const {
    state,
    switchDemoRole,
    logout,
    setViewMode,
    setActiveTab,
    toggleHighContrast,
    resetDemoData,
  } = useOrbit();

  const session = state.session;
  if (!session) return null;

  const pendingAlertsCount = state.students.filter((s) => s.handRaised !== null).length;
  const deliveredCount = state.demands.filter((d) => d.status === 'ENTREGUE').length;
  const pendingTriageCount = state.portalSubmissions.filter(
    (s) => s.status === 'PENDENTE_TRIAGEM' || s.status === 'EM_REVISAO'
  ).length;

  const roleButtons: { role: Role; label: string; icon: React.ReactNode }[] = [
    { role: 'ALUNO', label: 'Aluno', icon: <UserCheck className="w-3.5 h-3.5" /> },
    { role: 'PROFESSOR', label: 'Professor', icon: <GraduationCap className="w-3.5 h-3.5" /> },
    { role: 'COORDENADOR', label: 'Coordenador', icon: <Settings className="w-3.5 h-3.5" /> },
  ];

  return (
    <header className="no-print sticky top-0 z-40 bg-[#0B132B] text-white border-b border-slate-800 shadow-lg">
      <div className="max-w-[1440px] mx-auto px-3 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('LAB')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 group-hover:scale-105 transition">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm sm:text-base tracking-tight text-white">
                  Orbit Conecta
                </span>
                <span className="hidden md:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  SMED Cianorte · CEMI 2
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                {session.name} ·{' '}
                <span className="text-sky-300 font-medium">
                  {session.role === 'ALUNO'
                    ? 'Estudante AH/SD'
                    : session.role === 'PROFESSOR'
                    ? 'Professor Mentor'
                    : 'Coordenação SMED'}
                </span>
              </p>
            </div>
          </button>
        </div>

        {/* Center Navigation & View Toggle */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setActiveTab('LAB')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              state.activeTab === 'LAB'
                ? 'bg-sky-500 text-white shadow'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Laboratório</span>
          </button>

          {state.activeTab === 'LAB' && !state.activeDemandId && (
            <div className="inline-flex rounded-lg bg-slate-900 p-0.5 border border-slate-700">
              <button
                onClick={() => setViewMode('MAP')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition ${
                  state.viewMode === 'MAP'
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Map className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mapa 2.5D</span>
              </button>
              <button
                onClick={() => setViewMode('CARDS')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1 cursor-pointer transition ${
                  state.viewMode === 'CARDS'
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>
            </div>
          )}

          {session.role === 'PROFESSOR' && (
            <button
              onClick={() => setActiveTab('PROFESSOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                state.activeTab === 'PROFESSOR'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Painel Mentor</span>
              {pendingAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500 text-white font-bold">
                  {pendingAlertsCount}
                </span>
              )}
            </button>
          )}

          {session.role === 'COORDENADOR' && (
            <button
              onClick={() => setActiveTab('COORDENADOR')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                state.activeTab === 'COORDENADOR'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Gestão & BYOK</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('PORTAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              state.activeTab === 'PORTAL'
                ? 'bg-indigo-500 text-white shadow'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>Portal & Triagem</span>
            {pendingTriageCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sky-400 text-slate-950 font-bold">
                {pendingTriageCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('VITRINE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              state.activeTab === 'VITRINE'
                ? 'bg-emerald-400 text-slate-950 shadow'
                : 'bg-slate-800/80 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Vitrine Pública ({deliveredCount})</span>
          </button>
        </div>

        {/* Right: Quick Demo Role Switch + A11y + Reset + Logout */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div
            className="hidden lg:flex items-center gap-1 bg-slate-900/90 border border-slate-700 rounded-lg p-0.5"
            title="Troca rápida de perfil para demonstração"
          >
            <span className="text-[10px] text-slate-400 px-1.5 font-medium">Demo:</span>
            {roleButtons.map((btn) => (
              <button
                key={btn.role}
                onClick={() => switchDemoRole(btn.role)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 cursor-pointer transition ${
                  session.role === btn.role
                    ? 'bg-sky-500 text-white'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {btn.icon}
                <span>{btn.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={toggleHighContrast}
            title="Alternar Alto Contraste (Acessibilidade)"
            aria-label="Alternar Alto Contraste"
            className={`p-2 rounded-lg border text-xs cursor-pointer transition ${
              state.highContrast
                ? 'bg-amber-400 text-slate-950 border-amber-300'
                : 'bg-slate-800/80 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Contrast className="w-4 h-4" />
          </button>

          <button
            onClick={resetDemoData}
            title="Resetar Dados Demo"
            className="px-2.5 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Resetar Demo</span>
          </button>

          <button
            onClick={logout}
            title="Trocar Perfil / Sair"
            className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/30 text-xs font-medium flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Mobile/Chromebook compact Demo Switcher */}
      <div className="lg:hidden px-3 pb-2 flex items-center justify-between gap-2 border-t border-slate-800/70 pt-1.5">
        <span className="text-[11px] text-slate-400">Troca rápida Demo:</span>
        <div className="flex items-center gap-1">
          {roleButtons.map((btn) => (
            <button
              key={btn.role}
              onClick={() => switchDemoRole(btn.role)}
              className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer ${
                session.role === btn.role ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-300'
              }`}
            >
              {btn.icon}
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  );
};
