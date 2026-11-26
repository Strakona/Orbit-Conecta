import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Mail,
  MessageCircle,
  Sparkles,
  X,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { Demand, PortalSubmission } from '../types';

interface ApprovalNotifyModalProps {
  submission: PortalSubmission | null;
  demand: Demand | null;
  onClose: () => void;
  onOpenRoom?: (demandId: string) => void;
}

export function buildApprovalNotificationText(submission: PortalSubmission): {
  protocolUrl: string;
  message: string;
  whatsappHref: string;
  mailtoHref: string;
} {
  const origin =
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://orbit-conecta-v2.vercel.app';
  const protocolUrl = `${origin}/?protocolo=${encodeURIComponent(submission.protocol)}`;

  const message = [
    `Olá, ${submission.requesterName}! 🚀`,
    `Sua demanda "${submission.title}" (${submission.organization}) — protocolo ${submission.protocol} — foi APROVADA pela Coordenação SMED e já vai ser produzida pelas Turmas AH/SD no Laboratório Orbit Conecta (SMED Cianorte)!`,
    '',
    `📋 Acompanhe cada etapa em tempo real pelo link: ${protocolUrl}`,
  ].join('\n');

  const rawDigits = (submission.requesterWhatsapp ?? '').replace(/\D/g, '');
  const waPhone =
    rawDigits.length === 10 || rawDigits.length === 11
      ? `55${rawDigits}`
      : rawDigits.length >= 12
      ? rawDigits
      : '';
  const whatsappHref = waPhone
    ? `https://wa.me/${waPhone}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  const subject = `[Orbit Conecta · ${submission.protocol}] Demanda aprovada para produção no Laboratório`;
  const mailtoHref = `mailto:${encodeURIComponent(
    submission.requesterEmail ?? ''
  )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;

  return { protocolUrl, message, whatsappHref, mailtoHref };
}

export const ApprovalNotifyModal: React.FC<ApprovalNotifyModalProps> = ({
  submission,
  demand,
  onClose,
  onOpenRoom,
}) => {
  const { pushToast } = useOrbit();
  const [copied, setCopied] = useState(false);

  if (!submission) return null;

  const { protocolUrl, message, whatsappHref, mailtoHref } =
    buildApprovalNotificationText(submission);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      pushToast('Mensagem de notificação copiada!', undefined, 'success');
      window.setTimeout(() => setCopied(false), 2500);
    } catch {
      pushToast('Copie o texto manualmente', message, 'info');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Demanda Aprovada — Notificar Solicitante"
      className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
    >
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-emerald-200 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-700 to-[#0B132B] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base">
                Demanda Aprovada para Produção!
              </h3>
              <p className="text-[11px] text-emerald-200">
                Protocolo {submission.protocol} · Sala "{demand?.shortName ?? submission.title}" aberta no Laboratório
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar janela de notificação"
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Solicitante notificado no Protocolo em tempo real</span>
            </div>
            <p className="text-emerald-900/90">
              <strong>{submission.requesterName}</strong> ({submission.organization}) já vê o aviso de
              aprovação na consulta do protocolo{' '}
              <code className="font-bold">{submission.protocol}</code>. Envie também o aviso direto
              abaixo:
            </p>
            {(submission.requesterWhatsapp || submission.requesterEmail) && (
              <div className="pt-1 flex flex-wrap gap-2 text-[11px]">
                {submission.requesterWhatsapp && (
                  <span className="px-2 py-0.5 rounded-full bg-white border border-emerald-200 font-semibold">
                    📱 {submission.requesterWhatsapp}
                  </span>
                )}
                {submission.requesterEmail && (
                  <span className="px-2 py-0.5 rounded-full bg-white border border-emerald-200 font-semibold">
                    ✉️ {submission.requesterEmail}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-slate-700">
              Mensagem pronta para {submission.requesterName}:
            </label>
            <textarea
              readOnly
              rows={4}
              value={message}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 p-3 text-xs leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Enviar WhatsApp</span>
            </a>

            <a
              href={mailtoHref}
              className="py-2.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Mail className="w-4 h-4" />
              <span>Enviar E-mail</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar Aviso'}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500 truncate max-w-xs" title={protocolUrl}>
              Link: {protocolUrl}
            </span>

            {demand && onOpenRoom ? (
              <button
                type="button"
                onClick={() => {
                  const id = demand.id;
                  onClose();
                  onOpenRoom(id);
                }}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <span>Abrir Sala no Orbit Conecta</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold cursor-pointer"
              >
                Concluir
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
