import React, { useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  GraduationCap,
  ListPlus,
  Mail,
  MessageCircle,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { useStaffIdentity } from '../services/staffAccess';
import {
  buildInviteMessage,
  buildMailtoUrl,
  buildWhatsappUrl,
  deleteIlhaTeacher,
  fetchIlhaSchoolNames,
  formatWhatsapp,
  IlhaTeacher,
  isValidEmail,
  mergeSchools,
  normalizeEmail,
  normalizeWhatsapp,
  saveIlhaTeacher,
  splitSchools,
  subscribeIlhaTeachers,
} from '../services/ilhaTeachers';
import { isDemoMode } from '../utils/demoMode';

interface BulkRow {
  name: string;
  email: string;
  whatsapp: string;
  schools: string[];
}

function parseBulk(text: string): { rows: BulkRow[]; invalid: string[] } {
  const rows: BulkRow[] = [];
  const invalid: string[] = [];
  text.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const sep = line.includes('\t') ? '\t' : line.includes(';') && !line.includes('|') ? ';' : ',';
    const cols = line.split(sep).map((c) => c.trim());
    // Ignora o cabeçalho colado da planilha
    if (/^nome$/i.test(cols[0] ?? '') && /mail/i.test(cols[1] ?? '')) return;
    const [name = '', email = '', whatsapp = '', ...rest] = cols;
    if (!name || !isValidEmail(email)) {
      invalid.push(line.trim());
      return;
    }
    rows.push({
      name,
      email: normalizeEmail(email),
      whatsapp: normalizeWhatsapp(whatsapp),
      schools: splitSchools(rest.join(' | ')),
    });
  });
  return { rows, invalid };
}

export const SchoolTeachersManager: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { state, pushToast } = useOrbit();
  const demo = isDemoMode();
  const { identity, checking, signIn } = useStaffIdentity();
  const ilhaUrl = state.triagemAhsdUrl?.trim() ?? '';

  const [teachers, setTeachers] = useState<IlhaTeacher[]>([]);
  const [schoolOptions, setSchoolOptions] = useState<string[]>([]);
  const [mode, setMode] = useState<'SINGLE' | 'BULK'>('SINGLE');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [schoolsText, setSchoolsText] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  useEffect(() => {
    if (!demo && !identity?.isCoordinator) return;
    const unsub = subscribeIlhaTeachers(setTeachers);
    void fetchIlhaSchoolNames().then(setSchoolOptions);
    return unsub;
  }, [demo, identity?.isCoordinator]);

  const bulkPreview = useMemo(() => parseBulk(bulkText), [bulkText]);
  const existingEmails = useMemo(() => new Set(teachers.map((t) => t.id)), [teachers]);

  const upsertTeachers = async (items: BulkRow[]): Promise<{ created: number; updated: number }> => {
    let created = 0;
    let updated = 0;
    const next = [...teachers];
    for (const item of items) {
      const id = normalizeEmail(item.email);
      const idx = next.findIndex((t) => t.id === id);
      const base: IlhaTeacher =
        idx >= 0
          ? {
              ...next[idx],
              name: item.name || next[idx].name,
              whatsapp: item.whatsapp || next[idx].whatsapp,
              schools: mergeSchools(next[idx].schools, item.schools),
            }
          : {
              id,
              name: item.name,
              email: id,
              whatsapp: item.whatsapp,
              schools: item.schools,
              createdAt: new Date().toISOString(),
            };
      if (idx >= 0) {
        next[idx] = base;
        updated += 1;
      } else {
        next.push(base);
        created += 1;
      }
      await saveIlhaTeacher(base);
    }
    if (demo) setTeachers(next.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
    return { created, updated };
  };

  const handleSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !isValidEmail(email)) {
      pushToast('Confira o nome e o e-mail', 'Informe um e-mail válido.', 'warning');
      return;
    }
    try {
      const res = await upsertTeachers([
        {
          name: name.trim(),
          email,
          whatsapp: normalizeWhatsapp(whatsapp),
          schools: splitSchools(schoolsText),
        },
      ]);
      pushToast(res.created ? 'Professor cadastrado!' : 'Professor atualizado!', name.trim(), 'success');
      setName('');
      setEmail('');
      setWhatsapp('');
      setSchoolsText('');
    } catch {
      pushToast('Não foi possível salvar', 'Verifique a conexão com o Firebase.', 'warning');
    }
  };

  const handleBulk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkPreview.rows.length === 0) return;
    try {
      const res = await upsertTeachers(bulkPreview.rows);
      pushToast(
        'Lista importada!',
        `${res.created} novo(s), ${res.updated} atualizado(s).`,
        'success'
      );
      setBulkText('');
    } catch {
      pushToast('Não foi possível importar', 'Verifique a conexão com o Firebase.', 'warning');
    }
  };

  const markLinkSent = async (teacher: IlhaTeacher) => {
    const updated = { ...teacher, linkSentAt: new Date().toISOString() };
    try {
      await saveIlhaTeacher(updated);
      if (demo) setTeachers((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    } catch {
      // não bloqueia o envio da mensagem
    }
  };

  const handleCopy = async (teacher: IlhaTeacher) => {
    try {
      await navigator.clipboard.writeText(buildInviteMessage(teacher, ilhaUrl));
      setCopiedId(teacher.id);
      window.setTimeout(() => setCopiedId(null), 2000);
      void markLinkSent(teacher);
    } catch {
      pushToast('Não foi possível copiar', 'Copie manualmente a mensagem.', 'warning');
    }
  };

  const handleDelete = async (teacher: IlhaTeacher) => {
    if (!window.confirm(`Remover ${teacher.name}? Ele(a) perde o acesso à Ilha dos Inventores.`)) return;
    try {
      await deleteIlhaTeacher(teacher.id);
      if (demo) setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      pushToast('Professor removido', teacher.name, 'warning');
    } catch {
      pushToast('Não foi possível remover', 'Verifique a conexão com o Firebase.', 'warning');
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 ${className}`}
    >
      <div>
        <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-violet-600" />
          <span>Professores de Escola (Ilha dos Inventores)</span>
        </h3>
        <p className="text-xs text-slate-600">
          Professores de robótica que aplicam a triagem nas escolas. Não têm acesso ao Orbit
          Conecta: só recebem o link da Ilha e entram com o e-mail cadastrado aqui.
        </p>
      </div>

      {!demo && checking ? (
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
          Verificando conta Google autorizada...
        </div>
      ) : !demo && !identity?.isCoordinator ? (
        <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-3">
          <div className="flex items-start gap-2.5 text-xs text-indigo-950">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong>Autenticação Google necessária:</strong> para proteger a lista de professores
              autorizados na Ilha dos Inventores, entre com uma conta Google cadastrada pelo
              Administrador como Coordenador SMED.
            </div>
          </div>
          {googleError && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {googleError}
            </div>
          )}
          <button
            type="button"
            disabled={googleLoading}
            onClick={async () => {
              setGoogleError(null);
              setGoogleLoading(true);
              const res = await signIn();
              if (!res.ok && res.message) setGoogleError(res.message);
              setGoogleLoading(false);
            }}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer disabled:opacity-50"
          >
            {googleLoading ? 'Conectando...' : 'Entrar com Google (Admin / Coordenação)'}
          </button>
        </div>
      ) : (
        <>
          {!ilhaUrl && (
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
          Configure o endereço da Ilha dos Inventores no cartão de configuração da Coordenação para
          que o link entre nas mensagens.
        </div>
      )}

      <datalist id="ilha-school-options">
        {schoolOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 gap-1">
        <button
          type="button"
          onClick={() => setMode('SINGLE')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
            mode === 'SINGLE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Cadastro Individual</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('BULK')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
            mode === 'BULK' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          <ListPlus className="w-3.5 h-3.5 text-sky-600" />
          <span>Importar Lista</span>
        </button>
      </div>

      {mode === 'SINGLE' ? (
        <form
          onSubmit={handleSingle}
          className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome do professor"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            />
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail (conta Google)"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            />
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="WhatsApp com DDD"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            />
            <input
              list="ilha-school-options"
              value={schoolsText}
              onChange={(e) => setSchoolsText(e.target.value)}
              placeholder="Escola(s) — separe com |"
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs cursor-pointer"
          >
            Cadastrar professor
          </button>
        </form>
      ) : (
        <form
          onSubmit={handleBulk}
          className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200 space-y-2.5"
        >
          <p className="text-[11px] text-slate-600">
            Cole as linhas da planilha com as colunas <strong>Nome, E-mail, WhatsApp, Escola</strong>.
            Para mais de uma escola, separe com <code>|</code>.
          </p>
          <textarea
            rows={5}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'Ana Souza\tana@gmail.com\t(44) 99999-1111\tEscola Municipal A\nBruno Lima\tbruno@gmail.com\t44988882222\tEscola B | Escola C'}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <span className="px-2.5 py-1 rounded-full bg-white border border-sky-200 font-bold text-sky-800">
                {bulkPreview.rows.length} professor(es) na prévia (
                {bulkPreview.rows.filter((r) => existingEmails.has(r.email)).length} já cadastrado(s)
                serão atualizados)
              </span>
              {bulkPreview.invalid.length > 0 && (
                <span className="px-2.5 py-1 rounded-full bg-rose-100 border border-rose-300 font-semibold text-rose-900">
                  {bulkPreview.invalid.length} linha(s) ignorada(s): nome ou e-mail inválido
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={bulkPreview.rows.length === 0}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs cursor-pointer disabled:opacity-40"
            >
              Importar lista
            </button>
          </div>
        </form>
      )}

      <div className="text-xs font-bold text-slate-700">
        Professores cadastrados ({teachers.length})
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
        {teachers.length === 0 ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center text-xs text-slate-500">
            Nenhum professor de escola cadastrado ainda.
          </div>
        ) : (
          teachers.map((t) => (
            <div
              key={t.id}
              className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="min-w-0">
                <div className="font-bold text-slate-900 truncate">{t.name}</div>
                <div className="text-[11px] text-slate-500 truncate">
                  {t.email}
                  {t.whatsapp ? ` · ${formatWhatsapp(t.whatsapp)}` : ''}
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {t.schools.length === 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                      Sem escola vinculada
                    </span>
                  ) : (
                    t.schools.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded bg-violet-100 text-violet-800 text-[10px] font-semibold"
                      >
                        {s}
                      </span>
                    ))
                  )}
                  {t.linkSentAt && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      Link enviado em {new Date(t.linkSentAt).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <a
                  href={t.whatsapp ? buildWhatsappUrl(t, ilhaUrl) : undefined}
                  target="_blank"
                  rel="noreferrer"
                  aria-disabled={!t.whatsapp}
                  title={t.whatsapp ? 'Enviar link por WhatsApp' : 'Sem WhatsApp cadastrado'}
                  onClick={() => t.whatsapp && void markLinkSent(t)}
                  className={`px-2 py-1 rounded-lg border text-[11px] font-semibold flex items-center gap-1 ${
                    t.whatsapp
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 cursor-pointer'
                      : 'bg-slate-100 border-slate-200 text-slate-400 pointer-events-none'
                  }`}
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>WhatsApp</span>
                </a>
                <a
                  href={buildMailtoUrl(t, ilhaUrl)}
                  title="Enviar link por e-mail"
                  onClick={() => void markLinkSent(t)}
                  className="px-2 py-1 rounded-lg bg-sky-50 border border-sky-300 text-sky-800 hover:bg-sky-100 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Mail className="w-3 h-3" />
                  <span>E-mail</span>
                </a>
                <button
                  type="button"
                  onClick={() => handleCopy(t)}
                  title="Copiar mensagem"
                  className="px-2 py-1 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copiedId === t.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedId === t.id ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(t)}
                  title="Remover professor"
                  className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
        </>
      )}
    </div>
  );
};
