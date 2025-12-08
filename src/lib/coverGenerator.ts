// Serviço de geração de capas usando Pollinations AI (gratuito)

export interface CoverOptions {
    titulo: string
    subtitulo?: string
    autor: string
    tema: string
    estilo?: 'moderno' | 'classico' | 'minimalista' | 'vibrante' | 'profissional'
    corPrincipal?: string
}

// Pollinations AI - API gratuita de geração de imagens
const POLLINATIONS_URL = 'https://image.pollinations.ai/prompt/'

export function generateCoverPrompt(options: CoverOptions): string {
    const estilos = {
        moderno: 'modern, sleek, gradient colors, contemporary design',
        classico: 'classic, elegant, timeless, sophisticated',
        minimalista: 'minimalist, clean, simple, white space, subtle',
        vibrante: 'vibrant, colorful, energetic, bold colors',
        profissional: 'professional, corporate, trustworthy, business-like'
    }

    const estilo = estilos[options.estilo || 'profissional']

    // Criar prompt otimizado para capa de ebook
    const prompt = `
Professional ebook cover design, ${estilo}, 
theme: ${options.tema},
high quality, book cover art, 
vertical format, centered composition,
no text, no letters, no words, no typography,
abstract symbolic imagery related to ${options.tema},
premium quality, bestseller look,
soft lighting, depth, professional photography style
`.trim().replace(/\n/g, ' ')

    return prompt
}

export function getCoverImageUrl(options: CoverOptions, width = 600, height = 900): string {
    const prompt = generateCoverPrompt(options)
    const encodedPrompt = encodeURIComponent(prompt)

    // Pollinations aceita parâmetros de tamanho
    return `${POLLINATIONS_URL}${encodedPrompt}?width=${width}&height=${height}&nologo=true`
}

export async function generateCoverImage(options: CoverOptions): Promise<string> {
    // Retorna a URL direta - Pollinations gera sob demanda
    return getCoverImageUrl(options)
}

// Função para pré-carregar a imagem (verificar se carrega)
export function preloadCoverImage(url: string): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => resolve(true)
        img.onerror = () => resolve(false)
        img.src = url
    })
}

// Temas de cores para capas
export const coverColorThemes = {
    negocios: { primary: '#1e3a5f', secondary: '#3b82f6', accent: '#fbbf24' },
    saude: { primary: '#065f46', secondary: '#10b981', accent: '#fef3c7' },
    autoajuda: { primary: '#4c1d95', secondary: '#8b5cf6', accent: '#fde68a' },
    financas: { primary: '#1e40af', secondary: '#3b82f6', accent: '#22c55e' },
    relacionamentos: { primary: '#9f1239', secondary: '#ec4899', accent: '#fce7f3' },
    culinaria: { primary: '#9a3412', secondary: '#f97316', accent: '#fef3c7' },
    tecnologia: { primary: '#0f172a', secondary: '#06b6d4', accent: '#22d3ee' },
    educacao: { primary: '#1e3a5f', secondary: '#6366f1', accent: '#c7d2fe' }
}

export function getColorThemeForTema(tema: string): typeof coverColorThemes.negocios {
    const temaLower = tema.toLowerCase()

    if (temaLower.includes('negócio') || temaLower.includes('empreend') || temaLower.includes('marketing')) {
        return coverColorThemes.negocios
    }
    if (temaLower.includes('saúde') || temaLower.includes('emagrec') || temaLower.includes('dieta') || temaLower.includes('fitness')) {
        return coverColorThemes.saude
    }
    if (temaLower.includes('finança') || temaLower.includes('dinheiro') || temaLower.includes('invest')) {
        return coverColorThemes.financas
    }
    if (temaLower.includes('amor') || temaLower.includes('relaciona') || temaLower.includes('casal')) {
        return coverColorThemes.relacionamentos
    }
    if (temaLower.includes('receita') || temaLower.includes('culinária') || temaLower.includes('comida')) {
        return coverColorThemes.culinaria
    }
    if (temaLower.includes('ia') || temaLower.includes('tecnologia') || temaLower.includes('programação')) {
        return coverColorThemes.tecnologia
    }
    if (temaLower.includes('edu') || temaLower.includes('aprend') || temaLower.includes('ensino')) {
        return coverColorThemes.educacao
    }

    return coverColorThemes.autoajuda
}
