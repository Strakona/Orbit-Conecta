import React, { useMemo, useState } from 'react';
import { BadgeCheck, Eye, EyeOff, Printer, Sparkles, X } from 'lucide-react';
import { Student, Turma } from '../types';
import { PixelAvatar } from './PixelAvatar';

interface BadgePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  turmas: Turma[];
  initialFilterTurmaId?: string;
  singleStudentId?: string | null;
}

export const BadgePrintModal: React.FC<BadgePrintModalProps> = ({
  isOpen,
  onClose,
  students,
  turmas,
  initialFilterTurmaId = 'ALL',
  singleStudentId = null,
}) => {
  const [filterTurmaId, setFilterTurmaId] = useState<string>(initialFilterTurmaId);
  const [showPin, setShowPin] = useState<boolean>(true);

  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://orbit-conecta.vercel.app';

  const visibleStudents = useMemo(() => {
    if (singleStudentId) {
      return students.filter((s) => s.id === singleStudentId);
    }
    if (filterTurmaId === 'ALL') return students;
    return students.filter((s) => s.turmaId === filterTurmaId);
  }, [students, filterTurmaId, singleStudentId]);

  if (!isOpen) return null;

  return (
    <div className="badge-print-root fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 print:block print:bg-white print:p-0">
      <div className="badge-print-root bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden print:max-w-none print:rounded-none print:shadow-none print:border-0">
        {/* Toolbar (hidden on print) */}
        <div className="no-print bg-[#0B132B] text-white px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center">
              <BadgeCheck className="w-5 h-5 text-sky-300" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base">
                Folha de Crachás CEMI 2 (Recorte A4)
              </h3>
              <p className="text-[11px] text-slate-300">
                Cada crachá possui QR Code direto (<code>?cracha=ORB-XX</code>) e PIN do aluno.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!singleStudentId && (
              <select
                value={filterTurmaId}
                onChange={(e) => setFilterTurmaId(e.target.value)}
                aria-label="Filtrar crachás por turma"
                className="rounded-xl border border-slate-600 bg-slate-900 text-white px-3 py-1.5 text-xs font-semibold"
              >
                <option value="ALL">Todas as Turmas ({students.length})</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({students.filter((s) => s.turmaId === t.id).length})
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setShowPin((v) => !v)}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-600 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              <span>{showPin ? 'Ocultar PIN' : 'Mostrar PIN'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Folha A4</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar impressão de crachás"
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable A4 Cut-Out Grid */}
        <div className="p-5 overflow-y-auto bg-slate-100 print:bg-white print:p-2 print:overflow-visible">
          {visibleStudents.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center text-sm text-slate-500">
              Nenhum estudante encontrado neste filtro.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 print:grid-cols-2 gap-4 print:gap-3">
              {visibleStudents.map((stu) => {
                const turma = turmas.find((t) => t.id === stu.turmaId);
                const qrTarget = `${origin}/?cracha=${encodeURIComponent(stu.badgeCode)}`;
                const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=4&data=${encodeURIComponent(
                  qrTarget
                )}`;

                return (
                  <div
                    key={stu.id}
                    className="break-inside-avoid rounded-2xl border-2 border-dashed border-slate-400 bg-white overflow-hidden shadow-xs print:shadow-none"
                  >
                    {/* Badge Top Strip */}
                    <div className="bg-[#0B132B] text-white px-4 py-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wide">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                        <span>ORBIT CONECTA · CEMI 2</span>
                      </div>
                      <span className="text-[10px] font-semibold text-sky-300">
                        SMED Cianorte
                      </span>
                    </div>

                    {/* Badge Body */}
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-2xl bg-slate-50 border border-slate-200 shrink-0">
                          <PixelAvatar
                            name={stu.name}
                            config={stu.avatar}
                            size={52}
                            showBadgeTag={false}
                          />
                        </div>
                        <div className="min-w-0 space-y-1">
                          <div className="font-display font-extrabold text-sm text-slate-900 truncate">
                            {stu.name}
                          </div>
                          <div className="text-[11px] text-slate-600 font-medium">
                            {turma?.name ?? 'Turma AH/SD'}
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="px-2 py-0.5 rounded-md bg-sky-100 border border-sky-300 text-sky-900 font-mono font-bold text-xs">
                              {stu.badgeCode}
                            </span>
                            {showPin && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-950 font-mono font-bold text-xs">
                                PIN: {stu.pin}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* QR Code */}
                      <div className="flex flex-col items-center shrink-0">
                        <img
                          src={qrImageUrl}
                          alt={`QR Code do crachá ${stu.badgeCode}`}
                          width={84}
                          height={84}
                          className="rounded-lg border border-slate-200 bg-white"
                        />
                        <span className="text-[9px] font-mono text-slate-500 mt-1">
                          ?cracha={stu.badgeCode}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
