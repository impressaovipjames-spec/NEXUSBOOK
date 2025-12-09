import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Volume2, VolumeX, ZoomIn, ZoomOut } from 'lucide-react';

interface EbookViewerProps {
    ebookContent: {
        title: string;
        author: string;
        chapters: { title: string; content: string }[];
        coverImage?: string;
    };
    onClose: () => void;
}

export const EbookViewer: React.FC<EbookViewerProps> = ({ ebookContent, onClose }) => {
    const [currentPage, setCurrentPage] = useState(0);
    const [isFlipping, setIsFlipping] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [zoom, setZoom] = useState(1);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Preparar páginas do eBook
    const pages = [
        // Capa
        { type: 'cover', content: ebookContent },
        // Capítulos
        ...ebookContent.chapters.flatMap(chapter => ([
            { type: 'chapter-title', content: chapter.title },
            ...splitIntoPages(chapter.content)
        ]))
    ];

    useEffect(() => {
        // Criar elemento de áudio para o som de virar página
        if (!audioRef.current) {
            audioRef.current = new Audio();
            // Som de virar página (data URL do som)
            audioRef.current.src = createPageFlipSound();
        }
    }, []);

    const playPageFlipSound = () => {
        if (soundEnabled && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => { });
        }
    };

    const nextPage = () => {
        if (currentPage < pages.length - 1 && !isFlipping) {
            setIsFlipping(true);
            playPageFlipSound();
            setTimeout(() => {
                setCurrentPage(prev => prev + 1);
                setIsFlipping(false);
            }, 600);
        }
    };

    const prevPage = () => {
        if (currentPage > 0 && !isFlipping) {
            setIsFlipping(true);
            playPageFlipSound();
            setTimeout(() => {
                setCurrentPage(prev => prev - 1);
                setIsFlipping(false);
            }, 600);
        }
    };

    // Controles de teclado
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight') nextPage();
            if (e.key === 'ArrowLeft') prevPage();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [currentPage]);

    return (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-md flex items-center justify-center">
            {/* Controles Superiores */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between px-6 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                    <span className="text-white/80 text-sm font-medium">{ebookContent.title}</span>
                </div>

                <div className="flex items-center gap-3">
                    {/* Zoom */}
                    <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
                        className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                    >
                        <ZoomOut className="w-4 h-4 text-white" />
                    </button>
                    <span className="text-white/60 text-xs w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button
                        onClick={() => setZoom(Math.min(2, zoom + 0.1))}
                        className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                    >
                        <ZoomIn className="w-4 h-4 text-white" />
                    </button>

                    {/* Som */}
                    <button
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        className="w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
                    >
                        {soundEnabled ? (
                            <Volume2 className="w-4 h-4 text-white" />
                        ) : (
                            <VolumeX className="w-4 h-4 text-white/40" />
                        )}
                    </button>

                    {/* Progresso */}
                    <span className="text-white/60 text-sm">
                        {currentPage + 1} / {pages.length}
                    </span>
                </div>
            </div>

            {/* Área do Livro */}
            <div className="relative w-full h-full flex items-center justify-center p-20">
                <div
                    className="relative"
                    style={{
                        transform: `scale(${zoom})`,
                        transition: 'transform 0.3s ease'
                    }}
                >
                    {/* Livro com efeito 3D */}
                    <div className="relative w-[800px] h-[1000px] perspective-1000">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPage}
                                initial={{ rotateY: isFlipping ? (currentPage > 0 ? -90 : 90) : 0 }}
                                animate={{ rotateY: 0 }}
                                exit={{ rotateY: isFlipping ? 90 : 0 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                className="absolute inset-0 bg-gradient-to-br from-[#f8f7f4] to-[#e8e6e1] rounded-r-lg shadow-2xl overflow-hidden"
                                style={{
                                    transformStyle: 'preserve-3d',
                                    boxShadow: '0 0 100px rgba(0,0,0,0.3), inset -20px 0 50px rgba(0,0,0,0.1)'
                                }}
                            >
                                {renderPage(pages[currentPage])}
                            </motion.div>
                        </AnimatePresence>

                        {/* Sombra do livro */}
                        <div className="absolute -bottom-4 left-10 right-10 h-8 bg-black/20 blur-xl rounded-full" />
                    </div>
                </div>
            </div>

            {/* Botões de Navegação */}
            <button
                onClick={prevPage}
                disabled={currentPage === 0 || isFlipping}
                className="absolute left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition backdrop-blur-sm"
            >
                <ChevronLeft className="w-8 h-8 text-white" />
            </button>

            <button
                onClick={nextPage}
                disabled={currentPage === pages.length - 1 || isFlipping}
                className="absolute right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition backdrop-blur-sm"
            >
                <ChevronRight className="w-8 h-8 text-white" />
            </button>
        </div>
    );
};

// Renderizar conteúdo da página
function renderPage(page: any) {
    if (page.type === 'cover') {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center p-16 bg-gradient-to-br from-[#1e293b] to-[#0f172a]">
                {page.content.coverImage && (
                    <img src={page.content.coverImage} alt="Capa" className="w-full h-full object-cover absolute inset-0" />
                )}
                <div className="relative z-10 text-center">
                    <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">{page.content.title}</h1>
                    <p className="text-2xl text-white/80">{page.content.author}</p>
                </div>
            </div>
        );
    }

    if (page.type === 'chapter-title') {
        return (
            <div className="w-full h-full flex items-center justify-center p-16">
                <h2 className="text-5xl font-bold text-[#1e293b] text-center leading-tight">{page.content}</h2>
            </div>
        );
    }

    return (
        <div className="w-full h-full p-16 overflow-hidden">
            <div className="prose prose-lg max-w-none text-[#2d3748] leading-relaxed">
                {page.content}
            </div>
        </div>
    );
}

// Dividir conteúdo em páginas
function splitIntoPages(content: string): any[] {
    const wordsPerPage = 400;
    const words = content.split(' ');
    const pages = [];

    for (let i = 0; i < words.length; i += wordsPerPage) {
        pages.push({
            type: 'content',
            content: words.slice(i, i + wordsPerPage).join(' ')
        });
    }

    return pages;
}

// Criar som de virar página (usando Web Audio API)
function createPageFlipSound(): string {
    // Retorna um data URL de um som de papel
    // Em produção, use um arquivo MP3 real
    return 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
}
