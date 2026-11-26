import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Delete,
  GraduationCap,
  KeyRound,
  Lock,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { Role } from '../types';
import { isDemoMode, STAFF_PASSCODES } from '../utils/demoMode';

interface LoginScreenProps {
  initialBadgeCode?: string;
  onBackToPublicPortal?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  initialBadgeCode = '',
  onBackToPublicPortal,
}) => {
  const {
    state,
    loginAsStudentByBadge,
    loginAsStaffWithCode,
    loginAsRole,
  } = useOrbit();
  const demo = isDemoMode();

  const [selectedRole, setSelectedRole] = useState<Role>('ALUNO');
  const [badgeCode, setBadgeCode] = useState(initialBadgeCode.toUpperCase());
  const [pin, setPin] = useState('');
  const [studentError, setStudentError] = useState('');

  const [staffPasscode, setStaffPasscode] = useState('');
  const [staffError, setStaffError] = useState('');

  const handleDigit = async (digit: string) => {
    setStudentError('');
    if (pin.length >= 4) return;
    const next = pin + digit;
    setPin(next);
    if (next.length === 4 && badgeCode.trim()) {
      const ok = await loginAsStudentByBadge(badgeCode, next);
      if (!ok) {
        setStudentError('Código do Crachá ou PIN inválido. Confira com o Professor Mentor.');
      }
    }
  };

  const handleBackspace = () => {
    setStudentError('');
    setPin((p) => p.slice(0, -1));
  };

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeCode.trim()) {
      setStudentError('Informe o código do seu crachá (ex.: ORB-01).');
      return;
    }
    if (pin.length !== 4) {
      setStudentError('Digite os 4 dígitos do seu PIN.');
      return;
    }
    const ok = await loginAsStudentByBadge(badgeCode, pin);
    if (!ok) {
      setStudentError('Código do Crachá ou PIN inválido. Confira com o Professor Mentor.');
    }
  };

  const handleStaffSubmit = async (e: React.FormEvent, role: Exclude<Role, 'ALUNO'>) => {
    e.preventDefault();
    setStaffError('');
    const ok = await loginAsStaffWithCode(role, staffPasscode);
    if (!ok) {
      setStaffError('Código institucional inválido.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#0F172A] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 grid grid-cols-1 lg:grid-cols-12">
        {/* Left Institutional Column */}
        <div className="lg:col-span-5 bg-gradient-to-b from-[#0B132B] to-[#1E293B] text-white p-7 sm:p-9 flex flex-col justify-between">
          <div>
            {onBackToPublicPortal && (
              <button
                type="button"
                onClick={onBackToPublicPortal}
                className="mb-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Voltar ao Portal Público</span>
              </button>
            )}

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-400/30 text-sky-300 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Acesso Restrito · SMED Cianorte</span>
              </span>
              {demo && (
                <span className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10px] font-bold">
                  Modo Apresentação (?demo=1)
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Orbit Conecta
            </h1>
            <p className="mt-3 text-slate-300 text-sm leading-relaxed">
              Ambiente interno do Laboratório de Inovação Pedagógica e Altas Habilidades. Entre com
              seu crachá individual ou credencial institucional da SMED Cianorte.
            </p>

            {/* Role Selector */}
            <div className="mt-7 space-y-2.5">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                Selecione seu perfil
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('ALUNO');
                  setStaffError('');
                }}
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
                  <div className="font-semibold text-sm">Estudante AH/SD</div>
                  <div className="text-xs text-slate-300">Entrada privada por Código do Crachá + PIN</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('PROFESSOR');
                  setStaffPasscode('');
                  setStaffError('');
                }}
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
                  <div className="font-semibold text-sm">Professor Mentor (Lab. Inovação)</div>
                  <div className="text-xs text-slate-300">Acesso protegido por código institucional</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedRole('COORDENADOR');
                  setStaffPasscode('');
                  setStaffError('');
                }}
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
                  <div className="text-xs text-slate-300">Triagem, BYOK, crachás e auditoria LGPD</div>
                </div>
              </button>
            </div>
          </div>

          <div className="mt-7 pt-5 border-t border-slate-700/70 flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Proteção de Dados (LGPD / ECA): nenhum nome de estudante, horário ou PIN é exposto
              antes do login.
            </span>
          </div>
        </div>

        {/* Right Interactive Login Area */}
        <div className="lg:col-span-7 p-6 sm:p-9 bg-slate-50 flex flex-col justify-center">
          {selectedRole === 'ALUNO' && (
            <form onSubmit={handleStudentSubmit} className="space-y-5">
              <div>
                <h2 className="font-display text-xl font-bold text-slate-900">
                  Entrar com seu Crachá do Laboratório
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  Digite o código do seu crachá individual e o PIN secreto de 4 dígitos.
                </p>
                {initialBadgeCode && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 border border-sky-300 text-sky-900 text-xs font-bold">
                    <BadgeCheck className="w-3.5 h-3.5 text-sky-700" />
                    <span>Crachá {initialBadgeCode.toUpperCase()} lido via QR — digite seu PIN</span>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
                <div>
                  <label
                    htmlFor="student-badge-input"
                    className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"
                  >
                    <BadgeCheck className="w-4 h-4 text-sky-600" />
                    <span>Código do Crachá</span>
                  </label>
                  <input
                    id="student-badge-input"
                    name="badgeCode"
                    type="text"
                    autoComplete="off"
                    value={badgeCode}
                    onChange={(e) => {
                      setStudentError('');
                      setBadgeCode(e.target.value.toUpperCase());
                    }}
                    placeholder="Ex.: ORB-01"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm font-mono font-bold tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex-1 w-full">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                      <KeyRound className="w-3.5 h-3.5 text-sky-600" />
                      <span>PIN Secreto (4 dígitos)</span>
                    </span>

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

                    {studentError && (
                      <p className="text-xs font-medium text-rose-600 mt-1">{studentError}</p>
                    )}

                    {demo && (
                      <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1.5">
                        <div>
                          <strong>Modo Apresentação (?demo=1):</strong> use <code>ORB-01</code> + PIN{' '}
                          <code>1234</code> (ou <code>ORB-02</code> / <code>1111</code>).
                        </div>
                        <button
                          type="button"
                          onClick={() => loginAsStudentByBadge('ORB-01', '1234')}
                          className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-[11px] cursor-pointer"
                        >
                          Entrar Demo como ORB-01
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Numeric Keypad */}
                  <div className="grid grid-cols-3 gap-1.5 w-48 shrink-0">
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
                      aria-label="Apagar dígito"
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
                  </div>
                </div>
              </div>
            </form>
          )}

          {selectedRole === 'PROFESSOR' && (
            <form
              onSubmit={(e) => handleStaffSubmit(e, 'PROFESSOR')}
              className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Acesso Professor Mentor — Lab. Inovação
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Monitore a turma do dia, atenda mãos levantadas, aprove etapas com Badges e
                  realize Entregas Oficiais.
                </p>
              </div>

              <div>
                <label
                  htmlFor="professor-passcode"
                  className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Código Institucional do Mentor</span>
                </label>
                <input
                  id="professor-passcode"
                  type="password"
                  autoComplete="off"
                  value={staffPasscode}
                  onChange={(e) => {
                    setStaffError('');
                    setStaffPasscode(e.target.value);
                  }}
                  placeholder="Digite o código institucional..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                {staffError && (
                  <p className="text-xs font-medium text-rose-600 mt-1.5">{staffError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>Entrar como Professor Mentor</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {demo && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-2 text-xs text-amber-950">
                  <span>
                    Código demo: <code>{STAFF_PASSCODES.PROFESSOR}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => loginAsRole('PROFESSOR')}
                    className="px-3 py-1 rounded-lg bg-amber-400 hover:bg-amber-500 font-bold cursor-pointer"
                  >
                    Entrar Demo
                  </button>
                </div>
              )}
            </form>
          )}

          {selectedRole === 'COORDENADOR' && (
            <form
              onSubmit={(e) => handleStaffSubmit(e, 'COORDENADOR')}
              className="bg-white rounded-3xl border border-slate-200 p-7 shadow-sm space-y-5"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Settings className="w-8 h-8" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold text-slate-900">
                  Acesso Coordenador — SMED Cianorte
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Faça triagem de demandas municipais, configure a chave Gemini BYOK, consulte
                  crachás dos estudantes e audite logs de IA.
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
                • <strong>Chave Gemini BYOK:</strong>{' '}
                {state.geminiApiKey ? 'Configurada (Live)' : 'Modo Simulado Inteligente ativo'}
              </div>

              <div>
                <label
                  htmlFor="coordinator-passcode"
                  className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Código Institucional da Coordenação</span>
                </label>
                <input
                  id="coordinator-passcode"
                  type="password"
                  autoComplete="off"
                  value={staffPasscode}
                  onChange={(e) => {
                    setStaffError('');
                    setStaffPasscode(e.target.value);
                  }}
                  placeholder="Digite o código institucional..."
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {staffError && (
                  <p className="text-xs font-medium text-rose-600 mt-1.5">{staffError}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <span>Entrar como Coordenador SMED</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {demo && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2 text-xs text-emerald-950">
                  <span>
                    Código demo: <code>{STAFF_PASSCODES.COORDENADOR}</code>
                  </span>
                  <button
                    type="button"
                    onClick={() => loginAsRole('COORDENADOR')}
                    className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold cursor-pointer"
                  >
                    Entrar Demo
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
