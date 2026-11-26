import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  Compass,
  ListPlus,
  Printer,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { fetchIlhaSessions, IlhaSessionSummary } from '../services/ilhaSessions';
import { PixelAvatar } from './PixelAvatar';

interface StudentBadgeManagerProps {
  canManageSensitive: boolean;
  defaultTurmaId?: string;
  onPrintBadges: (singleStudentId: string | null, turmaFilter: string) => void;
  className?: string;
}

function cleanPastedLine(raw: string): string {
  return raw
    .replace(/^\s*(\d+[\.\)\-]|[-•*])\s+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getProximityBadgeStyle(level: string): string {
  switch (level) {
    case 'Indicativo Alto de AH/SD':
      return 'bg-violet-100 text-violet-900 border-violet-300';
    case 'Potencial em Destaque':
      return 'bg-emerald-100 text-emerald-900 border-emerald-300';
    case 'Desenvolvimento Esperado':
      return 'bg-sky-100 text-sky-900 border-sky-300';
    case 'Acompanhamento Sugerido':
      return 'bg-amber-100 text-amber-900 border-amber-300';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-300';
  }
}

export const StudentBadgeManager: React.FC<StudentBadgeManagerProps> = ({
  canManageSensitive,
  defaultTurmaId,
  onPrintBadges,
  className = '',
}) => {
  const {
    state,
    createStudent,
    createStudentsBulk,
    regenerateStudentPin,
    deleteStudent,
  } = useOrbit();

  const [mode, setMode] = useState<'SINGLE' | 'BULK' | 'ILHA'>('SINGLE');
  const [newStuName, setNewStuName] = useState('');
  const [newStuTurmaId, setNewStuTurmaId] = useState(
    defaultTurmaId ?? state.turmas[0]?.id ?? 'turma-1'
  );
  const [newStuPin, setNewStuPin] = useState('');

  const [bulkText, setBulkText] = useState('');
  const [bulkTurmaId, setBulkTurmaId] = useState(
    defaultTurmaId ?? state.turmas[0]?.id ?? 'turma-1'
  );
  const [badgeTurmaFilter, setBadgeTurmaFilter] = useState('ALL');

  const [ilhaTurmaId, setIlhaTurmaId] = useState(
    defaultTurmaId ?? state.turmas[0]?.id ?? 'turma-1'
  );
  const [ilhaSessions, setIlhaSessions] = useState<IlhaSessionSummary[]>([]);
  const [ilhaLoading, setIlhaLoading] = useState(false);
  const [ilhaLoaded, setIlhaLoaded] = useState(false);
  const [ilhaError, setIlhaError] = useState<string | null>(null);
  const [ilhaSearch, setIlhaSearch] = useState('');
  const [ilhaSchoolFilter, setIlhaSchoolFilter] = useState('ALL');
  const [ilhaGradeFilter, setIlhaGradeFilter] = useState('ALL');
  const [ilhaLevelFilter, setIlhaLevelFilter] = useState('ALL');
  const [hideImported, setHideImported] = useState(false);
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([]);
  const [ilhaFeedback, setIlhaFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (defaultTurmaId) {
      setNewStuTurmaId(defaultTurmaId);
      setBulkTurmaId(defaultTurmaId);
      setIlhaTurmaId(defaultTurmaId);
    }
  }, [defaultTurmaId]);

  const loadIlhaSessions = useCallback(async () => {
    setIlhaLoading(true);
    setIlhaError(null);
    try {
      const list = await fetchIlhaSessions();
      setIlhaSessions(list);
      setIlhaLoaded(true);
    } catch (err) {
      setIlhaError(
        err instanceof Error
          ? err.message
          : 'Não foi possível carregar os alunos da Ilha dos Inventores.'
      );
    } finally {
      setIlhaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mode === 'ILHA' && !ilhaLoaded && !ilhaLoading) {
      loadIlhaSessions();
    }
  }, [mode, ilhaLoaded, ilhaLoading, loadIlhaSessions]);

  const importedByStudentName = useMemo(() => {
    const map = new Map<string, string>();
    state.students.forEach((stu) => {
      const key = stu.name.trim().toLowerCase();
      if (!key || map.has(key)) return;
      const turmaName = state.turmas.find((t) => t.id === stu.turmaId)?.name ?? stu.turmaId;
      map.set(key, turmaName);
    });
    return map;
  }, [state.students, state.turmas]);

  const ilhaFilterOptions = useMemo(() => {
    const schools = Array.from(new Set(ilhaSessions.map((s) => s.schoolName))).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );
    const grades = Array.from(new Set(ilhaSessions.map((s) => s.grade))).sort((a, b) =>
      a.localeCompare(b, 'pt-BR')
    );
    const levels = Array.from(new Set(ilhaSessions.map((s) => s.performanceLevel)));
    return { schools, grades, levels };
  }, [ilhaSessions]);

  const filteredIlhaSessions = useMemo(() => {
    const q = ilhaSearch.trim().toLowerCase();
    return ilhaSessions.filter((item) => {
      const alreadyImported = importedByStudentName.has(item.studentName.trim().toLowerCase());
      if (hideImported && alreadyImported) return false;
      if (ilhaSchoolFilter !== 'ALL' && item.schoolName !== ilhaSchoolFilter) return false;
      if (ilhaGradeFilter !== 'ALL' && item.grade !== ilhaGradeFilter) return false;
      if (ilhaLevelFilter !== 'ALL' && item.performanceLevel !== ilhaLevelFilter) return false;
      if (q) {
        const hay = `${item.studentName} ${item.schoolName} ${item.className} ${item.performanceLevel}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [
    ilhaSessions,
    importedByStudentName,
    hideImported,
    ilhaSchoolFilter,
    ilhaGradeFilter,
    ilhaLevelFilter,
    ilhaSearch,
  ]);

  const selectableFilteredSessions = useMemo(
    () =>
      filteredIlhaSessions.filter(
        (item) => !importedByStudentName.has(item.studentName.trim().toLowerCase())
      ),
    [filteredIlhaSessions, importedByStudentName]
  );

  const filteredStudents = useMemo(
    () =>
      state.students.filter(
        (s) => badgeTurmaFilter === 'ALL' || s.turmaId === badgeTurmaFilter
      ),
    [state.students, badgeTurmaFilter]
  );

  const bulkPreview = useMemo(() => {
    const existingInTurma = new Set(
      state.students
        .filter((s) => s.turmaId === bulkTurmaId)
        .map((s) => s.name.trim().toLowerCase())
    );
    const seen = new Set<string>();
    const validNames: string[] = [];
    let duplicateCount = 0;

    bulkText.split(/\r?\n/).forEach((line) => {
      const cleaned = cleanPastedLine(line);
      if (!cleaned) return;
      const key = cleaned.toLowerCase();
      if (existingInTurma.has(key) || seen.has(key)) {
        duplicateCount += 1;
        return;
      }
      seen.add(key);
      validNames.push(cleaned);
    });

    return { validNames, duplicateCount };
  }, [bulkText, bulkTurmaId, state.students]);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStuName.trim()) return;
    createStudent({
      name: newStuName.trim(),
      turmaId: newStuTurmaId,
      pin: newStuPin.trim() || undefined,
    });
    setNewStuName('');
    setNewStuPin('');
  };

  const handleImportBulk = (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkPreview.validNames.length === 0) return;
    const created = createStudentsBulk({
      names: bulkPreview.validNames,
      turmaId: bulkTurmaId,
    });
    if (created.length > 0) {
      setBulkText('');
    }
  };

  const toggleIlhaSession = (sessionId: string) => {
    setIlhaFeedback(null);
    setSelectedSessionIds((prev) =>
      prev.includes(sessionId) ? prev.filter((id) => id !== sessionId) : [...prev, sessionId]
    );
  };

  const allFilteredSelected =
    selectableFilteredSessions.length > 0 &&
    selectableFilteredSessions.every((s) => selectedSessionIds.includes(s.id));

  const handleToggleSelectAllIlha = () => {
    setIlhaFeedback(null);
    if (allFilteredSelected) {
      const visibleIds = new Set(selectableFilteredSessions.map((s) => s.id));
      setSelectedSessionIds((prev) => prev.filter((id) => !visibleIds.has(id)));
    } else {
      setSelectedSessionIds((prev) =>
        Array.from(new Set([...prev, ...selectableFilteredSessions.map((s) => s.id)]))
      );
    }
  };

  const handleImportIlhaSelected = () => {
    if (selectedSessionIds.length === 0) return;
    const chosen = ilhaSessions.filter((s) => selectedSessionIds.includes(s.id));
    const uniqueNames: string[] = [];
    const seen = new Set<string>();
    chosen.forEach((s) => {
      const key = s.studentName.trim().toLowerCase();
      if (!key || seen.has(key) || importedByStudentName.has(key)) return;
      seen.add(key);
      uniqueNames.push(s.studentName.trim());
    });
    if (uniqueNames.length === 0) {
      setSelectedSessionIds([]);
      return;
    }
    const created = createStudentsBulk({
      names: uniqueNames,
      turmaId: ilhaTurmaId,
    });
    setSelectedSessionIds([]);
    if (created.length > 0) {
      const turmaLabel = state.turmas.find((t) => t.id === ilhaTurmaId)?.name ?? ilhaTurmaId;
      setIlhaFeedback(
        `${created.length} ${created.length === 1 ? 'estudante importado' : 'estudantes importados'} para ${turmaLabel} com crachá e PIN gerados!`
      );
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 ${className}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-sky-600" />
            <span>Gestão de Estudantes & Crachás (SMED)</span>
          </h3>
          <p className="text-xs text-slate-600">
            Cadastre individualmente ou cole uma lista de nomes para gerar crachás{' '}
            <code>ORB-XX</code>, PIN e QR Code.
          </p>
        </div>

        <button
          type="button"
          disabled={state.students.length === 0}
          onClick={() => onPrintBadges(null, badgeTurmaFilter)}
          className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir Folha A4</span>
        </button>
      </div>

      {/* Mode Switcher */}
      <div className="inline-flex flex-wrap rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1">
        <button
          type="button"
          onClick={() => setMode('SINGLE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
            mode === 'SINGLE'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cadastro Individual</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('BULK')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
            mode === 'BULK'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ListPlus className="w-3.5 h-3.5 text-sky-600" />
          <span>Importar Lista (Lote)</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('ILHA')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
            mode === 'ILHA'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-3.5 h-3.5 text-violet-600" />
          <span>Ilha dos Inventores</span>
        </button>
      </div>

      {mode === 'SINGLE' ? (
        <form
          onSubmit={handleCreateStudent}
          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end"
        >
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Nome do Estudante *
            </label>
            <input
              required
              value={newStuName}
              onChange={(e) => setNewStuName(e.target.value)}
              placeholder="Ex.: Clara Nogueira"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Turma</label>
            <select
              value={newStuTurmaId}
              onChange={(e) => setNewStuTurmaId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs"
            >
              {state.turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">PIN (opc.)</label>
            <input
              value={newStuPin}
              maxLength={4}
              onChange={(e) => setNewStuPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Auto"
              className="w-full rounded-xl border border-slate-300 bg-white px-2.5 py-2 text-xs font-mono"
            />
          </div>

          <button
            type="submit"
            className="sm:col-span-2 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Criar</span>
          </button>
        </form>
      ) : mode === 'BULK' ? (
        <form
          onSubmit={handleImportBulk}
          className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-700">Turma de destino:</label>
              <select
                value={bulkTurmaId}
                onChange={(e) => setBulkTurmaId(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
              >
                {state.turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.schedule}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[11px] text-slate-500">
              Cole 1 nome por linha (aceita listas numeradas ou com marcadores)
            </span>
          </div>

          <textarea
            rows={4}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'Cole a lista da chamada aqui (um nome por linha):\nAna Clara Silva\nBruno Oliveira\nClara Nogueira'}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-white border border-sky-200 font-bold text-sky-800">
                {bulkPreview.validNames.length}{' '}
                {bulkPreview.validNames.length === 1 ? 'novo crachá será gerado' : 'novos crachás serão gerados'}
              </span>
              {bulkPreview.duplicateCount > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 font-semibold text-amber-900">
                  {bulkPreview.duplicateCount}{' '}
                  {bulkPreview.duplicateCount === 1 ? 'duplicado ignorado' : 'duplicados ignorados'}
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={bulkPreview.validNames.length === 0}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>
                Importar {bulkPreview.validNames.length > 0 ? bulkPreview.validNames.length : ''}{' '}
                {bulkPreview.validNames.length === 1 ? 'Estudante' : 'Estudantes'}
              </span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3.5 rounded-2xl bg-violet-50/60 border border-violet-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
              <span className="text-xs font-bold text-slate-800">
                Triagem AH/SD — Ilha dos Inventores ({ilhaSessions.length})
              </span>
            </div>

            <button
              type="button"
              onClick={loadIlhaSessions}
              disabled={ilhaLoading}
              className="px-2.5 py-1 rounded-lg bg-white hover:bg-violet-50 border border-violet-200 text-[11px] font-semibold text-violet-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${ilhaLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar lista</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                value={ilhaSearch}
                onChange={(e) => setIlhaSearch(e.target.value)}
                placeholder="Buscar aluno ou escola..."
                className="w-full rounded-xl border border-slate-300 bg-white pl-8 pr-3 py-1.5 text-xs"
              />
            </div>

            <select
              value={ilhaSchoolFilter}
              onChange={(e) => setIlhaSchoolFilter(e.target.value)}
              className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
            >
              <option value="ALL">Todas as escolas</option>
              {ilhaFilterOptions.schools.map((sch) => (
                <option key={sch} value={sch}>
                  {sch}
                </option>
              ))}
            </select>

            <select
              value={ilhaGradeFilter}
              onChange={(e) => setIlhaGradeFilter(e.target.value)}
              className="sm:col-span-2 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
            >
              <option value="ALL">Todos os anos</option>
              {ilhaFilterOptions.grades.map((gr) => (
                <option key={gr} value={gr}>
                  {gr}
                </option>
              ))}
            </select>

            <select
              value={ilhaLevelFilter}
              onChange={(e) => setIlhaLevelFilter(e.target.value)}
              className="sm:col-span-3 rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs"
            >
              <option value="ALL">Todos os níveis AH/SD</option>
              {ilhaFilterOptions.levels.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
            <label className="inline-flex items-center gap-1.5 text-slate-700 font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={hideImported}
                onChange={(e) => setHideImported(e.target.checked)}
                className="rounded border-slate-300 text-violet-600"
              />
              <span>Ocultar já importados</span>
            </label>

            {selectableFilteredSessions.length > 0 && (
              <button
                type="button"
                onClick={handleToggleSelectAllIlha}
                className="text-violet-700 hover:underline font-bold cursor-pointer"
              >
                {allFilteredSelected
                  ? 'Desmarcar disponíveis'
                  : `Selecionar todos disponíveis (${selectableFilteredSessions.length})`}
              </button>
            )}
          </div>

          {ilhaError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {ilhaError}
            </div>
          )}

          {ilhaFeedback && (
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{ilhaFeedback}</span>
            </div>
          )}

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
            {ilhaLoading ? (
              <div className="p-4 rounded-xl bg-white border border-violet-200 text-center text-xs text-slate-500">
                Carregando estudantes da Ilha dos Inventores...
              </div>
            ) : filteredIlhaSessions.length === 0 ? (
              <div className="p-4 rounded-xl bg-white border border-dashed border-violet-200 text-center text-xs text-slate-500">
                Nenhum estudante encontrado na Ilha dos Inventores com os filtros atuais.
              </div>
            ) : (
              filteredIlhaSessions.map((item) => {
                const importedTurma = importedByStudentName.get(
                  item.studentName.trim().toLowerCase()
                );
                const isImported = Boolean(importedTurma);
                const isChecked = selectedSessionIds.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className={`p-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition ${
                      isImported
                        ? 'bg-slate-100/80 border-slate-200 opacity-75 cursor-not-allowed'
                        : isChecked
                          ? 'bg-violet-50 border-violet-400 cursor-pointer'
                          : 'bg-white border-slate-200 hover:border-violet-300 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        disabled={isImported}
                        checked={isChecked}
                        onChange={() => toggleIlhaSession(item.id)}
                        className="rounded border-slate-300 text-violet-600 disabled:opacity-40"
                      />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {item.studentName}
                          </span>
                          {isImported && (
                            <span className="px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold">
                              Já importado ({importedTurma})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {item.schoolName} · {item.grade} ({item.className}) ·{' '}
                          {item.status === 'concluida' ? 'Concluída' : 'Em andamento'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${getProximityBadgeStyle(
                          item.performanceLevel
                        )}`}
                      >
                        {item.performanceLevel}
                        {item.overallScore !== null ? ` · ${item.overallScore}%` : ''}
                      </span>
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-violet-200/70">
            <div className="flex items-center gap-2">
              <label className="text-[11px] font-bold text-slate-700">Turma de destino:</label>
              <select
                value={ilhaTurmaId}
                onChange={(e) => setIlhaTurmaId(e.target.value)}
                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
              >
                {state.turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · {t.schedule}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              disabled={selectedSessionIds.length === 0}
              onClick={handleImportIlhaSelected}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              <ListPlus className="w-3.5 h-3.5" />
              <span>Importar selecionados ({selectedSessionIds.length})</span>
            </button>
          </div>
        </div>
      )}

      {/* Filter & Registered Badges List */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700">
          Crachás cadastrados ({filteredStudents.length})
        </span>
        <select
          value={badgeTurmaFilter}
          onChange={(e) => setBadgeTurmaFilter(e.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
        >
          <option value="ALL">Todas as Turmas</option>
          {state.turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
        {filteredStudents.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
            Nenhum estudante cadastrado nesta seleção ainda. Use o formulário acima para gerar o
            primeiro crachá (<code>ORB-01</code>).
          </div>
        ) : (
          filteredStudents.map((stu) => {
            const turma = state.turmas.find((t) => t.id === stu.turmaId);
            return (
              <div
                key={stu.id}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <PixelAvatar
                    name={stu.name}
                    config={stu.avatar}
                    size={32}
                    showBadgeTag={false}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate">{stu.name}</div>
                    <div className="text-[11px] text-slate-500">
                      {turma?.name} ·{' '}
                      <span className="font-mono font-bold text-sky-700">{stu.badgeCode}</span> ·
                      PIN <span className="font-mono font-bold text-amber-800">{stu.pin}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    title="Imprimir crachá individual"
                    onClick={() => onPrintBadges(stu.id, badgeTurmaFilter)}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-sky-50 border border-slate-300 text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3 h-3" />
                    <span>Crachá</span>
                  </button>

                  {canManageSensitive && (
                    <>
                      <button
                        type="button"
                        title="Gerar novo PIN aleatório"
                        onClick={() => regenerateStudentPin(stu.id)}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-amber-50 border border-slate-300 text-[11px] font-semibold text-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>PIN</span>
                      </button>

                      <button
                        type="button"
                        title="Remover estudante"
                        onClick={() => deleteStudent(stu.id)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {!canManageSensitive && (
        <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            Troca de PIN e exclusão de estudantes ficam restritas ao perfil Coordenador SMED.
          </span>
        </div>
      )}
    </div>
  );
};
