import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ClipboardList,
  Delete,
  GraduationCap,
  KeyRound,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { Role } from '../types';
import { PixelAvatar } from './PixelAvatar';

interface LoginScreenProps {
  onOpenPublicPortal?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onOpenPublicPortal }) => {
  const { state, loginAsStudent, loginAsRole } = useOrbit();
  const [selectedRole, setSelectedRole] = useState<Role>('ALUNO');
  const [selectedTurmaId, setSelectedTurmaId] = useState<string>(state.turmas[0]?.id ?? 'turma-1');

  const turmaStudents = useMemo(
    () => state.students.filter((s) => s.turmaId === selectedTurmaId),
    [state.students, selectedTurmaId]
  );

  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    turmaStudents[0]?.id ?? state.students[0].id
  );
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');

  const activeStudent =
    turmaStudents.find((s) => s.id === selectedStudentId) ?? turmaStudents[0] ?? state.students[0];

  const handleTurmaChange = (turmaId: string) => {
    setSelectedTurmaId(turmaId);
    const first = state.students.find((s) => s.turmaId === turmaId);
    if (first) setSelectedStudentId(first.id);
    setPin('');
    setPinError('');
  };

  const handleDigit = (digit: string) => {
    setPinError('');
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4 && activeStudent) {
      const ok = loginAsStudent(activeStudent.id, next);
      if (!ok) {
        setPinError(`PIN incorreto. Dica demo para ${activeStudent.name.split(' ')[0]}: ${activeStudent.pin}`);
      }
    }
  };

  const handleBackspace = () => {
    setPinError('');
    setPin((p) => p.slice(0, -1));
  };

  const handleStudentSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeStudent) return;
    if (!loginAsStudent(activeStudent.id, pin)) {
      setPinError(`PIN inválido! Use ${activeStudent.pin} para demonstração.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0F172A] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Institutional Column */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0B132B] to-[#1E293B] text-white p-7 sm:p-9 flex flex-col justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>CEMI 2 · SMED Cianorte — PR</span>
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Orbit Conecta
            </h1>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed">
              Software house pública infantil das <strong className="text-white">Turmas AH/SD</strong>.
              Escolha uma demanda municipal, construa telas, regras lógicas e IA com Gemini, e entregue
              soluções reais para a rede de Cianorte.
            </p>

            {/* Quick Role Selector */}
            <div className="mt-7 space-y-2.5">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Selecione o perfil de acesso
              </p>
              <button
                onClick={() => setSelectedRole('ALUNO')}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  selectedRole === 'ALUNO'
                    ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/10'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Estudante (Turmas AH/SD 1–4)</div>
                  <div className="text-xs text-slate-300">Avatar pixel art, Pull System e Tutores IA</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('PROFESSOR')}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  selectedRole === 'PROFESSOR'
                    ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
                  <GraduationCap className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Professor Mentor (CEMI 2)</div>
                  <div className="text-xs text-slate-300">Mãos levantadas, Badges, Modo Teste e Entrega</div>
                </div>
              </button>

              <button
                onClick={() => setSelectedRole('COORDENADOR')}
                className={`w-full p-3.5 rounded-2xl border text-left transition flex items-center gap-3 cursor-pointer ${
                  selectedRole === 'COORDENADOR'
                    ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/10'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
                  <Settings className="w-5 h-5 text-slate-950" />
                </div>
                <div>
                  <div className="font-semibold text-sm">Coordenador (Gestão SMED)</div>
                  <div className="text-xs text-slate-300">Novas demandas, Chave Gemini BYOK e Auditoria</div>
                </div>
              </button>
            </div>

            {onOpenPublicPortal && (
              <div className="mt-5 pt-5 border-t border-slate-700/70">
                <button
                  type="button"
                  onClick={onOpenPublicPortal}
                  className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-sky-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 border border-sky-400/50 text-left transition flex items-center justify-between gap-3 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-400 text-slate-950 flex items-center justify-center shrink-0">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white">
                        Portal de Demandas (Sem Login)
                      </div>
                      <div className="text-[11px] text-sky-200">
                        Para Escolas e Secretarias enviarem problemas ou consultarem protocolo
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-sky-300 group-hover:translate-x-0.5 transition shrink-0" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-7 pt-5 border-t border-slate-700/70 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Privacidade LGPD Infantil: apenas UUIDs anônimos são enviados à Gemini API.</span>
          </div>
        </div>

        {/* Right Interactive Login Area */}
        <div className="lg:col-span-7 p-6 sm:p-9 bg-slate-50 flex flex-col justify-center">
          {selectedRole === 'ALUNO' && (
            <div className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Entrar no Laboratório Virtual
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  1) Escolha sua Turma AH/SD · 2) Selecione seu Avatar · 3) Digite seu PIN de 4 dígitos
                </p>
              </div>

              {/* Turma selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {state.turmas.map((turma) => (
                  <button
                    key={turma.id}
                    onClick={() => handleTurmaChange(turma.id)}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedTurmaId === turma.id
                        ? 'bg-sky-50 border-sky-500 ring-2 ring-sky-200'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-slate-900">{turma.name}</div>
                    <div className="text-[11px] text-slate-500">{turma.schedule}</div>
                  </button>
                ))}
              </div>

              {/* Student Avatar Selector */}
              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Estudantes da turma ({turmaStudents.length}):
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {turmaStudents.map((stu) => {
                    const isSelected = activeStudent?.id === stu.id;
                    return (
                      <button
                        key={stu.id}
                        type="button"
                        onClick={() => {
                          setSelectedStudentId(stu.id);
                          setPin('');
                          setPinError('');
                        }}
                        className={`px-3 py-2 rounded-2xl border flex items-center gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-white border-sky-500 ring-2 ring-sky-200 shadow-sm'
                            : 'bg-white/70 border-slate-200 hover:bg-white'
                        }`}
                      >
                        <PixelAvatar
                          name={stu.name}
                          config={stu.avatar}
                          size={34}
                          showBadgeTag={false}
                          highlight={isSelected}
                        />
                        <div className="text-left">
                          <div className="text-xs font-bold text-slate-900">{stu.name}</div>
                          <div className="text-[10px] text-slate-500">PIN demo: {stu.pin}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Numeric PIN Pad */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 w-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                        PIN de {activeStudent?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => activeStudent && loginAsStudent(activeStudent.id, activeStudent.pin)}
                        className="text-[11px] font-semibold text-sky-600 hover:text-sky-700 underline cursor-pointer"
                      >
                        Entrar rápido ({activeStudent?.pin})
                      </button>
                    </div>

                    {/* 4 PIN Dots */}
                    <div className="flex gap-2.5 justify-center sm:justify-start my-3">
                      {[0, 1, 2, 3].map((idx) => (
                        <div
                          key={idx}
                          className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-lg font-bold transition ${
                            pin[idx]
                              ? 'border-sky-500 bg-sky-50 text-sky-800'
                              : 'border-slate-200 bg-slate-50 text-slate-400'
                          }`}
                        >
                          {pin[idx] ? '●' : ''}
                        </div>
                      ))}
                    </div>

                    {pinError && (
                      <p className="text-xs font-medium text-rose-600 mt-1">{pinError}</p>
                    )}

                    <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                      <strong>PINs de Teste (Demo):</strong> Lucas <code>1234</code> · Sofia{' '}
                      <code>1111</code> · Pedro <code>2222</code> · Marina <code>3333</code> ·
                      Gabriel <code>4444</code>
                    </div>
                  </div>

                  {/* Keypad */}
                  <form onSubmit={handleStudentSubmit} className="grid grid-cols-3 gap-1.5 w-48 shrink-0">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleDigit(d)}
                        className="h-10 rounded-xl bg-slate-100 hover:bg-sky-100 active:scale-95 font-display font-bold text-slate-800 transition cursor-pointer"
                      >
                        {d}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={handleBackspace}
                      className="h-10 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-700 flex items-center justify-center cursor-pointer"
                      title="Apagar"
                    >
                      <Delete className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDigit('0')}
                      className="h-10 rounded-xl bg-slate-100 hover:bg-sky-100 active:scale-95 font-display font-bold text-slate-800 transition cursor-pointer"
                    >
                      0
                    </button>
                    <button
                      type="submit"
                      className="h-10 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                    >
                      OK
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {selectedRole === 'PROFESSOR' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Acesso Professor Mentor — CEMI 2
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Monitore a turma do dia em tempo real, atenda alunos com a mão levantada, avalie
                  etapas com Badges, ative o Modo Teste coletivo e realize Entregas Oficiais.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div>• <strong>Alertas ativos agora:</strong> {state.students.filter((s) => s.handRaised).length} aluno(s) com mão levantada</div>
                <div>• <strong>Sala em Modo Teste:</strong> {state.demands.filter((d) => d.status === 'MODO_TESTE').length} projeto(s)</div>
              </div>
              <button
                onClick={() => loginAsRole('PROFESSOR')}
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>Entrar como Professor Mentor</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {selectedRole === 'COORDENADOR' && (
            <div className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Settings className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Acesso Coordenador — SMED Cianorte
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Cadastre novas demandas das Secretarias Municipais, configure a chave Gemini BYOK
                  (<code>gemini-2.5-flash</code>), audite logs de IA anonimizados e gerencie a Vitrine Pública.
                </p>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <div>• <strong>Chave Gemini BYOK:</strong> {state.geminiApiKey ? 'Configurada (Live)' : 'Modo Simulado Inteligente ativo'}</div>
                <div>• <strong>Registros de auditoria IA:</strong> {state.auditLogs.length} interações</div>
              </div>
              <button
                onClick={() => loginAsRole('COORDENADOR')}
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>Entrar como Coordenador SMED</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
