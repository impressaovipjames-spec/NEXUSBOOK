
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
        let baseURL = undefined;
        let modelName = "gpt-4-turbo-preview";

        if (apiKey.startsWith('ghp_')) {
            baseURL = "https://models.inference.ai.azure.com";
            modelName = "gpt-4o";
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

// --- FUNÇÃO DE PRODUÇÃO EM ESCALA ("LINHA DE MONTAGEM") ---
// Gera capítulo por capítulo para criar eBooks GIGANTES sem estourar token.
export async function generateEbookContent(
    apiKey: string,
    structure: EbookStructure,
    onProgress?: (status: string, progress: number) => void,
    forcedProvider?: 'google' | 'openai' | 'groq'
): Promise<MultiLanguageEbook> {
    const provider = forcedProvider || detectProvider(apiKey);
    const result: Partial<MultiLanguageEbook> = {};
    const languages = [
        { code: 'pt', name: 'Português Brasileiro' }
        // Foco em qualidade PT-BR. Depois pode habilitar outros se quiser.
    ];

    let openai: OpenAI | null = null;
    let genAIModel: any = null;
    let modelName = "gpt-4-turbo-preview"; // Default fallback

    // --- CONFIGURAÇÃO DO WORKER (IA) ---
    if (provider === 'groq') {
        openai = new OpenAI({
            apiKey,
            baseURL: 'https://api.groq.com/openai/v1',
            dangerouslyAllowBrowser: true
        });
        modelName = "llama-3.3-70b-versatile"; // O CARRO CHEFE
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

    // Função Helper para chamar a IA para cada pedaço
    const generatePart = async (prompt: string): Promise<string> => {
        try {
            if (provider === 'openai' && openai) {
                const completion = await openai.chat.completions.create({
                    model: modelName,
                    messages: [{ role: "user", content: prompt }]
                });
                return completion.choices[0].message.content || "";
            } else if (genAIModel) {
                const response = await genAIModel.generateContent(prompt);
                return response.response.text();
            } else if (openai) { // Groq logic uses openai client
                const completion = await openai.chat.completions.create({
                    model: modelName,
                    messages: [{ role: "user", content: prompt }]
                });
                return completion.choices[0].message.content || "";
            }
            return "";
        } catch (e) {
            console.error("Erro ao gerar parte:", e);
            throw e;
        }
    };

    // --- LOOP DE PRODUÇÃO SEQUENCIAL ---
    for (let langIndex = 0; langIndex < languages.length; langIndex++) {
        const lang = languages[langIndex];

        // Estrutura Base
        const ebookContent: EbookContent = {
            title: structure.titulo,
            subtitle: structure.subtitulo,
            author: structure.autor,
            introduction: "",
            chapters: [],
            conclusion: "",
            aboutAuthor: "",
            metadata: {
                language: lang.code,
                pageCount: 0,
                wordCount: 0,
                generatedAt: new Date().toISOString()
            }
        };

        // 1. INTRODUÇÃO
        onProgress?.(`Escrevendo Introdução (${lang.name})...`, 5);
        const introPrompt = `Atue como um Autor Best-Seller.
Escreva a INTRODUÇÃO do livro "${structure.titulo}".
Público Alvo: ${structure.publicoAlvo}.
Tom: ${structure.tomTexto}.
Idioma: ${lang.name}.
Objetivo: Engajar o leitor e apresentar a promessa do livro.
Formato: Texto corrido em Markdown. Mínimo 800 palavras.`;

        ebookContent.introduction = await generatePart(introPrompt);

        // 2. CAPÍTULOS (LOOP DE ALTA CAPACIDADE)
        for (let i = 0; i < structure.capitulos.length; i++) {
            const capTitle = structure.capitulos[i];
            const progress = 10 + ((i + 1) / structure.capitulos.length) * 80; // 10% a 90%
            onProgress?.(`Escrevendo Cap. ${i + 1}/${structure.capitulos.length}: ${capTitle}...`, progress);

            const capPrompt = `Atue como um Autor Best-Seller.
Escreva o CAPÍTULO ${i + 1}: "${capTitle}" do livro "${structure.titulo}".
Contexto: Este é um capítulo de um livro sobre "${structure.titulo}".
Público: ${structure.publicoAlvo}. 
Tom: ${structure.tomTexto}. 
Idioma: ${lang.name}.

REGRAS DE PRODUÇÃO:
1. Escreva um conteúdo PROFUNDO, TÉCNICO E DETALHADO (Mínimo 2000 palavras).
2. Não economize em exemplos, explicações e listas.
3. Use Markdown para subtítulos (##), negrito, bullets.
4. Retorne APENAS O CONTEÚDO DO CAPÍTULO. Sem preâmbulos.`;

            const content = await generatePart(capPrompt);
            ebookContent.chapters.push({
                title: capTitle,
                content: content
            });
        }

        // 3. CONCLUSÃO
        onProgress?.(`Finalizando Conclusão...`, 95);
        const conclusionPrompt = `Escreva uma CONCLUSÃO inspiradora e uma BIO DO AUTOR para o livro "${structure.titulo}".
Idioma: ${lang.name}.
Retorne APENAS um JSON válido neste formato:
{ "conclusion": "texto da conclusão...", "aboutAuthor": "texto sobre o autor..." }`;

        try {
            const jsonResp = await generatePart(conclusionPrompt);
            const cleanJson = jsonResp.replace(/```json/g, '').replace(/```/g, '').trim();
            const finalData = JSON.parse(cleanJson);
            ebookContent.conclusion = finalData.conclusion || await generatePart("Escreva uma conclusão curta.");
            ebookContent.aboutAuthor = finalData.aboutAuthor || "Autor Especialista.";
        } catch (e) {
            // Fallback se falhar json
            ebookContent.conclusion = "Obrigado por ler.";
            ebookContent.aboutAuthor = "Autor Nexus.";
        }

        // 4. METADADOS FINAIS
        let totalWords = 0;
        totalWords += (ebookContent.introduction?.split(/\s+/)?.length || 0);
        ebookContent.chapters.forEach(c => totalWords += (c.content?.split(/\s+/)?.length || 0));
        ebookContent.metadata.wordCount = totalWords;
        ebookContent.metadata.pageCount = Math.ceil(totalWords / 300); // Média de palavras por pág

        result[lang.code as keyof MultiLanguageEbook] = ebookContent;
    }

    onProgress?.('Concluído! Seu Ebook Premium está pronto.', 100);
    return result as MultiLanguageEbook;
}
