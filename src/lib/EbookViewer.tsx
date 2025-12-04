import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { EbookContent } from './gemini';

interface EbookViewerProps {
    ebook: EbookContent;
    onClose: () => void;
}

export function EbookViewer({ ebook, onClose }: EbookViewerProps) {
    const [currentPage, setCurrentPage] = useState(0);

    // Criar páginas do livro
    const pages = [
        // Capa
        {
            type: 'cover',
            content: (
                <div className="h-full bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex flex-col items-center justify-center p-12 text-white">
                    <h1 className="text-5xl font-black text-center mb-6 leading-tight">
                        {ebook.title}
                    </h1>
                    {ebook.subtitle && (
                        <h2 className="text-2xl text-center mb-12 opacity-90">
                            {ebook.subtitle}
                        </h2>
                    )}
                    <div className="mt-auto">
                        <p className="text-xl font-semibold">{ebook.author}</p>
                        <p className="text-sm opacity-75 mt-2">Gerado por NEXUSBOOK AI</p>
                    </div>
                </div>
            )
        },
        // Página de informações
        {
            type: 'info',
            content: (
                <div className="h-full bg-white p-12 flex flex-col justify-center">
                    <h3 className="text-3xl font-bold mb-8 text-gray-800">Sobre este eBook</h3>
                    <div className="space-y-4 text-gray-700">
                        <p><strong>Idioma:</strong> {ebook.language}</p>
                        <p><strong>Páginas:</strong> {ebook.metadata.pageCount}</p>
                        <p><strong>Palavras:</strong> {ebook.metadata.wordCount.toLocaleString()}</p>
                        <p><strong>Tempo de leitura:</strong> {ebook.metadata.readingTime}</p>
                        <p><strong>Capítulos:</strong> {ebook.chapters.length}</p>
                    </div>
                </div>
            )
        }
    ];

    // Adicionar capítulos
    ebook.chapters.forEach((chapter) => {
        // Página de título do capítulo
        pages.push({
            type: 'chapter-title',
            content: (
                <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 p-12 flex flex-col justify-center">
                    <div className="text-purple-600 text-xl font-semibold mb-4">
                        Capítulo {chapter.number}
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 mb-6">
                        {chapter.title}
                    </h2>
                    <p className="text-lg text-gray-600 italic">
                        {chapter.summary}
                    </p>
                </div>
            )
        });

        // Dividir conteúdo em páginas (aproximadamente 500 palavras por página)
        const paragraphs = chapter.content.split('\n\n').filter(p => p.trim());
        let currentPageContent: string[] = [];
        let wordCount = 0;

        paragraphs.forEach((para) => {
            const paraWords = para.split(/\s+/).length;

            if (wordCount + paraWords > 500 && currentPageContent.length > 0) {
                // Criar nova página
                pages.push({
                    type: 'content',
                    content: (
                        <div className="h-full bg-white p-12 overflow-auto">
                            <div className="prose prose-lg max-w-none">
                                {currentPageContent.map((p, i) => (
                                    <p key={i} className="mb-4 text-gray-800 leading-relaxed">
                                        {p}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )
                });
                currentPageContent = [para];
                wordCount = paraWords;
            } else {
                currentPageContent.push(para);
                wordCount += paraWords;
            }
        });

        // Adicionar última página do capítulo
        if (currentPageContent.length > 0) {
            pages.push({
                type: 'content',
                content: (
                    <div className="h-full bg-white p-12 overflow-auto">
                        <div className="prose prose-lg max-w-none">
                            {currentPageContent.map((p, i) => (
                                <p key={i} className="mb-4 text-gray-800 leading-relaxed">
                                    {p}
                                </p>
                            ))}
                        </div>
                    </div>
                )
            });
        }
    });

    const nextPage = () => {
        if (currentPage < pages.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const prevPage = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <div className="max-w-4xl w-full">
                {/* Livro */}
                <div className="relative bg-white shadow-2xl rounded-lg overflow-hidden" style={{ height: '80vh' }}>
                    {/* Página atual */}
                    <div className="h-full transition-all duration-500">
                        {pages[currentPage].content}
                    </div>

                    {/* Controles */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 flex items-center justify-between">
                        <button
                            onClick={prevPage}
                            disabled={currentPage === 0}
                            className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-full backdrop-blur transition-all"
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <div className="text-white text-sm font-semibold">
                            Página {currentPage + 1} de {pages.length}
                        </div>

                        <button
                            onClick={nextPage}
                            disabled={currentPage === pages.length - 1}
                            className="bg-white/20 hover:bg-white/30 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-full backdrop-blur transition-all"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>
                </div>

                {/* Botão fechar */}
                <button
                    onClick={onClose}
                    className="mt-6 w-full bg-white/10 hover:bg-white/20 text-white py-3 rounded-lg backdrop-blur transition-all"
                >
                    Fechar Preview
                </button>
            </div>
        </div>
    );
}
