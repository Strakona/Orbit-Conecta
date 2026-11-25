import { GoogleGenAI, Schema, Type } from '@google/genai';

interface ReqLike {
  method?: string;
  body?: unknown;
}

interface ResLike {
  status: (code: number) => ResLike;
  json: (body: unknown) => void;
}

const TUTOR_FOCUS: Record<string, string> = {
  GERAL:
    'Ajude o estudante a conectar o problema real de Cianorte com os blocos digitais do sistema usando perguntas curtas e analogias do dia a dia.',
  DESIGNER_UI:
    'Conduza o estudante a pensar sobre quem vai usar a tela (morador, servidor, aluno), contraste, clareza dos rótulos e simplicidade.',
  ARQUITETO:
    'Oriente o estudante a estruturar condições Se/Então, testar entradas inesperadas e organizar prioridades sem escrever a regra pronta.',
  ENG_PROMPTS:
    'Guie o estudante a definir limites claros para o assistente de IA municipal (o que responder, o que não inventar e quando encaminhar para humanos).',
  REVISOR_QA:
    'Incentive o estudante a criar cenários de teste reais, verificar botões, mensagens de erro e clareza das respostas antes da entrega oficial.',
};

const TRIAGE_SCHEMA: Schema = {
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

export default async function handler(req: ReqLike, res: ResLike) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const serverKey = process.env.GEMINI_API_KEY?.trim();
  if (!serverKey) {
    return res.status(200).json({ configured: false });
  }

  try {
    const body = (typeof req.body === 'string' ? JSON.parse(req.body) : req.body) as {
      action?: 'socratic' | 'assistant' | 'triage';
      payload?: Record<string, unknown>;
    };

    const ai = new GoogleGenAI({ apiKey: serverKey });

    if (body.action === 'socratic' && body.payload) {
      const p = body.payload as {
        studentUuid: string;
        demandTitle: string;
        secretaria: string;
        stageKey: string;
        personaId: string;
        userMessage: string;
        history?: { role: string; text: string }[];
      };

      const systemInstruction = [
        `Você é tutor (${p.personaId}) no laboratório escolar Orbit Conecta — SMED Cianorte (Turmas AH/SD).`,
        `Contexto técnico anonimizado: estudante UUID=${p.studentUuid}, demanda="${p.demandTitle}" (${p.secretaria}), bancada ativa="${p.stageKey}".`,
        `Foco da persona: ${TUTOR_FOCUS[p.personaId] ?? TUTOR_FOCUS.GERAL}`,
        'REGRA SOCRÁTICA OBRIGATÓRIA (NUNCA VIOLAR):',
        '1. NUNCA entregue código pronto, JSON pronto, layout pronto ou prompt final completo.',
        '2. Faça APENAS UMA pergunta orientadora por vez para estimular o raciocínio do estudante.',
        '3. Use uma analogia curta e clara ligada ao mundo real ou à cidade.',
        '4. Dê no máximo uma pista gradual alinhada à bancada atual.',
        '5. Responda em português brasileiro acessível, positivo e objetivo (máximo 4 frases).',
      ].join('\n');

      const transcript = (p.history ?? [])
        .slice(-6)
        .map((m) => `${m.role === 'user' ? 'Estudante' : 'Tutor'}: ${m.text}`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: transcript
          ? `Histórico recente:\n${transcript}\n\nNova pergunta do estudante: ${p.userMessage}`
          : p.userMessage,
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 280,
        },
      });

      return res.status(200).json({ configured: true, reply: response.text?.trim() ?? '' });
    }

    if (body.action === 'assistant' && body.payload) {
      const p = body.payload as {
        assistantName: string;
        persona: string;
        systemInstructions: string;
        faqs?: { question: string; answer: string }[];
        demandTitle: string;
        userQuestion: string;
      };

      const faqBlock = (p.faqs ?? [])
        .map((f) => `- P: ${f.question}\n  R: ${f.answer}`)
        .join('\n');

      const systemInstruction = [
        `Você é "${p.assistantName}", assistente digital do projeto municipal "${p.demandTitle}" em Cianorte-PR.`,
        `Persona: ${p.persona}`,
        `Instruções de comportamento: ${p.systemInstructions}`,
        faqBlock ? `Perguntas Frequentes cadastradas:\n${faqBlock}` : '',
        'Responda de forma clara, educativa, respeitosa e concisa em português do Brasil.',
      ]
        .filter(Boolean)
        .join('\n\n');

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: p.userQuestion,
        config: {
          systemInstruction,
          temperature: 0.5,
          maxOutputTokens: 240,
        },
      });

      return res.status(200).json({ configured: true, reply: response.text?.trim() ?? '' });
    }

    if (body.action === 'triage' && body.payload) {
      const i = body.payload as {
        requesterName: string;
        requesterRole: string;
        organization: string;
        organizationType: string;
        title: string;
        problemDescription: string;
        targetAudienceAndImpact: string;
        urgency: string;
      };

      const prompt = [
        'Você é o Motor de Triagem e Decomposição Pedagógica do Laboratório Orbit Conecta (CEMI 2 / SMED Cianorte-PR).',
        'Avalie a demanda abaixo enviada por uma escola ou secretaria municipal:',
        `- Solicitante: ${i.requesterName} (${i.requesterRole})`,
        `- Órgão: ${i.organization} (${i.organizationType})`,
        `- Título: ${i.title}`,
        `- Problema real: ${i.problemDescription}`,
        `- Público e impacto esperado: ${i.targetAudienceAndImpact}`,
        `- Urgência percebida: ${i.urgency}`,
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
          responseSchema: TRIAGE_SCHEMA,
          temperature: 0.35,
        },
      });

      const raw = response.text?.trim();
      return res.status(200).json({
        configured: true,
        parsed: raw ? JSON.parse(raw) : null,
      });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Server error',
    });
  }
}
