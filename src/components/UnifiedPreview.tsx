import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Info,
  Send,
  Sparkles,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { testProjectAssistant } from '../services/geminiService';
import { Demand, LogicRule } from '../types';

interface UnifiedPreviewProps {
  demand: Demand;
  compact?: boolean;
}

function evaluateRule(rule: LogicRule, rawVal: string): boolean {
  const val = rawVal.trim();
  const target = rule.value.trim();

  switch (rule.operator) {
    case 'nao_vazio':
      return val.length > 0;
    case 'contem':
      return target.length > 0 && val.toLowerCase().includes(target.toLowerCase());
    case 'igual':
      return val.toLowerCase() === target.toLowerCase();
    case 'maior_que': {
      const a = Number(val);
      const b = Number(target);
      return !Number.isNaN(a) && !Number.isNaN(b) && a > b;
    }
    case 'menor_que': {
      const a = Number(val);
      const b = Number(target);
      return !Number.isNaN(a) && !Number.isNaN(b) && a < b;
    }
    default:
      return false;
  }
}

export const UnifiedPreview: React.FC<UnifiedPreviewProps> = ({ demand, compact = false }) => {
  const { state } = useOrbit();
  const { ui, logic, ai } = demand.artifacts;

  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    ui.fields.forEach((f) => {
      init[f.id] = f.type === 'select' ? f.options?.[0] ?? '' : '';
    });
    return init;
  });

  const [evalResult, setEvalResult] = useState<{
    title: string;
    message: string;
    severity: 'info' | 'success' | 'warning' | 'urgent';
  } | null>(null);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { role: 'bot' | 'user'; text: string; mode?: string }[]
  >([{ role: 'bot', text: ai.greeting }]);
  const [isSending, setIsSending] = useState(false);

  const handleRunLogic = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = logic.rules.find((rule) => evaluateRule(rule, formValues[rule.fieldId] ?? ''));
    if (matched) {
      setEvalResult({
        title: matched.resultTitle,
        message: matched.resultMessage,
        severity: matched.severity,
      });
    } else {
      setEvalResult({
        title: 'Resultado do Sistema',
        message: logic.defaultMessage,
        severity: 'info',
      });
    }
  };

  const handleAskAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = chatInput.trim();
    if (!q || isSending) return;
    setChatInput('');
    setChatMessages((prev) => [...prev, { role: 'user', text: q }]);
    setIsSending(true);
    const res = await testProjectAssistant({
      apiKey: state.geminiApiKey,
      aiArtifact: ai,
      demandTitle: demand.title,
      userQuestion: q,
    });
    setChatMessages((prev) => [
      ...prev,
      { role: 'bot', text: res.reply, mode: res.mode === 'GEMINI_LIVE' ? 'Gemini' : 'Simulado' },
    ]);
    setIsSending(false);
  };

  const severityStyles: Record<'info' | 'success' | 'warning' | 'urgent', string> = {
    info: 'bg-sky-50 border-sky-300 text-sky-900',
    success: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    warning: 'bg-amber-50 border-amber-300 text-amber-900',
    urgent: 'bg-rose-50 border-rose-300 text-rose-900',
  };

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
      {/* Simulated App Header */}
      <div
        className="px-5 py-4 text-white flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: ui.primaryColor || '#0284C7' }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-wider opacity-85 font-semibold">
            Simulador Unificado · {demand.secretaria}
          </div>
          <h3 className="font-display font-bold text-lg leading-tight">{ui.appTitle}</h3>
          <p className="text-xs opacity-90 mt-0.5">{ui.appSubtitle}</p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-semibold backdrop-blur-sm">
          {demand.status === 'MODO_TESTE'
            ? 'Modo Teste Coletivo'
            : demand.status === 'ENTREGUE'
            ? 'Entregue SMED'
            : 'Preview ao Vivo'}
        </span>
      </div>

      <div className={`p-4 sm:p-5 grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-12'} gap-5 bg-slate-50/70`}>
        {/* Left: UI + Logic Evaluation */}
        <div className={`${compact ? '' : 'lg:col-span-7'} space-y-4`}>
          {/* Info Cards */}
          {ui.infoCards.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ui.infoCards.map((card) => (
                <div
                  key={card.id}
                  className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs"
                >
                  <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full inline-block"
                      style={{ backgroundColor: ui.accentColor || '#10B981' }}
                    />
                    {card.title}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{card.description}</p>
                </div>
              ))}
            </div>
          )}

          {/* Interactive Form */}
          <form
            onSubmit={handleRunLogic}
            className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs"
          >
            {ui.fields.map((field) => (
              <div key={field.id}>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {field.label}
                </label>
                {field.type === 'select' ? (
                  <select
                    value={formValues[field.id] ?? ''}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {(field.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    value={formValues[field.id] ?? ''}
                    placeholder={field.placeholder}
                    onChange={(e) =>
                      setFormValues((prev) => ({ ...prev, [field.id]: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                )}
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm transition hover:opacity-95 cursor-pointer"
              style={{ backgroundColor: ui.accentColor || '#10B981' }}
            >
              {ui.ctaLabel || 'Executar Regra'}
            </button>
          </form>

          {/* Logic Evaluation Result */}
          {evalResult && (
            <div className={`rounded-2xl border p-3.5 text-xs ${severityStyles[evalResult.severity]}`}>
              <div className="font-bold flex items-center gap-1.5">
                {evalResult.severity === 'urgent' || evalResult.severity === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                ) : evalResult.severity === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <Info className="w-4 h-4 shrink-0" />
                )}
                <span>{evalResult.title}</span>
              </div>
              <p className="mt-1 leading-relaxed">{evalResult.message}</p>
            </div>
          )}
        </div>

        {/* Right: Configured Municipal AI Assistant */}
        <div
          className={`${
            compact ? '' : 'lg:col-span-5'
          } bg-white rounded-2xl border border-slate-200 flex flex-col overflow-hidden shadow-xs min-h-[290px] max-h-[380px]`}
        >
          <div className="px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-emerald-400" />
              <div>
                <div className="text-xs font-bold">{ai.assistantName}</div>
                <div className="text-[10px] text-slate-300 truncate max-w-[180px]">
                  {ai.persona}
                </div>
              </div>
            </div>
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-sky-600 text-white'
                      : 'bg-white border border-slate-200 text-slate-800'
                  }`}
                >
                  {msg.text}
                  {msg.mode && (
                    <div className="text-[9px] text-slate-400 mt-1">Motor: {msg.mode}</div>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="text-[11px] text-slate-500 italic">Assistente digitando...</div>
            )}
          </div>

          {/* Quick FAQ chips */}
          {ai.faqs.length > 0 && (
            <div className="px-2.5 py-1.5 bg-white border-t border-slate-100 flex flex-wrap gap-1">
              {ai.faqs.slice(0, 2).map((faq) => (
                <button
                  key={faq.id}
                  type="button"
                  onClick={() => setChatInput(faq.question)}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-700 truncate max-w-[170px] cursor-pointer"
                >
                  {faq.question}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleAskAssistant}
            className="p-2 border-t border-slate-200 bg-white flex items-center gap-1.5"
          >
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Pergunte ao assistente do projeto..."
              className="flex-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={isSending}
              className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
