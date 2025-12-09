// PDF Generator - Criação de PDFs profissionais com capa

import { jsPDF } from 'jspdf'
import type { EbookContent } from './gemini'

interface PDFOptions {
    coverImageUrl?: string
    colorTheme?: {
        primary: string
        secondary: string
        accent: string
    }
}

// Converter hex para RGB
function hexToRgb(hex: string): { r: number, g: number, b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 128, g: 90, b: 213 }
}

// Função para quebrar texto em linhas
function splitTextToLines(doc: jsPDF, text: string, maxWidth: number): string[] {
    const lines: string[] = []
    const paragraphs = text.split('\n')

    for (const paragraph of paragraphs) {
        if (paragraph.trim() === '') {
            lines.push('')
            continue
        }

        const words = paragraph.split(' ')
        let currentLine = ''

        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word
            const testWidth = doc.getTextWidth(testLine)

            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine)
                currentLine = word
            } else {
                currentLine = testLine
            }
        }

        if (currentLine) {
            lines.push(currentLine)
        }
    }

    return lines
}

export async function createPDF(
    ebook: EbookContent,
    options?: PDFOptions
): Promise<jsPDF> {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    })

    const pageWidth = 210
    const pageHeight = 297
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Cores Premium
    const colors = options?.colorTheme || {
        primary: '#1E1B4B', // Azul meia-noite profundo
        secondary: '#4338CA', // Índigo vibrante
        accent: '#F59E0B' // Dourado
    }

    const primaryRgb = hexToRgb(colors.primary)
    const secondaryRgb = hexToRgb(colors.secondary)
    const accentRgb = hexToRgb(colors.accent)

    let currentPage = 1
    const tocEntries: { title: string, page: number }[] = []

    // =====================
    // PÁGINA 1: CAPA PREMIUM SUPERIOR
    // =====================

    // Fundo Gradiente Moderno (Radial)
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Círculos Decorativos (Estilo Tech/Moderno)
    doc.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
    doc.circle(pageWidth, 0, 100, 'F'); // Canto superior direito
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b); // Sobreposição sutil

    // Elementos Gráficos
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.line(margin, 50, pageWidth - margin, 50); // Linha superior

    doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.setLineWidth(1.5);
    doc.line(margin, 52, margin + 40, 52); // Acento dourado

    // Título Principal
    doc.setTextColor(255, 255, 255);
    doc.setFont('times', 'bold'); // Fonte serifada para elegância

    let titleSize = 42; // Título Gigante
    if (ebook.title.length > 20) titleSize = 36;
    if (ebook.title.length > 40) titleSize = 28;

    doc.setFontSize(titleSize);
    const titleLines = splitTextToLines(doc, ebook.title.toUpperCase(), contentWidth - 20);
    let titleY = 100;

    for (const line of titleLines) {
        doc.text(line, margin, titleY);
        titleY += titleSize * 0.45;
    }

    // Subtítulo
    if (ebook.subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(16);
        doc.setTextColor(220, 220, 220);
        titleY += 10;
        const subLines = splitTextToLines(doc, ebook.subtitle, contentWidth - 20);
        for (const line of subLines) {
            doc.text(line, margin, titleY);
            titleY += 8;
        }
    }

    // Autor e Branding
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(`Por ${ebook.author}`, margin, pageHeight - 40);

    // Selo de Qualidade (Simulado)
    doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.setLineWidth(1);
    doc.circle(pageWidth - 40, pageHeight - 40, 15, 'S');
    doc.setFontSize(8);
    doc.setTextColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.text('EDITION', pageWidth - 40, pageHeight - 42, { align: 'center' });
    doc.text('PREMIUM', pageWidth - 40, pageHeight - 38, { align: 'center' });

    currentPage++;

    // =====================
    // PÁGINA 2: FOLHA DE ROSTO (Estilo Clean)
    // =====================
    doc.addPage();
    doc.setTextColor(30, 30, 30);

    // Título Centralizado
    doc.setFont('times', 'bold');
    doc.setFontSize(28);
    let y = 80;
    const titleLines2 = splitTextToLines(doc, ebook.title, contentWidth);
    for (const line of titleLines2) {
        doc.text(line, pageWidth / 2, y, { align: 'center' });
        y += 12;
    }

    // Subtítulo
    if (ebook.subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(80, 80, 80);
        y += 5;
        doc.text(ebook.subtitle, pageWidth / 2, y, { align: 'center' });
    }

    // Dados Técnicos (Estilo Ficha)
    y = pageHeight - 70;
    doc.setDrawColor(200, 200, 200);
    doc.line(pageWidth / 2 - 20, y, pageWidth / 2 + 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`${ebook.metadata.wordCount.toLocaleString()} Palavras`, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.text(`Gerado em ${new Date().toLocaleDateString()}`, pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.text('VIPNEXUS IA EDITORIAL', pageWidth / 2, y, { align: 'center' });

    currentPage++;
    tocEntries.push({ title: 'Folha de Rosto', page: currentPage });

    // =====================
    // SUMÁRIO (Placeholder)
    // =====================
    doc.addPage();
    const tocPageNumber = currentPage;
    currentPage++;

    // =====================
    // INTRODUÇÃO
    // =====================
    doc.addPage();
    tocEntries.push({ title: 'Introdução', page: currentPage });

    // Cabeçalho da Introdução
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text('INTRODUÇÃO', margin, 30);
    doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
    doc.setLineWidth(1);
    doc.line(margin, 35, margin + 40, 35);

    // Texto
    doc.setFont('times', 'roman'); // Serifada para leitura longa (estilo livro)
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);

    let textY = 50;
    const introLines = splitTextToLines(doc, ebook.introduction, contentWidth);

    for (const line of introLines) {
        if (textY > pageHeight - 25) {
            // Footer
            doc.setFontSize(10);
            doc.setTextColor(150, 150, 150);
            doc.text(`${currentPage}`, pageWidth - margin, pageHeight - 15, { align: 'right' });

            doc.addPage();
            currentPage++;
            textY = 30; // Margem topo
            doc.setFont('times', 'roman');
            doc.setFontSize(12);
            doc.setTextColor(20, 20, 20);
        }
        doc.text(line, margin, textY);
        textY += 6; // Espaçamento entre linhas (Leading)
    }

    // Footer final Intro
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`${currentPage}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
    currentPage++;

    // =====================
    // CAPÍTULOS (ESTILO PREMIUM)
    // =====================
    for (let i = 0; i < ebook.chapters.length; i++) {
        const chapter = ebook.chapters[i];

        // Página de Abertura de Capítulo (Estilo Moderno)
        doc.addPage();
        tocEntries.push({ title: chapter.title, page: currentPage });

        // Número Gigante do Capítulo
        doc.setFillColor(245, 245, 245); // Fundo cinza suave
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        doc.setTextColor(220, 220, 220);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(150);
        doc.text(`${i + 1}`, pageWidth - 40, pageHeight - 40, { align: 'right' });

        // Título do Capítulo
        doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
        doc.setFont('times', 'bold');
        doc.setFontSize(32);
        const titleLinesCap = splitTextToLines(doc, chapter.title, contentWidth - 40);
        let capY = 100;
        for (const line of titleLinesCap) {
            doc.text(line, margin + 10, capY);
            capY += 14;
        }

        doc.setDrawColor(accentRgb.r, accentRgb.g, accentRgb.b);
        doc.setLineWidth(2);
        doc.line(margin + 10, capY + 10, margin + 60, capY + 10);

        currentPage++;

        // Conteúdo do Capítulo
        doc.addPage();
        doc.setFont('times', 'roman');
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);

        textY = 30;
        const contentLines = splitTextToLines(doc, chapter.content, contentWidth);

        for (const line of contentLines) {
            // Tratamento Básico de Markdown (Títulos ##)
            if (line.trim().startsWith('##')) {
                doc.setFont('times', 'bold');
                doc.setFontSize(14);
                // line = line.replace(/#/g, '');
            } else {
                doc.setFont('times', 'roman');
                doc.setFontSize(12);
            }

            if (textY > pageHeight - 25) {
                // Header com Título do Livro
                doc.setFontSize(8);
                doc.setTextColor(180, 180, 180);
                doc.text(ebook.title, margin, 15);

                // Footer
                doc.setFontSize(10);
                doc.setTextColor(150, 150, 150);
                doc.text(`${currentPage}`, pageWidth - margin, pageHeight - 15, { align: 'right' });

                doc.addPage();
                currentPage++;
                textY = 30;
                doc.setTextColor(20, 20, 20);
            }
            doc.text(line.replace(/#/g, '').trim(), margin, textY);
            textY += 6;
        }

        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(`${currentPage}`, pageWidth - margin, pageHeight - 15, { align: 'right' });
        currentPage++;
    }

    // =====================
    // CONCLUSÃO & BIO
    // =====================
    doc.addPage();
    tocEntries.push({ title: 'Conclusão', page: currentPage });

    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text('CONCLUSÃO', margin, 36);

    doc.setFont('times', 'roman');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);
    textY = 50;

    const concLines = splitTextToLines(doc, ebook.conclusion, contentWidth);
    for (const line of concLines) {
        if (textY > 150) break; // Limite para bio
        doc.text(line, margin, textY);
        textY += 6;
    }

    // Bio do Autor (Box)
    const bioY = textY + 20;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, bioY, contentWidth, 60, 3, 3, 'F');

    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text('Sobre o Autor', margin + 10, bioY + 15);

    doc.setFont('times', 'italic'); // Estilo Bio
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 60);
    const bioLines = splitTextToLines(doc, ebook.aboutAuthor, contentWidth - 20);
    let bioTextY = bioY + 25;
    for (const line of bioLines) {
        doc.text(line, margin + 10, bioTextY);
        bioTextY += 5;
    }

    // =====================
    // PREENCHER SUMÁRIO
    // =====================
    doc.setPage(tocPageNumber);
    doc.setFont('times', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    doc.text('SUMÁRIO', margin, 30);

    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(20, 20, 20);

    let tocY = 50;
    for (const entry of tocEntries) {
        if (tocY > pageHeight - 30) break;

        doc.text(entry.title, margin, tocY);
        doc.text(entry.page.toString(), pageWidth - margin, tocY, { align: 'right' });

        // Pontilhados
        doc.setDrawColor(200, 200, 200);
        doc.setLineDashPattern([1, 2], 0);
        const titleW = doc.getTextWidth(entry.title);
        doc.line(margin + titleW + 2, tocY, pageWidth - margin - 10, tocY);
        doc.setLineDashPattern([], 0);

        tocY += 10;
    }

    return doc;
}

// Função para download do PDF
export function downloadPDF(doc: jsPDF, filename: string): void {
    doc.save(filename)
}
