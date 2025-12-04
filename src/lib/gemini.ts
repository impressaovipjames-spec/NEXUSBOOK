import { GoogleGenerativeAI } from "@google/generative-ai";

export interface EbookContent {
  title: string;
  author: string;
  language: string;
  chapters: {
    title: string;
    content: string;
  }[];
}

export interface MultiLanguageEbook {
  pt: EbookContent;
  en: EbookContent;
  es: EbookContent;
  fr: EbookContent;
}

export async function generateEbook(apiKey: string, topic: string): Promise<MultiLanguageEbook> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Atue como um autor best-seller e especialista em criação de conteúdo.
    Crie um mini-eBook completo e profissional sobre o tema: "${topic}".
    
    O eBook deve ser gerado SIMULTANEAMENTE em 4 idiomas: Português (pt), Inglês (en), Espanhol (es) e Francês (fr).
    
    Estrutura requerida para CADA idioma:
    1. Título chamativo e comercial.
    2. Nome do Autor (crie um pseudônimo profissional relacionado ao nicho).
    3. 3 Capítulos densos e informativos (sem enrolação, direto ao ponto).
    
    Você DEVE retornar APENAS um JSON válido com a seguinte estrutura exata, sem markdown, sem texto extra:
    
    {
      "pt": {
        "title": "...",
        "author": "...",
        "language": "Português",
        "chapters": [
          { "title": "...", "content": "..." },
          { "title": "...", "content": "..." },
          { "title": "...", "content": "..." }
        ]
      },
      "en": { ...mesma estrutura... },
      "es": { ...mesma estrutura... },
      "fr": { ...mesma estrutura... }
    }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Limpar markdown se houver (```json ... ```)
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(cleanText) as MultiLanguageEbook;
  } catch (error) {
    console.error("Erro ao gerar eBook:", error);
    throw new Error("Falha ao gerar o conteúdo do eBook. Tente novamente.");
  }
}
