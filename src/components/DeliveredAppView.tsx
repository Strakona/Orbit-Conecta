import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Flower2,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { UnifiedPreview } from './UnifiedPreview';

interface DeliveredAppViewProps {
  demandId: string;
  onBackHome: () => void;
  onOpenPortal?: (protocol?: string) => void;
}

export const DeliveredAppView: React.FC<DeliveredAppViewProps> = ({
  demandId,
  onBackHome,
  onOpenPortal,
}) => {
  const { state, syncStatus, confirmDeliveryReceipt, pushToast } = useOrbit();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const demand = state.demands.find((d) => d.id === demandId);
  const linkedSub = state.portalSubmissions.find(
    (s) => s.linkedDemandId === demandId
  );

  const appUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?app=${encodeURIComponent(demandId)}`
      : `/?app=${demandId}`;

  const handleCopyAppUrl = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopiedLink(true);
      pushToast('Link do aplicativo copiado!', appUrl, 'success');
      window.setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      pushToast('Copie o link na barra do navegador', appUrl, 'info');
    }
  };

  if (!demand) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <header className="bg-[#0B132B] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display font-bold text-sm sm:text-base">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Orbit Conecta · Solução Digital SMED Cianorte</span>
          </div>
          <button
            type="button"
            onClick={onBackHome}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar ao Início</span>
          </button>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-7 text-center shadow-sm space-y-3">
            <Sparkles className="w-10 h-10 text-sky-500 mx-auto" />
            <h2 className="font-display font-bold text-lg text-slate-900">
              {syncStatus === 'CONNECTING'
                ? 'Carregando aplicativo da nuvem...'
                : 'Aplicativo ainda não encontrado'}
            </h2>
            <p className="text-xs text-slate-600">
              {syncStatus === 'CONNECTING'
                ? 'Aguardando sincronização com o Firebase Firestore.'
                : 'Verifique se o link está correto ou consulte pelo número de protocolo no Portal.'}
            </p>
            <button
              type="button"
              onClick={onBackHome}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold cursor-pointer"
            >
              Ir para o Início
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-[#0B132B] text-white border-b border-slate-800 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackHome}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Início</span>
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-display font-bold text-sm sm:text-base">
                  {demand.artifacts.ui.appTitle}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-[10px] font-bold flex items-center gap-1">
                  <Flower2 className="w-3 h-3" />
                  <span>{demand.status === 'ENTREGUE' ? 'Entrega Oficial CEMI 2' : 'Pré-visualização'}</span>
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                {demand.secretaria} · Desenvolvido pelas Turmas AH/SD (SMED Cianorte)
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {linkedSub && onOpenPortal && (
              <button
                type="button"
                onClick={() => onOpenPortal(linkedSub.protocol)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-sky-300" />
                <span>Protocolo {linkedSub.protocol}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyAppUrl}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copiado!' : 'Copiar Link do App'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 space-y-5">
        <UnifiedPreview demand={demand} />

        {/* Requester Delivery Receipt & Feedback Card */}
        {linkedSub && demand.status === 'ENTREGUE' && (
          <div className="bg-white rounded-3xl border-2 border-emerald-200 p-5 sm:p-6 shadow-sm space-y-4">
            {linkedSub.deliveryConfirmation ? (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-display font-bold text-sm text-emerald-950">
                      Recebimento Confirmado pelo Solicitante ({linkedSub.requesterName})
                    </div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      Avaliação: {'⭐'.repeat(linkedSub.deliveryConfirmation.rating)} (
                      {linkedSub.deliveryConfirmation.rating}/5)
                    </div>
                    {linkedSub.deliveryConfirmation.comment && (
                      <p className="text-xs text-slate-700 mt-1.5 italic">
                        "{linkedSub.deliveryConfirmation.comment}"
                      </p>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                  Entrega Validada
                </span>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  confirmDeliveryReceipt(linkedSub.id, rating, comment);
                }}
                className="space-y-3"
              >
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Você solicitou esta solução? Confirme o recebimento!</span>
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Solicitante: <strong>{linkedSub.requesterName}</strong> ({linkedSub.organization}) ·
                    Protocolo <code>{linkedSub.protocol}</code>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Avaliação:</span>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setRating(n)}
                      className={`p-1.5 rounded-lg border cursor-pointer transition ${
                        n <= rating
                          ? 'bg-amber-100 border-amber-300 text-amber-600'
                          : 'bg-slate-50 border-slate-200 text-slate-300'
                      }`}
                    >
                      <Star className="w-4 h-4 fill-current" />
                    </button>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Deixe um recado para os estudantes do CEMI 2 (opcional)..."
                    className="flex-1 rounded-xl border border-slate-300 px-3.5 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                  >
                    Confirmar Recebimento & Aprovar
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Solução digital pública · Laboratório de Inovação Pedagógica (CEMI 2 / SMED Cianorte).
          </span>
        </div>
      </main>
    </div>
  );
};
