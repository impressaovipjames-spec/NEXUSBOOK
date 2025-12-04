import { jsPDF } from "jspdf";
import type { EbookContent } from "./gemini";

export function createPDF(content: EbookContent): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let pageNumber = 1;

    // Função para adicionar número de página
    const addPageNumber = () => {
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text(
            `${pageNumber}`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
        );
        pageNumber++;
    };

    // ============ CAPA ============
    doc.setFillColor(88, 28, 135); // Purple-900
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Gradiente simulado com retângulos
    for (let i = 0; i < 50; i++) {
        const alpha = i / 50;
        const r = 88 + (219 - 88) * alpha;
        const g = 28 + (39 - 28) * alpha;
        const b = 135 + (132 - 135) * alpha;
        doc.setFillColor(r, g, b);
        doc.rect(0, i * (pageHeight / 50), pageWidth, pageHeight / 50, 'F');
    }

    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);

    const titleLines = doc.splitTextToSize(content.title.toUpperCase(), contentWidth - 20);
    let titleY = pageHeight / 3;
    titleLines.forEach((line: string) => {
        doc.text(line, pageWidth / 2, titleY, { align: "center" });
        titleY += 14;
    });

    // Subtítulo
    if (content.subtitle) {
        doc.setFontSize(18);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(220, 220, 220);
        const subtitleLines = doc.splitTextToSize(content.subtitle, contentWidth - 20);
        subtitleLines.forEach((line: string) => {
            doc.text(line, pageWidth / 2, titleY + 10, { align: "center" });
            titleY += 8;
        });
    }

    // Autor
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(content.author, pageWidth / 2, pageHeight - 60, { align: "center" });

    // Rodapé
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(200, 200, 200);
    doc.text("Gerado por NEXUSBOOK AI", pageWidth / 2, pageHeight - 40, { align: "center" });
    doc.text(`${content.language} • ${content.metadata.pageCount} páginas • ${content.metadata.readingTime}`,
        pageWidth / 2, pageHeight - 30, { align: "center" });

    // ============ PÁGINA DE INFORMAÇÕES ============
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("Sobre este eBook", margin, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);

    let infoY = 60;
    const info = [
        `Título: ${content.title}`,
        `Autor: ${content.author}`,
        `Idioma: ${content.language}`,
        `Páginas: ${content.metadata.pageCount}`,
        `Palavras: ${content.metadata.wordCount.toLocaleString()}`,
        `Tempo de leitura estimado: ${content.metadata.readingTime}`,
        `Capítulos: ${content.chapters.length}`,
        ``,
        `Este eBook foi gerado automaticamente usando`,
        `tecnologia de Inteligência Artificial de última geração.`,
        ``,
        `© ${new Date().getFullYear()} - Todos os direitos reservados.`
    ];

    info.forEach(line => {
        doc.text(line, margin, infoY);
        infoY += 7;
    });

    addPageNumber();

    // ============ SUMÁRIO ============
    doc.addPage();
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.setTextColor(0, 0, 0);
    doc.text("Sumário", margin, 40);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    let summaryY = 60;

    content.chapters.forEach((chapter) => {
        if (summaryY > pageHeight - 40) {
            doc.addPage();
            addPageNumber();
            summaryY = margin;
        }

        doc.setFont("helvetica", "bold");
        doc.text(`Capítulo ${chapter.number}`, margin, summaryY);

        doc.setFont("helvetica", "normal");
        const chapterTitleLines = doc.splitTextToSize(chapter.title, contentWidth - 30);
        chapterTitleLines.forEach((line: string) => {
            summaryY += 6;
            doc.text(line, margin + 5, summaryY);
        });

        summaryY += 10;
    });

    addPageNumber();

    // ============ CAPÍTULOS ============
    content.chapters.forEach((chapter) => {
        // Página de título do capítulo
        doc.addPage();
        doc.setFillColor(250, 250, 250);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Número do capítulo
        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(147, 51, 234); // Purple-600
        doc.text(`CAPÍTULO ${chapter.number}`, margin, 50);

        // Título do capítulo
        doc.setFontSize(28);
        doc.setTextColor(0, 0, 0);
        const chapterTitleLines = doc.splitTextToSize(chapter.title, contentWidth);
        let chapterTitleY = 70;
        chapterTitleLines.forEach((line: string) => {
            doc.text(line, margin, chapterTitleY);
            chapterTitleY += 12;
        });

        // Resumo do capítulo
        if (chapter.summary) {
            doc.setFont("helvetica", "italic");
            doc.setFontSize(12);
            doc.setTextColor(100, 100, 100);
            const summaryLines = doc.splitTextToSize(chapter.summary, contentWidth);
            summaryLines.forEach((line: string) => {
                doc.text(line, margin, chapterTitleY + 10);
                chapterTitleY += 6;
            });
        }

        addPageNumber();

        // Conteúdo do capítulo
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());
        let y = margin + 10;

        paragraphs.forEach((paragraph) => {
            const lines = doc.splitTextToSize(paragraph.trim(), contentWidth);

            lines.forEach((line: string) => {
                if (y > pageHeight - margin - 20) {
                    addPageNumber();
                    doc.addPage();
                    doc.setFillColor(255, 255, 255);
                    doc.rect(0, 0, pageWidth, pageHeight, 'F');
                    y = margin + 10;
                }

                doc.text(line, margin, y);
                y += 6;
            });

            y += 4; // Espaço entre parágrafos
        });

        addPageNumber();
    });

    // ============ PÁGINA FINAL ============
    doc.addPage();
    doc.setFillColor(88, 28, 135);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.text("Obrigado por ler!", pageWidth / 2, pageHeight / 2 - 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(14);
    doc.text("Este eBook foi criado com NEXUSBOOK AI", pageWidth / 2, pageHeight / 2 + 10, { align: "center" });
    doc.text("A revolução na criação de conteúdo digital", pageWidth / 2, pageHeight / 2 + 25, { align: "center" });

    return doc;
}
