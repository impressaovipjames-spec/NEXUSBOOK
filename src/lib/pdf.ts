import { jsPDF } from "jspdf";
import type { EbookContent } from "./gemini";

export function createPDF(content: EbookContent): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Capa
    doc.setFillColor(40, 40, 40); // Fundo escuro
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(30);

    // Título (com quebra de linha se necessário)
    const titleLines = doc.splitTextToSize(content.title.toUpperCase(), contentWidth);
    doc.text(titleLines, pageWidth / 2, pageHeight / 3, { align: "center" });

    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text(`Autor: ${content.author}`, pageWidth / 2, pageHeight / 2, { align: "center" });

    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text("Gerado por NEXUSBOOK AI", pageWidth / 2, pageHeight - 20, { align: "center" });

    // Conteúdo
    content.chapters.forEach((chapter, index) => {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, pageHeight, 'F'); // Fundo branco
        doc.setTextColor(0, 0, 0);

        // Título do Capítulo
        doc.setFont("helvetica", "bold");
        doc.setFontSize(24);
        doc.text(`Capítulo ${index + 1}`, margin, 40);

        doc.setFontSize(18);
        doc.setTextColor(100, 100, 100);
        const chapterTitleLines = doc.splitTextToSize(chapter.title, contentWidth);
        doc.text(chapterTitleLines, margin, 50);

        // Texto do Capítulo
        doc.setFont("times", "roman"); // Fonte mais legível para leitura
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        const textLines = doc.splitTextToSize(chapter.content, contentWidth);
        let y = 70 + (chapterTitleLines.length * 10);

        textLines.forEach((line: string) => {
            if (y > pageHeight - margin) {
                doc.addPage();
                y = margin;
            }
            doc.text(line, margin, y);
            y += 7; // Espaçamento entre linhas
        });
    });

    return doc;
}
