import { PortalSubmission, StageKey } from '../types';

export const STATION_THEME: Record<
  StageKey,
  {
    label: string;
    shortLabel: string;
    badgeCls: string;
    cardCls: string;
    accentBorder: string;
  }
> = {
  UI_UX: {
    label: 'Interface & Telas',
    shortLabel: 'UI_UX',
    badgeCls: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300',
    cardCls: 'bg-fuchsia-50/50 border-fuchsia-200',
    accentBorder: 'border-l-fuchsia-500',
  },
  LOGICA_REGRAS: {
    label: 'Lógica & Regras',
    shortLabel: 'LOGICA_REGRAS',
    badgeCls: 'bg-sky-100 text-sky-800 border-sky-300',
    cardCls: 'bg-sky-50/50 border-sky-200',
    accentBorder: 'border-l-sky-500',
  },
  IA_DADOS: {
    label: 'IA & Conteúdo (Gemini)',
    shortLabel: 'IA_DADOS',
    badgeCls: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    cardCls: 'bg-emerald-50/50 border-emerald-200',
    accentBorder: 'border-l-emerald-500',
  },
  QA_TESTES: {
    label: 'Qualidade & Testes',
    shortLabel: 'QA_TESTES',
    badgeCls: 'bg-amber-100 text-amber-800 border-amber-300',
    cardCls: 'bg-amber-50/50 border-amber-200',
    accentBorder: 'border-l-amber-500',
  },
};

export const CIANORTE_ORGANIZATIONS: { label: string; type: 'ESCOLA' | 'SECRETARIA' }[] = [
  { label: 'Escola Municipal Liomar Gomes', type: 'ESCOLA' },
  { label: 'Escola Municipal Lúcia de Barros', type: 'ESCOLA' },
  { label: 'Escola Municipal Castro Alves', type: 'ESCOLA' },
  { label: 'Escola Municipal Gonçalves Dias', type: 'ESCOLA' },
  { label: 'CMEI Pequeno Príncipe', type: 'ESCOLA' },
  { label: 'Secretaria Municipal de Educação (SMED)', type: 'SECRETARIA' },
  { label: 'Secretaria Municipal de Saúde', type: 'SECRETARIA' },
  { label: 'Secretaria Municipal de Meio Ambiente', type: 'SECRETARIA' },
  { label: 'Secretaria Municipal de Assistência Social', type: 'SECRETARIA' },
  { label: 'Secretaria Municipal de Obras e Serviços Públicos', type: 'SECRETARIA' },
  { label: 'Diretoria de Trânsito e Mobilidade', type: 'SECRETARIA' },
];

export const INITIAL_PORTAL_SUBMISSIONS: PortalSubmission[] = [
  {
    id: 'psub-104',
    protocol: 'SMED-2026-0104',
    requesterName: 'Profa. Fernanda Oliveira',
    requesterRole: 'Coordenadora Pedagógica',
    organization: 'Escola Municipal Liomar Gomes',
    organizationType: 'ESCOLA',
    title: 'Controle Digital de Empréstimo de Jogos Pedagógicos',
    problemDescription:
      'Os professores usam caderno de papel para reservar os kits de jogos matemáticos e de alfabetização na sala de recursos. Muitas vezes dois professores tentam pegar o mesmo jogo no mesmo horário ou esquecem de dar baixa na devolução.',
    targetAudienceAndImpact:
      '22 professores da escola; evita conflitos de agenda e garante que todos os alunos tenham acesso organizado aos materiais.',
    urgency: 'MEDIA',
    status: 'PENDENTE_TRIAGEM',
    createdAt: '2026-11-24T10:15:00Z',
    updatedAt: '2026-11-24T10:15:00Z',
    clarifications: [],
    analysis: {
      viabilityStatus: 'ALTAMENTE_VIAVEL',
      viabilityScore: 95,
      viabilityRationale:
        'Demanda 100% digital ideal para aplicativo web leve com formulário de reserva, regras de conflito de horário e assistente para sugerir jogos por faixa etária.',
      friendlySummary:
        'Sua solicitação pode se transformar em um painel web de reservas escolares: o professor escolhe o jogo, informa turma e horário, o sistema verifica disponibilidade automaticamente e uma IA sugere jogos adequados ao conteúdo da aula.',
      suggestedShortName: 'Jogos Pedagógicos',
      stations: {
        UI_UX: {
          taskTitle: 'Tela de Reserva Rápida de Jogos',
          objective: 'Criar interface clara para escolher jogo, professor, turma e turno em menos de 3 cliques.',
          technicalDetails:
            'Paleta acolhedora escolar, seletor de jogo/categoria, campo de nome do professor e cards de status de disponibilidade.',
          checklist: [
            'Criar título e subtítulo amigáveis para professores',
            'Configurar campos: Nome do Jogo, Turma e Horário/Turno',
            'Adicionar card informativo com regra de devolução no mesmo dia',
          ],
        },
        LOGICA_REGRAS: {
          taskTitle: 'Regras de Disponibilidade & Devolução',
          objective: 'Detectar empréstimos em atraso ou conflitos de reserva no mesmo turno.',
          technicalDetails:
            'Implementar regra Se/Então para alertar caso o jogo esteja marcado como em uso ou para orientar retirada na coordenação.',
          checklist: [
            'Criar regra Se status/jogo em uso -> alerta de reserva indisponível',
            'Configurar mensagem padrão confirmando pré-reserva na coordenação',
          ],
        },
        IA_DADOS: {
          taskTitle: 'Consultor de Jogos por Objetivo Didático',
          objective: 'Configurar assistente Gemini para recomendar jogos por ano escolar e habilidade.',
          technicalDetails:
            'Persona de apoio pedagógico com instruções seguras e FAQs sobre cuidados com peças e prazos.',
          checklist: [
            'Definir persona pedagógica para recomendar jogos da brinquedoteca',
            'Cadastrar ao menos 2 FAQs sobre reserva e conservação das peças',
          ],
        },
        QA_TESTES: {
          taskTitle: 'Validação com Cenários de Turno Manhã/Tarde',
          objective: 'Testar reservas simultâneas, campos vazios e perguntas ao assistente.',
          technicalDetails:
            'Executar simulações completas no Preview Unificado simulando professores da manhã e da tarde.',
          checklist: [
            'Testar reserva válida e reserva com conflito',
            'Validar respostas do consultor de jogos no simulador',
          ],
        },
      },
      starterArtifacts: {
        ui: {
          appTitle: 'Acervo Jogos Liomar Gomes',
          appSubtitle: 'Reserva rápida de jogos pedagógicos e kits matemáticos da escola',
          primaryColor: '#7C3AED',
          accentColor: '#0EA5E9',
          ctaLabel: 'Verificar Disponibilidade e Reservar',
          fields: [
            {
              id: 'jogo',
              label: 'Kit / Jogo Pedagógico',
              type: 'select',
              options: ['Material Dourado', 'Tabuleiro Alfabetização', 'Tangram Coletivo', 'Xadrez Escolar'],
            },
            { id: 'professor', label: 'Professor(a) solicitante', type: 'text', placeholder: 'Ex.: Prof. Carlos' },
            {
              id: 'situacao',
              label: 'Observação / Situação atual',
              type: 'text',
              placeholder: 'Ex.: disponível ou em manutenção',
            },
          ],
          infoCards: [
            {
              id: 'jog-1',
              title: 'Devolução no Mesmo Turno',
              description: 'Devolva a caixa conferida na coordenação ao final da aula.',
              icon: 'Clock',
            },
          ],
        },
        logic: {
          rules: [
            {
              id: 'r-jog-1',
              fieldId: 'situacao',
              operator: 'contem',
              value: 'manutenção',
              resultTitle: 'Kit Temporariamente Indisponível',
              resultMessage: 'Este jogo está em conferência de peças. Escolha outro kit equivalente ou consulte o assistente.',
              severity: 'warning',
            },
          ],
          defaultMessage: 'Pré-reserva registrada! Retire o kit na sala da coordenação antes do sinal.',
        },
        ai: {
          assistantName: 'Ludoteca Guia Cianorte',
          persona: 'Especialista em jogos educativos para o Ensino Fundamental I.',
          systemInstructions:
            'Sugira jogos do acervo conforme idade e conteúdo (matemática, leitura, raciocínio lógico) e lembre de conferir as peças.',
          greeting: 'Olá, profe! Qual conteúdo você vai trabalhar hoje para eu indicar um jogo?',
          faqs: [
            {
              id: 'jog-f1',
              question: 'Posso reservar dois jogos para a mesma aula?',
              answer: 'Sim, desde que haja kits disponíveis e devolução no mesmo turno.',
            },
          ],
        },
        qa: {
          checklist: [
            { id: 'qa-j1', label: 'Testar alerta quando observação contém "manutenção"', checked: false },
            { id: 'qa-j2', label: 'Testar recomendação de jogo de frações no chat IA', checked: false },
          ],
          notes: '',
        },
      },
      mode: 'SIMULADO',
      analyzedAt: '2026-11-24T10:15:12Z',
    },
  },
  {
    id: 'psub-103',
    protocol: 'SMED-2026-0103',
    requesterName: 'Roberto Nascimento',
    requesterRole: 'Chefe de Atendimento ao Cidadão',
    organization: 'Secretaria Municipal de Obras e Serviços Públicos',
    organizationType: 'SECRETARIA',
    title: 'Catraca Eletrônica com Sensor Físico de Fila no Pátio',
    problemDescription:
      'Queremos instalar uma catraca física com sensor infravermelho e placa Arduino ligada a um totem metálico para contar quantas pessoas entram no pátio de atendimento de obras e imprimir senhas em papel térmico.',
    targetAudienceAndImpact:
      'Servidores da recepção e moradores; reduzir aglomeração e organizar a ordem de chegada.',
    urgency: 'ALTA',
    status: 'PENDENTE_TRIAGEM',
    createdAt: '2026-11-24T09:00:00Z',
    updatedAt: '2026-11-24T09:00:00Z',
    clarifications: [],
    analysis: {
      viabilityStatus: 'FORA_DE_ESCOPO_HARDWARE',
      viabilityScore: 28,
      viabilityRationale:
        'O pedido original exige hardware físico (catraca, sensor infravermelho, Arduino e impressora térmica), o que foge do escopo 100% digital em software e IA das Turmas AH/SD no CEMI 2.',
      friendlySummary:
        'Identificamos que catracas, sensores físicos e impressoras térmicas não são construídos no laboratório (foco 100% em software web e IA). Porém, o CEMI 2 pode criar uma versão 100% digital com check-in web por QR Code e triagem inteligente de fila!',
      suggestedShortName: 'Fila Digital Obras',
      hardwareAdaptation: {
        suggestedTitle: 'Check-in Web & Painel de Fila Digital da Secretaria de Obras',
        suggestedDescription:
          'Substitui a catraca física e o sensor por um aplicativo web responsivo (acessado via QR Code no balcão ou celular) que registra o assunto do cidadão, calcula prioridade de atendimento e orienta documentos via IA.',
        adaptationNotes:
          'Elimina Arduino, sensor físico e impressora térmica: tudo funciona no navegador com senha digital na tela e triagem automática por tipo de serviço.',
      },
      stations: {
        UI_UX: {
          taskTitle: 'Tela de Check-in Web sem Hardware',
          objective: 'Criar formulário web leve para substituir o totem/impressora física.',
          technicalDetails: 'Campos de nome, tipo de demanda de obras e bairro.',
          checklist: [
            'Criar tela de auto-atendimento acessível no navegador',
            'Exibir cards com serviços mais procurados na Secretaria de Obras',
          ],
        },
        LOGICA_REGRAS: {
          taskTitle: 'Regras de Encaminhamento de Fila Digital',
          objective: 'Direcionar o cidadão ao guichê correto conforme o serviço informado.',
          technicalDetails: 'Regras Se/Então para alvará, iluminação pública e poda/calçada.',
          checklist: [
            'Criar regra de prioridade para demandas urgentes de via pública',
            'Configurar mensagem com número/guichê sugerido na tela',
          ],
        },
        IA_DADOS: {
          taskTitle: 'Atendente Digital de Obras e Documentos',
          objective: 'Tirar dúvidas prévias para evitar que o morador espere na fila sem documento.',
          technicalDetails: 'Persona cordial explicando prazos e documentos de protocolos.',
          checklist: [
            'Configurar lista de documentos por tipo de protocolo',
            'Adicionar aviso de horários presenciais',
          ],
        },
        QA_TESTES: {
          taskTitle: 'Teste de Fluxo Digital Completo',
          objective: 'Garantir que todo o atendimento funcione sem depender de equipamento físico.',
          technicalDetails: 'Testar simulação no navegador de celular e Chromebook.',
          checklist: [
            'Confirmar funcionamento 100% web sem periféricos',
            'Validar encaminhamento para alvará e iluminação',
          ],
        },
      },
      starterArtifacts: {
        ui: {
          appTitle: 'Atende Obras Digital — Cianorte',
          appSubtitle: 'Check-in web de atendimento e pré-triagem de documentos sem papel',
          primaryColor: '#0F172A',
          accentColor: '#D97706',
          ctaLabel: 'Gerar Encaminhamento Digital',
          fields: [
            {
              id: 'servico',
              label: 'Tipo de solicitação',
              type: 'select',
              options: ['Iluminação Pública', 'Alvará / Planta', 'Calçada e Via Pública', 'Consulta de Protocolo'],
            },
            { id: 'prioridade', label: 'Possui atendimento prioritário?', type: 'text', placeholder: 'Ex.: sim ou não' },
          ],
          infoCards: [
            {
              id: 'ob-1',
              title: 'Atendimento 100% Digital na Tela',
              description: 'Não precisa imprimir papel: apresente o resumo gerado na tela ao atendente.',
              icon: 'Sparkles',
            },
          ],
        },
        logic: {
          rules: [
            {
              id: 'r-ob-1',
              fieldId: 'prioridade',
              operator: 'contem',
              value: 'sim',
              resultTitle: 'Senha Preferencial Digital',
              resultMessage: 'Dirija-se ao Guichê 01 (Atendimento Prioritário).',
              severity: 'warning',
            },
          ],
          defaultMessage: 'Check-in confirmado! Aguarde ser chamado no Guichê de Obras correspondente ao serviço.',
        },
        ai: {
          assistantName: 'Guia Obras Cianorte',
          persona: 'Orientador digital da Secretaria de Obras para agilizar documentos antes do guichê.',
          systemInstructions: 'Informe documentos básicos para alvarás e solicitações urbanas sem inventar prazos legais.',
          greeting: 'Olá! Enquanto aguarda, posso conferir quais documentos você precisa para seu pedido?',
          faqs: [
            {
              id: 'ob-f1',
              question: 'O que preciso para pedir troca de lâmpada no poste?',
              answer: 'Informe o endereço exato, nome da rua e um ponto de referência próximo ao poste.',
            },
          ],
        },
        qa: {
          checklist: [{ id: 'qa-o1', label: 'Validar substituição 100% digital sem hardware', checked: false }],
          notes: '',
        },
      },
      mode: 'SIMULADO',
      analyzedAt: '2026-11-24T09:00:10Z',
    },
  },
  {
    id: 'psub-102',
    protocol: 'SMED-2026-0102',
    requesterName: 'Luciana Ferreira',
    requesterRole: 'Assistente Social',
    organization: 'Secretaria Municipal de Assistência Social',
    organizationType: 'SECRETARIA',
    title: 'Guia Interativo de Documentos para o CadÚnico',
    problemDescription:
      'Muitas famílias chegam ao CRAS faltando algum comprovante ou documento de dependentes para atualizar o Cadastro Único e precisam retornar outro dia.',
    targetAudienceAndImpact:
      'Famílias atendidas nos CRAS de Cianorte; reduz viagens perdidas e filas de retorno.',
    urgency: 'ALTA',
    status: 'AJUSTE_SOLICITADO',
    createdAt: '2026-11-22T14:20:00Z',
    updatedAt: '2026-11-23T16:10:00Z',
    clarifications: [
      {
        id: 'clr-1',
        author: 'MENTOR',
        message:
          'Olá, Luciana! Adoramos a proposta para os CRAS. Para deixarmos as regras bem corretas, você pode confirmar se menores de 16 anos sem RG podem apresentar apenas a Certidão de Nascimento no atendimento inicial?',
        timestamp: '2026-11-23T16:10:00Z',
      },
    ],
    analysis: {
      viabilityStatus: 'VIAVEL_COM_ADAPTACAO',
      viabilityScore: 81,
      viabilityRationale:
        'Excelente aplicativo informativo web + assistente IA; requer confirmação das regras documentais oficiais do CRAS antes da publicação aos estudantes.',
      friendlySummary:
        'Vamos construir um checklist inteligente onde o cidadão seleciona quantas pessoas moram na casa e recebe na hora a lista exata de documentos, além de poder tirar dúvidas com uma IA acolhedora.',
      suggestedShortName: 'Guia CadÚnico',
      stations: {
        UI_UX: {
          taskTitle: 'Checklist Visual de Documentos do CRAS',
          objective: 'Tela simples com linguagem cidadã acessível em celular.',
          technicalDetails: 'Campos de tipo de atendimento e presença de dependentes.',
          checklist: [
            'Usar linguagem simples e empática sem siglas difíceis',
            'Incluir card com endereços e horários dos CRAS de Cianorte',
          ],
        },
        LOGICA_REGRAS: {
          taskTitle: 'Regras de Documentação por Perfil Familiar',
          objective: 'Adaptar a lista de documentos para atualização vs novo cadastro.',
          technicalDetails: 'Condicionais Se/Então para menores, idosos e comprovante de residência.',
          checklist: [
            'Diferenciar primeiro cadastro de atualização cadastral',
            'Exibir alerta caso falte documento do responsável familiar',
          ],
        },
        IA_DADOS: {
          taskTitle: 'Assistente Acolhedor do CRAS',
          objective: 'Esclarecer dúvidas comuns sobre CadÚnico sem coletar dados sensíveis.',
          technicalDetails: 'Proibir pedido de CPF real ou dados bancários no chat.',
          checklist: [
            'Inserir regra de privacidade para nunca pedir CPF ou número de NIS',
            'Cadastrar FAQs sobre comprovante de residência',
          ],
        },
        QA_TESTES: {
          taskTitle: 'Revisão de Linguagem Cidadã e Segurança',
          objective: 'Testar todos os perfis familiares e validar bloqueio de dados pessoais.',
          technicalDetails: 'Simular dúvida de morador no Preview Unificado.',
          checklist: [
            'Validar acessibilidade e contraste no celular',
            'Conferir que a IA orienta agendamento presencial quando necessário',
          ],
        },
      },
      starterArtifacts: {
        ui: {
          appTitle: 'CadÚnico Fácil — CRAS Cianorte',
          appSubtitle: 'Confira os documentos antes de sair de casa para o atendimento no CRAS',
          primaryColor: '#0284C7',
          accentColor: '#10B981',
          ctaLabel: 'Conferir Lista de Documentos',
          fields: [
            {
              id: 'tipo',
              label: 'O que você precisa fazer?',
              type: 'select',
              options: ['Novo Cadastro', 'Atualização Cadastral', 'Transferência de Município'],
            },
            { id: 'dependentes', label: 'Há crianças ou menores na casa?', type: 'text', placeholder: 'Ex.: sim ou não' },
          ],
          infoCards: [
            {
              id: 'cad-1',
              title: 'Documentos do Responsável',
              description: 'RG, CPF e comprovante de residência recente (conta de luz ou água).',
              icon: 'FileText',
            },
          ],
        },
        logic: {
          rules: [
            {
              id: 'r-cad-1',
              fieldId: 'dependentes',
              operator: 'contem',
              value: 'sim',
              resultTitle: 'Inclua Documentos dos Menores',
              resultMessage: 'Leve Certidão de Nascimento (ou RG) de todas as crianças e declaração escolar atualizada.',
              severity: 'info',
            },
          ],
          defaultMessage: 'Leve RG, CPF e comprovante de residência de todos os adultos que moram na casa.',
        },
        ai: {
          assistantName: 'Amiga do CRAS Cianorte',
          persona: 'Atendente social gentil que explica documentos do CadÚnico em linguagem simples.',
          systemInstructions: 'Nunca peça números reais de CPF, RG ou NIS. Explique documentos aceitos e oriente procurar o CRAS.',
          greeting: 'Olá! Quer conferir quais documentos levar ao CRAS? Me conte sua dúvida!',
          faqs: [
            {
              id: 'cad-f1',
              question: 'Não tenho conta de luz no meu nome, o que faço?',
              answer: 'Você pode apresentar declaração de endereço assinada ou outro comprovante aceito pelo CRAS da sua região.',
            },
          ],
        },
        qa: {
          checklist: [{ id: 'qa-c1', label: 'Testar cenário com menores de idade na família', checked: false }],
          notes: '',
        },
      },
      mode: 'SIMULADO',
      analyzedAt: '2026-11-22T14:20:15Z',
    },
  },
  {
    id: 'psub-101',
    protocol: 'SMED-2026-0101',
    requesterName: 'Profa. Márcia Tavares',
    requesterRole: 'Coordenadora de Bibliotecas Escolares',
    organization: 'Secretaria Municipal de Educação (SMED)',
    organizationType: 'SECRETARIA',
    title: 'Educação — Guia Interativo da Biblioteca',
    problemDescription:
      'Estudantes da rede municipal têm dificuldade para escolher livros adequados à sua faixa etária e ficam com dúvidas sobre prazos de empréstimo.',
    targetAudienceAndImpact:
      'Alunos do 1º ao 5º ano da rede municipal; incentiva a leitura autônoma nas escolas.',
    urgency: 'MEDIA',
    status: 'APROVADA_ORBIT',
    linkedDemandId: 'dem-educacao',
    createdAt: '2026-11-04T08:30:00Z',
    updatedAt: '2026-11-19T16:45:00Z',
    clarifications: [],
    analysis: {
      viabilityStatus: 'ALTAMENTE_VIAVEL',
      viabilityScore: 98,
      viabilityRationale: 'Solução 100% digital com recomendação interativa e assistente literário Gemini.',
      friendlySummary:
        'Transformado no aplicativo LeiaMais Cianorte, já concluído pelas Turmas AH/SD e disponível na Vitrine Pública!',
      suggestedShortName: 'Guia Biblioteca',
      stations: {
        UI_UX: {
          taskTitle: 'Tela Lúdica de Busca Literária',
          objective: 'Interface colorida para alunos escolherem tema e idade.',
          technicalDetails: 'Seletor de temas e cards com prazo de empréstimo.',
          checklist: ['Tela amigável para alunos do Fundamental'],
        },
        LOGICA_REGRAS: {
          taskTitle: 'Regras de Estante por Tema e Idade',
          objective: 'Indicar estante correta conforme gênero escolhido.',
          technicalDetails: 'Regras Se/Então por tema literário.',
          checklist: ['Regras de recomendação por idade'],
        },
        IA_DADOS: {
          taskTitle: 'Profe Cora Literária',
          objective: 'Assistente que sugere livros sem dar spoilers.',
          technicalDetails: 'Prompt entusiasta com bloqueio de spoilers.',
          checklist: ['Assistente configurado sem spoilers'],
        },
        QA_TESTES: {
          taskTitle: 'Validação nas Escolas Municipais',
          objective: 'Testar buscas e chat literário com alunos.',
          technicalDetails: 'Checklist completo de usabilidade infantil.',
          checklist: ['Testado com alunos de 3 escolas municipais'],
        },
      },
      starterArtifacts: {
        ui: {
          appTitle: 'LeiaMais Cianorte',
          appSubtitle: 'Encontre seu próximo livro favorito nas bibliotecas das escolas municipais',
          primaryColor: '#4F46E5',
          accentColor: '#F59E0B',
          ctaLabel: 'Buscar Recomendação de Leitura',
          fields: [],
          infoCards: [],
        },
        logic: { rules: [], defaultMessage: '' },
        ai: { assistantName: 'Profe Cora Literária', persona: '', systemInstructions: '', greeting: '', faqs: [] },
        qa: { checklist: [], notes: '' },
      },
      mode: 'SIMULADO',
      analyzedAt: '2026-11-04T08:30:10Z',
    },
  },
  {
    id: 'psub-100',
    protocol: 'SMED-2026-0100',
    requesterName: 'Enf. Camila Duarte',
    requesterRole: 'Gerente de Atenção Básica',
    organization: 'Secretaria Municipal de Saúde',
    organizationType: 'SECRETARIA',
    title: 'Saúde — Triagem Inteligente UBS',
    problemDescription:
      'Pacientes chegam às UBSs sem saber quais documentos apresentar ou se o sintoma exige atendimento imediato na UPA.',
    targetAudienceAndImpact:
      'Moradores atendidos nas UBSs de Cianorte; agiliza o pré-acolhimento e orienta vacinação.',
    urgency: 'ALTA',
    status: 'APROVADA_ORBIT',
    linkedDemandId: 'dem-saude',
    createdAt: '2026-11-17T09:10:00Z',
    updatedAt: '2026-11-18T09:00:00Z',
    clarifications: [],
    analysis: {
      viabilityStatus: 'ALTAMENTE_VIAVEL',
      viabilityScore: 96,
      viabilityRationale: 'Sistema web educativo de pré-acolhimento com regras de alerta 192 e assistente de dúvidas.',
      friendlySummary:
        'Aprovado e em desenvolvimento ativo pelas Turmas AH/SD do CEMI 2 na sala Triagem UBS!',
      suggestedShortName: 'Triagem UBS',
      stations: {
        UI_UX: {
          taskTitle: 'Tela de Pré-Acolhimento UBS',
          objective: 'Campos de sintoma, idade e UBS de referência.',
          technicalDetails: 'Cards de documentos e emergência 192.',
          checklist: ['Título claro e acessível para cidadãos'],
        },
        LOGICA_REGRAS: {
          taskTitle: 'Classificação de Prioridade',
          objective: 'Regras Se/Então para sintomas graves e moderados.',
          technicalDetails: 'Alerta vermelho para falta de ar e amarelo para febre.',
          checklist: ['Regra de alerta para sintomas graves'],
        },
        IA_DADOS: {
          taskTitle: 'Clara Saúde Cianorte',
          objective: 'Orientar horários e documentos sem diagnosticar.',
          technicalDetails: 'Instruções éticas de saúde.',
          checklist: ['Adicionar regra de não substituir consulta médica'],
        },
        QA_TESTES: {
          taskTitle: 'Validação de Fluxos Clínicos Simulados',
          objective: 'Testar alertas graves e leves no simulador.',
          technicalDetails: 'Conferir contraste e clareza.',
          checklist: ['Testar fluxo com campo de sintoma urgente'],
        },
      },
      starterArtifacts: {
        ui: {
          appTitle: 'UBS Conecta Cianorte',
          appSubtitle: 'Pré-acolhimento digital rápido para Unidades Básicas de Saúde',
          primaryColor: '#0284C7',
          accentColor: '#10B981',
          ctaLabel: 'Verificar Orientação de Acolhimento',
          fields: [],
          infoCards: [],
        },
        logic: { rules: [], defaultMessage: '' },
        ai: { assistantName: 'Clara Saúde Cianorte', persona: '', systemInstructions: '', greeting: '', faqs: [] },
        qa: { checklist: [], notes: '' },
      },
      mode: 'SIMULADO',
      analyzedAt: '2026-11-17T09:10:15Z',
    },
  },
];
