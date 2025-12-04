import { GoogleGenerativeAI } from "@google/generative-ai";

export interface EbookContent {
    title: string;
    subtitle: string;
    author: string;
    language: string;
    coverImage?: string;
    chapters: {
        number: number;
        title: string;
        content: string;
        summary: string;
    }[];
    metadata: {
        pageCount: number;
        wordCount: number;
        readingTime: string;
    };
}

export interface MultiLanguageEbook {
    pt: EbookContent;
    en: EbookContent;
    es: EbookContent;
    fr: EbookContent;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export async function chatWithAI(
    apiKey: string,
    messages: ChatMessage[]
): Promise<string> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const chat = model.startChat({
        history: messages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }))
    });

    const lastMessage = messages[messages.length - 1];
    const result = await chat.sendMessage(lastMessage.content);
    return result.response.text();
}

export async function generateEbookWithInstructions(
    apiKey: string,
    topic: string,
    instructions: string,
    languages: string[] = ['pt', 'en', 'es', 'fr'],
    onProgress?: (step: string) => void
): Promise<MultiLanguageEbook> {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const languageMap: { [key: string]: string } = {
        pt: 'Português',
        en: 'English',
        es: 'Español',
        fr: 'Français'
    };

    const result: any = {};

    for (const lang of languages) {
        if (onProgress) onProgress(`Gerando conteúdo em ${languageMap[lang]}...`);

        const prompt = `
Você é um autor best-seller e especialista em criar conteúdo de alta qualidade.

TEMA DO EBOOK: "${topic}"

INSTRUÇÕES ESPECIAIS DO AUTOR:
${instructions}

Crie um eBook COMPLETO e PROFISSIONAL em ${languageMap[lang]} seguindo estas diretrizes:

1. O eBook deve ter entre 5-7 capítulos DENSOS e informativos
2. Cada capítulo deve ter pelo menos 800-1200 palavras
3. O conteúdo deve ser PRÁTICO, ACIONÁVEL e com EXEMPLOS REAIS
4. Evite enrolação - vá direto ao ponto com informações valiosas
5. Use storytelling quando apropriado para engajar o leitor
6. Inclua dicas, estratégias e passos práticos

RETORNE APENAS um JSON válido (sem markdown, sem texto extra) com esta estrutura:

{
  "title": "Título chamativo e comercial",
  "subtitle": "Subtítulo explicativo",
  "author": "Nome profissional do autor (crie um pseudônimo relacionado ao nicho)",
  "language": "${languageMap[lang]}",
  "chapters": [
    {
      "number": 1,
      "title": "Título do Capítulo",
      "content": "Conteúdo completo do capítulo com parágrafos bem estruturados...",
      "summary": "Resumo de 1-2 linhas do capítulo"
    }
  ]
}

IMPORTANTE: Gere pelo menos 5 capítulos completos e substanciais.
`;

        try {
            const response = await model.generateContent(prompt);
            const text = response.response.text();
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const ebookData = JSON.parse(cleanText);

            // Calcular metadados
            const totalWords = ebookData.chapters.reduce((sum: number, ch: any) =>
                sum + ch.content.split(/\s+/).length, 0
            );
            const readingTimeMinutes = Math.ceil(totalWords / 200); // 200 palavras por minuto

            result[lang] = {
                ...ebookData,
                metadata: {
                    pageCount: Math.ceil(totalWords / 250), // ~250 palavras por página
                    wordCount: totalWords,
                    readingTime: `${readingTimeMinutes} minutos`
                }
            };

        } catch (error) {
            console.error(`Erro ao gerar eBook em ${lang}:`, error);
            throw new Error(`Falha ao gerar conteúdo em ${languageMap[lang]}`);
        }

        // Pequeno delay para não sobrecarregar a API
        await new Promise(r => setTimeout(r, 1000));
    }

    return result as MultiLanguageEbook;
}

export async function generateEbook(
    apiKey: string,
    topic: string,
    onProgress?: (step: string) => void
): Promise<MultiLanguageEbook> {
    return generateEbookWithInstructions(
        apiKey,
        topic,
        "Crie um conteúdo profissional, prático e de alta qualidade que realmente ajude o leitor.",
        ['pt', 'en', 'es', 'fr'],
        onProgress
    );
}
