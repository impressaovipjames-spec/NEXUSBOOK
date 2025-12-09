
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// --- INTERFACES ---

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export interface EbookStructure {
    titulo: string;
    subtitulo: string;
    autor: string;
    capitulos: string[];
    publicoAlvo: string;
    tomTexto: string;
    idiomas: string[];
}

export interface EbookContent {
    title: string;
    subtitle: string;
    author: string;
    chapters: {
        title: string;
        content: string;
    }[];
    introduction: string;
    conclusion: string;
    aboutAuthor: string;
    metadata: {
        language: string;
        pageCount: number;
        wordCount: number;
        generatedAt: string;
    };
}

export interface MultiLanguageEbook {
    pt: EbookContent;
    en: EbookContent;
    es: EbookContent;
    fr: EbookContent;
}

// --- PROMPTS DO SISTEMA ---
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

Agora vamos conversar! Quando o usuário iniciar, faça a primeira pergunta sobre o tema do eBook.`;

// --- FUNÇÕES HELPER ---

function detectProvider(apiKey: string): 'google' | 'openai' | 'groq' {
    if (apiKey.startsWith('gsk_')) return 'groq'; // Groq keys start with gsk_
    if (apiKey.startsWith('sk-') || apiKey.startsWith('ghp_')) return 'openai';
    return 'google';
}

export function getInitialBriefingMessage(templateContext?: string): ChatMessage {
    let message = `Olá! 👋 Sou sua assistente de criação de eBooks.

Vou te ajudar a criar um eBook profissional que vende! Vou fazer algumas perguntas para entender exatamente o que você precisa.`;

    if (templateContext) {
        message += `\n\n${templateContext}\n\nMe conta: qual é o tema específico do seu eBook?`;
    } else {
        message += `\n\n**Qual é o tema do eBook que você quer criar?** 📚

Pode ser qualquer coisa: saúde, finanças, relacionamentos, receitas, desenvolvimento pessoal, negócios... Me diz!`;
    }

    return {
        role: 'assistant',
        content: message
    };
}

export function isStructureApproved(messages: ChatMessage[]): boolean {
    for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].content.includes('---ESTRUTURA_APROVADA---')) {
            return true;
        }
    }
    return false;
}

export function extractApprovedStructure(messages: ChatMessage[]): EbookStructure | null {
    for (let i = messages.length - 1; i >= 0; i--) {
        const content = messages[i].content;

        if (content.includes('---ESTRUTURA_PROPOSTA---')) {
            const match = content.match(/---ESTRUTURA_PROPOSTA---([\s\S]*?)---FIM_ESTRUTURA---/);
            if (match) {
                const estruturaText = match[1];

                const tituloMatch = estruturaText.match(/TITULO:\s*(.+)/);
                const subtituloMatch = estruturaText.match(/SUBTITULO:\s*(.+)/);
                const publicoMatch = estruturaText.match(/PUBLICO:\s*(.+)/);
                const tomMatch = estruturaText.match(/TOM:\s*(.+)/);

                const capitulosSection = estruturaText.match(/CAPITULOS:([\s\S]*?)(?=PUBLICO:|$)/);
                const capitulos: string[] = [];
                if (capitulosSection) {
                    const lines = capitulosSection[1].split('\n');
                    for (const line of lines) {
                        const capMatch = line.match(/\d+\.\s*(.+)/);
                        if (capMatch) {
                            capitulos.push(capMatch[1].trim());
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
                    };
                }
            }
        }
    }
    return null;
}

// --- FUNÇÕES PRINCIPAIS ---

export async function chatWithAI(
    apiKey: string,
    messages: ChatMessage[],
    templateContext?: string,
    forcedProvider?: 'google' | 'openai' | 'groq'
): Promise<string> {
    const provider = forcedProvider || detectProvider(apiKey);
    let systemPrompt = BRIEFING_SYSTEM_PROMPT;
    if (templateContext) {
        systemPrompt += `\n\nCONTEXTO DO TEMPLATE SELECIONADO:\n${templateContext}`;
    }

    if (provider === 'groq') {
        // GROQ - 100% GRATUITO, SUPER RÁPIDO!
        const groq = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
            dangerouslyAllowBrowser: true
        });

        try {
            const completion = await groq.chat.completions.create({
                model: "llama-3.3-70b-versatile", // Modelo mais recente e ativo
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages.map(m => ({ role: m.role, content: m.content }))
                ],
            });
            return completion.choices[0].message.content || "Sem resposta.";
        } catch (error: any) {
            console.error("Groq API Error:", error);
            const msg = error.message || error.toString();
            if (error.code === 'invalid_api_key' || error.status === 401) {
                throw new Error(`❌ Chave Groq inválida. Crie uma grátis em: console.groq.com`);
            }
            throw new Error(`❌ Erro Groq: ${msg}`);
        }

    } else if (provider === 'openai') {
        // Handle custom endpoints or just standard OpenAI
        // Note: ghp_ keys are for GitHub models but usually require a different base URL (https://models.inference.ai.azure.com)
        // We will try standard OpenAI first, if it fails, and if key starts with ghp_, maybe we could try the other endpoint?
        // For now, let's just assume standard OpenAI or user knows what they are doing.

        let baseURL = undefined;
        let modelName = "gpt-4-turbo-preview"; // Default OpenAI

        if (apiKey.startsWith('ghp_')) {
            // It's a GitHub Model key!
            baseURL = "https://models.inference.ai.azure.com";
            modelName = "gpt-4o"; // GitHub models often use this
        }

        const openai = new OpenAI({
            apiKey,
            baseURL,
            dangerouslyAllowBrowser: true
        });

        try {
            const completion = await openai.chat.completions.create({
                model: modelName,
                messages: [
                    { role: "system", content: systemPrompt },
                    ...messages.map(m => ({ role: m.role, content: m.content }))
                ],
            });
            return completion.choices[0].message.content || "Sem resposta.";
        } catch (error: any) {
            console.error("OpenAI/GitHub API Error:", error);
            const msg = error.message || error.toString();
            if (error.code === 'invalid_api_key' || error.status === 401) {
                throw new Error(`Chave Inválida (${provider}). Verifique se está usando a chave correta.`);
            }
            throw new Error(`Erro na IA (${provider}): ${msg}`);
        }

    } else {
        // GOOGLE GEMINI (MODELO GRATUITO - GEMINI PRO)
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

        const history = messages.slice(0, -1).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        try {
            const chat = model.startChat({
                history: [
                    { role: 'user', parts: [{ text: systemPrompt }] },
                    { role: 'model', parts: [{ text: 'Entendido! Estou pronto para ajudar a criar um eBook incrível. Vou fazer perguntas estratégicas para garantir que o conteúdo seja perfeito. Vamos começar! 📚' }] },
                    ...history
                ]
            });

            const lastMessage = messages[messages.length - 1];
            const result = await chat.sendMessage(lastMessage.content);
            return result.response.text();
        } catch (error: any) {
            console.error("Gemini API Error (Detalhes Completos):", error);
            console.error("Error Message:", error.message);
            console.error("Error Status:", error.status);

            // Mensagens mais específicas
            if (error.message?.includes('API_KEY_INVALID') || error.status === 400) {
                throw new Error('❌ Chave API inválida. Verifique se copiou corretamente (deve começar com "AIza")');
            }
            if (error.message?.includes('PERMISSION_DENIED') || error.status === 403) {
                throw new Error('❌ Permissão negada. Habilite a API Gemini em console.cloud.google.com');
            }
            if (error.message?.includes('QUOTA_EXCEEDED')) {
                throw new Error('❌ Cota excedida. Verifique os limites da sua conta Google Cloud.');
            }
            if (error.message?.includes('API key')) {
                throw new Error(`❌ Erro na chave: ${error.message}`);
            }

            // Erro genérico com detalhes
            throw new Error(`❌ Gemini API: ${error.message || error.toString()}`);
        }
    }
}

export async function generateEbookContent(
    apiKey: string,
    structure: EbookStructure,
    onProgress?: (status: string, progress: number) => void,
    forcedProvider?: 'google' | 'openai' | 'groq'
): Promise<MultiLanguageEbook> {
    const provider = forcedProvider || detectProvider(apiKey);
    const result: Partial<MultiLanguageEbook> = {};
    const languages = [
        { code: 'pt', name: 'Português Brasileiro' },
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Español' },
        { code: 'fr', name: 'Français' }
    ];

    let openai: OpenAI | null = null;
    let genAIModel: any = null;
    let modelName = "gpt-4-turbo-preview";

    if (provider === 'groq') {
        openai = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
            dangerouslyAllowBrowser: true
        });
        modelName = "llama-3.3-70b-versatile";
    } else if (provider === 'openai') {
        let baseURL = undefined;
        if (apiKey.startsWith('ghp_')) {
            baseURL = "https://models.inference.ai.azure.com";
            modelName = "gpt-4o";
        }
        openai = new OpenAI({ apiKey, baseURL, dangerouslyAllowBrowser: true });
    } else {
        const genAI = new GoogleGenerativeAI(apiKey);
        genAIModel = genAI.getGenerativeModel({ model: 'gemini-pro' });
    }

    for (let langIndex = 0; langIndex < languages.length; langIndex++) {
        const lang = languages[langIndex];
        const progress = ((langIndex + 1) / languages.length) * 100;
        onProgress?.(`Gerando em ${lang.name}...`, progress);

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
2. Seja CONCISO E DIRETO. Crie um eBook curto e impactante (Mini-Book).
3. Cada capítulo deve ter cerca de 300 a 400 palavras (NÃO ULTRAPASSE, para não cortar a resposta).
4. Use parágrafos curtos e tópicos.
5. Mantenha o tom ${structure.tomTexto} consistente
6. Crie uma introdução e conclusão breves.

FORMATO DE RESPOSTA (JSON PURO):
{
  "title": "título em ${lang.name}",
  "subtitle": "subtítulo em ${lang.name}",
  "author": "${structure.autor}",
  "introduction": "texto da introdução",
  "chapters": [
    {
      "title": "título do capítulo",
      "content": "conteúdo do capítulo (use markdown para negrito/títulos)"
    }
  ],
  "conclusion": "texto da conclusão",
  "aboutAuthor": "bio curta"
}

IMPORTANTE: A resposta DEVE ser um JSON vádido completo. Se for muito longo, corte o conteúdo, mas FECHE o JSON corretamente. Responda APENAS com o JSON.`;

        try {
            let jsonText = "";

            if (provider === 'openai' && openai) {
                const completion = await openai.chat.completions.create({
                    model: modelName,
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" }
                });
                jsonText = completion.choices[0].message.content || "";
            } else if (genAIModel) {
                const response = await genAIModel.generateContent(prompt);
                const text = response.response.text();
                jsonText = text.trim();
                // Strip markdown code blocks if present
                if (jsonText.startsWith('```json')) {
                    jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
                } else if (jsonText.startsWith('```')) {
                    jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
                }
            }

            const ebookContent = JSON.parse(jsonText);

            // Calcular metadados
            let totalWords = 0;
            totalWords += ebookContent.introduction?.split(/\s+/).length || 0;
            totalWords += ebookContent.conclusion?.split(/\s+/).length || 0;
            for (const chapter of ebookContent.chapters || []) {
                totalWords += chapter.content?.split(/\s+/).length || 0;
            }
            const pageCount = Math.ceil(totalWords / 250);

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
            };

        } catch (error) {
            console.error(`Erro ao gerar conteúdo em ${lang.name}:`, error);
            throw new Error(`Erro ao gerar conteúdo em ${lang.name}: ${error}`);
        }
    }

    onProgress?.('Concluído!', 100);
    return result as MultiLanguageEbook;
}
