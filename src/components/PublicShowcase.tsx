import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Download,
  Eye,
  Flower2,
  Printer,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useOrbit } from '../context/OrbitContext';
import { STAGE_META } from '../data/seedData';
import { Demand, StageKey } from '../types';
import { PixelAvatar } from './PixelAvatar';
import { UnifiedPreview } from './UnifiedPreview';

const STAGE_ORDER: StageKey[] = ['UI_UX', 'LOGICA_REGRAS', 'IA_DADOS', 'QA_TESTES'];

interface PublicShowcaseProps {
  isPublicMode?: boolean;
}

export const PublicShowcase: React.FC<PublicShowcaseProps> = ({ isPublicMode = false }) => {
  const { state } = useOrbit();
  const [testingDemand, setTestingDemand] = useState<Demand | null>(null);

  const session = state.session;
  const publicView = isPublicMode || !session;
  const isStaff = session?.role === 'PROFESSOR' || session?.role === 'COORDENADOR';
  const isStudent = session?.role === 'ALUNO';

  const [staffSelectedStudentId, setStaffSelectedStudentId] = useState<string>(
    session?.studentId ?? state.students[1]?.id ?? state.students[0].id
  );

  const deliveredDemands = state.demands.filter((d) => d.status === 'ENTREGUE');

  const selectedStudent = isStudent
    ? state.students.find((s) => s.id === session.studentId) ?? state.students[0]
    : state.students.find((s) => s.id === staffSelectedStudentId) ?? state.students[0];

  const studentContributions: {
    demand: Demand;
    stages: StageKey[];
  }[] = [];

  if (!publicView && selectedStudent) {
    state.demands.forEach((d) => {
      const built = STAGE_ORDER.filter((k) => d.stages[k].assigneeId === selectedStudent.id);
      if (
        built.length > 0 &&
        (d.status === 'ENTREGUE' || built.some((k) => d.stages[k].status === 'APROVADA'))
      ) {
        studentContributions.push({ demand: d, stages: built });
      }
    });
  }

  const handleDownloadCard = () => {
    if (publicView || !selectedStudent) return;
    const lines = [
      'ORBIT CONECTA — SMED CIANORTE (CEMI 2)',
      'CERTIFICADO DIGITAL: "EU AJUDEI A FAZER"',
      '-------------------------------------------',
      `Estudante: ${selectedStudent.name}`,
      `Identificador Anônimo: ${selectedStudent.uuid}`,
      `Badges conquistadas: ${selectedStudent.badges.join(', ') || 'Em formação'}`,
      '',
      'CONTRIBUIÇÕES EM PROJETOS MUNICIPAIS:',
      ...(studentContributions.length > 0
        ? studentContributions.map(
            (c) =>
              `- ${c.demand.title} (${c.demand.secretaria}): ${c.stages
                .map((s) => STAGE_META[s].label)
                .join(' + ')}`
          )
        : ['- Participante ativo das Turmas AH/SD no Laboratório Orbit Conecta']),
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eu-ajudei-a-fazer-${selectedStudent.name.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-[#0B132B] text-white rounded-3xl p-6 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-400/20 border border-emerald-300/40 text-emerald-200 text-xs font-semibold mb-2">
            <Flower2 className="w-3.5 h-3.5" />
            <span>Jardim da Inovação · Vitrine Pública SMED Cianorte</span>
          </div>
          <h2 className="font-display font-bold text-2xl">
            Soluções Digitais Entregues à Comunidade
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1">
            Aplicativos web e assistentes de IA criados colaborativamente pelas Turmas AH/SD do CEMI 2 após Entrega Oficial.
          </p>
        </div>

        <div className="px-4 py-3 rounded-2xl bg-white/10 border border-white/20 text-center">
          <div className="font-display font-extrabold text-2xl">{deliveredDemands.length}</div>
          <div className="text-[11px] text-emerald-200">Projetos Entregues</div>
        </div>
      </div>

      {/* Delivered Projects Gallery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {deliveredDemands.map((demand) => {
          const ownStages =
            isStudent && session.studentId
              ? STAGE_ORDER.filter((k) => demand.stages[k].assigneeId === session.studentId)
              : [];

          return (
            <div
              key={demand.id}
              className="bg-white rounded-2xl border-2 border-emerald-200 p-5 shadow-sm flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-bold uppercase text-emerald-700">
                      {demand.secretaria}
                    </span>
                    <h3 className="font-display font-bold text-lg text-slate-900">
                      {demand.title}
                    </h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 shrink-0">
                    <Sparkles className="w-3 h-3" />
                    Oficial
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2">{demand.description}</p>

                {/* Credits: Institutional-only in Public & Student views; full internal team for Staff */}
                {isStaff ? (
                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-700 mb-2">
                      Créditos Internos da Equipe Construtora (Uso CEMI 2):
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {STAGE_ORDER.map((k) => {
                        const st = demand.stages[k];
                        const stu = state.students.find((s) => s.id === st.assigneeId);
                        if (!stu) return null;
                        return (
                          <div
                            key={k}
                            className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                          >
                            <PixelAvatar
                              name={stu.name}
                              config={stu.avatar}
                              size={28}
                              showBadgeTag={false}
                            />
                            <div className="min-w-0">
                              <div className="font-bold text-slate-900 truncate">{stu.name}</div>
                              <div className="text-[10px] text-emerald-700 font-medium">
                                {STAGE_META[k].label}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Desenvolvido pelas Turmas AH/SD · CEMI 2 — SMED Cianorte</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5">
                      {STAGE_ORDER.map((k) => (
                        <div
                          key={k}
                          className="px-2.5 py-1.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 font-medium flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{STAGE_META[k].label}</span>
                        </div>
                      ))}
                    </div>

                    {ownStages.length > 0 && (
                      <div className="px-3 py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-900 font-semibold">
                        🏅 Você contribuiu nesta entrega em:{' '}
                        {ownStages.map((k) => STAGE_META[k].label).join(' · ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={() => setTestingDemand(demand)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye className="w-4 h-4" />
                <span>Testar Protótipo Entregue</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Individual Card ONLY in Authenticated Views; LGPD Notice in Public View */}
      {publicView ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex items-center gap-3 text-xs text-slate-600">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>
            <strong>Proteção de Dados (LGPD / ECA):</strong> nesta vitrine pública não são exibidos
            nomes, fotos, horários ou identificações individuais dos estudantes. Certificados
            individuais ("Eu Ajudei a Fazer") ficam disponíveis apenas dentro do ambiente autenticado
            do CEMI 2.
          </span>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="no-print flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-lg text-slate-900 flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>
                  {isStudent
                    ? 'Meu Cartão — "Eu Ajudei a Fazer"'
                    : 'Cartão Individual — "Eu Ajudei a Fazer"'}
                </span>
              </h3>
              <p className="text-xs text-slate-600">
                {isStudent
                  ? 'Veja e exporte suas contribuições pessoais nos projetos municipais.'
                  : 'Selecione um estudante para visualizar e exportar suas contribuições exatas em cada projeto.'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {isStaff && (
                <select
                  id="showcase-student-select"
                  name="studentId"
                  aria-label="Selecionar estudante para o cartão"
                  value={selectedStudent.id}
                  onChange={(e) => setStaffSelectedStudentId(e.target.value)}
                  className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold bg-slate-50"
                >
                  {state.students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.badgeCode})
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleDownloadCard}
                className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Cartão</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-900 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-emerald-50 p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-indigo-200/70 pb-4">
              <div className="flex items-center gap-4">
                <PixelAvatar
                  name={selectedStudent.name}
                  config={selectedStudent.avatar}
                  size={56}
                  showBadgeTag={false}
                />
                <div>
                  <span className="font-pixel text-[10px] text-indigo-700 uppercase">
                    Eu Ajudei a Fazer · CEMI 2 / SMED Cianorte
                  </span>
                  <h4 className="font-display font-extrabold text-xl text-slate-900">
                    {selectedStudent.name}
                  </h4>
                  <p className="text-xs text-slate-600">
                    {state.turmas.find((t) => t.id === selectedStudent.turmaId)?.name} · Crachá{' '}
                    <code>{selectedStudent.badgeCode}</code> · UUID <code>{selectedStudent.uuid}</code>
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {selectedStudent.badges.map((b) => (
                  <span
                    key={b}
                    className="px-2.5 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-[11px] font-bold"
                  >
                    🏅 {b}
                  </span>
                ))}
              </div>
            </div>

            {studentContributions.length === 0 ? (
              <p className="text-xs text-slate-600 italic">
                Este estudante ainda está construindo suas primeiras entregas oficiais.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {studentContributions.map((c) => (
                  <div
                    key={c.demand.id}
                    className="p-3.5 rounded-xl bg-white border border-indigo-100 shadow-xs"
                  >
                    <div className="text-[10px] font-bold uppercase text-emerald-700">
                      {c.demand.secretaria} ·{' '}
                      {c.demand.status === 'ENTREGUE' ? 'Entregue Oficialmente' : 'Etapa Aprovada'}
                    </div>
                    <div className="font-display font-bold text-sm text-slate-900 mt-0.5">
                      {c.demand.title}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {c.stages.map((stKey) => (
                        <span
                          key={stKey}
                          className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[11px] font-semibold"
                        >
                          ✓ {STAGE_META[stKey].label}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal to test a delivered prototype */}
      {testingDemand && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Protótipo Oficial da Vitrine Pública"
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
            <div className="bg-[#0B132B] text-white px-5 py-3.5 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase text-emerald-300 font-bold">
                  Vitrine Pública · Protótipo Oficial
                </span>
                <h3 className="font-display font-bold text-base">{testingDemand.title}</h3>
              </div>
              <button
                onClick={() => setTestingDemand(null)}
                aria-label="Fechar protótipo"
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <UnifiedPreview demand={testingDemand} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
