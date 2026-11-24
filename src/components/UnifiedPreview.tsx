import React, { useEffect, useId, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CheckCircle2,
  Info,
  Layers,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { testProjectAssistant } from '../services/geminiService';
import { Demand, LogicRule } from '../types';
import { getAllUiFields, getUiScreens } from '../utils/uiScreens';

interface UnifiedPreviewProps {
  demand: Demand;
  compact?: boolean;
  preferredScreenId?: string;
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
      if (val === '' || target === '') return false;
      const a = Number(val);
      const b = Number(target);
      return !Number.isNaN(a) && !Number.isNaN(b) && a > b;
    }
    case 'menor_que': {
      if (val === '' || target === '') return false;
      const a = Number(val);
      const b = Number(target);
      return !Number.isNaN(a) && !Number.isNaN(b) && a < b;
    }
    default:
      return false;
  }
}

export const UnifiedPreview: React.FC<UnifiedPreviewProps> = ({
  demand,
  compact = false,
  preferredScreenId,
}) => {
  const { state } = useOrbit();
  const previewId = useId();
  const { ui, logic, ai } = demand.artifacts;

  const screens = useMemo(() => getUiScreens(ui), [ui]);
  const allFields = useMemo(() => getAllUiFields(ui), [ui]);

  const [activeScreenId, setActiveScreenId] = useState<string>(() =>
    preferredScreenId && screens.some((s) => s.id === preferredScreenId)
      ? preferredScreenId
      : screens[0].id
  );

  useEffect(() => {
    if (preferredScreenId && screens.some((s) => s.id === preferredScreenId)) {
      setActiveScreenId(preferredScreenId);
    }
  }, [preferredScreenId, screens]);

  useEffect(() => {
    if (!screens.some((s) => s.id === activeScreenId)) {
      setActiveScreenId(screens[0].id);
    }
  }, [screens, activeScreenId]);

  const activeScreen = screens.find((s) => s.id === activeScreenId) ?? screens[0];

  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    allFields.forEach((f) => {
      init[f.id] = f.type === 'select' ? f.options?.[0] ?? '' : '';
    });
    return init;
  });

  const [evalResult, setEvalResult] = useState<{
    title: string;
    message: string;
    severity: 'info' | 'success' | 'warning' | 'urgent';
    navigatedTo?: string;
  } | null>(null);

  useEffect(() => {
    setEvalResult(null);
  }, [demand.id]);

  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<
    { role: 'bot' | 'user'; text: string; mode?: string }[]
  >([{ role: 'bot', text: ai.greeting }]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setFormValues((prev) => {
      let changed = false;
      const next: Record<string, string> = {};
      allFields.forEach((f) => {
        if (f.type === 'select') {
          const opts = f.options ?? [];
          const existing = prev[f.id];
          if (existing !== undefined && opts.includes(existing)) {
            next[f.id] = existing;
          } else {
            next[f.id] = opts[0] ?? '';
            if (prev[f.id] !== next[f.id]) changed = true;
          }
        } else if (prev[f.id] !== undefined) {
          next[f.id] = prev[f.id];
        } else {
          next[f.id] = '';
          changed = true;
        }
      });
      if (!changed && Object.keys(prev).length === Object.keys(next).length) {
        return prev;
      }
      return next;
    });
  }, [allFields]);

  useEffect(() => {
    setChatMessages((prev) => {
      if (prev.length > 0 && prev[0].role === 'bot' && !prev[0].mode && prev[0].text !== ai.greeting) {
        return [{ ...prev[0], text: ai.greeting }, ...prev.slice(1)];
      }
      return prev;
    });
  }, [ai.greeting]);

  const handleRunLogic = (e: React.FormEvent) => {
    e.preventDefault();
    const screenFieldIds = new Set(activeScreen.fields.map((f) => f.id));
    const currentScreenRules = logic.rules.filter((r) => screenFieldIds.has(r.fieldId));
    const matched =
      currentScreenRules.find((rule) => evaluateRule(rule, formValues[rule.fieldId] ?? '')) ??
      logic.rules.find((rule) => evaluateRule(rule, formValues[rule.fieldId] ?? ''));

    const ruleTarget = matched?.targetScreenId
      ? screens.find((s) => s.id === matched.targetScreenId)
      : undefined;
    const ctaTarget = activeScreen.ctaTargetScreenId
      ? screens.find((s) => s.id === activeScreen.ctaTargetScreenId)
      : undefined;
    const redirectTarget = ruleTarget ?? ctaTarget;

    if (matched) {
      setEvalResult({
        title: matched.resultTitle,
        message: matched.resultMessage,
        severity: matched.severity,
        navigatedTo: redirectTarget?.name,
      });
    } else {
      setEvalResult({
        title: 'Resultado do Sistema',
        message: logic.defaultMessage,
        severity: 'info',
        navigatedTo: redirectTarget?.name,
      });
    }

    if (redirectTarget) {
      setActiveScreenId(redirectTarget.id);
    }
  };

  const handleStandaloneCta = () => {
    if (activeScreen.ctaTargetScreenId) {
      const target = screens.find((s) => s.id === activeScreen.ctaTargetScreenId);
      if (target) {
        setActiveScreenId(target.id);
        return;
      }
    }
    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
    handleRunLogic(fakeEvent);
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

  const navStyle = ui.navigationStyle ?? 'tabs';
  const hasMultipleScreens = screens.length > 1;
  const primaryColor = ui.primaryColor || '#0284C7';
  const accentColor = ui.accentColor || '#10B981';

  const renderScreenNavButtons = (layout: 'tabs' | 'bottom' | 'sidebar') => {
    if (!hasMultipleScreens) return null;
    if (layout === 'sidebar') {
      return (
        <nav
          aria-label="Telas do aplicativo"
          className="sm:w-36 shrink-0 bg-white border border-slate-200 rounded-2xl p-2 flex sm:flex-col gap-1 overflow-x-auto"
        >
          {screens.map((scr, idx) => {
            const isCurrent = scr.id === activeScreen.id;
            return (
              <button
                key={scr.id}
                type="button"
                onClick={() => setActiveScreenId(scr.id)}
                style={isCurrent ? { backgroundColor: primaryColor } : undefined}
                className={`px-2.5 py-2 rounded-xl text-left text-[11px] font-bold transition whitespace-nowrap sm:whitespace-normal cursor-pointer ${
                  isCurrent
                    ? 'text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className="opacity-70 mr-1">{idx + 1}.</span>
                {scr.name}
              </button>
            );
          })}
        </nav>
      );
    }

    if (layout === 'bottom') {
      return (
        <nav
          aria-label="Telas do aplicativo"
          className="bg-white border border-slate-200 rounded-2xl p-1.5 grid gap-1 shadow-xs"
          style={{ gridTemplateColumns: `repeat(${Math.min(screens.length, 4)}, minmax(0, 1fr))` }}
        >
          {screens.map((scr, idx) => {
            const isCurrent = scr.id === activeScreen.id;
            return (
              <button
                key={scr.id}
                type="button"
                onClick={() => setActiveScreenId(scr.id)}
                style={isCurrent ? { color: primaryColor } : undefined}
                className={`py-1.5 px-2 rounded-xl text-center text-[11px] font-bold transition truncate cursor-pointer ${
                  isCurrent ? 'bg-slate-100' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className="block text-[9px] opacity-70">Tela {idx + 1}</span>
                <span className="truncate block">{scr.name}</span>
              </button>
            );
          })}
        </nav>
      );
    }

    return (
      <nav
        aria-label="Telas do aplicativo"
        className="flex flex-wrap items-center gap-1.5 bg-white border border-slate-200 rounded-2xl p-1.5 shadow-xs"
      >
        {screens.map((scr, idx) => {
          const isCurrent = scr.id === activeScreen.id;
          return (
            <button
              key={scr.id}
              type="button"
              onClick={() => setActiveScreenId(scr.id)}
              style={isCurrent ? { backgroundColor: primaryColor } : undefined}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                isCurrent ? 'text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {idx + 1}. {scr.name}
            </button>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="rounded-2xl border-2 border-slate-200 bg-white shadow-md overflow-hidden">
      {/* Simulated App Header */}
      <div
        className="px-5 py-4 text-white flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: primaryColor }}
      >
        <div>
          <div className="text-[10px] uppercase tracking-wider opacity-85 font-semibold">
            Simulador Unificado · {demand.secretaria}
          </div>
          <h3 className="font-display font-bold text-lg leading-tight">{ui.appTitle}</h3>
          <p className="text-xs opacity-90 mt-0.5">{ui.appSubtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {hasMultipleScreens && (
            <span className="px-2.5 py-1 rounded-full bg-black/20 text-[11px] font-semibold backdrop-blur-sm inline-flex items-center gap-1">
              <Layers className="w-3 h-3" />
              {screens.length} telas
            </span>
          )}
          <span className="px-2.5 py-1 rounded-full bg-white/20 text-[11px] font-semibold backdrop-blur-sm">
            {demand.status === 'MODO_TESTE'
              ? 'Modo Teste Coletivo'
              : demand.status === 'ENTREGUE'
              ? 'Entregue SMED'
              : 'Preview ao Vivo'}
          </span>
        </div>
      </div>

      <div className={`p-4 sm:p-5 grid grid-cols-1 ${compact ? '' : 'lg:grid-cols-12'} gap-5 bg-slate-50/70`}>
        {/* Left: Multi-Screen UI + Logic Evaluation */}
        <div className={`${compact ? '' : 'lg:col-span-7'} space-y-3.5`}>
          {navStyle === 'tabs' && renderScreenNavButtons('tabs')}

          <div className={navStyle === 'sidebar' && hasMultipleScreens ? 'flex flex-col sm:flex-row gap-3 items-stretch' : 'space-y-3.5'}>
            {navStyle === 'sidebar' && renderScreenNavButtons('sidebar')}

            <div className="flex-1 space-y-3.5 min-w-0">
              {/* Active Screen Sub-header when multi-screen */}
              {hasMultipleScreens && (
                <div className="rounded-xl bg-white border border-slate-200 px-3.5 py-2.5 shadow-xs">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {activeScreen.name}
                  </div>
                  <div className="font-display font-bold text-sm text-slate-900">
                    {activeScreen.title}
                  </div>
                  {activeScreen.subtitle && (
                    <p className="text-[11px] text-slate-600 mt-0.5">{activeScreen.subtitle}</p>
                  )}
                </div>
              )}

              {/* Info Cards */}
              {activeScreen.infoCards.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeScreen.infoCards.map((card) => (
                    <div
                      key={card.id}
                      className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs"
                    >
                      <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block shrink-0"
                          style={{ backgroundColor: accentColor }}
                        />
                        {card.title}
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1">{card.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Interactive Form OR Standalone Navigation CTA */}
              {activeScreen.fields.length > 0 ? (
                <form
                  onSubmit={handleRunLogic}
                  className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 shadow-xs"
                >
                  {activeScreen.fields.map((field) => {
                    const inputId = `${previewId}-${activeScreen.id}-${field.id}`;
                    return (
                      <div key={field.id}>
                        <label htmlFor={inputId} className="block text-xs font-semibold text-slate-700 mb-1">
                          {field.label}
                        </label>
                        {field.type === 'select' ? (
                          <select
                            id={inputId}
                            name={field.id}
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
                            id={inputId}
                            name={field.id}
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
                    );
                  })}

                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm transition hover:opacity-95 cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    {activeScreen.ctaLabel || ui.ctaLabel || 'Executar Regra'}
                  </button>
                </form>
              ) : (
                (activeScreen.ctaTargetScreenId || activeScreen.ctaLabel) && (
                  <button
                    type="button"
                    onClick={handleStandaloneCta}
                    className="w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-sm transition hover:opacity-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    style={{ backgroundColor: accentColor }}
                  >
                    <span>{activeScreen.ctaLabel || 'Continuar'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )
              )}

              {/* Logic Evaluation Result */}
              {evalResult && (
                <div className={`rounded-2xl border p-3.5 text-xs ${severityStyles[evalResult.severity]}`}>
                  <div className="flex items-start justify-between gap-2">
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
                    <button
                      type="button"
                      onClick={() => setEvalResult(null)}
                      aria-label="Fechar resultado"
                      className="opacity-60 hover:opacity-100 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="mt-1 leading-relaxed">{evalResult.message}</p>
                  {evalResult.navigatedTo && (
                    <div className="mt-1.5 text-[10px] font-bold uppercase tracking-wide opacity-80">
                      Tela aberta automaticamente: {evalResult.navigatedTo}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {navStyle === 'bottom' && renderScreenNavButtons('bottom')}
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
              id={`${previewId}-chat-input`}
              name="assistantQuestion"
              aria-label="Pergunte ao assistente do projeto"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Pergunte ao assistente do projeto..."
              className="flex-1 rounded-xl border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <button
              type="submit"
              disabled={isSending}
              aria-label="Enviar pergunta ao assistente"
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
