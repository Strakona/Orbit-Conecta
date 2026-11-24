import React, { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  FileSearch,
  KeyRound,
  PlusCircle,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { STAGE_META, TUTOR_PERSONAS } from '../data/seedData';
import { StageKey } from '../types';

const ALL_STAGES: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

export const CoordinatorPanel: React.FC = () => {
  const { state, createDemand, setGeminiApiKey } = useOrbit();

  // New Demand Form
  const [title, setTitle] = useState('');
  const [shortName, setShortName] = useState('');
  const [secretaria, setSecretaria] = useState('Secretaria Municipal de Educação (SMED)');
  const [description, setDescription] = useState('');
  const [requiredStages, setRequiredStages] = useState<StageKey[]>([...ALL_STAGES]);

  // BYOK state
  const [apiKeyDraft, setApiKeyDraft] = useState(state.geminiApiKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setApiKeyDraft(state.geminiApiKey);
  }, [state.geminiApiKey]);

  // Audit filter
  const [auditFilter, setAuditFilter] = useState('');

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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-display font-bold text-xl text-slate-900">
              Painel da Coordenação — SMED / CEMI 2 Cianorte
            </h2>
            <p className="text-xs text-slate-600">
              Cadastre demandas municipais, configure a chave Gemini BYOK e audite logs socráticos anonimizados.
            </p>
          </div>
        </div>
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
          </div>
        </div>
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
              {filteredLogs.map((log) => {
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
