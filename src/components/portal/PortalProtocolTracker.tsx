import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  Flower2,
  MessageCircle,
  Search,
  Send,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { useOrbit } from '../../context/OrbitContext';
import { Demand, PortalSubmission } from '../../types';
import { UnifiedPreview } from '../UnifiedPreview';

interface PortalProtocolTrackerProps {
  initialProtocol?: string;
}

const STEPS = [
  'Recebida',
  'Em Triagem',
  'Em Desenvolvimento no Laboratório',
  'Em Modo Teste',
  'Entregue na Vitrine Pública',
];

function computeTimelineStep(
  sub: PortalSubmission,
  linkedDemand?: Demand
): number {
  if (linkedDemand) {
    if (linkedDemand.status === 'ENTREGUE') return 4;
    if (linkedDemand.status === 'MODO_TESTE') return 3;
    return 2;
  }
  if (sub.status === 'APROVADA_ORBIT') return 2;
  if (sub.status === 'EM_REVISAO' || sub.status === 'AJUSTE_SOLICITADO') return 1;
  return 0;
}

function statusPill(sub: PortalSubmission, linkedDemand?: Demand): { label: string; cls: string } {
  if (linkedDemand?.status === 'ENTREGUE') {
    return {
      label: 'Entregue na Vitrine Pública',
      cls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    };
  }
  if (linkedDemand?.status === 'MODO_TESTE') {
    return {
      label: 'Em Modo Teste Coletivo',
      cls: 'bg-amber-100 text-amber-800 border-amber-300',
    };
  }
  if (sub.status === 'APROVADA_ORBIT') {
    return {
      label: 'Em Desenvolvimento no Laboratório',
      cls: 'bg-sky-100 text-sky-800 border-sky-300',
    };
  }
  if (sub.status === 'AJUSTE_SOLICITADO') {
    return {
      label: 'Aguardando Esclarecimento',
      cls: 'bg-amber-100 text-amber-900 border-amber-300',
    };
  }
  if (sub.status === 'ARQUIVADA') {
    return {
      label: 'Arquivada',
      cls: 'bg-slate-200 text-slate-700 border-slate-300',
    };
  }
  if (sub.status === 'EM_REVISAO') {
    return {
      label: 'Em Revisão pelo Mentor',
      cls: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    };
  }
  return {
    label: 'Recebida · Pendente de Triagem',
    cls: 'bg-slate-100 text-slate-800 border-slate-300',
  };
}

export const PortalProtocolTracker: React.FC<PortalProtocolTrackerProps> = ({
  initialProtocol,
}) => {
  const { state, replyToSubmissionClarification, confirmDeliveryReceipt, pushToast } = useOrbit();
  const [query, setQuery] = useState(initialProtocol ?? '');
  const [selectedId, setSelectedId] = useState<string>(() => {
    if (initialProtocol) {
      const match = state.portalSubmissions.find(
        (s) => s.protocol.toLowerCase() === initialProtocol.toLowerCase()
      );
      if (match) return match.id;
    }
    return state.portalSubmissions[0]?.id ?? '';
  });
  const [replyText, setReplyText] = useState('');
  const [previewDemand, setPreviewDemand] = useState<Demand | null>(null);
  const [rating, setRating] = useState(5);
  const [receiptComment, setReceiptComment] = useState('');
  const [copiedAppLink, setCopiedAppLink] = useState(false);

  useEffect(() => {
    if (!initialProtocol) return;
    setQuery(initialProtocol);
    const match = state.portalSubmissions.find(
      (s) => s.protocol.toLowerCase() === initialProtocol.toLowerCase()
    );
    if (match) setSelectedId(match.id);
  }, [initialProtocol, state.portalSubmissions]);

  const filtered = state.portalSubmissions.filter((s) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      s.protocol.toLowerCase().includes(q) ||
      s.title.toLowerCase().includes(q) ||
      s.organization.toLowerCase().includes(q)
    );
  });

  const activeSubmission =
    filtered.find((s) => s.id === selectedId) ??
    filtered[0] ??
    state.portalSubmissions.find((s) => s.id === selectedId);

  const linkedDemand = activeSubmission?.linkedDemandId
    ? state.demands.find((d) => d.id === activeSubmission.linkedDemandId)
    : undefined;

  const activeStep = activeSubmission
    ? computeTimelineStep(activeSubmission, linkedDemand)
    : 0;

  const prevStatusRef = useRef<{ id: string; status: string } | null>(null);
  useEffect(() => {
    if (!activeSubmission) return;
    const prev = prevStatusRef.current;
    if (
      prev &&
      prev.id === activeSubmission.id &&
      prev.status !== 'APROVADA_ORBIT' &&
      activeSubmission.status === 'APROVADA_ORBIT'
    ) {
      pushToast(
        '🎉 Sua demanda foi aprovada!',
        'A Coordenação SMED liberou sua demanda para produção no Laboratório.',
        'success'
      );
    }
    prevStatusRef.current = { id: activeSubmission.id, status: activeSubmission.status };
  }, [activeSubmission, pushToast]);

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSubmission || !replyText.trim()) return;
    replyToSubmissionClarification(activeSubmission.id, replyText);
    setReplyText('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left: Search & Protocol List */}
      <div className="lg:col-span-4 space-y-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <h3 className="font-display font-bold text-sm text-slate-900">
            Consultar Protocolo
          </h3>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: SMED-2026-0102 ou escola..."
              className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="space-y-2 max-h-[540px] overflow-y-auto pr-1">
          {filtered.map((sub) => {
            const dem = sub.linkedDemandId
              ? state.demands.find((d) => d.id === sub.linkedDemandId)
              : undefined;
            const pill = statusPill(sub, dem);
            const isSelected = activeSubmission?.id === sub.id;

            return (
              <button
                key={sub.id}
                onClick={() => setSelectedId(sub.id)}
                className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-200 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[11px] text-slate-700">
                    {sub.protocol}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${pill.cls}`}
                  >
                    {pill.label}
                  </span>
                </div>
                <div className="font-display font-bold text-xs text-slate-900 mt-1.5 line-clamp-1">
                  {sub.title}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                  {sub.organization}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right: Protocol Details & Synchronized Timeline */}
      <div className="lg:col-span-8">
        {!activeSubmission ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-sm text-slate-500">
            Nenhum protocolo encontrado para a busca informada.
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                    {activeSubmission.protocol}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      statusPill(activeSubmission, linkedDemand).cls
                    }`}
                  >
                    {statusPill(activeSubmission, linkedDemand).label}
                  </span>
                </div>
                <h2 className="font-display font-bold text-xl text-slate-900 mt-2">
                  {activeSubmission.title}
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {activeSubmission.organization} · Solicitante:{' '}
                  <strong>{activeSubmission.requesterName}</strong> ({activeSubmission.requesterRole})
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    const url = `${window.location.origin}/?protocolo=${encodeURIComponent(
                      activeSubmission.protocol
                    )}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      pushToast('Link do protocolo copiado!', url, 'info');
                    } catch {
                      pushToast('Link do protocolo', url, 'info');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </button>

                {linkedDemand &&
                  (linkedDemand.status === 'ENTREGUE' || linkedDemand.status === 'MODO_TESTE') && (
                    <button
                      onClick={() => setPreviewDemand(linkedDemand)}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Abrir Solução</span>
                    </button>
                  )}
              </div>
            </div>

            {/* 5-Stage Synchronized Stepper */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">
                Linha do Tempo (Sincronizada com o Orbit Conecta):
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                {STEPS.map((label, idx) => {
                  const done = idx <= activeStep;
                  const current = idx === activeStep;
                  return (
                    <div
                      key={label}
                      className={`p-3 rounded-2xl border text-xs transition ${
                        current
                          ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                          : done
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold">
                        {done ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>Etapa {idx + 1}</span>
                      </div>
                      <div className="text-[11px] mt-1 font-medium leading-snug">{label}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Friendly AI Summary */}
            <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-1.5">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-sky-600" />
                <span>Resumo da Solução Digital (Lab. Inovação)</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {activeSubmission.analysis.friendlySummary}
              </p>
            </div>

            {/* Live Approval Notification Banner (while in production or test mode) */}
            {activeSubmission.status === 'APROVADA_ORBIT' &&
              linkedDemand?.status !== 'ENTREGUE' && (
                <div className="rounded-2xl border-2 border-sky-300 bg-gradient-to-r from-sky-50 to-emerald-50 p-4 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-display font-bold text-sm text-sky-950 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        🎉 Demanda Aprovada — Vai ser produzida pelas Turmas AH/SD no Laboratório!
                      </span>
                    </div>
                    {activeSubmission.approvedAt && (
                      <span className="text-[11px] font-semibold text-sky-800">
                        Aprovada em{' '}
                        {new Date(activeSubmission.approvedAt).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {activeSubmission.approvalNote ??
                      'Sua demanda já foi liberada na Sala de Demandas do Orbit Conecta para criação pelos estudantes das Turmas AH/SD.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    {activeSubmission.approvedBy && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-sky-200 font-semibold">
                        Aprovada por: {activeSubmission.approvedBy}
                      </span>
                    )}
                    {linkedDemand && (
                      <span className="px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 font-semibold text-emerald-800">
                        Sala ativa: {linkedDemand.shortName}
                      </span>
                    )}
                  </div>
                </div>
              )}

            {/* Official Delivery Card + Requester Confirmation */}
            {linkedDemand?.status === 'ENTREGUE' && (
              <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/70 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-display font-bold text-sm text-emerald-950 flex items-center gap-2">
                    <Flower2 className="w-4 h-4 text-emerald-600" />
                    <span>🎉 Solução Oficial Entregue à Comunidade!</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewDemand(linkedDemand)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Usar / Testar Aplicativo</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const url = `${window.location.origin}/?app=${encodeURIComponent(
                          linkedDemand.id
                        )}`;
                        try {
                          await navigator.clipboard.writeText(url);
                          setCopiedAppLink(true);
                          pushToast('Link direto do app copiado!', url, 'success');
                          window.setTimeout(() => setCopiedAppLink(false), 2500);
                        } catch {
                          pushToast('Link direto do app', url, 'info');
                        }
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedAppLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedAppLink ? 'Copiado!' : 'Link Direto do App'}</span>
                    </button>
                  </div>
                </div>

                {activeSubmission.deliveryConfirmation ? (
                  <div className="p-3 rounded-xl bg-white border border-emerald-200 text-xs text-slate-800 space-y-1">
                    <div className="font-bold text-emerald-800">
                      ✅ Recebimento confirmado por {activeSubmission.requesterName} ·{' '}
                      {'⭐'.repeat(activeSubmission.deliveryConfirmation.rating)} (
                      {activeSubmission.deliveryConfirmation.rating}/5)
                    </div>
                    {activeSubmission.deliveryConfirmation.comment && (
                      <p className="italic text-slate-600">
                        "{activeSubmission.deliveryConfirmation.comment}"
                      </p>
                    )}
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      confirmDeliveryReceipt(activeSubmission.id, rating, receiptComment);
                      setReceiptComment('');
                    }}
                    className="p-3 rounded-xl bg-white border border-emerald-200 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Confirmar Recebimento & Avaliar Entrega:
                      </span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setRating(n)}
                            className={`p-1 rounded border cursor-pointer ${
                              n <= rating
                                ? 'bg-amber-100 border-amber-300 text-amber-600'
                                : 'bg-slate-50 border-slate-200 text-slate-300'
                            }`}
                          >
                            <Star className="w-3.5 h-3.5 fill-current" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={receiptComment}
                        onChange={(e) => setReceiptComment(e.target.value)}
                        placeholder="Comentário opcional sobre a solução entregue..."
                        className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                      >
                        Confirmar Recebimento
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Clarification Dialogue Loop */}
            {(activeSubmission.clarifications.length > 0 ||
              activeSubmission.status === 'AJUSTE_SOLICITADO') && (
              <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/50 p-4 space-y-3">
                <div className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <MessageCircle className="w-4 h-4 text-amber-600" />
                  <span>Conversa com o Mentor do Laboratório</span>
                </div>

                <div className="space-y-2">
                  {activeSubmission.clarifications.map((entry) => (
                    <div
                      key={entry.id}
                      className={`p-3 rounded-xl text-xs border ${
                        entry.author === 'MENTOR'
                          ? 'bg-white border-amber-200 text-slate-800'
                          : 'bg-sky-600 text-white border-sky-600 ml-6'
                      }`}
                    >
                      <div className="font-bold text-[10px] uppercase opacity-75 mb-1">
                        {entry.author === 'MENTOR' ? 'Professor Mentor · Lab. Inovação' : 'Sua Resposta'}
                      </div>
                      <p className="leading-relaxed">{entry.message}</p>
                    </div>
                  ))}
                </div>

                {activeSubmission.status === 'AJUSTE_SOLICITADO' && (
                  <form onSubmit={handleReplySubmit} className="flex flex-col sm:flex-row gap-2 pt-1">
                    <input
                      required
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Responda ao Mentor aqui para liberar a triagem..."
                      className="flex-1 rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Responder ao Laboratório</span>
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prototype Preview Modal */}
      {previewDemand && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="bg-[#0B132B] text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-emerald-300 font-bold">
                  Solução Digital · Laboratório de Inovação SMED Cianorte
                </span>
                <h3 className="font-display font-bold text-base">{previewDemand.title}</h3>
              </div>
              <button
                onClick={() => setPreviewDemand(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <UnifiedPreview demand={previewDemand} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
