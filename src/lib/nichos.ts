// Sistema de Temperatura de Nichos - Dados atualizados
export interface Nicho {
    nome: string;
    temperatura: number; // 0-100
    tendencia: 'subindo' | 'estavel' | 'caindo';
    potencialLucro: string;
    dificuldade: 'Fácil' | 'Médio' | 'Difícil';
    sugestaoPreco: string;
    keywords: string[];
}

export const nichosQuentes: Nicho[] = [
    {
        nome: 'Inteligência Artificial para Negócios',
        temperatura: 98,
        tendencia: 'subindo',
        potencialLucro: 'R$ 5.000 - R$ 50.000/mês',
        dificuldade: 'Médio',
        sugestaoPreco: 'R$ 47 - R$ 197',
        keywords: ['IA', 'ChatGPT', 'Automação', 'Produtividade']
    },
    {
        nome: 'Emagrecimento Saudável',
        temperatura: 95,
        tendencia: 'estavel',
        potencialLucro: 'R$ 3.000 - R$ 30.000/mês',
        dificuldade: 'Fácil',
        sugestaoPreco: 'R$ 27 - R$ 97',
        keywords: ['Dieta', 'Saúde', 'Fitness', 'Nutrição']
    },
    {
        nome: 'Marketing Digital e Vendas Online',
        temperatura: 92,
        tendencia: 'subindo',
        potencialLucro: 'R$ 4.000 - R$ 40.000/mês',
        dificuldade: 'Médio',
        sugestaoPreco: 'R$ 37 - R$ 147',
        keywords: ['Tráfego', 'Instagram', 'Vendas', 'Afiliados']
    },
    {
        nome: 'Desenvolvimento Pessoal',
        temperatura: 89,
        tendencia: 'estavel',
        potencialLucro: 'R$ 2.000 - R$ 20.000/mês',
        dificuldade: 'Fácil',
        sugestaoPreco: 'R$ 27 - R$ 77',
        keywords: ['Mindset', 'Produtividade', 'Hábitos', 'Sucesso']
    },
    {
        nome: 'Investimentos e Finanças',
        temperatura: 87,
        tendencia: 'subindo',
        potencialLucro: 'R$ 3.500 - R$ 35.000/mês',
        dificuldade: 'Médio',
        sugestaoPreco: 'R$ 47 - R$ 197',
        keywords: ['Bolsa', 'Criptomoedas', 'Renda Passiva', 'Investir']
    },
    {
        nome: 'Relacionamentos e Conquista',
        temperatura: 84,
        tendencia: 'estavel',
        potencialLucro: 'R$ 2.500 - R$ 25.000/mês',
        dificuldade: 'Fácil',
        sugestaoPreco: 'R$ 27 - R$ 97',
        keywords: ['Sedução', 'Namoro', 'Casamento', 'Amor']
    },
    {
        nome: 'Artesanato e Trabalhos Manuais',
        temperatura: 81,
        tendencia: 'subindo',
        potencialLucro: 'R$ 1.500 - R$ 15.000/mês',
        dificuldade: 'Fácil',
        sugestaoPreco: 'R$ 17 - R$ 67',
        keywords: ['DIY', 'Crochê', 'Bijuterias', 'Decoração']
    },
    {
        nome: 'Culinária e Receitas',
        temperatura: 78,
        tendencia: 'estavel',
        potencialLucro: 'R$ 1.500 - R$ 15.000/mês',
        dificuldade: 'Fácil',
        sugestaoPreco: 'R$ 17 - R$ 47',
        keywords: ['Receitas', 'Doces', 'Fit', 'Vegano']
    }
];

export function getNichoByTemperatura(minTemp: number = 0): Nicho[] {
    return nichosQuentes.filter(n => n.temperatura >= minTemp);
}

export function getNichoMaisQuente(): Nicho {
    return nichosQuentes[0];
}

export function calcularROI(_nicho: Nicho, investimento: number = 0): string {
    // Investimento é zero, então ROI é infinito 😎
    if (investimento === 0) {
        return '∞% (Investimento Zero!)';
    }
    return 'Lucro Puro';
}
