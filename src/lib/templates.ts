// Templates de nicho para acelerar a criação de ebooks

export interface EbookTemplate {
    id: string
    nome: string
    descricao: string
    icone: string
    cor: string
    estruturaSugerida: string[]
    promptBase: string
    publicoAlvo: string
    precoSugerido: string
}

export const templates: EbookTemplate[] = [
    {
        id: 'autoajuda',
        nome: 'Autoajuda & Desenvolvimento Pessoal',
        descricao: 'Livros de transformação pessoal, mindset e crescimento',
        icone: '🧠',
        cor: '#8b5cf6',
        publicoAlvo: 'Pessoas buscando melhorar a vida pessoal e profissional',
        precoSugerido: 'R$ 27 - R$ 47',
        estruturaSugerida: [
            'Introdução: Por que este livro vai mudar sua vida',
            'Capítulo 1: Entendendo o problema',
            'Capítulo 2: A mentalidade necessária',
            'Capítulo 3: O primeiro passo da transformação',
            'Capítulo 4: Construindo novos hábitos',
            'Capítulo 5: Superando obstáculos',
            'Capítulo 6: Mantendo a consistência',
            'Capítulo 7: Histórias de sucesso reais',
            'Capítulo 8: Seu plano de ação de 30 dias',
            'Conclusão: O novo você começa agora'
        ],
        promptBase: `Você é um especialista em desenvolvimento pessoal e autoajuda. 
Crie conteúdo transformador, motivacional mas prático. 
Use linguagem acessível, exemplos reais e exercícios práticos.
O tom deve ser empático, inspirador e orientado a ação.`
    },
    {
        id: 'tutorial',
        nome: 'Tutorial & Passo a Passo',
        descricao: 'Guias práticos que ensinam habilidades específicas',
        icone: '📋',
        cor: '#10b981',
        publicoAlvo: 'Pessoas querendo aprender uma habilidade específica',
        precoSugerido: 'R$ 19 - R$ 37',
        estruturaSugerida: [
            'Introdução: O que você vai aprender',
            'Capítulo 1: Fundamentos essenciais',
            'Capítulo 2: Preparação e ferramentas necessárias',
            'Capítulo 3: Passo a passo básico',
            'Capítulo 4: Técnicas intermediárias',
            'Capítulo 5: Técnicas avançadas',
            'Capítulo 6: Erros comuns e como evitar',
            'Capítulo 7: Dicas de profissionais',
            'Capítulo 8: Projetos práticos para treinar',
            'Conclusão: Próximos passos na sua jornada'
        ],
        promptBase: `Você é um instrutor experiente e didático.
Crie conteúdo passo a passo, claro e objetivo.
Use listas, bullet points e instruções numeradas.
Inclua dicas práticas, avisos importantes e exemplos visuais.
O tom deve ser professoral, paciente e encorajador.`
    },
    {
        id: 'saude',
        nome: 'Saúde & Bem-estar',
        descricao: 'Livros sobre emagrecimento, nutrição, exercícios e saúde mental',
        icone: '💪',
        cor: '#ef4444',
        publicoAlvo: 'Pessoas buscando melhorar saúde física e mental',
        precoSugerido: 'R$ 29 - R$ 57',
        estruturaSugerida: [
            'Introdução: Sua jornada de transformação',
            'Capítulo 1: Entendendo seu corpo',
            'Capítulo 2: A ciência por trás do método',
            'Capítulo 3: Alimentação inteligente',
            'Capítulo 4: Movimento e exercícios',
            'Capítulo 5: Sono e recuperação',
            'Capítulo 6: Saúde mental e emocional',
            'Capítulo 7: Plano semanal completo',
            'Capítulo 8: Receitas e cardápios',
            'Capítulo 9: Mantendo os resultados',
            'Conclusão: O novo estilo de vida'
        ],
        promptBase: `Você é um profissional de saúde experiente e atualizado.
Crie conteúdo baseado em evidências científicas mas acessível.
Inclua planos práticos, receitas e rotinas.
IMPORTANTE: Sempre recomende consultar um profissional de saúde.
O tom deve ser motivador, científico mas compreensível.`
    },
    {
        id: 'financas',
        nome: 'Finanças & Investimentos',
        descricao: 'Livros sobre educação financeira, investimentos e renda extra',
        icone: '💰',
        cor: '#fbbf24',
        publicoAlvo: 'Pessoas querendo organizar finanças ou investir',
        precoSugerido: 'R$ 37 - R$ 67',
        estruturaSugerida: [
            'Introdução: Por que você precisa deste livro',
            'Capítulo 1: Diagnóstico financeiro pessoal',
            'Capítulo 2: Mentalidade de prosperidade',
            'Capítulo 3: Organizando suas finanças',
            'Capítulo 4: Eliminando dívidas',
            'Capítulo 5: Construindo reserva de emergência',
            'Capítulo 6: Começando a investir',
            'Capítulo 7: Tipos de investimentos explicados',
            'Capítulo 8: Criando fontes de renda extra',
            'Capítulo 9: Planejamento de longo prazo',
            'Conclusão: Liberdade financeira é possível'
        ],
        promptBase: `Você é um educador financeiro experiente.
Crie conteúdo prático, com exemplos de valores reais.
Use planilhas, cálculos simples e exemplos do dia a dia.
Foque em ações práticas que qualquer pessoa pode fazer.
O tom deve ser direto, motivador e sem jargões complicados.`
    },
    {
        id: 'parentalidade',
        nome: 'Parentalidade & Família',
        descricao: 'Livros para pais sobre educação, desenvolvimento infantil e família',
        icone: '👨‍👩‍👧‍👦',
        cor: '#ec4899',
        publicoAlvo: 'Pais e mães buscando orientação',
        precoSugerido: 'R$ 27 - R$ 47',
        estruturaSugerida: [
            'Introdução: Você não está sozinho nessa jornada',
            'Capítulo 1: Entendendo a fase do seu filho',
            'Capítulo 2: Comunicação efetiva com crianças',
            'Capítulo 3: Estabelecendo limites com amor',
            'Capítulo 4: Rotina e organização familiar',
            'Capítulo 5: Lidando com comportamentos difíceis',
            'Capítulo 6: Educação emocional',
            'Capítulo 7: A parceria entre os pais',
            'Capítulo 8: Cuidando de você também',
            'Capítulo 9: Situações especiais e desafios',
            'Conclusão: Criando memórias que importam'
        ],
        promptBase: `Você é um especialista em desenvolvimento infantil e parentalidade.
Crie conteúdo empático, sem julgamentos, que valide os pais.
Use exemplos práticos de situações do dia a dia.
Inclua diálogos exemplo e scripts de conversas.
O tom deve ser acolhedor, compreensivo e esperançoso.`
    },
    {
        id: 'negocios',
        nome: 'Negócios & Empreendedorismo',
        descricao: 'Livros sobre como começar e crescer um negócio',
        icone: '🚀',
        cor: '#3b82f6',
        publicoAlvo: 'Empreendedores e aspirantes a dono de negócio',
        precoSugerido: 'R$ 37 - R$ 77',
        estruturaSugerida: [
            'Introdução: A mentalidade empreendedora',
            'Capítulo 1: Encontrando sua ideia de negócio',
            'Capítulo 2: Validando sua ideia antes de investir',
            'Capítulo 3: Planejamento estratégico simplificado',
            'Capítulo 4: Começando com pouco ou zero capital',
            'Capítulo 5: Marketing e vendas para iniciantes',
            'Capítulo 6: Presença digital e redes sociais',
            'Capítulo 7: Gestão financeira do negócio',
            'Capítulo 8: Escalando suas operações',
            'Capítulo 9: Erros comuns e como evitá-los',
            'Conclusão: O primeiro passo é o mais importante'
        ],
        promptBase: `Você é um empreendedor experiente e mentor de negócios.
Crie conteúdo prático focado em ação imediata com baixo investimento.
Use estudos de caso reais e exemplos de negócios que funcionam.
Inclua templates, checklists e ferramentas gratuitas.
O tom deve ser motivador, realista e orientado a resultados.`
    },
    {
        id: 'receitas',
        nome: 'Receitas & Culinária',
        descricao: 'Livros de receitas temáticas',
        icone: '🍳',
        cor: '#f97316',
        publicoAlvo: 'Pessoas que querem aprender a cozinhar ou novas receitas',
        precoSugerido: 'R$ 19 - R$ 37',
        estruturaSugerida: [
            'Introdução: Sobre este livro de receitas',
            'Capítulo 1: Equipamentos e ingredientes essenciais',
            'Capítulo 2: Dicas de preparo e organização',
            'Capítulo 3: Café da manhã (5-8 receitas)',
            'Capítulo 4: Almoço (8-10 receitas)',
            'Capítulo 5: Jantar (8-10 receitas)',
            'Capítulo 6: Lanches e snacks (5-8 receitas)',
            'Capítulo 7: Sobremesas (5-8 receitas)',
            'Capítulo 8: Receitas especiais para ocasiões',
            'Conclusão: Índice de receitas por ingrediente'
        ],
        promptBase: `Você é um chef e criador de receitas experiente.
Crie receitas com ingredientes acessíveis e fáceis de encontrar.
Inclua tempo de preparo, porções e nível de dificuldade.
Use instruções passo a passo claras e numeradas.
Inclua dicas de substituição de ingredientes.
O tom deve ser amigável e encorajador para iniciantes.`
    },
    {
        id: 'relacionamentos',
        nome: 'Relacionamentos & Amor',
        descricao: 'Livros sobre relacionamentos amorosos, autoestima e conexões',
        icone: '❤️',
        cor: '#dc2626',
        publicoAlvo: 'Pessoas buscando melhorar vida amorosa',
        precoSugerido: 'R$ 27 - R$ 47',
        estruturaSugerida: [
            'Introdução: Amor começa por você',
            'Capítulo 1: Autoconhecimento e autoestima',
            'Capítulo 2: Padrões de relacionamento',
            'Capítulo 3: Comunicação efetiva no amor',
            'Capítulo 4: Construindo conexão emocional',
            'Capítulo 5: Lidando com conflitos de forma saudável',
            'Capítulo 6: Mantendo a chama acesa',
            'Capítulo 7: Quando é hora de seguir em frente',
            'Capítulo 8: Reconstruindo após o fim',
            'Conclusão: O amor que você merece'
        ],
        promptBase: `Você é um especialista em relacionamentos e psicologia amorosa.
Crie conteúdo empático que valide as emoções do leitor.
Use exemplos de situações reais e diálogos.
Inclua exercícios de reflexão e autoconhecimento.
O tom deve ser acolhedor, esperançoso e sem julgamentos.`
    }
]

export function getTemplateById(id: string): EbookTemplate | undefined {
    return templates.find(t => t.id === id)
}

export function getTemplateByNicho(nichoNome: string): EbookTemplate | undefined {
    const nichoLower = nichoNome.toLowerCase()

    if (nichoLower.includes('ia') || nichoLower.includes('inteligência') || nichoLower.includes('tecnologia')) {
        return templates.find(t => t.id === 'tutorial')
    }
    if (nichoLower.includes('emagrec') || nichoLower.includes('dieta') || nichoLower.includes('saúde') || nichoLower.includes('fitness')) {
        return templates.find(t => t.id === 'saude')
    }
    if (nichoLower.includes('marketing') || nichoLower.includes('negócio') || nichoLower.includes('empreend') || nichoLower.includes('vend')) {
        return templates.find(t => t.id === 'negocios')
    }
    if (nichoLower.includes('finança') || nichoLower.includes('invest') || nichoLower.includes('dinheiro') || nichoLower.includes('renda')) {
        return templates.find(t => t.id === 'financas')
    }
    if (nichoLower.includes('relaciona') || nichoLower.includes('amor') || nichoLower.includes('casal') || nichoLower.includes('namoro')) {
        return templates.find(t => t.id === 'relacionamentos')
    }
    if (nichoLower.includes('filho') || nichoLower.includes('criança') || nichoLower.includes('pais') || nichoLower.includes('mãe') || nichoLower.includes('autismo')) {
        return templates.find(t => t.id === 'parentalidade')
    }
    if (nichoLower.includes('receita') || nichoLower.includes('culinária') || nichoLower.includes('comida') || nichoLower.includes('cozinha')) {
        return templates.find(t => t.id === 'receitas')
    }

    // Default: autoajuda
    return templates.find(t => t.id === 'autoajuda')
}
