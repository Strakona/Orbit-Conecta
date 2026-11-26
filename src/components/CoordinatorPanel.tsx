import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ClipboardCheck,
  Compass,
  ExternalLink,
  Eye,
  EyeOff,
  FileSearch,
  KeyRound,
  PlusCircle,
  Printer,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { STAGE_META, TUTOR_PERSONAS } from '../data/seedData';
import { Demand, PortalSubmission, StageKey } from '../types';
import { isDemoMode } from '../utils/demoMode';
import { ApprovalNotifyModal } from './ApprovalNotifyModal';
import { BadgePrintModal } from './BadgePrintModal';
import { SchoolTeachersManager } from './SchoolTeachersManager';
import { StudentBadgeManager } from './StudentBadgeManager';

const ALL_STAGES: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

export const CoordinatorPanel: React.FC = () => {
  const {
    state,
    syncStatus,
    createDemand,
    setGeminiApiKey,
    setTriagemAhsdUrl,
    createStaffMember,
    deleteStaffMember,
    purgeProductionDemoData,
    approveAndPublishSubmission,
    setActiveTab,
    openDemandRoom,
  } = useOrbit();
  const demo = isDemoMode();
  const [purgingDemo, setPurgingDemo] = useState(false);
  const [approvalNotifyTarget, setApprovalNotifyTarget] = useState<{
    submission: PortalSubmission;
    demand: Demand;
  } | null>(null);

  const pendingApprovals = state.portalSubmissions.filter(
    (s) => s.status === 'PENDENTE_TRIAGEM' || s.status === 'EM_REVISAO'
  );

  // New Demand Form
  const [title, setTitle] = useState('');
  const [shortName, setShortName] = useState('');
  const [secretaria, setSecretaria] = useState('Secretaria Municipal de Educação (SMED)');
  const [description, setDescription] = useState('');
  const [requiredStages, setRequiredStages] = useState<StageKey[]>([...ALL_STAGES]);

  // BYOK state & Triagem URL state
  const [apiKeyDraft, setApiKeyDraft] = useState(state.geminiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [triagemUrlDraft, setTriagemUrlDraft] = useState(state.triagemAhsdUrl ?? '');

  useEffect(() => {
    setApiKeyDraft(state.geminiApiKey);
  }, [state.geminiApiKey]);

  useEffect(() => {
    setTriagemUrlDraft(state.triagemAhsdUrl ?? '');
  }, [state.triagemAhsdUrl]);

  // Audit filter
  const [auditFilter, setAuditFilter] = useState('');

  // Print Modal State
  const [badgeTurmaFilter, setBadgeTurmaFilter] = useState('ALL');
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [printSingleStudentId, setPrintSingleStudentId] = useState<string | null>(null);

  // Staff Access Management
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<'PROFESSOR' | 'COORDENADOR'>('PROFESSOR');
  const [newStaffCode, setNewStaffCode] = useState('');
  const [showStaffCodes, setShowStaffCodes] = useState(false);

  const handleCreateDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    createDemand({
      title: title.trim(),
      shortName: shortName.trim() || title.trim().slice(0, 18),
      secretaria,
      description: description.trim(),
      icon: 'Sparkles',
      requiredStages,
    });
    setTitle('');
    setShortName('');
    setDescription('');
  };

  const toggleRequiredStage = (key: StageKey) => {
    setRequiredStages((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const filteredLogs = state.auditLogs.filter((log) => {
    const q = auditFilter.trim().toLowerCase();
    if (!q) return true;
    return (
      log.studentUuid.toLowerCase().includes(q) ||
      log.demandTitle.toLowerCase().includes(q) ||
      log.userMessage.toLowerCase().includes(q) ||
      log.tutorReply.toLowerCase().includes(q)
    );
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim() || !newStaffCode.trim()) return;
    createStaffMember({
      name: newStaffName.trim(),
      role: newStaffRole,
      accessCode: newStaffCode.trim().toUpperCase(),
    });
    setNewStaffName('');
    setNewStaffCode('');
  };

  return (
    <>
    <div className="no-print space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">
              Painel da Coordenação — SMED Cianorte
            </h2>
            <p className="text-xs text-slate-600">
              Cadastre demandas municipais, configure a chave Gemini BYOK e audite logs socráticos anonimizados.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!demo && syncStatus === 'ONLINE_FIREBASE' && (
            <button
              type="button"
              disabled={purgingDemo}
              onClick={async () => {
                if (
                  !window.confirm(
                    'Remover eventuais dados de demonstração (alunos ORB-01..10, demandas de exemplo e equipe demo) do Firestore de produção?'
                  )
                ) {
                  return;
                }
                setPurgingDemo(true);
                await purgeProductionDemoData();
                setPurgingDemo(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{purgingDemo ? 'Limpando...' : 'Limpar Dados Demo do Firestore'}</span>
            </button>
          )}

          <span
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              syncStatus === 'ONLINE_FIREBASE'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : syncStatus === 'CONNECTING'
                ? 'bg-sky-50 border-sky-300 text-sky-800'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}
          >
            {syncStatus === 'ONLINE_FIREBASE'
              ? '🟢 Firebase Firestore Online (Tempo Real)'
              : syncStatus === 'CONNECTING'
              ? '🔵 Conectando ao Firestore...'
              : '🟡 Modo Local (Configure .env para Firebase)'}
          </span>
        </div>
      </div>

      {/* Pending Approval Queue (Live from Portal de Demandas) */}
      <div
        className={`rounded-2xl border p-5 shadow-sm space-y-3 ${
          pendingApprovals.length > 0
            ? 'bg-gradient-to-br from-amber-50 via-white to-sky-50 border-amber-300'
            : 'bg-white border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                pendingApprovals.length > 0
                  ? 'bg-amber-500 text-slate-950'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-slate-900">
                Demandas Aguardando Aprovação ({pendingApprovals.length})
              </h3>
              <p className="text-xs text-slate-600">
                Pedidos enviados pelo Portal Público aparecem aqui na hora para você aprovar e
                avisar o solicitante.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('PORTAL')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
          >
            Abrir Triagem Completa
          </button>
        </div>

        {pendingApprovals.length === 0 ? (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-500">
            Nenhuma nova demanda pendente de aprovação no momento. Assim que uma escola ou secretaria
            enviar um pedido, ele aparecerá aqui em tempo real.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingApprovals.map((sub) => {
              const isHardware = sub.analysis.viabilityStatus === 'FORA_DE_ESCOPO_HARDWARE';
              return (
                <div
                  key={sub.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className="font-mono font-bold text-[11px] px-2 py-0.5 rounded bg-slate-900 text-white">
                        {sub.protocol}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${
                          isHardware
                            ? 'bg-rose-100 text-rose-900 border-rose-300'
                            : sub.analysis.viabilityStatus === 'VIAVEL_COM_ADAPTACAO'
                            ? 'bg-sky-100 text-sky-900 border-sky-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {isHardware ? (
                          <AlertTriangle className="w-3 h-3" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        <span>
                          {isHardware
                            ? 'Requer Adaptação Digital'
                            : sub.analysis.viabilityStatus === 'VIAVEL_COM_ADAPTACAO'
                            ? 'Viável com Adaptação'
                            : 'Altamente Viável'}
                        </span>
                      </span>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold uppercase text-sky-700">
                        {sub.organization}
                      </div>
                      <h4 className="font-display font-bold text-sm text-slate-900">{sub.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Solicitante: <strong>{sub.requesterName}</strong> ({sub.requesterRole})
                        {sub.requesterWhatsapp ? ` · 📱 ${sub.requesterWhatsapp}` : ''}
                        {sub.requesterEmail ? ` · ✉️ ${sub.requesterEmail}` : ''}
                      </p>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">
                      {sub.analysis.friendlySummary}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setActiveTab('PORTAL')}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold cursor-pointer"
                    >
                      Revisar Estações
                    </button>

                    {isHardware ? (
                      <button
                        type="button"
                        onClick={() => setActiveTab('PORTAL')}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        Adaptar na Triagem
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const built = approveAndPublishSubmission(sub.id);
                          if (built) {
                            const updatedSub: PortalSubmission = {
                              ...sub,
                              status: 'APROVADA_ORBIT',
                              linkedDemandId: built.id,
                              approvedAt: new Date().toISOString(),
                              approvedBy: state.session?.name ?? 'Coordenação SMED',
                            };
                            setApprovalNotifyTarget({ submission: updatedSub, demand: built });
                          }
                        }}
                        className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <Rocket className="w-3.5 h-3.5" />
                        <span>Aprovar & Liberar Produção</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Top Grid: Create Demand + BYOK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* New Demand Form */}
        <form
          onSubmit={handleCreateDemand}
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
        >
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-sky-600" />
            <span>Cadastrar Nova Demanda Municipal</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="demand-title" className="block text-xs font-semibold text-slate-700 mb-1">
                Título da Demanda
              </label>
              <input
                id="demand-title"
                name="demandTitle"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Cultura — Agenda Jovem de Cianorte"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label htmlFor="demand-short-name" className="block text-xs font-semibold text-slate-700 mb-1">
                Nome curto (Placa da Sala)
              </label>
              <input
                id="demand-short-name"
                name="demandShortName"
                value={shortName}
                onChange={(e) => setShortName(e.target.value)}
                placeholder="Ex.: Agenda Jovem"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label htmlFor="demand-secretaria" className="block text-xs font-semibold text-slate-700 mb-1">
              Secretaria Demandante
            </label>
            <select
              id="demand-secretaria"
              name="demandSecretaria"
              value={secretaria}
              onChange={(e) => setSecretaria(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs bg-white"
            >
              <option>Secretaria Municipal de Educação (SMED)</option>
              <option>Secretaria Municipal de Saúde</option>
              <option>Secretaria Municipal de Meio Ambiente</option>
              <option>Secretaria de Mobilidade e Trânsito</option>
              <option>Secretaria Municipal de Cultura e Esportes</option>
              <option>Secretaria de Assistência Social</option>
            </select>
          </div>

          <div>
            <label htmlFor="demand-description" className="block text-xs font-semibold text-slate-700 mb-1">
              Descrição do Problema Digital
            </label>
            <textarea
              id="demand-description"
              name="demandDescription"
              required
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva qual aplicativo web ou assistente de IA os alunos devem construir..."
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-slate-700 mb-1.5">
              Etapas Modulares Necessárias
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_STAGES.map((k) => {
                const active = requiredStages.includes(k);
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => toggleRequiredStage(k)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition ${
                      active
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {STAGE_META[k].shortLabel}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer"
          >
            Publicar na Sala de Demandas
          </button>
        </form>

        {/* BYOK Gemini Config + Turmas Overview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-600" />
                <span>Chave Gemini API (BYOK)</span>
              </h3>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  state.geminiApiKey
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                {state.geminiApiKey ? 'gemini-2.5-flash ATIVA' : 'Fallback Simulado'}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Insira uma chave da Google Gemini API para ativar respostas ao vivo do modelo{' '}
              <code>gemini-2.5-flash</code> nos Tutores Socráticos e nos Estúdios de IA. Sem chave, o
              simulador inteligente responde localmente.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setGeminiApiKey(apiKeyDraft);
              }}
              className="flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  id="coordinator-gemini-key"
                  name="geminiApiKey"
                  type={showKey ? 'text' : 'password'}
                  autoComplete="off"
                  aria-label="Chave da Google Gemini API"
                  value={apiKeyDraft}
                  onChange={(e) => setApiKeyDraft(e.target.value)}
                  placeholder="AIzaSy... (opcional para demo)"
                  className="w-full rounded-xl border border-slate-300 pl-3 pr-9 py-2 text-xs font-mono"
                />
                <button
                  type="button"
                  aria-label={showKey ? 'Ocultar chave API' : 'Mostrar chave API'}
                  onClick={() => setShowKey((v) => !v)}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                Salvar
              </button>
            </form>
          </div>

          {/* Overview of all 4 Turmas AH/SD */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-600" />
              <span>Visão Geral — Turmas AH/SD</span>
            </h3>
            <div className="space-y-2">
              {state.turmas.map((turma) => {
                const count = state.students.filter((s) => s.turmaId === turma.id).length;
                const badges = state.students
                  .filter((s) => s.turmaId === turma.id)
                  .reduce((acc, s) => acc + s.badges.length, 0);
                return (
                  <div
                    key={turma.id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900">{turma.name}</div>
                      <div className="text-[11px] text-slate-500">{turma.schedule}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-indigo-700">
                        {count} {count === 1 ? 'estudante' : 'estudantes'}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {badges} {badges === 1 ? 'badge conquistada' : 'badges conquistadas'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Internal Student Badge Summary */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-700">
                Total de crachás ativos: <strong>{state.students.length}</strong>
              </span>
              <button
                type="button"
                disabled={state.students.length === 0}
                onClick={() => {
                  setPrintSingleStudentId(null);
                  setPrintModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Crachás (A4)</span>
              </button>
            </div>
          </div>

          {/* Etapa 1: Ilha dos Inventores — Triagem AH/SD */}
          <div className="bg-gradient-to-br from-indigo-50 via-white to-sky-50 rounded-2xl border border-indigo-200 p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-600" />
                <span>Etapa 1: Triagem AH/SD — Ilha dos Inventores</span>
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
                Renzulli &amp; Torrance · 9 Ilhas
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Conecte o link da plataforma gamificada de triagem nas escolas (36 missões offline-first)
              para encaminhar os estudantes identificados diretamente às Turmas AH/SD.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setTriagemAhsdUrl(triagemUrlDraft);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={triagemUrlDraft}
                onChange={(e) => setTriagemUrlDraft(e.target.value)}
                placeholder="https://ilha-dos-inventores.vercel.app"
                aria-label="URL da plataforma Ilha dos Inventores (Triagem AH/SD)"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer"
              >
                Salvar
              </button>
            </form>

            {state.triagemAhsdUrl && (
              <a
                href={state.triagemAhsdUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-sky-300" />
                <span>Abrir Ilha dos Inventores (Triagem AH/SD)</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Gestão Completa de Estudantes, Crachás & Equipe */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <StudentBadgeManager
          canManageSensitive={true}
          className="lg:col-span-7"
          onPrintBadges={(singleId, turmaFilter) => {
            setBadgeTurmaFilter(turmaFilter);
            setPrintSingleStudentId(singleId);
            setPrintModalOpen(true);
          }}
        />

        {/* Staff Access Codes Management */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-600" />
                <span>Equipe & Códigos de Acesso</span>
              </h3>
              <p className="text-xs text-slate-600">
                Cadastre códigos individuais para mentores e gestores (ex.: Douglas, Jaqueline, Caio).
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowStaffCodes((v) => !v)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
              title={showStaffCodes ? 'Ocultar códigos' : 'Mostrar códigos'}
            >
              {showStaffCodes ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <form
            onSubmit={handleCreateStaff}
            className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                required
                value={newStaffName}
                onChange={(e) => setNewStaffName(e.target.value)}
                placeholder="Nome (ex.: Jaqueline)"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
              />
              <select
                value={newStaffRole}
                onChange={(e) =>
                  setNewStaffRole(e.target.value as 'PROFESSOR' | 'COORDENADOR')
                }
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold"
              >
                <option value="PROFESSOR">Professor Mentor</option>
                <option value="COORDENADOR">Coordenador SMED</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                required
                value={newStaffCode}
                onChange={(e) => setNewStaffCode(e.target.value.toUpperCase())}
                placeholder="Código secreto (ex.: JAQUE26)"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono uppercase"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
              >
                Adicionar
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {state.staffMembers.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
                Nenhum mentor ou gestor cadastrado ainda. Adicione códigos individuais acima (ex.:
                Douglas, Jaqueline, Caio).
              </div>
            ) : (
              state.staffMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{member.name}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          member.role === 'COORDENADOR'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {member.role === 'COORDENADOR' ? 'Coordenador' : 'Mentor'}
                      </span>
                      <span className="font-mono font-bold text-slate-700">
                        {showStaffCodes ? member.accessCode : '••••••••'}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteStaffMember(member.id)}
                    title="Remover acesso"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            {demo ? (
              <>
                Códigos demo ativos: Mentor <code>CEMI2026</code> · Coordenação{' '}
                <code>SMED2026</code>.
              </>
            ) : (
              <>
                Código mestre de primeiro acesso da Coordenação sempre ativo (padrão{' '}
                <code>SMED2026</code> ou variável <code>VITE_COORDINATOR_PIN</code>). Mentores
                usam exclusivamente seus códigos cadastrados acima.
              </>
            )}
          </p>
        </div>

        {/* Professores de escola (Ilha dos Inventores) */}
        <SchoolTeachersManager className="lg:col-span-12" />
      </div>

      {/* Audit Log of AI Conversations */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-sky-600" />
              <span>Log de Auditoria — Interações com Tutores IA ({filteredLogs.length})</span>
            </h3>
            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Conformidade LGPD: somente UUIDs anônimos dos estudantes são registrados.</span>
            </p>
          </div>
          <input
            id="audit-log-filter"
            name="auditFilter"
            aria-label="Filtrar log de auditoria"
            value={auditFilter}
            onChange={(e) => setAuditFilter(e.target.value)}
            placeholder="Filtrar por UUID, demanda ou palavra..."
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-3 font-semibold">UUID Anônimo</th>
                <th className="py-2 pr-3 font-semibold">Demanda / Bancada</th>
                <th className="py-2 pr-3 font-semibold">Persona</th>
                <th className="py-2 pr-3 font-semibold">Pergunta do Aluno</th>
                <th className="py-2 pr-3 font-semibold">Resposta Socrática</th>
                <th className="py-2 font-semibold">Motor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-xs text-slate-500">
                    Nenhuma interação registrada nos Tutores Socráticos ainda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const persona = TUTOR_PERSONAS.find((p) => p.id === log.personaId);
                  return (
                    <tr key={log.id} className="align-top">
                      <td className="py-2.5 pr-3 font-mono text-[11px] text-slate-700 whitespace-nowrap">
                        {log.studentUuid}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="font-semibold text-slate-900">{log.demandTitle}</div>
                        <div className="text-[10px] text-slate-500">
                          {STAGE_META[log.stageKey].shortLabel}
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 whitespace-nowrap text-indigo-700 font-medium">
                        {persona?.name ?? log.personaId}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-700 max-w-xs">{log.userMessage}</td>
                      <td className="py-2.5 pr-3 text-slate-700 max-w-sm">{log.tutorReply}</td>
                      <td className="py-2.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.mode === 'GEMINI_LIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {log.mode === 'GEMINI_LIVE' ? 'Gemini Live' : 'Simulado'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <BadgePrintModal
      isOpen={printModalOpen}
      onClose={() => setPrintModalOpen(false)}
      students={state.students}
      turmas={state.turmas}
      initialFilterTurmaId={badgeTurmaFilter}
      singleStudentId={printSingleStudentId}
    />

    <ApprovalNotifyModal
      submission={approvalNotifyTarget?.submission ?? null}
      demand={approvalNotifyTarget?.demand ?? null}
      onClose={() => setApprovalNotifyTarget(null)}
      onOpenRoom={(demandId) => openDemandRoom(demandId)}
    />
    </>
  );
};
