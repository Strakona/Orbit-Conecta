export type Role = 'ALUNO' | 'PROFESSOR' | 'COORDENADOR';

export type StageKey = 'UI_UX' | 'LOGICA_REGRAS' | 'IA_DADOS' | 'QA_TESTES';

export type StageStatus = 'DISPONIVEL' | 'EM_DESENVOLVIMENTO' | 'EM_REVISAO' | 'APROVADA';

export type DemandStatus = 'ATIVA' | 'MODO_TESTE' | 'ENTREGUE';

export type TutorPersonaId =
  | 'GERAL'
  | 'DESIGNER_UI'
  | 'ARQUITETO'
  | 'ENG_PROMPTS'
  | 'REVISOR_QA';

export type ActivityBubble = '</> Código' | '🎨 UI' | '🤖 IA' | '🧪 QA' | '☕ Lounge';

export type HandRaisedType = 'AJUDA' | 'AVALIACAO' | null;

export interface AvatarConfig {
  skin: string;
  hair: string;
  shirt: string;
  accent: string;
  hairStyle: 'curto' | 'longo' | 'moicano' | 'cacheado';
  accessory?: 'oculos' | 'fone' | 'bone' | 'nenhum';
}

export interface Turma {
  id: string;
  name: string;
  schedule: string;
  description: string;
}

export interface Student {
  id: string;
  uuid: string; // Anonymized identifier sent to Gemini API (LGPD)
  name: string;
  turmaId: string;
  pin: string;
  avatar: AvatarConfig;
  location: string; // 'LOBBY' | 'LOUNGE' | 'SALA_DEMANDAS' | 'AUDITORIO' | demandId
  activeStage?: StageKey;
  activityBubble?: ActivityBubble;
  handRaised: HandRaisedType;
  handNote?: string;
  badges: string[];
}

export interface UiField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select';
  placeholder?: string;
  options?: string[];
}

export interface UiInfoCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export type UiNavigationStyle = 'tabs' | 'bottom' | 'sidebar';

export interface UiScreen {
  id: string;
  name: string;
  title: string;
  subtitle: string;
  fields: UiField[];
  infoCards: UiInfoCard[];
  ctaLabel?: string;
  ctaTargetScreenId?: string;
}

export interface UiArtifact {
  appTitle: string;
  appSubtitle: string;
  primaryColor: string;
  accentColor: string;
  navigationStyle?: UiNavigationStyle;
  screens?: UiScreen[];
  fields: UiField[];
  infoCards: UiInfoCard[];
  ctaLabel: string;
}

export interface LogicRule {
  id: string;
  fieldId: string;
  operator: 'contem' | 'igual' | 'maior_que' | 'menor_que' | 'nao_vazio';
  value: string;
  resultTitle: string;
  resultMessage: string;
  severity: 'info' | 'success' | 'warning' | 'urgent';
  targetScreenId?: string;
}

export interface LogicArtifact {
  rules: LogicRule[];
  defaultMessage: string;
}

export interface AiFaq {
  id: string;
  question: string;
  answer: string;
}

export interface AiArtifact {
  assistantName: string;
  persona: string;
  systemInstructions: string;
  greeting: string;
  faqs: AiFaq[];
}

export interface QaChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export interface QaArtifact {
  checklist: QaChecklistItem[];
  notes: string;
}

export interface DemandStage {
  key: StageKey;
  title: string;
  description: string;
  required: boolean;
  status: StageStatus;
  assigneeId: string | null;
  checklist: { id: string; label: string; done: boolean }[];
  feedback?: string;
  submittedAt?: string;
  approvedAt?: string;
}

export interface Demand {
  id: string;
  title: string;
  shortName: string;
  secretaria: string;
  description: string;
  icon: string;
  status: DemandStatus;
  createdAt: string;
  deliveredAt?: string;
  stages: Record<StageKey, DemandStage>;
  artifacts: {
    ui: UiArtifact;
    logic: LogicArtifact;
    ai: AiArtifact;
    qa: QaArtifact;
  };
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  studentUuid: string;
  demandId: string;
  demandTitle: string;
  stageKey: StageKey;
  personaId: TutorPersonaId;
  userMessage: string;
  tutorReply: string;
  mode: 'GEMINI_LIVE' | 'SIMULADO';
}

export interface TutorPersona {
  id: TutorPersonaId;
  name: string;
  role: string;
  badgeColor: string;
  specialty: string;
  focusPrompt: string;
}

export interface SessionUser {
  role: Role;
  studentId?: string;
  name: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type: 'info' | 'success' | 'warning';
}

export type PortalSubmissionStatus =
  | 'PENDENTE_TRIAGEM'
  | 'EM_REVISAO'
  | 'AJUSTE_SOLICITADO'
  | 'APROVADA_ORBIT'
  | 'ARQUIVADA';

export type ViabilityStatus =
  | 'ALTAMENTE_VIAVEL'
  | 'VIAVEL_COM_ADAPTACAO'
  | 'FORA_DE_ESCOPO_HARDWARE';

export type UrgencyLevel = 'BAIXA' | 'MEDIA' | 'ALTA';

export interface StationPlan {
  taskTitle: string;
  objective: string;
  technicalDetails: string;
  checklist: string[];
}

export interface HardwareAdaptationProposal {
  suggestedTitle: string;
  suggestedDescription: string;
  adaptationNotes: string;
}

export interface DemandAiAnalysis {
  viabilityStatus: ViabilityStatus;
  viabilityScore: number;
  viabilityRationale: string;
  friendlySummary: string;
  suggestedShortName: string;
  hardwareAdaptation?: HardwareAdaptationProposal;
  stations: Record<StageKey, StationPlan>;
  starterArtifacts: Demand['artifacts'];
  mode: 'GEMINI_LIVE' | 'SIMULADO';
  analyzedAt: string;
}

export interface ClarificationEntry {
  id: string;
  author: 'MENTOR' | 'SOLICITANTE';
  message: string;
  timestamp: string;
}

export interface PortalSubmission {
  id: string;
  protocol: string;
  requesterName: string;
  requesterRole: string;
  organization: string;
  organizationType: 'ESCOLA' | 'SECRETARIA';
  title: string;
  problemDescription: string;
  targetAudienceAndImpact: string;
  urgency: UrgencyLevel;
  status: PortalSubmissionStatus;
  createdAt: string;
  updatedAt: string;
  analysis: DemandAiAnalysis;
  clarifications: ClarificationEntry[];
  linkedDemandId?: string;
}

export interface OrbitState {
  session: SessionUser | null;
  turmas: Turma[];
  students: Student[];
  demands: Demand[];
  portalSubmissions: PortalSubmission[];
  auditLogs: AuditLogEntry[];
  geminiApiKey: string;
  highContrast: boolean;
  viewMode: 'MAP' | 'CARDS';
  activeDemandId: string | null;
  activeTab: 'LAB' | 'PROFESSOR' | 'COORDENADOR' | 'VITRINE' | 'PORTAL';
}
