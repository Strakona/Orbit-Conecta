import { GoogleGenAI, Schema, Type } from '@google/genai';
import {
  Demand,
  DemandAiAnalysis,
  PortalSubmission,
  StageKey,
  StationPlan,
  UrgencyLevel,
  ViabilityStatus,
} from '../types';

export interface PortalAnalysisInput {
  requesterName: string;
  requesterRole: string;
  requesterWhatsapp?: string;
  requesterEmail?: string;
  organization: string;
  organizationType: 'ESCOLA' | 'SECRETARIA';
  title: string;
  problemDescription: string;
  targetAudienceAndImpact: string;
  urgency: UrgencyLevel;
}

const HARDWARE_KEYWORDS = [
  'hardware',
  'robótica',
  'robotica',
  'robô',
  'robo',
  'arduino',
  'esp32',
  'raspberry',
  'sensor',
  'catraca',
  'cancela',
  'totem físico',
  'totem fisico',
  'impressora térmica',
  'impressora termica',
  'biometria física',
  'leitor biométrico',
  'microcontrolador',
  'fiação',
  'placa eletrônica',
  'servo motor',
  'drone',
];

const TRIAGE_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    viabilityStatus: {
      type: Type.STRING,
      enum: ['ALTAMENTE_VIAVEL', 'VIAVEL_COM_ADAPTACAO', 'FORA_DE_ESCOPO_HARDWARE'],
    },
    viabilityScore: { type: Type.NUMBER },
    viabilityRationale: { type: Type.STRING },
    friendlySummary: { type: Type.STRING },
    suggestedShortName: { type: Type.STRING },
    hasHardwareAdaptation: { type: Type.BOOLEAN },
    hardwareSuggestedTitle: { type: Type.STRING },
    hardwareSuggestedDescription: { type: Type.STRING },
    hardwareAdaptationNotes: { type: Type.STRING },
    uiStation: {
      type: Type.OBJECT,
      properties: {
        taskTitle: { type: Type.STRING },
        objective: { type: Type.STRING },
        technicalDetails: { type: Type.STRING },
        checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['taskTitle', 'objective', 'technicalDetails', 'checklist'],
    },
    logicStation: {
      type: Type.OBJECT,
      properties: {
        taskTitle: { type: Type.STRING },
        objective: { type: Type.STRING },
        technicalDetails: { type: Type.STRING },
        checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['taskTitle', 'objective', 'technicalDetails', 'checklist'],
    },
    aiStation: {
      type: Type.OBJECT,
      properties: {
        taskTitle: { type: Type.STRING },
        objective: { type: Type.STRING },
        technicalDetails: { type: Type.STRING },
        checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['taskTitle', 'objective', 'technicalDetails', 'checklist'],
    },
    qaStation: {
      type: Type.OBJECT,
      properties: {
        taskTitle: { type: Type.STRING },
        objective: { type: Type.STRING },
        technicalDetails: { type: Type.STRING },
        checklist: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ['taskTitle', 'objective', 'technicalDetails', 'checklist'],
    },
    starterAppTitle: { type: Type.STRING },
    starterAppSubtitle: { type: Type.STRING },
    starterCtaLabel: { type: Type.STRING },
    starterPrimaryColor: { type: Type.STRING },
    starterAccentColor: { type: Type.STRING },
    starterFieldLabel: { type: Type.STRING },
    starterFieldPlaceholder: { type: Type.STRING },
    starterInfoTitle: { type: Type.STRING },
    starterInfoDescription: { type: Type.STRING },
    starterRuleValue: { type: Type.STRING },
    starterRuleTitle: { type: Type.STRING },
    starterRuleMessage: { type: Type.STRING },
    starterDefaultMessage: { type: Type.STRING },
    starterAssistantName: { type: Type.STRING },
    starterAssistantPersona: { type: Type.STRING },
    starterAssistantInstructions: { type: Type.STRING },
    starterAssistantGreeting: { type: Type.STRING },
    starterFaqQuestion: { type: Type.STRING },
    starterFaqAnswer: { type: Type.STRING },
  },
  required: [
    'viabilityStatus',
    'viabilityScore',
    'viabilityRationale',
    'friendlySummary',
    'suggestedShortName',
    'hasHardwareAdaptation',
    'uiStation',
    'logicStation',
    'aiStation',
    'qaStation',
    'starterAppTitle',
    'starterAppSubtitle',
    'starterCtaLabel',
    'starterFieldLabel',
    'starterRuleTitle',
    'starterRuleMessage',
    'starterDefaultMessage',
    'starterAssistantName',
    'starterAssistantPersona',
    'starterAssistantInstructions',
    'starterAssistantGreeting',
  ],
};

function sanitizeShortName(title: string): string {
  const cleaned = title.replace(/^[^a-zA-ZÀ-ÿ0-9]+/, '').trim();
  const words = cleaned.split(/\s+/).slice(0, 3).join(' ');
  return words.length > 20 ? `${words.slice(0, 18)}…` : words || 'Nova Demanda';
}

function buildStarterArtifactsFromSummary(params: {
  title: string;
  organization: string;
  shortName: string;
  fieldLabel?: string;
  fieldPlaceholder?: string;
  ctaLabel?: string;
  primaryColor?: string;
  accentColor?: string;
  infoTitle?: string;
  infoDesc?: string;
  ruleValue?: string;
  ruleTitle?: string;
  ruleMessage?: string;
  defaultMessage?: string;
  assistantName?: string;
  persona?: string;
  instructions?: string;
  greeting?: string;
  faqQuestion?: string;
  faqAnswer?: string;
}): Demand['artifacts'] {
  const fieldId = 'entrada_principal';
  const mainFields = [
    {
      id: fieldId,
      label: params.fieldLabel || 'Descreva ou informe o dado principal',
      type: 'text' as const,
      placeholder: params.fieldPlaceholder || 'Digite aqui...',
    },
    {
      id: 'unidade_atendimento',
      label: 'Unidade / Setor de referência',
      type: 'select' as const,
      options: [params.organization, 'Atendimento Central SMED', 'Outro setor municipal'],
    },
  ];
  const infoCards = [
    {
      id: 'info-1',
      title: params.infoTitle || params.organization,
      description:
        params.infoDesc ||
        'Aplicativo web do Laboratório de Inovação CEMI 2 — SMED Cianorte.',
      icon: 'Sparkles',
    },
  ];
  const appTitle = params.shortName ? `${params.shortName} · Cianorte` : params.title;
  const appSubtitle = `Solução digital desenvolvida para ${params.organization}`;
  const ctaLabel = params.ctaLabel || 'Analisar Solicitação';

  return {
    ui: {
      appTitle,
      appSubtitle,
      primaryColor: params.primaryColor || '#0284C7',
      accentColor: params.accentColor || '#10B981',
      navigationStyle: 'tabs',
      ctaLabel,
      fields: mainFields,
      infoCards,
      screens: [
        {
          id: 'scr-inicio',
          name: 'Início',
          title: appTitle,
          subtitle: appSubtitle,
          fields: mainFields,
          infoCards: [],
          ctaLabel,
        },
        {
          id: 'scr-info',
          name: 'Orientações',
          title: `Sobre — ${params.shortName || params.title}`,
          subtitle: `Informações oficiais de ${params.organization}`,
          fields: [],
          infoCards,
          ctaLabel: 'Voltar ao Início',
          ctaTargetScreenId: 'scr-inicio',
        },
      ],
    },
    logic: {
      rules: [
        {
          id: 'rule-1',
          fieldId,
          operator: params.ruleValue ? 'contem' : 'nao_vazio',
          value: params.ruleValue || '',
          resultTitle: params.ruleTitle || 'Prioridade Identificada',
          resultMessage:
            params.ruleMessage ||
            'Solicitação registrada e encaminhada conforme as regras da unidade.',
          severity: params.ruleValue ? 'warning' : 'success',
        },
      ],
      defaultMessage:
        params.defaultMessage ||
        'Informação recebida com sucesso! Confira as orientações ou converse com o assistente ao lado.',
    },
    ai: {
      assistantName: params.assistantName || `Guia ${params.shortName}`,
      persona:
        params.persona ||
        `Assistente digital cordial e educativo vinculado à ${params.organization}.`,
      systemInstructions:
        params.instructions ||
        'Responda dúvidas com clareza, respeite a privacidade dos cidadãos e não invente normas oficiais.',
      greeting:
        params.greeting ||
        `Olá! Sou o guia digital do projeto "${params.title}". Como posso ajudar?`,
      faqs: [
        {
          id: 'faq-1',
          question: params.faqQuestion || 'Como funciona este atendimento digital?',
          answer:
            params.faqAnswer ||
            'Preencha os campos do formulário para receber orientação imediata ou tire dúvidas comigo aqui no chat.',
        },
      ],
    },
    qa: {
      checklist: [
        {
          id: 'qa-1',
          label: 'Testar preenchimento do formulário principal e disparo da regra',
          checked: false,
        },
        {
          id: 'qa-2',
          label: 'Testar pergunta real no chat do assistente de IA',
          checked: false,
        },
      ],
      notes: '',
    },
  };
}

export function simulateDemandAnalysis(input: PortalAnalysisInput): DemandAiAnalysis {
  const combined = `${input.title} ${input.problemDescription} ${input.targetAudienceAndImpact}`.toLowerCase();
  const matchedHardware = HARDWARE_KEYWORDS.filter((kw) => combined.includes(kw));
  const shortName = sanitizeShortName(input.title);

  if (matchedHardware.length > 0) {
    return {
      viabilityStatus: 'FORA_DE_ESCOPO_HARDWARE',
      viabilityScore: 30,
      viabilityRationale: `Detectamos menção a componentes físicos (${matchedHardware.slice(0, 3).join(', ')}). As Turmas AH/SD no CEMI 2 desenvolvem exclusivamente software web e soluções com IA (sem robótica ou hardware físico).`,
      friendlySummary:
        'Seu pedido envolve equipamentos físicos, que não fazem parte do escopo do laboratório. Mas não se preocupe: já preparamos uma sugestão 100% digital (web + QR Code + IA) que resolve o mesmo problema usando apenas navegadores e celulares!',
      suggestedShortName: shortName,
      hardwareAdaptation: {
        suggestedTitle: `${input.title.replace(/catraca|sensor|totem físico|arduino|robô/gi, 'Sistema Digital')} (Versão Web + IA)`,
        suggestedDescription: `Versão 100% digital para ${input.organization}: substitui dispositivos físicos por um formulário web acessível por QR Code/Chromebook com triagem lógica automática e assistente Gemini.`,
        adaptationNotes: `Substitui ${matchedHardware.slice(0, 3).join(', ')} por registro web instantâneo, painel de regras condicionais e atendimento assistido por IA.`,
      },
      stations: {
        UI_UX: {
          taskTitle: `Tela Web de Autoatendimento — ${shortName}`,
          objective: 'Substituir o equipamento físico por uma interface web responsiva e direta.',
          technicalDetails:
            'Criar campos claros para o cidadão ou servidor registrar a ocorrência pelo celular ou computador.',
          checklist: [
            'Definir título acolhedor sem termos técnicos',
            'Configurar campos essenciais de entrada no formulário',
            'Adicionar card explicando uso via navegador/QR Code',
          ],
        },
        LOGICA_REGRAS: {
          taskTitle: 'Regras de Triagem Digital (Se/Então)',
          objective: 'Replicar a lógica de controle sem depender de sensores físicos.',
          technicalDetails:
            'Classificar automaticamente casos prioritários e gerar a orientação na tela.',
          checklist: [
            'Criar regra Se/Então para casos urgentes',
            'Definir mensagem padrão clara de confirmação',
          ],
        },
        IA_DADOS: {
          taskTitle: 'Assistente Gemini de Orientação',
          objective: 'Ajudar o usuário a tirar dúvidas antes do atendimento humano.',
          technicalDetails:
            'Configurar persona institucional com FAQs reais e limites éticos.',
          checklist: [
            'Definir persona vinculada ao órgão solicitante',
            'Cadastrar ao menos 1 FAQ de dúvida recorrente',
          ],
        },
        QA_TESTES: {
          taskTitle: 'Validação 100% Web sem Hardware',
          objective: 'Confirmar que o fluxo opera perfeitamente em navegador e Chromebook.',
          technicalDetails: 'Testar entradas válidas, prioritárias e chat IA no Preview Unificado.',
          checklist: [
            'Confirmar que nenhum hardware físico é exigido',
            'Testar regra prioritária e resposta do assistente',
          ],
        },
      },
      starterArtifacts: buildStarterArtifactsFromSummary({
        title: input.title,
        organization: input.organization,
        shortName,
        fieldLabel: 'Motivo / situação do atendimento',
        fieldPlaceholder: 'Ex.: urgente, dúvida documental...',
        ruleValue: 'urgente',
        ruleTitle: 'Atendimento Prioritário Digital',
        ruleMessage: 'Caso sinalizado como urgente! Encaminhamento imediato exibido na tela.',
      }),
      mode: 'SIMULADO',
      analyzedAt: new Date().toISOString(),
    };
  }

  const isComplex =
    input.urgency === 'ALTA' ||
    combined.includes('integração') ||
    combined.includes('integracao') ||
    combined.includes('relatório') ||
    combined.includes('cadastro');

  const viabilityStatus: ViabilityStatus = isComplex ? 'VIAVEL_COM_ADAPTACAO' : 'ALTAMENTE_VIAVEL';
  const viabilityScore = isComplex ? 84 : 94;

  const isSchool = input.organizationType === 'ESCOLA';

  return {
    viabilityStatus,
    viabilityScore,
    viabilityRationale: isComplex
      ? 'Demanda digital viável para prototipação web + IA no CEMI 2, recomendando recorte modular em formulário objetivo, regras Se/Então e assistente Gemini focado.'
      : 'Excelente demanda 100% digital: clara, com impacto direto na comunidade de Cianorte e aderente às 4 estações modulares do Orbit Conecta.',
    friendlySummary: `Recebemos a demanda de ${input.organization}! Nossa equipe do CEMI 2 pode transformá-la em um aplicativo web simples onde ${
      isSchool ? 'professores, alunos ou famílias' : 'cidadãos e servidores'
    } preenchem poucos campos, recebem uma orientação automática imediata e tiram dúvidas com um assistente inteligente.`,
    suggestedShortName: shortName,
    stations: {
      UI_UX: {
        taskTitle: `Interface Cidadã — ${shortName}`,
        objective: `Criar uma tela limpa e intuitiva para ${input.organization}.`,
        technicalDetails:
          'Definir paleta institucional legível, campos objetivos de entrada e cards explicativos para evitar erros de preenchimento.',
        checklist: [
          'Escrever título e subtítulo sem jargões técnicos',
          'Configurar os campos principais do formulário',
          'Adicionar card de orientação rápida na tela inicial',
        ],
      },
      LOGICA_REGRAS: {
        taskTitle: `Regras de Decisão — ${shortName}`,
        objective: 'Automatizar a resposta ou alerta com base nos dados informados pelo usuário.',
        technicalDetails:
          'Construir regras Se/Então para destacar situações urgentes ou encaminhar para o setor certo.',
        checklist: [
          'Criar regra condicional para o cenário de maior prioridade',
          'Definir mensagem padrão segura quando nenhuma exceção ocorrer',
        ],
      },
      IA_DADOS: {
        taskTitle: `Assistente Gemini — ${shortName}`,
        objective: 'Responder dúvidas frequentes do público-alvo com segurança e empatia.',
        technicalDetails:
          'Configurar persona, limites de atuação (LGPD / sem dados pessoais) e base inicial de FAQs.',
        checklist: [
          'Definir persona alinhada ao público beneficiado',
          'Incluir regra de não solicitar dados pessoais sensíveis',
          'Cadastrar ao menos 1 FAQ prática do dia a dia',
        ],
      },
      QA_TESTES: {
        taskTitle: `Roteiro de Testes — ${shortName}`,
        objective: 'Validar a integração entre tela, regras lógicas e assistente antes da entrega.',
        technicalDetails:
          'Simular cenários reais descritos pelo solicitante no Preview Unificado em Chromebook.',
        checklist: [
          'Testar disparo da regra prioritária com dados reais',
          'Conferir contraste, legibilidade e respostas do chat IA',
        ],
      },
    },
    starterArtifacts: buildStarterArtifactsFromSummary({
      title: input.title,
      organization: input.organization,
      shortName,
      primaryColor: isSchool ? '#4F46E5' : '#0284C7',
      accentColor: '#10B981',
      fieldLabel: isSchool ? 'Turma / Situação observada' : 'Principal necessidade / ocorrência',
      fieldPlaceholder: 'Ex.: urgente, dúvida, agendamento...',
      ruleValue: 'urgente',
      ruleTitle: 'Atenção Prioritária Identificada',
      ruleMessage: `Sua solicitação em "${shortName}" foi marcada como prioritária para atendimento rápido.`,
    }),
    mode: 'SIMULADO',
    analyzedAt: new Date().toISOString(),
  };
}

export async function analyzePortalDemand(params: {
  apiKey: string;
  input: PortalAnalysisInput;
}): Promise<DemandAiAnalysis> {
  const { apiKey, input } = params;
  const cleanKey = apiKey.trim();
  const fallback = simulateDemandAnalysis(input);

  if (!cleanKey) {
    try {
      const proxyRes = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'triage', payload: input }),
      });
      if (proxyRes.ok) {
        const data = (await proxyRes.json()) as {
          configured?: boolean;
          parsed?: Record<string, unknown> | null;
        };
        if (data.configured && data.parsed) {
          return normalizeParsedTriage(data.parsed, input, fallback);
        }
      }
    } catch {
      // fallback to local simulator
    }
    return fallback;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    const prompt = [
      'Você é o Motor de Triagem e Decomposição Pedagógica do Laboratório Orbit Conecta (CEMI 2 / SMED Cianorte-PR).',
      'Avalie a demanda abaixo enviada por uma escola ou secretaria municipal:',
      `- Solicitante: ${input.requesterName} (${input.requesterRole})`,
      `- Órgão: ${input.organization} (${input.organizationType})`,
      `- Título: ${input.title}`,
      `- Problema real: ${input.problemDescription}`,
      `- Público e impacto esperado: ${input.targetAudienceAndImpact}`,
      `- Urgência percebida: ${input.urgency}`,
      '',
      'REGRAS OBRIGATÓRIAS:',
      '1. As Turmas AH/SD (estudantes de Altas Habilidades) criam EXCLUSIVAMENTE aplicativos web, sistemas digitais e assistentes com IA (100% software, SEM robótica física, hardware, sensores, Arduino, catracas ou impressoras).',
      '2. Se exigir hardware físico, classifique viabilityStatus como FORA_DE_ESCOPO_HARDWARE (score <= 40), explique o motivo e preencha hasHardwareAdaptation=true com uma proposta 100% digital (web + QR + IA).',
      '3. Caso seja viável digitalmente, classifique como ALTAMENTE_VIAVEL ou VIAVEL_COM_ADAPTACAO (hasHardwareAdaptation=false) e fatie em 4 estações modulares (uiStation, logicStation, aiStation, qaStation) com checklists de 2 a 4 itens claros para estudantes.',
      '4. Gere também os campos starter* para pré-popular as bancadas iniciais do Orbit Conecta em português do Brasil.',
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: TRIAGE_RESPONSE_SCHEMA,
        temperature: 0.35,
      },
    });

    const rawText = response.text?.trim();
    if (!rawText) return fallback;
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    return normalizeParsedTriage(parsed, input, fallback);
  } catch {
    return fallback;
  }
}

function normalizeParsedTriage(
  parsed: Record<string, unknown>,
  input: PortalAnalysisInput,
  fallback: DemandAiAnalysis
): DemandAiAnalysis {

    const parseStation = (raw: unknown, fb: StationPlan): StationPlan => {
      if (!raw || typeof raw !== 'object') return fb;
      const obj = raw as Record<string, unknown>;
      const list = Array.isArray(obj.checklist)
        ? obj.checklist.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
        : fb.checklist;
      return {
        taskTitle: typeof obj.taskTitle === 'string' && obj.taskTitle ? obj.taskTitle : fb.taskTitle,
        objective: typeof obj.objective === 'string' && obj.objective ? obj.objective : fb.objective,
        technicalDetails:
          typeof obj.technicalDetails === 'string' && obj.technicalDetails
            ? obj.technicalDetails
            : fb.technicalDetails,
        checklist: list.length ? list : fb.checklist,
      };
    };

    const status = parsed.viabilityStatus as ViabilityStatus;
    const validStatus: ViabilityStatus =
      status === 'ALTAMENTE_VIAVEL' ||
      status === 'VIAVEL_COM_ADAPTACAO' ||
      status === 'FORA_DE_ESCOPO_HARDWARE'
        ? status
        : fallback.viabilityStatus;

    const shortName =
      typeof parsed.suggestedShortName === 'string' && parsed.suggestedShortName.trim()
        ? parsed.suggestedShortName.trim().slice(0, 22)
        : fallback.suggestedShortName;

    const hasHw = Boolean(parsed.hasHardwareAdaptation) || validStatus === 'FORA_DE_ESCOPO_HARDWARE';

    return {
      viabilityStatus: validStatus,
      viabilityScore:
        typeof parsed.viabilityScore === 'number'
          ? Math.max(0, Math.min(100, Math.round(parsed.viabilityScore)))
          : fallback.viabilityScore,
      viabilityRationale:
        typeof parsed.viabilityRationale === 'string'
          ? parsed.viabilityRationale
          : fallback.viabilityRationale,
      friendlySummary:
        typeof parsed.friendlySummary === 'string'
          ? parsed.friendlySummary
          : fallback.friendlySummary,
      suggestedShortName: shortName,
      ...(hasHw
        ? {
            hardwareAdaptation: {
              suggestedTitle:
                typeof parsed.hardwareSuggestedTitle === 'string' && parsed.hardwareSuggestedTitle
                  ? parsed.hardwareSuggestedTitle
                  : `${input.title} (Versão 100% Web + IA)`,
              suggestedDescription:
                typeof parsed.hardwareSuggestedDescription === 'string' &&
                parsed.hardwareSuggestedDescription
                  ? parsed.hardwareSuggestedDescription
                  : `Solução 100% web para ${input.organization} sem necessidade de hardware físico.`,
              adaptationNotes:
                typeof parsed.hardwareAdaptationNotes === 'string' && parsed.hardwareAdaptationNotes
                  ? parsed.hardwareAdaptationNotes
                  : 'Hardware físico substituído por formulário web responsivo e assistente Gemini.',
            },
          }
        : {}),
      stations: {
        UI_UX: parseStation(parsed.uiStation, fallback.stations.UI_UX),
        LOGICA_REGRAS: parseStation(parsed.logicStation, fallback.stations.LOGICA_REGRAS),
        IA_DADOS: parseStation(parsed.aiStation, fallback.stations.IA_DADOS),
        QA_TESTES: parseStation(parsed.qaStation, fallback.stations.QA_TESTES),
      },
      starterArtifacts: buildStarterArtifactsFromSummary({
        title: input.title,
        organization: input.organization,
        shortName,
        ctaLabel: typeof parsed.starterCtaLabel === 'string' ? parsed.starterCtaLabel : undefined,
        primaryColor:
          typeof parsed.starterPrimaryColor === 'string' ? parsed.starterPrimaryColor : undefined,
        accentColor:
          typeof parsed.starterAccentColor === 'string' ? parsed.starterAccentColor : undefined,
        fieldLabel:
          typeof parsed.starterFieldLabel === 'string' ? parsed.starterFieldLabel : undefined,
        fieldPlaceholder:
          typeof parsed.starterFieldPlaceholder === 'string'
            ? parsed.starterFieldPlaceholder
            : undefined,
        infoTitle:
          typeof parsed.starterInfoTitle === 'string' ? parsed.starterInfoTitle : undefined,
        infoDesc:
          typeof parsed.starterInfoDescription === 'string'
            ? parsed.starterInfoDescription
            : undefined,
        ruleValue:
          typeof parsed.starterRuleValue === 'string' ? parsed.starterRuleValue : undefined,
        ruleTitle:
          typeof parsed.starterRuleTitle === 'string' ? parsed.starterRuleTitle : undefined,
        ruleMessage:
          typeof parsed.starterRuleMessage === 'string' ? parsed.starterRuleMessage : undefined,
        defaultMessage:
          typeof parsed.starterDefaultMessage === 'string'
            ? parsed.starterDefaultMessage
            : undefined,
        assistantName:
          typeof parsed.starterAssistantName === 'string'
            ? parsed.starterAssistantName
            : undefined,
        persona:
          typeof parsed.starterAssistantPersona === 'string'
            ? parsed.starterAssistantPersona
            : undefined,
        instructions:
          typeof parsed.starterAssistantInstructions === 'string'
            ? parsed.starterAssistantInstructions
            : undefined,
        greeting:
          typeof parsed.starterAssistantGreeting === 'string'
            ? parsed.starterAssistantGreeting
            : undefined,
        faqQuestion:
          typeof parsed.starterFaqQuestion === 'string' ? parsed.starterFaqQuestion : undefined,
        faqAnswer:
          typeof parsed.starterFaqAnswer === 'string' ? parsed.starterFaqAnswer : undefined,
      }),
      mode: 'GEMINI_LIVE',
      analyzedAt: new Date().toISOString(),
    };
}

export function applyDigitalAdaptation(submission: PortalSubmission): DemandAiAnalysis {
  const prev = submission.analysis;
  const hw = prev.hardwareAdaptation;
  const adaptedTitle = hw?.suggestedTitle || `${submission.title} (Versão 100% Digital)`;
  const adaptedShort = sanitizeShortName(adaptedTitle);

  return {
    ...prev,
    viabilityStatus: 'VIAVEL_COM_ADAPTACAO',
    viabilityScore: 88,
    viabilityRationale: `Adaptado para escopo 100% digital pelo Mentor: ${
      hw?.adaptationNotes || 'Substituição de dispositivos físicos por aplicativo web + IA.'
    }`,
    friendlySummary:
      hw?.suggestedDescription ||
      'Versão 100% digital aprovada para construção nas bancadas web e Gemini do CEMI 2.',
    suggestedShortName: adaptedShort,
    hardwareAdaptation: undefined,
    starterArtifacts: {
      ...prev.starterArtifacts,
      ui: {
        ...prev.starterArtifacts.ui,
        appTitle: adaptedTitle,
        appSubtitle:
          hw?.suggestedDescription || prev.starterArtifacts.ui.appSubtitle,
      },
    },
    analyzedAt: new Date().toISOString(),
  };
}

export function buildOrbitDemandFromSubmission(submission: PortalSubmission): Demand {
  const demandId = `dem-${submission.protocol.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
  const { analysis } = submission;
  const now = new Date().toISOString();

  const makeStage = (key: StageKey) => {
    const plan = analysis.stations[key];
    return {
      key,
      title: plan.taskTitle,
      description: `${plan.objective} ${plan.technicalDetails}`.trim(),
      required: true,
      status: 'DISPONIVEL' as const,
      assigneeId: null,
      checklist: plan.checklist.map((label, idx) => ({
        id: `${demandId}-${key}-${idx + 1}`,
        label,
        done: false,
      })),
    };
  };

  return {
    id: demandId,
    title: analysis.hardwareAdaptation ? analysis.hardwareAdaptation.suggestedTitle : submission.title,
    shortName: analysis.suggestedShortName || sanitizeShortName(submission.title),
    secretaria: submission.organization,
    description: `${submission.problemDescription} (Impacto esperado: ${submission.targetAudienceAndImpact})`,
    icon: submission.organizationType === 'ESCOLA' ? 'BookOpen' : 'Sparkles',
    status: 'AGUARDANDO_PROFESSOR',
    releasedTurmaIds: [],
    createdAt: now,
    stages: {
      UI_UX: makeStage('UI_UX'),
      LOGICA_REGRAS: makeStage('LOGICA_REGRAS'),
      IA_DADOS: makeStage('IA_DADOS'),
      QA_TESTES: makeStage('QA_TESTES'),
    },
    artifacts: JSON.parse(JSON.stringify(analysis.starterArtifacts)) as Demand['artifacts'],
  };
}

export function buildClarificationTemplate(submission: PortalSubmission): string {
  return `Olá, ${submission.requesterName}! Aqui é a equipe do Laboratório de Inovação (CEMI 2 / SMED Cianorte). Recebemos sua demanda "${submission.title}" (Protocolo ${submission.protocol}). Para que nossos estudantes das Turmas AH/SD possam desenhar a melhor solução digital, você poderia esclarecer: quais são os 2 ou 3 campos ou informações principais que quem for usar o sistema precisa preencher primeiro?`;
}
