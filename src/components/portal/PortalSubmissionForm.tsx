import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Loader2,
  School,
  Search,
  Sparkles,
} from 'lucide-react';
import { useOrbit } from '../../context/OrbitContext';
import { CIANORTE_ORGANIZATIONS, STATION_THEME } from '../../data/portalSeedData';
import { analyzePortalDemand } from '../../services/demandTriageService';
import { PortalSubmission, StageKey, UrgencyLevel } from '../../types';

interface PortalSubmissionFormProps {
  onGoToProtocol: (protocol: string) => void;
}

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

export const PortalSubmissionForm: React.FC<PortalSubmissionFormProps> = ({
  onGoToProtocol,
}) => {
  const { state, submitPortalDemand } = useOrbit();

  const [requesterName, setRequesterName] = useState('');
  const [requesterRole, setRequesterRole] = useState('');
  const [organization, setOrganization] = useState(CIANORTE_ORGANIZATIONS[0].label);
  const [organizationType, setOrganizationType] = useState<'ESCOLA' | 'SECRETARIA'>('ESCOLA');
  const [title, setTitle] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [targetAudienceAndImpact, setTargetAudienceAndImpact] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('MEDIA');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<PortalSubmission | null>(null);

  const handleOrgSelect = (label: string) => {
    setOrganization(label);
    const found = CIANORTE_ORGANIZATIONS.find((o) => o.label === label);
    if (found) setOrganizationType(found.type);
  };

  const fillExample = (kind: 'ESCOLA_DIGITAL' | 'HARDWARE_TESTE') => {
    if (kind === 'ESCOLA_DIGITAL') {
      setRequesterName('Profa. Juliana Martins');
      setRequesterRole('Diretora Escolar');
      setOrganization('Escola Municipal Castro Alves');
      setOrganizationType('ESCOLA');
      setTitle('Agenda Digital de Reforço e Apoio Escolar');
      setProblemDescription(
        'As famílias muitas vezes perdem o recado em papel sobre os horários do contraturno de reforço em português e matemática, e a secretaria da escola recebe dezenas de ligações por dia com dúvidas.'
      );
      setTargetAudienceAndImpact(
        '320 famílias e equipe da secretaria escolar; reduz ligações repetitivas e melhora a frequência no reforço.'
      );
      setUrgency('MEDIA');
    } else {
      setRequesterName('Marcos Antônio');
      setRequesterRole('Coordenador de Pátio');
      setOrganization('Secretaria Municipal de Meio Ambiente');
      setOrganizationType('SECRETARIA');
      setTitle('Totem Físico com Sensor e Balança Arduino na Coleta');
      setProblemDescription(
        'Queremos construir um totem físico com placa Arduino, sensor de peso e impressora térmica para pesar sacos de recicláveis na entrada do parque.'
      );
      setTargetAudienceAndImpact(
        'Visitantes do parque municipal; registrar o peso entregue.'
      );
      setUrgency('ALTA');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !problemDescription.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    const input = {
      requesterName: requesterName.trim() || 'Servidor Municipal',
      requesterRole: requesterRole.trim() || 'Gestor(a)',
      organization,
      organizationType,
      title: title.trim(),
      problemDescription: problemDescription.trim(),
      targetAudienceAndImpact:
        targetAudienceAndImpact.trim() || 'Comunidade escolar e cidadãos de Cianorte.',
      urgency,
    };

    const analysis = await analyzePortalDemand({
      apiKey: state.geminiApiKey,
      input,
    });

    const created = submitPortalDemand(input, analysis);
    setSubmittedRecord(created);
    setIsAnalyzing(false);
  };

  const handleResetForm = () => {
    setSubmittedRecord(null);
    setTitle('');
    setProblemDescription('');
    setTargetAudienceAndImpact('');
  };

  if (submittedRecord) {
    const { analysis } = submittedRecord;
    const isHardware = analysis.viabilityStatus === 'FORA_DE_ESCOPO_HARDWARE';

    return (
      <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-start gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                isHardware
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              {isHardware ? (
                <AlertTriangle className="w-6 h-6" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-sky-700">
                Solicitação Recebida · {submittedRecord.organization}
              </span>
              <h2 className="font-display font-bold text-2xl text-slate-900 mt-0.5">
                {submittedRecord.title}
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Análise preliminar via{' '}
                <strong>
                  {analysis.mode === 'GEMINI_LIVE'
                    ? 'Gemini 2.5 Flash (Ao Vivo)'
                    : 'Motor Inteligente CEMI 2'}
                </strong>
              </p>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-2xl bg-[#0B132B] text-white text-right">
            <div className="text-[10px] uppercase tracking-wider text-sky-300 font-semibold">
              Protocolo de Acompanhamento
            </div>
            <div className="font-mono font-bold text-lg tracking-wide">
              {submittedRecord.protocol}
            </div>
          </div>
        </div>

        {/* Friendly AI Summary */}
        <div
          className={`rounded-2xl border p-5 space-y-2 ${
            isHardware
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-sky-50/70 border-sky-200 text-slate-800'
          }`}
        >
          <div className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-sky-600" />
            <span>Como seu pedido pode virar solução digital no CEMI 2:</span>
          </div>
          <p className="text-sm leading-relaxed">{analysis.friendlySummary}</p>

          {isHardware && analysis.hardwareAdaptation && (
            <div className="mt-3 p-3.5 rounded-xl bg-white border border-amber-300 text-xs space-y-1">
              <div className="font-bold text-amber-900">
                Sugestão 100% Digital encaminhada ao Mentor: {analysis.hardwareAdaptation.suggestedTitle}
              </div>
              <p className="text-slate-700">{analysis.hardwareAdaptation.suggestedDescription}</p>
            </div>
          )}
        </div>

        {/* 4 Stations Preview */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Plano Modular Gerado para as Turmas AH/SD (4 Estações Orbit Conecta):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {STAGE_ORDER.map((k) => {
              const theme = STATION_THEME[k];
              const st = analysis.stations[k];
              return (
                <div
                  key={k}
                  className={`rounded-2xl border p-3.5 ${theme.cardCls}`}
                >
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${theme.badgeCls}`}
                  >
                    {theme.shortLabel}
                  </span>
                  <div className="font-display font-bold text-xs text-slate-900 mt-2">
                    {st.taskTitle}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">{st.objective}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleResetForm}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
          >
            Enviar Outra Demanda
          </button>

          <button
            type="button"
            onClick={() => onGoToProtocol(submittedRecord.protocol)}
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Acompanhar Protocolo {submittedRecord.protocol}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Intro Hero */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>SMED Cianorte · CEMI 2</span>
          </span>
          <h2 className="font-display font-bold text-xl sm:text-2xl text-slate-900">
            Conte qual desafio sua escola ou secretaria quer resolver
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Não precisa usar termos técnicos! Nossa equipe e os estudantes das <strong>Turmas AH/SD</strong>{' '}
            transformam problemas do dia a dia em <strong>aplicativos web e assistentes digitais com IA</strong>.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fillExample('ESCOLA_DIGITAL')}
            className="px-3 py-1.5 rounded-xl bg-fuchsia-50 hover:bg-fuchsia-100 border border-fuchsia-200 text-fuchsia-900 text-[11px] font-semibold cursor-pointer"
          >
            ⚡ Exemplo: Escola (Reforço)
          </button>
          <button
            type="button"
            onClick={() => fillExample('HARDWARE_TESTE')}
            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[11px] font-semibold cursor-pointer"
          >
            🔧 Exemplo: Pedido c/ Hardware
          </button>
        </div>
      </div>

      {/* Guided Form */}
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Seu nome completo *
            </label>
            <input
              required
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              placeholder="Ex.: Profa. Ana Paula Souza"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Cargo ou função *
            </label>
            <input
              required
              value={requesterRole}
              onChange={(e) => setRequesterRole(e.target.value)}
              placeholder="Ex.: Diretora, Coordenadora Pedagógica, Chefe de Setor"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Órgão / Unidade Solicitante (Escola ou Secretaria) *
            </label>
            <select
              value={organization}
              onChange={(e) => handleOrgSelect(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {CIANORTE_ORGANIZATIONS.map((org) => (
                <option key={org.label} value={org.label}>
                  {org.label}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Tipo de Unidade
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setOrganizationType('ESCOLA')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  organizationType === 'ESCOLA'
                    ? 'bg-sky-50 border-sky-500 text-sky-900'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <School className="w-3.5 h-3.5" />
                <span>Escola</span>
              </button>
              <button
                type="button"
                onClick={() => setOrganizationType('SECRETARIA')}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                  organizationType === 'SECRETARIA'
                    ? 'bg-sky-50 border-sky-500 text-sky-900'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Secretaria</span>
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Título curto da necessidade *
          </label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Controle de reserva do laboratório de informática ou Guia de vacinas para pais"
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Qual dificuldade vocês enfrentam hoje no dia a dia? *
          </label>
          <textarea
            required
            rows={3}
            value={problemDescription}
            onChange={(e) => setProblemDescription(e.target.value)}
            placeholder="Conte com suas palavras como esse problema acontece hoje e o que costuma dar errado ou atrasar..."
            className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Quem vai usar e o que melhora se resolvermos isso? *
            </label>
            <input
              required
              value={targetAudienceAndImpact}
              onChange={(e) => setTargetAudienceAndImpact(e.target.value)}
              placeholder="Ex.: Pais, professores ou moradores; reduz filas e evita retrabalho"
              className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Urgência percebida
            </label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as UrgencyLevel)}
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm"
            >
              <option value="BAIXA">Baixa (Planejamento)</option>
              <option value="MEDIA">Média (Semestre atual)</option>
              <option value="ALTA">Alta (Prioritária)</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-500">
            Escopo do laboratório: soluções 100% digitais (apps web e IA), sem hardware físico.
          </p>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold text-sm flex items-center gap-2 shadow-md transition cursor-pointer disabled:opacity-60"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analisando viabilidade com IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analisar com IA e Enviar Demanda</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
