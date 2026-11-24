import React, { useState } from 'react';
import { Bot, Send, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { STAGE_META, TUTOR_PERSONAS } from '../data/seedData';
import { askSocraticTutor } from '../services/geminiService';
import { Demand, StageKey, TutorPersonaId } from '../types';

interface SocraticTutorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  demand: Demand;
  activeStage: StageKey;
}

interface ChatMsg {
  role: 'user' | 'tutor';
  text: string;
  mode?: 'GEMINI_LIVE' | 'SIMULADO';
}

export const SocraticTutorDrawer: React.FC<SocraticTutorDrawerProps> = ({
  isOpen,
  onClose,
  demand,
  activeStage,
}) => {
  const { state, addAuditLog } = useOrbit();
  const [personaId, setPersonaId] = useState<TutorPersonaId>('GERAL');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      role: 'tutor',
      text: `Olá! Estou aqui como seu Tutor Socrático na bancada "${STAGE_META[activeStage].shortLabel}" do projeto "${demand.shortName}". Não entrego respostas prontas, mas faço perguntas que destravam suas ideias! Qual é sua dúvida agora?`,
    },
  ]);

  if (!isOpen) return null;

  const activePersona =
    TUTOR_PERSONAS.find((p) => p.id === personaId) ?? TUTOR_PERSONAS[0];
  const currentStudent =
    state.students.find((s) => s.id === state.session?.studentId) ?? state.students[0];

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput('');
    const nextHistory = [...messages, { role: 'user' as const, text }];
    setMessages(nextHistory);
    setLoading(true);

    const response = await askSocraticTutor({
      apiKey: state.geminiApiKey,
      studentUuid: currentStudent.uuid, // LGPD: anonymized UUID only
      demandTitle: demand.title,
      secretaria: demand.secretaria,
      stageKey: activeStage,
      personaId,
      userMessage: text,
      history: nextHistory.map((m) => ({ role: m.role, text: m.text })),
    });

    setMessages((prev) => [
      ...prev,
      { role: 'tutor', text: response.reply, mode: response.mode },
    ]);

    addAuditLog({
      studentUuid: currentStudent.uuid,
      demandId: demand.id,
      demandTitle: demand.title,
      stageKey: activeStage,
      personaId,
      userMessage: text,
      tutorReply: response.reply,
      mode: response.mode,
    });

    setLoading(false);
  };

  return (
    <aside className="fixed inset-y-0 right-0 z-50 w-full sm:w-[400px] bg-white border-l border-slate-200 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="bg-[#0B132B] text-white px-4 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/30 border border-indigo-400/50 flex items-center justify-center">
            <Bot className="w-5 h-5 text-sky-300" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm flex items-center gap-1.5">
              <span>Tutores Socráticos IA</span>
              <span
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                  state.geminiApiKey
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-sky-500/20 text-sky-200'
                }`}
              >
                {state.geminiApiKey ? 'Gemini 2.5' : 'Simulado'}
              </span>
            </h3>
            <p className="text-[10px] text-slate-300">
              Bancada: {STAGE_META[activeStage].shortLabel}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* LGPD Privacy Banner */}
      <div className="px-3.5 py-2 bg-emerald-50 border-b border-emerald-200 text-[11px] text-emerald-900 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          LGPD ativa: sessão anonimizada como <code>{currentStudent.uuid}</code>
        </span>
      </div>

      {/* 5 Persona Tabs */}
      <div className="p-2.5 bg-slate-50 border-b border-slate-200">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
          Escolha a Persona Mentora (5):
        </div>
        <div className="flex flex-wrap gap-1.5">
          {TUTOR_PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPersonaId(p.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                personaId === p.id
                  ? 'bg-slate-900 text-white border-slate-900'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="mt-2 text-[11px] text-slate-600 bg-white rounded-lg border border-slate-200 px-2.5 py-1.5">
          <strong>{activePersona.role}:</strong> {activePersona.specialty}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-3 bg-slate-50/70">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-800'
              }`}
            >
              {m.role === 'tutor' && (
                <div className="text-[10px] font-bold text-indigo-700 mb-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{activePersona.name}</span>
                </div>
              )}
              {m.text}
              {m.mode && (
                <div className="text-[9px] text-slate-400 mt-1">
                  {m.mode === 'GEMINI_LIVE' ? 'Gemini 2.5 Flash' : 'Simulador Socrático'}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="text-xs text-slate-500 italic">Pensando em uma boa pergunta...</div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="px-3 py-2 bg-white border-t border-slate-100 flex flex-wrap gap-1">
        {[
          'Como melhorar essa bancada?',
          'Me dê uma pista sem entregar pronto',
          'O que pode dar errado nos testes?',
        ].map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => setInput(suggestion)}
            className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-700 cursor-pointer"
          >
            {suggestion}
          </button>
        ))}
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Conte o que você está pensando..."
          className="flex-1 rounded-xl border border-slate-300 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
