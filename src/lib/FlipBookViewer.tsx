// FlipBook Viewer - Visualizador de eBook estilo livro real

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, BookOpen, Download } from 'lucide-react'
import type { EbookContent } from './gemini'

interface FlipBookViewerProps {
    ebook: EbookContent
    onClose: () => void
    onDownload?: () => void
    colorTheme?: {
        primary: string
        secondary: string
    }
}

interface BookPage {
    type: 'cover' | 'title' | 'toc' | 'intro' | 'chapter' | 'conclusion' | 'author'
    title?: string
    content?: string
    chapterNumber?: number
}

export function FlipBookViewer({ ebook, onClose, onDownload, colorTheme }: FlipBookViewerProps) {
    const [currentPage, setCurrentPage] = useState(0)
    const [direction, setDirection] = useState(0)

    // Construir páginas do livro
    const pages: BookPage[] = []

    // Capa
    pages.push({ type: 'cover' })

    // Folha de rosto
    pages.push({ type: 'title' })

    // Sumário
    pages.push({ type: 'toc' })

    // Introdução (pode ocupar múltiplas páginas)
    const introSections = splitIntoPages(ebook.introduction, 1500)
    introSections.forEach((content, index) => {
        pages.push({
            type: 'intro',
            title: index === 0 ? 'Introdução' : undefined,
            content
        })
    })

    // Capítulos
    ebook.chapters.forEach((chapter, index) => {
        const chapterSections = splitIntoPages(chapter.content, 1500)
        chapterSections.forEach((content, pageIndex) => {
            pages.push({
                type: 'chapter',
                title: pageIndex === 0 ? chapter.title : undefined,
                content,
                chapterNumber: index + 1
            })
        })
    })

    // Conclusão
    const conclusionSections = splitIntoPages(ebook.conclusion, 1500)
    conclusionSections.forEach((content, index) => {
        pages.push({
            type: 'conclusion',
            title: index === 0 ? 'Conclusão' : undefined,
            content
        })
    })

    // Sobre o autor
    pages.push({ type: 'author', content: ebook.aboutAuthor })

    const totalPages = pages.length

    const goToNext = () => {
        if (currentPage < totalPages - 1) {
            setDirection(1)
            setCurrentPage(prev => prev + 1)
        }
    }

    const goToPrev = () => {
        if (currentPage > 0) {
            setDirection(-1)
            setCurrentPage(prev => prev - 1)
        }
    }

    // Navegação por teclado
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') goToNext()
            if (e.key === 'ArrowLeft') goToPrev()
            if (e.key === 'Escape') onClose()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentPage])

    const primaryColor = colorTheme?.primary || '#7c3aed'
    const secondaryColor = colorTheme?.secondary || '#a78bfa'

    // Variantes de animação para efeito de virar página
    const pageVariants = {
        enter: (direction: number) => ({
            rotateY: direction > 0 ? 90 : -90,
            opacity: 0,
            scale: 0.95
        }),
        center: {
            rotateY: 0,
            opacity: 1,
            scale: 1
        },
        exit: (direction: number) => ({
            rotateY: direction < 0 ? 90 : -90,
            opacity: 0,
            scale: 0.95
        })
    }

    const renderPage = (page: BookPage, pageNumber: number) => {
        switch (page.type) {
            case 'cover':
                return (
                    <div
                        className="w-full h-full flex flex-col items-center justify-center text-white p-8 rounded-lg"
                        style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
                    >
                        <div className="text-center">
                            <h1 className="text-2xl md:text-4xl font-bold mb-4 leading-tight">
                                {ebook.title}
                            </h1>
                            {ebook.subtitle && (
                                <p className="text-sm md:text-lg opacity-90 mb-8">{ebook.subtitle}</p>
                            )}
                            <div className="w-16 h-0.5 bg-white/50 mx-auto mb-8" />
                            <p className="text-sm opacity-80">por {ebook.author}</p>
                        </div>
                    </div>
                )

            case 'title':
                return (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white text-gray-800 p-8 rounded-lg">
                        <h1 className="text-xl md:text-3xl font-bold text-center mb-4" style={{ color: primaryColor }}>
                            {ebook.title}
                        </h1>
                        {ebook.subtitle && (
                            <p className="text-sm md:text-base text-gray-600 text-center mb-8">{ebook.subtitle}</p>
                        )}
                        <p className="text-sm text-gray-500 mb-12">por {ebook.author}</p>
                        <div className="text-xs text-gray-400 text-center mt-auto">
                            <p>{ebook.metadata.pageCount} páginas</p>
                            <p>{ebook.metadata.wordCount.toLocaleString()} palavras</p>
                        </div>
                    </div>
                )

            case 'toc':
                return (
                    <div className="w-full h-full bg-white text-gray-800 p-6 rounded-lg overflow-auto">
                        <h2 className="text-lg font-bold mb-4 pb-2 border-b" style={{ color: primaryColor }}>
                            Sumário
                        </h2>
                        <ul className="space-y-2 text-sm">
                            <li className="flex justify-between">
                                <span>Introdução</span>
                                <span className="text-gray-400">4</span>
                            </li>
                            {ebook.chapters.map((chapter, i) => (
                                <li key={i} className="flex justify-between">
                                    <span className="truncate pr-4">
                                        <span className="text-gray-400 mr-2">{i + 1}.</span>
                                        {chapter.title}
                                    </span>
                                    <span className="text-gray-400">{5 + i * 3}</span>
                                </li>
                            ))}
                            <li className="flex justify-between">
                                <span>Conclusão</span>
                                <span className="text-gray-400">{pages.length - 2}</span>
                            </li>
                            <li className="flex justify-between">
                                <span>Sobre o Autor</span>
                                <span className="text-gray-400">{pages.length - 1}</span>
                            </li>
                        </ul>
                    </div>
                )

            case 'intro':
            case 'conclusion':
                return (
                    <div className="w-full h-full bg-white text-gray-800 p-6 rounded-lg overflow-auto">
                        {page.title && (
                            <h2
                                className="text-lg font-bold mb-4 pb-2 border-b"
                                style={{ color: primaryColor }}
                            >
                                {page.title}
                            </h2>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {page.content}
                        </p>
                        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                            {pageNumber}
                        </div>
                    </div>
                )

            case 'chapter':
                return (
                    <div className="w-full h-full bg-white text-gray-800 p-6 rounded-lg overflow-auto">
                        {page.title && (
                            <>
                                <div className="text-xs uppercase tracking-wider mb-1" style={{ color: primaryColor }}>
                                    Capítulo {page.chapterNumber}
                                </div>
                                <h2 className="text-lg font-bold mb-4 pb-2 border-b" style={{ color: primaryColor }}>
                                    {page.title}
                                </h2>
                            </>
                        )}
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                            {page.content}
                        </p>
                        <div className="absolute bottom-4 right-4 text-xs text-gray-400">
                            {pageNumber}
                        </div>
                    </div>
                )

            case 'author':
                return (
                    <div className="w-full h-full bg-white text-gray-800 p-6 rounded-lg overflow-auto">
                        <h2
                            className="text-lg font-bold mb-4 pb-2 border-b"
                            style={{ color: primaryColor }}
                        >
                            Sobre o Autor
                        </h2>
                        <p className="text-sm leading-relaxed mb-8">
                            {page.content}
                        </p>
                        <div
                            className="p-4 rounded-lg text-center"
                            style={{ backgroundColor: `${primaryColor}10` }}
                        >
                            <p className="font-medium mb-2" style={{ color: primaryColor }}>
                                Obrigado por ler!
                            </p>
                            <p className="text-xs text-gray-600">
                                Se este livro te ajudou, considere deixar uma avaliação positiva.
                            </p>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            {/* Container do livro */}
            <div
                className="relative max-w-2xl w-full"
                onClick={e => e.stopPropagation()}
            >
                {/* Botão de fechar */}
                <button
                    onClick={onClose}
                    className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors flex items-center gap-2"
                >
                    <span className="text-sm">Fechar</span>
                    <X className="w-5 h-5" />
                </button>

                {/* Livro */}
                <div
                    className="relative aspect-[3/4] w-full perspective-1000"
                    style={{ perspective: '1500px' }}
                >
                    <AnimatePresence initial={false} custom={direction} mode="wait">
                        <motion.div
                            key={currentPage}
                            custom={direction}
                            variants={pageVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                rotateY: { type: "spring", stiffness: 300, damping: 30 },
                                opacity: { duration: 0.2 },
                                scale: { duration: 0.2 }
                            }}
                            className="absolute inset-0 origin-center shadow-2xl rounded-lg overflow-hidden"
                            style={{
                                transformStyle: 'preserve-3d',
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1)'
                            }}
                        >
                            {renderPage(pages[currentPage], currentPage + 1)}
                        </motion.div>
                    </AnimatePresence>

                    {/* Efeito de sombra do livro */}
                    <div
                        className="absolute inset-y-0 left-0 w-4 pointer-events-none"
                        style={{
                            background: 'linear-gradient(to right, rgba(0,0,0,0.2), transparent)'
                        }}
                    />
                </div>

                {/* Controles de navegação */}
                <div className="flex items-center justify-between mt-6">
                    {/* Botão anterior */}
                    <button
                        onClick={goToPrev}
                        disabled={currentPage === 0}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm hidden sm:inline">Anterior</span>
                    </button>

                    {/* Indicador de página */}
                    <div className="flex items-center gap-3 text-white">
                        <BookOpen className="w-5 h-5 opacity-50" />
                        <span className="font-medium">
                            {currentPage + 1} / {totalPages}
                        </span>
                    </div>

                    {/* Botão próximo */}
                    <button
                        onClick={goToNext}
                        disabled={currentPage === totalPages - 1}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <span className="text-sm hidden sm:inline">Próximo</span>
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Botão de download */}
                {onDownload && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={onDownload}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium transition-all hover:scale-105"
                            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)` }}
                        >
                            <Download className="w-5 h-5" />
                            <span>Baixar PDF</span>
                        </button>
                    </div>
                )}

                {/* Dica de navegação */}
                <p className="text-center text-white/40 text-xs mt-4">
                    Use as setas do teclado ← → para navegar | ESC para fechar
                </p>
            </div>
        </motion.div>
    )
}

// Função auxiliar para dividir texto em páginas
function splitIntoPages(text: string, maxChars: number): string[] {
    if (!text) return ['']

    const pages: string[] = []
    const paragraphs = text.split('\n\n')
    let currentPage = ''

    for (const paragraph of paragraphs) {
        if ((currentPage + paragraph).length > maxChars && currentPage) {
            pages.push(currentPage.trim())
            currentPage = paragraph
        } else {
            currentPage += (currentPage ? '\n\n' : '') + paragraph
        }
    }

    if (currentPage) {
        pages.push(currentPage.trim())
    }

    return pages.length > 0 ? pages : ['']
}

export default FlipBookViewer
