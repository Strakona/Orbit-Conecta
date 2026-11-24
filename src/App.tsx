import React, { useState } from 'react';
import { X } from 'lucide-react';
import { CardsOverview } from './components/CardsOverview';
import { CoordinatorPanel } from './components/CoordinatorPanel';
import { DemandBoardModal } from './components/DemandBoardModal';
import { DemandRoom } from './components/DemandRoom';
import { Header } from './components/Header';
import { IsometricMap } from './components/IsometricMap';
import { LoginScreen } from './components/LoginScreen';
import { ProfessorPanel } from './components/ProfessorPanel';
import { PublicShowcase } from './components/PublicShowcase';
import { UnifiedPreview } from './components/UnifiedPreview';
import { OrbitProvider, useOrbit } from './context/OrbitContext';
import { Demand } from './types';

const OrbitWorkspace: React.FC = () => {
  const { state, toasts, dismissToast } = useOrbit();
  const [boardOpen, setBoardOpen] = useState(false);
  const [auditoriumDemand, setAuditoriumDemand] = useState<Demand | null>(null);

  if (!state.session) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col">
      <Header />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-3 sm:px-5 py-5">
        {state.activeTab === 'PROFESSOR' && <ProfessorPanel />}
        {state.activeTab === 'COORDENADOR' && <CoordinatorPanel />}
        {state.activeTab === 'VITRINE' && <PublicShowcase />}

        {state.activeTab === 'LAB' && (
          <>
            {state.activeDemandId ? (
              <DemandRoom key={state.activeDemandId} demandId={state.activeDemandId} />
            ) : state.viewMode === 'MAP' ? (
              <IsometricMap
                onOpenDemandBoard={() => setBoardOpen(true)}
                onOpenTestAuditorium={(d) => setAuditoriumDemand(d)}
              />
            ) : (
              <CardsOverview
                onOpenDemandBoard={() => setBoardOpen(true)}
                onOpenTestAuditorium={(d) => setAuditoriumDemand(d)}
              />
            )}
          </>
        )}
      </main>

      <DemandBoardModal isOpen={boardOpen} onClose={() => setBoardOpen(false)} />

      {/* Auditorium Collective Test Mode Modal */}
      {auditoriumDemand && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Auditório de Pitches"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-amber-300">
            <div className="bg-[#0B132B] text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-amber-300 font-bold">
                  Auditório de Pitches · Modo Teste Coletivo
                </span>
                <h3 className="font-display font-bold text-base">{auditoriumDemand.title}</h3>
              </div>
              <button
                onClick={() => setAuditoriumDemand(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <UnifiedPreview demand={auditoriumDemand} />
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="no-print fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-2xl border p-3.5 shadow-xl flex items-start justify-between gap-3 bg-white ${
              t.type === 'success'
                ? 'border-emerald-300'
                : t.type === 'warning'
                ? 'border-amber-300'
                : 'border-sky-300'
            }`}
          >
            <div>
              <div className="font-display font-bold text-xs text-slate-900">{t.title}</div>
              {t.description && (
                <p className="text-[11px] text-slate-600 mt-0.5">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export function App() {
  return (
    <OrbitProvider>
      <OrbitWorkspace />
    </OrbitProvider>
  );
}

export default App;
