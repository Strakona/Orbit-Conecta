import { GoogleGenAI } from '@google/genai';
import { TUTOR_PERSONAS } from '../data/seedData';
import { AiArtifact, StageKey, TutorPersonaId } from '../types';

export interface SocraticRequest {
  apiKey: string;
  studentUuid: string; // LGPD: only anonymized UUID, never personal names
  demandTitle: string;
  secretaria: string;
  stageKey: StageKey;
  personaId: TutorPersonaId;
  userMessage: string;
  history: { role: 'user' | 'tutor'; text: string }[];
}

export interface SocraticResponse {
  reply: string;
  mode: 'GEMINI_LIVE' | 'SIMULADO';
}

function buildSocraticSystemInstruction(req: SocraticRequest): string {
  const persona = TUTOR_PERSONAS.find((p) => p.id === req.personaId) ?? TUTOR_PERSONAS[0];
  return [
    `Você é ${persona.name} (${persona.role}) no laboratório escolar Orbit Conecta — SMED Cianorte (Turmas AH/SD).`,
    `Contexto técnico anonimizado: estudante UUID=${req.studentUuid}, demanda="${req.demandTitle}" (${req.secretaria}), bancada ativa="${req.stageKey}".`,
    `Foco da persona: ${persona.focusPrompt}`,
    'REGRA SOCRÁTICA OBRIGATÓRIA (NUNCA VIOLAR):',
    '1. NUNCA entregue código pronto, JSON pronto, layout pronto ou prompt final completo.',
    '2. Faça APENAS UMA pergunta orientadora por vez para estimular o raciocínio do estudante.',
    '3. Use uma analogia curta e clara ligada ao mundo real ou à cidade.',
    '4. Dê no máximo uma pista gradual alinhada à bancada atual.',
    '5. Responda em português brasileiro acessível, positivo e objetivo (máximo 4 frases).',
  ].join('\n');
}

function generateSimulatedSocraticReply(req: SocraticRequest): string {
  const msg = req.userMessage.toLowerCase();
  const stageHints: Record<StageKey, string[]> = {
    UI_UX: [
      'Imagine a tela do seu app como a placa de entrada de um posto de atendimento em Cianorte: se uma avó ou uma criança olhar por 5 segundos, qual informação precisa saltar aos olhos primeiro?',
      'Antes de adicionar mais um campo ou botão, pense na mochila de viagem: só levamos o essencial! Qual dado do formulário é realmente indispensável para o sistema tomar uma decisão?',
      'Cores também comunicam emoções, como um semáforo. Se você escolher um tom calmo para o topo e um tom de destaque apenas para o botão principal, o que você acha que muda para quem está usando?',
    ],
    LOGICA_REGRAS: [
      'Pense nas regras Se/Então como um porteiro atento que segue um manual: qual condição precisa ser verificada PRIMEIRO para evitar que um caso urgente receba uma resposta comum?',
      'Se um usuário digitar algo inesperado ou deixar um campo em branco, o que o seu "porteiro lógico" deveria responder como caminho seguro padrão?',
      'Imagine comparar um número como velocidade ou idade: qual é o limite exato que separa uma situação tranquila de uma situação de alerta na sua regra?',
    ],
    IA_DADOS: [
      'Um bom assistente municipal é como um guia de museu bem treinado: ele sabe exatamente o que pode explicar e quando dizer "procure um especialista". Qual limite de segurança você quer escrever nas instruções do seu assistente?',
      'Para testar se seu prompt funciona de verdade, que pergunta difícil ou confusa um morador de Cianorte poderia fazer para tentar confundir o assistente?',
      'Pense no tom de voz da sua persona: ela deve soar como um manual técnico ou como uma vizinha acolhedora? Como uma frase de boas-vindas refletiria essa escolha?',
    ],
    QA_TESTES: [
      'Um revisor de qualidade age como um detetive procurando falhas antes do público ver: qual cenário extremo (ex.: texto vazio ou caso urgente) você ainda não testou no Preview Unificado?',
      'Imagine que você entregou esse app para um servidor da secretaria testar no Chromebook da escola. O que poderia deixá-lo em dúvida logo nos primeiros 10 segundos?',
      'Olhe para o resultado das regras junto com o chat da IA: as duas partes estão falando a mesma língua ou há alguma contradição entre elas?',
    ],
  };

  if (msg.includes('código') || msg.includes('pronto') || msg.includes('faz pra mim') || msg.includes('prompt completo')) {
    return 'Meu papel aqui é ser seu parceiro de descoberta, não fazer por você! Vamos dar um passo pequeno juntos: qual é a PRIMEIRA coisa que você gostaria que acontecesse quando o cidadão clicar no botão do seu sistema?';
  }

  const personaPrefix: Record<TutorPersonaId, string> = {
    GERAL: 'Boa reflexão! ',
    DESIGNER_UI: 'Olhando com olhos de Designer UI: ',
    ARQUITETO: 'Pensando como Arquiteto de Software: ',
    ENG_PROMPTS: 'Como Engenheiro de Prompts: ',
    REVISOR_QA: 'No papel de Revisor QA: ',
  };

  const options = stageHints[req.stageKey];
  const index = (req.history.length + req.userMessage.length) % options.length;
  return `${personaPrefix[req.personaId]}${options[index]}`;
}

export async function askSocraticTutor(req: SocraticRequest): Promise<SocraticResponse> {
  const cleanKey = req.apiKey.trim();
  if (!cleanKey) {
    try {
      const proxyRes = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'socratic',
          payload: {
            studentUuid: req.studentUuid,
            demandTitle: req.demandTitle,
            secretaria: req.secretaria,
            stageKey: req.stageKey,
            personaId: req.personaId,
            userMessage: req.userMessage,
            history: req.history,
          },
        }),
      });
      if (proxyRes.ok) {
        const data = (await proxyRes.json()) as { configured?: boolean; reply?: string };
        if (data.configured && data.reply) {
          return { reply: data.reply, mode: 'GEMINI_LIVE' };
        }
      }
    } catch {
      // fallback to local simulator
    }
    return {
      reply: generateSimulatedSocraticReply(req),
      mode: 'SIMULADO',
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    const historyTranscript = req.history
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'Estudante' : 'Tutor'}: ${m.text}`)
      .join('\n');

    const contents = historyTranscript
      ? `Histórico recente:\n${historyTranscript}\n\nNova pergunta do estudante: ${req.userMessage}`
      : req.userMessage;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction: buildSocraticSystemInstruction(req),
        temperature: 0.7,
        maxOutputTokens: 280,
      },
    });

    const text = response.text?.trim();
    if (text) {
      return { reply: text, mode: 'GEMINI_LIVE' };
    }
    return {
      reply: generateSimulatedSocraticReply(req),
      mode: 'SIMULADO',
    };
  } catch {
    return {
      reply: generateSimulatedSocraticReply(req),
      mode: 'SIMULADO',
    };
  }
}

export async function testProjectAssistant(params: {
  apiKey: string;
  aiArtifact: AiArtifact;
  demandTitle: string;
  userQuestion: string;
}): Promise<{ reply: string; mode: 'GEMINI_LIVE' | 'SIMULADO' }> {
  const { apiKey, aiArtifact, demandTitle, userQuestion } = params;
  const cleanKey = apiKey.trim();

  const simulateReply = () => {
    const q = userQuestion.toLowerCase();
    const matchedFaq = aiArtifact.faqs.find((f) => {
      const words = f.question
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      return words.some((w) => q.includes(w));
    });

    if (matchedFaq) {
      return matchedFaq.answer;
    }

    return `[${aiArtifact.assistantName}] Sobre "${userQuestion}": conforme as diretrizes do projeto ${demandTitle}, ${aiArtifact.systemInstructions} Se precisar de atendimento presencial, procure a unidade municipal responsável em Cianorte.`;
  };

  if (!cleanKey) {
    try {
      const proxyRes = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assistant',
          payload: {
            assistantName: aiArtifact.assistantName,
            persona: aiArtifact.persona,
            systemInstructions: aiArtifact.systemInstructions,
            faqs: aiArtifact.faqs,
            demandTitle,
            userQuestion,
          },
        }),
      });
      if (proxyRes.ok) {
        const data = (await proxyRes.json()) as { configured?: boolean; reply?: string };
        if (data.configured && data.reply) {
          return { reply: data.reply, mode: 'GEMINI_LIVE' };
        }
      }
    } catch {
      // fallback to local simulator
    }
    return { reply: simulateReply(), mode: 'SIMULADO' };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: cleanKey });
    const faqBlock = aiArtifact.faqs
      .map((f) => `- P: ${f.question}\n  R: ${f.answer}`)
      .join('\n');

    const systemInstruction = [
      `Você é "${aiArtifact.assistantName}", assistente digital do projeto municipal "${demandTitle}" em Cianorte-PR.`,
      `Persona: ${aiArtifact.persona}`,
      `Instruções de comportamento: ${aiArtifact.systemInstructions}`,
      faqBlock ? `Perguntas Frequentes cadastradas:\n${faqBlock}` : '',
      'Responda de forma clara, educativa, respeitosa e concisa em português do Brasil.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuestion,
      config: {
        systemInstruction,
        temperature: 0.5,
        maxOutputTokens: 240,
      },
    });

    const text = response.text?.trim();
    if (text) {
      return { reply: text, mode: 'GEMINI_LIVE' };
    }
    return { reply: simulateReply(), mode: 'SIMULADO' };
  } catch {
    return { reply: simulateReply(), mode: 'SIMULADO' };
  }
}
