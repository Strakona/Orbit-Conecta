import React, { useState } from 'react';
import { Eye, EyeOff, KeyRound, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { useOrbit } from '../../context/OrbitContext';
import { isDemoMode } from '../../utils/demoMode';

interface PortalByokModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PortalByokModal: React.FC<PortalByokModalProps> = ({ isOpen, onClose }) => {
  const { state, setGeminiApiKey, resetPortalDemoData, resetDemoData } = useOrbit();
  const [keyDraft, setKeyDraft] = useState(state.geminiApiKey);
  const [showKey, setShowKey] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#0B132B] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
              <KeyRound className="w-4 h-4 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base">
                Cofre BYOK & Dados Demo — SMED Cianorte
              </h3>
              <p className="text-[11px] text-slate-300">
                Configuração compartilhada com o ecossistema Orbit Conecta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Chave Gemini API (<code>gemini-2.5-flash</code>)
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  state.geminiApiKey
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-sky-100 text-sky-800'
                }`}
              >
                {state.geminiApiKey ? 'Gemini Live Ativo' : 'Fallback Simulado Ativo'}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Com a chave preenchida, o Portal usa Structured Outputs (<code>responseSchema</code>)
              reais da Gemini API para avaliar viabilidade digital e fatiar demandas nas 4 estações.
              Sem chave, o motor simulado inteligente garante funcionamento imediato.
            </p>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={keyDraft}
                  onChange={(e) => setKeyDraft(e.target.value)}
                  placeholder="AIzaSy... (opcional para demo)"
                  className="w-full rounded-xl border border-slate-300 pl-3 pr-9 py-2 text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => setGeminiApiKey(keyDraft)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </div>

          {isDemoMode() && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                <span>Restaurar Dados de Demonstração</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    resetPortalDemoData();
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-800 cursor-pointer"
                >
                  Resetar Apenas Portal de Demandas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetDemoData();
                    onClose();
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                >
                  Resetar Tudo (Orbit + Portal)
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>A chave é salva apenas no <code>localStorage</code> deste navegador (BYOK).</span>
          </div>
        </div>
      </div>
    </div>
  );
};
