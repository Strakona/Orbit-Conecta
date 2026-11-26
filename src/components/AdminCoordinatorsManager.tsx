import React, { useEffect, useState } from 'react';
import { ShieldCheck, UserPlus, Trash2, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  subscribeCoordinators,
  saveCoordinator,
  deleteCoordinator,
  CoordinatorRecord,
  StaffIdentity,
} from '../services/staffAccess';

interface AdminCoordinatorsManagerProps {
  adminIdentity: StaffIdentity;
  className?: string;
}

export const AdminCoordinatorsManager: React.FC<AdminCoordinatorsManagerProps> = ({
  adminIdentity,
  className = '',
}) => {
  const [coordinators, setCoordinators] = useState<CoordinatorRecord[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsub = subscribeCoordinators(setCoordinators);
    return unsub;
  }, []);

  const handleAddCoordinator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    setFeedback(null);
    try {
      await saveCoordinator({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdBy: adminIdentity.email,
      });
      setName('');
      setEmail('');
      setFeedback({
        type: 'success',
        text: `Coordenador(a) ${name.trim()} cadastrado(a) com sucesso! A conta Google já pode acessar.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Erro ao cadastrar coordenador.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (coordEmail: string, coordName: string) => {
    if (!window.confirm(`Remover o acesso de coordenação de ${coordName} (${coordEmail})?`)) return;
    try {
      await deleteCoordinator(coordEmail);
      setFeedback({
        type: 'success',
        text: `Acesso de ${coordName} revogado com sucesso.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        text: 'Erro ao remover coordenador.',
      });
    }
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-indigo-800/60 space-y-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display font-bold text-lg text-white">
                Gestão de Administrador do Sistema
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-400/40 text-[11px] font-bold text-indigo-300">
                Acesso Master
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              Logado como Administrador: <strong>{adminIdentity.name}</strong> ({adminIdentity.email}).
              Cadastre e gerencie as contas Google autorizadas como Coordenadores SMED.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleAddCoordinator}
        className="p-4 rounded-2xl bg-white/5 border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
      >
        <div className="sm:col-span-5">
          <label className="block text-[11px] font-bold text-indigo-200 mb-1">
            Nome do(a) Coordenador(a) *
          </label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex.: Mariana Fernandes"
            className="w-full rounded-xl border border-white/20 bg-black/20 text-white placeholder-slate-400 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="sm:col-span-5">
          <label className="block text-[11px] font-bold text-indigo-200 mb-1">
            E-mail (Conta Google) *
          </label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ex.: mariana.smed@gmail.com"
            className="w-full rounded-xl border border-white/20 bg-black/20 text-white placeholder-slate-400 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-md"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Adicionar</span>
          </button>
        </div>
      </form>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
            feedback.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : 'bg-rose-950/60 border-rose-500/40 text-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      <div className="space-y-2">
        <div className="text-xs font-bold text-indigo-200 flex items-center justify-between">
          <span>Coordenadores Autorizados ({coordinators.length})</span>
          <span className="text-[11px] text-indigo-300/70 font-normal">
            Essas contas têm permissão para importar da Ilha e gerenciar professores de robótica
          </span>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {coordinators.length === 0 ? (
            <div className="p-4 rounded-xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-indigo-300/60">
              Nenhum coordenador adicional cadastrado ainda. Use o formulário acima para autorizar outras pessoas da SMED.
            </div>
          ) : (
            coordinators.map((c) => (
              <div
                key={c.id}
                className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-white truncate">{c.name}</div>
                  <div className="text-[11px] text-indigo-200/80 flex items-center gap-2 truncate">
                    <Mail className="w-3 h-3 shrink-0" />
                    <span>{c.email}</span>
                    <span className="text-slate-400">·</span>
                    <span className="text-[10px] text-slate-400">
                      Desde {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(c.id, c.name)}
                  title="Revogar acesso"
                  className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
