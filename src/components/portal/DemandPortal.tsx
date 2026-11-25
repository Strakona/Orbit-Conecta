import React, { useState } from 'react';
import {
  ArrowLeft,
  ClipboardCheck,
  KeyRound,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useOrbit } from '../../context/OrbitContext';
import { PortalByokModal } from './PortalByokModal';
import { PortalProtocolTracker } from './PortalProtocolTracker';
import { PortalSubmissionForm } from './PortalSubmissionForm';
import { PortalTriagePanel } from './PortalTriagePanel';

interface DemandPortalProps {
  isPublicMode?: boolean;
  onExitPublicMode?: () => void;
}

type PortalSubTab = 'SUBMISSION' | 'PROTOCOL' | 'TRIAGE';

export const DemandPortal: React.FC<DemandPortalProps> = ({
  isPublicMode = false,
  onExitPublicMode,
}) => {
  const { state, openDemandRoom } = useOrbit();
  const isStaff =
    state.session?.role === 'PROFESSOR' || state.session?.role === 'COORDENADOR';

  const [mentorDemoMode, setMentorDemoMode] = useState(false);
  const [subTab, setSubTab] = useState<PortalSubTab>(
    !isPublicMode && isStaff ? 'TRIAGE' : 'SUBMISSION'
  );
  const [trackedProtocol, setTrackedProtocol] = useState<string | undefined>(undefined);
  const [byokOpen, setByokOpen] = useState(false);

  const canSeeTriage = isStaff || mentorDemoMode;
  const pendingCount = state.portalSubmissions.filter(
    (s) => s.status === 'PENDENTE_TRIAGEM' || s.status === 'EM_REVISAO'
  ).length;

  return (
    <div className={isPublicMode ? 'min-h-screen bg-slate-100 flex flex-col' : 'space-y-5'}>
      {/* Standalone Topbar when accessed without login */}
      {isPublicMode && (
        <header className="bg-[#0B132B] text-white border-b border-slate-800 shadow-lg">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {onExitPublicMode && (
                <button
                  type="button"
                  onClick={onExitPublicMode}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar ao Login</span>
                </button>
              )}
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-400 to-indigo-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-display font-bold text-sm sm:text-base">
                    Portal de Demandas — SMED Cianorte / CEMI 2
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Integrado ao ecossistema Orbit Conecta (Turmas AH/SD)
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = !mentorDemoMode;
                  setMentorDemoMode(next);
                  if (next) setSubTab('TRIAGE');
                  else if (subTab === 'TRIAGE') setSubTab('SUBMISSION');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                  mentorDemoMode
                    ? 'bg-amber-400 text-slate-950 border-amber-300'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>
                  {mentorDemoMode ? 'Modo Mentor (Demo): ATIVO' : 'Modo Mentor (Triagem)'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setByokOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cofre BYOK</span>
              </button>
            </div>
          </div>
        </header>
      )}

      <div
        className={
          isPublicMode
            ? 'flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5 space-y-5'
            : 'space-y-5'
        }
      >
        {/* Portal Sub-navigation Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSubTab('SUBMISSION')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'SUBMISSION'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Enviar Demanda</span>
            </button>

            <button
              type="button"
              onClick={() => setSubTab('PROTOCOL')}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                subTab === 'PROTOCOL'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Consulta de Protocolo</span>
            </button>

            {canSeeTriage && (
              <button
                type="button"
                onClick={() => setSubTab('TRIAGE')}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  subTab === 'TRIAGE'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200'
                }`}
              >
                <ClipboardCheck className="w-4 h-4" />
                <span>Triagem & Curadoria ({pendingCount})</span>
              </button>
            )}
          </div>

          {!isPublicMode && (
            <div className="flex items-center gap-2">
              {!isStaff && (
                <button
                  type="button"
                  onClick={() => {
                    const next = !mentorDemoMode;
                    setMentorDemoMode(next);
                    if (next) setSubTab('TRIAGE');
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    mentorDemoMode
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {mentorDemoMode ? 'Modo Mentor: ON' : 'Modo Mentor (Triagem)'}
                </button>
              )}

              <button
                type="button"
                onClick={() => setByokOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Cofre BYOK</span>
              </button>
            </div>
          )}
        </div>

        {/* Active Portal View */}
        {subTab === 'SUBMISSION' && (
          <PortalSubmissionForm
            onGoToProtocol={(protocol) => {
              setTrackedProtocol(protocol);
              setSubTab('PROTOCOL');
            }}
          />
        )}

        {subTab === 'PROTOCOL' && (
          <PortalProtocolTracker initialProtocol={trackedProtocol} />
        )}

        {subTab === 'TRIAGE' && canSeeTriage && (
          <PortalTriagePanel
            isPublicDemoMode={isPublicMode}
            onJumpToOrbitRoom={(demandId) => openDemandRoom(demandId)}
          />
        )}
      </div>

      <PortalByokModal isOpen={byokOpen} onClose={() => setByokOpen(false)} />
    </div>
  );
};
