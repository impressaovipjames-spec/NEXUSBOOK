// Gemini AI Service - Briefing Inteligente para criação de eBooks

import { GoogleGenerativeAI } from '@google/generative-ai'

export interface ChatMessage {
    role: 'user' | 'assistant'
    content: string
}

export interface EbookStructure {
    titulo: string
    subtitulo: string
    autor: string
    capitulos: string[]
    publicoAlvo: string
    tomTexto: string
    idiomas: string[]
}

export interface EbookContent {
    title: string
    subtitle: string
    author: string
    chapters: {
        title: string
        content: string
    }[]
    introduction: string
    conclusion: string
    aboutAuthor: string
    metadata: {
        language: string
        pageCount: number
        wordCount: number
        generatedAt: string
    }
}

export interface MultiLanguageEbook {
    pt: EbookContent
    en: EbookContent
    es: EbookContent
    fr: EbookContent
}

// Sistema de briefing - a IA faz perguntas inteligentes
const BRIEFING_SYSTEM_PROMPT = `Você é um consultor especialista em criação de eBooks de sucesso. Seu papel é ajudar o usuário a definir o melhor conteúdo para seu eBook através de perguntas estratégicas.

REGRAS IMPORTANTES:
1. Faça perguntas uma de cada vez, não bombardeie o usuário
2. Seja amigável, profissional e encorajador
3. Use emojis com moderação para deixar a conversa agradável
4. Quando tiver informações suficientes, proponha a estrutura do eBook
5. Sempre pergunte se o usuário quer modificar algo antes de finalizar

FLUXO DO BRIEFING:
1. Primeiro: Entender o TEMA principal
2. Segundo: Entender o PÚBLICO-ALVO (quem vai ler)
3. Terceiro: Entender o OBJETIVO (o que o leitor vai ganhar)
4. Quarto: Propor ESTRUTURA DE CAPÍTULOS
5. Quinto: Confirmar ou ajustar

QUANDO PROPOR A ESTRUTURA, USE ESTE FORMATO EXATO:
---ESTRUTURA_PROPOSTA---
TITULO: [título do ebook]
SUBTITULO: [subtítulo]
CAPITULOS:
1. [nome do capítulo 1]
2. [nome do capítulo 2]
... (continue para todos os capítulos)
PUBLICO: [descrição do público-alvo]
TOM: [tom do texto: motivacional/técnico/amigável/profissional]
---FIM_ESTRUTURA---

Depois de propor a estrutura, pergunte se o usuário quer modificar algo.

Se o usuário aprovar a estrutura (dizendo "ok", "pode gerar", "está bom", "gostei", "aprovo", etc.), responda EXATAMENTE:
---ESTRUTURA_APROVADA---

Agora vamos conversar! Quando o usuário iniciar, faça a primeira pergunta sobre o tema do eBook.`

// Chat com IA para briefing
export async function chatWithAI(
    apiKey: string,
    messages: ChatMessage[],
    templateContext?: string
): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // Construir histórico de conversa
    const history = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
    }))

    // Adicionar contexto de template se houver
    let systemPrompt = BRIEFING_SYSTEM_PROMPT
    if (templateContext) {
        systemPrompt += `\n\nCONTEXTO DO TEMPLATE SELECIONADO:\n${templateContext}`
    }

    const chat = model.startChat({
        history: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Entendido! Estou pronto para ajudar a criar um eBook incrível. Vou fazer perguntas estratégicas para garantir que o conteúdo seja perfeito. Vamos começar! 📚' }] },
            ...history.slice(0, -1) // Tudo exceto a última mensagem
        ]
    })

    const lastMessage = messages[messages.length - 1]
    const result = await chat.sendMessage(lastMessage.content)

    return result.response.text()
}

// Extrair estrutura aprovada da conversa
export function extractApprovedStructure(messages: ChatMessage[]): EbookStructure | null {
    // Procurar pela última mensagem que contém a estrutura proposta
    for (let i = messages.length - 1; i >= 0; i--) {
        const content = messages[i].content

        if (content.includes('---ESTRUTURA_PROPOSTA---')) {
            const match = content.match(/---ESTRUTURA_PROPOSTA---([\s\S]*?)---FIM_ESTRUTURA---/)
            if (match) {
                const estruturaText = match[1]

                // Parse da estrutura
                const tituloMatch = estruturaText.match(/TITULO:\s*(.+)/)
                const subtituloMatch = estruturaText.match(/SUBTITULO:\s*(.+)/)
                const publicoMatch = estruturaText.match(/PUBLICO:\s*(.+)/)
                const tomMatch = estruturaText.match(/TOM:\s*(.+)/)

                // Parse dos capítulos
                const capitulosSection = estruturaText.match(/CAPITULOS:([\s\S]*?)(?=PUBLICO:|$)/)
                const capitulos: string[] = []
                if (capitulosSection) {
                    const lines = capitulosSection[1].split('\n')
                    for (const line of lines) {
                        const capMatch = line.match(/\d+\.\s*(.+)/)
                        if (capMatch) {
                            capitulos.push(capMatch[1].trim())
                        }
                    }
                }

                if (tituloMatch && capitulos.length > 0) {
                    return {
                        titulo: tituloMatch[1].trim(),
                        subtitulo: subtituloMatch ? subtituloMatch[1].trim() : '',
                        autor: 'VIPNEXUS IA',
                        capitulos,
                        publicoAlvo: publicoMatch ? publicoMatch[1].trim() : '',
                        tomTexto: tomMatch ? tomMatch[1].trim() : 'profissional',
                        idiomas: ['pt', 'en', 'es', 'fr']
                    }
                }
            }
        }
    }

    return null
}

// Checar se a estrutura foi aprovada
export function isStructureApproved(messages: ChatMessage[]): boolean {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].content.includes('---ESTRUTURA_APROVADA---')) {
            return true
        }
    }
    return false
}

// Gerar conteúdo completo do eBook baseado na estrutura aprovada
export async function generateEbookContent(
    apiKey: string,
    structure: EbookStructure,
    onProgress?: (status: string, progress: number) => void
): Promise<MultiLanguageEbook> {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result: Partial<MultiLanguageEbook> = {}
    const languages = [
        { code: 'pt', name: 'Português Brasileiro' },
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' }
    ]

    for (let langIndex = 0; langIndex < languages.length; langIndex++) {
        const lang = languages[langIndex]
        const progress = ((langIndex + 1) / languages.length) * 100

        onProgress?.(`Gerando em ${lang.name}...`, progress)

        const prompt = `
Você é um escritor profissional de eBooks. Crie o conteúdo COMPLETO de um eBook com as seguintes especificações:

TÍTULO: ${structure.titulo}
SUBTÍTULO: ${structure.subtitulo}
AUTOR: ${structure.autor}
PÚBLICO-ALVO: ${structure.publicoAlvo}
TOM DO TEXTO: ${structure.tomTexto}
IDIOMA: ${lang.name}

CAPÍTULOS A CRIAR:
${structure.capitulos.map((c, i) => `${i + 1}. ${c}`).join('\n')}

INSTRUÇÕES:
1. Escreva TODO o conteúdo em ${lang.name}
2. Cada capítulo deve ter no mínimo 800 palavras
3. Use parágrafos curtos para facilitar a leitura
4. Inclua exemplos práticos e dicas acionáveis
5. Mantenha o tom ${structure.tomTexto} consistente
6. Crie uma introdução cativante e uma conclusão inspiradora

FORMATO DE RESPOSTA (JSON):
{
  "title": "título em ${lang.name}",
  "subtitle": "subtítulo em ${lang.name}",
  "author": "${structure.autor}",
  "introduction": "texto completo da introdução (mínimo 500 palavras)",
  "chapters": [
    {
      "title": "título do capítulo 1",
      "content": "conteúdo completo do capítulo 1 (mínimo 800 palavras)"
    }
  ],
  "conclusion": "texto completo da conclusão (mínimo 400 palavras)",
  "aboutAuthor": "breve bio do autor (100 palavras)"
}

Responda APENAS com o JSON válido, sem explicações adicionais.`

        try {
            const response = await model.generateContent(prompt)
            const text = response.response.text()

            // Limpar o texto para extrair JSON
            let jsonText = text.trim()
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '')
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '')
            }

            const ebookContent = JSON.parse(jsonText)

            // Calcular metadados
            let totalWords = 0
            totalWords += ebookContent.introduction?.split(/\s+/).length || 0
            totalWords += ebookContent.conclusion?.split(/\s+/).length || 0
            for (const chapter of ebookContent.chapters || []) {
                totalWords += chapter.content?.split(/\s+/).length || 0
            }

            const pageCount = Math.ceil(totalWords / 250) // ~250 palavras por página

            result[lang.code as keyof MultiLanguageEbook] = {
                title: ebookContent.title || structure.titulo,
                subtitle: ebookContent.subtitle || structure.subtitulo,
                author: ebookContent.author || structure.autor,
                introduction: ebookContent.introduction || '',
                chapters: ebookContent.chapters || [],
                conclusion: ebookContent.conclusion || '',
                aboutAuthor: ebookContent.aboutAuthor || '',
                metadata: {
                    language: lang.code,
                    pageCount,
                    wordCount: totalWords,
                    generatedAt: new Date().toISOString()
                }
            }
        } catch (error) {
            console.error(`Erro ao gerar conteúdo em ${lang.name}:`, error)
            throw new Error(`Erro ao gerar conteúdo em ${lang.name}: ${error}`)
        }
    }

    onProgress?.('Concluído!', 100)

    return result as MultiLanguageEbook
}

// Função para iniciar o chat de briefing
export function getInitialBriefingMessage(templateContext?: string): ChatMessage {
    let message = `Olá! 👋 Sou sua assistente de criação de eBooks.

Vou te ajudar a criar um eBook profissional que vende! Vou fazer algumas perguntas para entender exatamente o que você precisa.`

    if (templateContext) {
        message += `\n\n${templateContext}\n\nMe conta: qual é o tema específico do seu eBook?`
    } else {
        message += `\n\n**Qual é o tema do eBook que você quer criar?** 📚

Pode ser qualquer coisa: saúde, finanças, relacionamentos, receitas, desenvolvimento pessoal, negócios... Me diz!`
    }

    return {
        role: 'assistant',
        content: message
    }
}
