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

    // Cores padrão ou personalizadas
    const colors = options?.colorTheme || {
        primary: '#7c3aed',
        secondary: '#a78bfa',
        accent: '#fbbf24'
    }

    const primaryRgb = hexToRgb(colors.primary)
    const secondaryRgb = hexToRgb(colors.secondary)

    let currentPage = 1
    const tocEntries: { title: string, page: number }[] = []

    // =====================
    // PÁGINA 1: CAPA
    // =====================

    // Fundo gradiente da capa
    for (let i = 0; i < pageHeight; i++) {
        const ratio = i / pageHeight
        const r = Math.round(primaryRgb.r + (secondaryRgb.r - primaryRgb.r) * ratio * 0.5)
        const g = Math.round(primaryRgb.g + (secondaryRgb.g - primaryRgb.g) * ratio * 0.5)
        const b = Math.round(primaryRgb.b + (secondaryRgb.b - primaryRgb.b) * ratio * 0.5)
        doc.setFillColor(r, g, b)
        doc.rect(0, i, pageWidth, 1, 'F')
    }

    // Elementos decorativos na capa (linhas sutis)
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(0.3)

    // Linha decorativa superior
    doc.setDrawColor(255, 255, 255)
    doc.setLineWidth(0.5)
    doc.line(margin, 40, pageWidth - margin, 40)

    // Título principal
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')

    // Ajustar tamanho do título baseado no comprimento
    let titleSize = 28
    if (ebook.title.length > 30) titleSize = 24
    if (ebook.title.length > 50) titleSize = 20

    doc.setFontSize(titleSize)
    const titleLines = splitTextToLines(doc, ebook.title.toUpperCase(), contentWidth)
    let titleY = pageHeight / 2 - (titleLines.length * titleSize * 0.4)

    for (const line of titleLines) {
        doc.text(line, pageWidth / 2, titleY, { align: 'center' })
        titleY += titleSize * 0.5
    }

    // Subtítulo
    if (ebook.subtitle) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(255, 255, 255)
        const subtitleLines = splitTextToLines(doc, ebook.subtitle, contentWidth)
        let subtitleY = titleY + 15
        for (const line of subtitleLines) {
            doc.text(line, pageWidth / 2, subtitleY, { align: 'center' })
            subtitleY += 7
        }
    }

    // Linha decorativa
    doc.setDrawColor(255, 255, 255)
    doc.line(pageWidth / 2 - 30, pageHeight - 70, pageWidth / 2 + 30, pageHeight - 70)

    // Autor
    doc.setFontSize(12)
    doc.setFont('helvetica', 'italic')
    doc.text(`por ${ebook.author}`, pageWidth / 2, pageHeight - 55, { align: 'center' })

    // Rodapé da capa
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Powered by NEXUSBOOK', pageWidth / 2, pageHeight - 20, { align: 'center' })

    currentPage++

    // =====================
    // PÁGINA 2: FOLHA DE ROSTO
    // =====================
    doc.addPage()
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    doc.setTextColor(30, 30, 30)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')

    const titleLines2 = splitTextToLines(doc, ebook.title, contentWidth)
    let y = 60
    for (const line of titleLines2) {
        doc.text(line, pageWidth / 2, y, { align: 'center' })
        y += 12
    }

    if (ebook.subtitle) {
        doc.setFontSize(14)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 100, 100)
        y += 10
        const subtitleLines = splitTextToLines(doc, ebook.subtitle, contentWidth)
        for (const line of subtitleLines) {
            doc.text(line, pageWidth / 2, y, { align: 'center' })
            y += 7
        }
    }

    doc.setFontSize(12)
    doc.setTextColor(50, 50, 50)
    y += 30
    doc.text(`Por ${ebook.author}`, pageWidth / 2, y, { align: 'center' })

    // Informações do livro
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    y = pageHeight - 60
    doc.text(`${ebook.metadata.pageCount} páginas | ${ebook.metadata.wordCount.toLocaleString()} palavras`, pageWidth / 2, y, { align: 'center' })
    y += 8
    doc.text(`Gerado em: ${new Date(ebook.metadata.generatedAt).toLocaleDateString('pt-BR')}`, pageWidth / 2, y, { align: 'center' })
    y += 16
    doc.setFontSize(9)
    doc.text('Este eBook foi criado com NEXUSBOOK - Gerador de eBooks com IA', pageWidth / 2, y, { align: 'center' })

    currentPage++
    tocEntries.push({ title: 'Folha de Rosto', page: currentPage })

    // =====================
    // PÁGINA 3: SUMÁRIO (placeholder, será atualizado depois)
    // =====================
    doc.addPage()
    const tocPageNumber = currentPage
    currentPage++

    // =====================
    // INTRODUÇÃO
    // =====================
    doc.addPage()
    tocEntries.push({ title: 'Introdução', page: currentPage })

    // Header da página
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    doc.rect(0, 0, pageWidth, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('INTRODUÇÃO', pageWidth / 2, 16, { align: 'center' })

    // Conteúdo da introdução
    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    let textY = 40
    const introLines = splitTextToLines(doc, ebook.introduction, contentWidth)

    for (const line of introLines) {
        if (textY > pageHeight - 30) {
            // Rodapé
            doc.setTextColor(150, 150, 150)
            doc.setFontSize(9)
            doc.text(`${currentPage}`, pageWidth / 2, pageHeight - 15, { align: 'center' })

            doc.addPage()
            currentPage++
            textY = 30
            doc.setTextColor(50, 50, 50)
            doc.setFontSize(11)
        }

        doc.text(line, margin, textY)
        textY += 6
    }

    // Rodapé
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(9)
    doc.text(`${currentPage}`, pageWidth / 2, pageHeight - 15, { align: 'center' })
    currentPage++

    // =====================
    // CAPÍTULOS
    // =====================
    for (let i = 0; i < ebook.chapters.length; i++) {
        const chapter = ebook.chapters[i]

        doc.addPage()
        tocEntries.push({ title: `Capítulo ${i + 1}: ${chapter.title}`, page: currentPage })

        // Header do capítulo
        doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
        doc.rect(0, 0, pageWidth, 35, 'F')

        doc.setTextColor(255, 255, 255)
        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text(`CAPÍTULO ${i + 1}`, pageWidth / 2, 14, { align: 'center' })

        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        const chapterTitleLines = splitTextToLines(doc, chapter.title, contentWidth - 20)
        let chapterTitleY = 26
        for (const line of chapterTitleLines.slice(0, 2)) {
            doc.text(line, pageWidth / 2, chapterTitleY, { align: 'center' })
            chapterTitleY += 8
        }

        // Conteúdo do capítulo
        doc.setTextColor(50, 50, 50)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(11)

        textY = 50
        const chapterLines = splitTextToLines(doc, chapter.content, contentWidth)

        for (const line of chapterLines) {
            if (textY > pageHeight - 30) {
                // Rodapé
                doc.setTextColor(150, 150, 150)
                doc.setFontSize(9)
                doc.text(`${currentPage}`, pageWidth / 2, pageHeight - 15, { align: 'center' })

                doc.addPage()
                currentPage++
                textY = 30
                doc.setTextColor(50, 50, 50)
                doc.setFontSize(11)
            }

            doc.text(line, margin, textY)
            textY += 6
        }

        // Rodapé
        doc.setTextColor(150, 150, 150)
        doc.setFontSize(9)
        doc.text(`${currentPage}`, pageWidth / 2, pageHeight - 15, { align: 'center' })
        currentPage++
    }

    // =====================
    // CONCLUSÃO
    // =====================
    doc.addPage()
    tocEntries.push({ title: 'Conclusão', page: currentPage })

    // Header
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    doc.rect(0, 0, pageWidth, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('CONCLUSÃO', pageWidth / 2, 16, { align: 'center' })

    // Conteúdo
    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    textY = 40
    const conclusionLines = splitTextToLines(doc, ebook.conclusion, contentWidth)

    for (const line of conclusionLines) {
        if (textY > pageHeight - 30) {
            doc.setTextColor(150, 150, 150)
            doc.setFontSize(9)
            doc.text(`${currentPage}`, pageWidth / 2, pageHeight - 15, { align: 'center' })

            doc.addPage()
            currentPage++
            textY = 30
            doc.setTextColor(50, 50, 50)
            doc.setFontSize(11)
        }

        doc.text(line, margin, textY)
        textY += 6
    }

    // Rodapé
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(9)
    doc.text(`${currentPage}`, pageWidth / 2, pageHeight - 15, { align: 'center' })
    currentPage++

    // =====================
    // SOBRE O AUTOR
    // =====================
    doc.addPage()
    tocEntries.push({ title: 'Sobre o Autor', page: currentPage })

    // Header
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    doc.rect(0, 0, pageWidth, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('SOBRE O AUTOR', pageWidth / 2, 16, { align: 'center' })

    // Conteúdo
    doc.setTextColor(50, 50, 50)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(11)

    const aboutLines = splitTextToLines(doc, ebook.aboutAuthor, contentWidth)
    textY = 50
    for (const line of aboutLines) {
        doc.text(line, margin, textY)
        textY += 7
    }

    // Mensagem final
    textY += 30
    doc.setFillColor(245, 245, 245)
    doc.roundedRect(margin, textY - 10, contentWidth, 50, 5, 5, 'F')

    doc.setTextColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Obrigado por ler!', pageWidth / 2, textY + 5, { align: 'center' })

    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text('Se este livro te ajudou de alguma forma,', pageWidth / 2, textY + 18, { align: 'center' })
    doc.text('considere deixar uma avaliação positiva!', pageWidth / 2, textY + 26, { align: 'center' })

    // Rodapé
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(9)
    doc.text(`${currentPage}`, pageWidth / 2, pageHeight - 15, { align: 'center' })

    // =====================
    // VOLTAR PARA PREENCHER O SUMÁRIO
    // =====================
    doc.setPage(tocPageNumber)
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, pageWidth, pageHeight, 'F')

    // Header do sumário
    doc.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b)
    doc.rect(0, 0, pageWidth, 25, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('SUMÁRIO', pageWidth / 2, 16, { align: 'center' })

    // Entradas do sumário
    doc.setTextColor(50, 50, 50)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')

    let tocY = 45
    for (const entry of tocEntries) {
        if (tocY > pageHeight - 30) break

        // Título
        const entryTitle = entry.title.length > 50
            ? entry.title.substring(0, 47) + '...'
            : entry.title
        doc.text(entryTitle, margin, tocY)

        // Número da página
        doc.text(entry.page.toString(), pageWidth - margin, tocY, { align: 'right' })

        // Linha pontilhada
        const titleWidth = doc.getTextWidth(entryTitle)
        const pageNumWidth = doc.getTextWidth(entry.page.toString())
        const dotsStart = margin + titleWidth + 5
        const dotsEnd = pageWidth - margin - pageNumWidth - 5

        doc.setDrawColor(200, 200, 200)
        doc.setLineDashPattern([1, 2], 0)
        doc.line(dotsStart, tocY - 1, dotsEnd, tocY - 1)
        doc.setLineDashPattern([], 0)

        tocY += 10
    }

    // Rodapé do sumário
    doc.setTextColor(150, 150, 150)
    doc.setFontSize(9)
    doc.text(`${tocPageNumber}`, pageWidth / 2, pageHeight - 15, { align: 'center' })

    return doc
}

// Função para download do PDF
export function downloadPDF(doc: jsPDF, filename: string): void {
    doc.save(filename)
}
