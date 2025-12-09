import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Send, Flame, Sparkles,
    Key, X, FileText,
    Loader2, MessageSquare, LayoutGrid
} from 'lucide-react';

// Logic Imports
import {
    chatWithAI,
    getInitialBriefingMessage,
    extractApprovedStructure,
    isStructureApproved,
    generateEbookContent
} from './lib/hybrid-ai';

// Type Imports
import type {
    EbookStructure,
    ChatMessage,
    MultiLanguageEbook
} from './lib/hybrid-ai';

import { nichosQuentes } from './lib/nichos';
import { templates, getTemplateByNicho } from './lib/templates';
import type { EbookTemplate } from './lib/templates'; // Import EbookTemplate as type
import { createPDF } from './lib/pdf';
import { getColorThemeForTema } from './lib/coverGenerator';

// --- INTERFACES ---
interface SidebarNichosProps {
    onSelectNicho: (nicho: string) => void;
    selectedTemplate: EbookTemplate | null;
}

interface RightPanelProps {
    history: { id: string; title: string; date: string; messages: ChatMessage[] }[];
    onLoadChat: (id: string) => void;
    handleNewChat: () => void;
    detectedStructure: EbookStructure | null;
    structureApproved: boolean;
    onGenerate: () => void;
    isGenerating: boolean;
    generationStatus: string;
    generationProgress: number;
    ebookData: MultiLanguageEbook | null;
    onDownload: (lang: keyof MultiLanguageEbook) => void;
}

interface ChatAreaProps {
    messages: ChatMessage[];
    // Removed unused setMessages
    onSendMessage: (text: string) => void;
    isThinking: boolean;
    chatEndRef: React.RefObject<HTMLDivElement | null>;
    onConfigApi: () => void;
    apiKey: string;
}

// =============================
// COLUNA ESQUERDA — TERMÔMETRO & NICHOS
// =============================
const SidebarNichos: React.FC<SidebarNichosProps> = ({ onSelectNicho, selectedTemplate }) => {
    return (
        <div className="h-full flex flex-col p-4 text-white bg-white/5 rounded-2xl shadow-xl border border-white/5 overflow-hidden">
            <h2 className="text-sm font-semibold mb-6 flex items-center gap-2 text-orange-400">
                <Flame className="w-4 h-4" />
                Nichos em Alta
            </h2>

            {/* Termômetro Visual com Labels */}
            <div className="flex gap-1 items-end justify-between h-[180px] px-1 mb-8">
                {nichosQuentes.slice(0, 6).map((n, i) => (
                    <div key={i} className="flex flex-col items-center h-full justify-end w-full group cursor-pointer" onClick={() => onSelectNicho(n.nome)}>

                        {/* Bar Container */}
                        <div className="w-full relative flex-1 flex items-end px-1">
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: `${(n.temperatura / 100) * 80}%` }} // Max 80% height
                                transition={{ duration: 0.6, delay: i * 0.1 }}
                                className="w-full rounded-t-sm shadow-lg group-hover:brightness-125 transition-all opacity-80 group-hover:opacity-100"
                                style={{
                                    background: "linear-gradient(to top, #F7D44C, #FF9A32, #FF4A24)",
                                    minHeight: '4px'
                                }}
                            >
                                {/* Hover Tooltip (Detalhado) */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 text-[10px] px-2 py-1 rounded-md border border-white/10 whitespace-nowrap z-20 pointer-events-none">
                                    <div className="font-bold text-orange-400">{n.nome}</div>
                                    <div className="text-white/60">{n.temperatura}° Temperatura</div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Label Abaixo da Barra */}
                        <div className="h-16 w-full flex items-start justify-center pt-2 border-t border-white/5">
                            <span className="text-[9px] text-white/50 group-hover:text-white transition-colors rotate-[-90deg] whitespace-nowrap origin-top w-[80px] mt-1 text-right">
                                {n.nome.length > 15 ? n.nome.substring(0, 15) + '...' : n.nome}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2 text-purple-400">
                <LayoutGrid className="w-4 h-4" />
                Templates
            </h2>
            <div className="flex-1 overflow-y-auto pr-1 space-y-2 custom-scrollbar">
                {templates.map((t) => (
                    <button
                        key={t.id}
                        onClick={() => onSelectNicho(t.nome.split(' ')[0])} // Simplificação para demo
                        className={`w-full text-left p-3 rounded-xl border transition-all text-xs group ${selectedTemplate?.id === t.id
                            ? "bg-purple-500/20 border-purple-500/50 text-white"
                            : "bg-white/5 border-transparent hover:bg-white/10 text-white/70"
                            }`}
                    >
                        <div className="font-medium group-hover:text-white mb-0.5 flex items-center gap-2">
                            <span>{t.icone}</span> {t.nome}
                        </div>
                        <div className="text-[10px] opacity-60 truncate">
                            {t.publicoAlvo}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
};

// =============================
// COLUNA DIREITA — HISTÓRICO & ESTRUTURA
// =============================
const RightPanel: React.FC<RightPanelProps> = ({
    history,
    onLoadChat,
    handleNewChat,
    detectedStructure,
    structureApproved,
    onGenerate,
    isGenerating,
    generationStatus,
    generationProgress,
    ebookData,
    onDownload
}) => {
    return (
        <div className="h-full flex flex-col gap-4">
            {/* ESTRUTURA CARD */}
            <div className="flex-1 flex flex-col p-4 text-white bg-white/5 rounded-2xl shadow-xl border border-white/5 overflow-hidden">
                <h2 className="text-sm font-semibold mb-4 flex items-center gap-2 text-green-400">
                    <FileText className="w-4 h-4" />
                    Estrutura do eBook
                </h2>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    {detectedStructure ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-3"
                        >
                            <div>
                                <div className="text-[10px] text-purple-400 uppercase font-bold tracking-wider mb-1">Título</div>
                                <div className="font-bold text-sm leading-snug">{detectedStructure.titulo}</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">Capítulos</div>
                                <div className="space-y-1">
                                    {detectedStructure.capitulos.map((cap, i) => (
                                        <div key={i} className="flex gap-2 text-xs py-1 border-b border-white/5 last:border-0 text-white/80">
                                            <span className="text-purple-500 font-mono w-4 font-bold">{i + 1}.</span>
                                            <span>{cap}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* STATUS DE GERAÇÃO */}
                            {isGenerating && (
                                <div className="mt-4 p-3 bg-black/40 rounded-xl border border-white/10">
                                    <div className="flex justify-between text-[10px] text-white/60 mb-1">
                                        <span>{generationStatus}</span>
                                        <span>{generationProgress}%</span>
                                    </div>
                                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            className="h-full bg-green-500"
                                            initial={{ width: 0 }}
                                            animate={{ width: `${generationProgress}%` }}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* DOWNLOADS */}
                            {ebookData && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-2">
                                    <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-2">Downloads Disponíveis</div>
                                    <button onClick={() => onDownload('pt')} className="w-full py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 rounded text-xs text-blue-300 flex items-center justify-center gap-2">
                                        🇧🇷 Português
                                    </button>
                                    <button onClick={() => onDownload('en')} className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 rounded text-xs text-purple-300 flex items-center justify-center gap-2">
                                        🇺🇸 English
                                    </button>
                                </motion.div>
                            )}

                        </motion.div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-30 p-4">
                            <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center mb-3">
                                <Sparkles className="w-6 h-6" />
                            </div>
                            <p className="text-sm font-medium">Aguardando Inteligência</p>
                            <p className="text-[10px] max-w-[140px] mt-1">Converse com a IA para estruturar seu best-seller.</p>
                        </div>
                    )}
                </div>

                <div className="mt-4 pt-4 border-t border-white/5">
                    <button
                        onClick={onGenerate}
                        disabled={!structureApproved || isGenerating}
                        className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${structureApproved
                            ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-[1.02] text-white shadow-lg shadow-green-900/20"
                            : "bg-white/5 text-white/30 cursor-not-allowed"
                            }`}
                    >
                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {structureApproved ? (isGenerating ? "Gerando..." : "Gerar eBook Completo") : "Aprovar Estrutura"}
                    </button>
                </div>
            </div>

            {/* HISTÓRICO CARD */}
            <div className="h-1/3 flex flex-col p-4 text-white bg-white/5 rounded-2xl shadow-xl border border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-sm font-semibold flex items-center gap-2 text-blue-400">
                        <MessageSquare className="w-4 h-4" />
                        Histórico
                    </h2>
                    <button
                        onClick={handleNewChat}
                        className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded hover:bg-blue-500/20 transition"
                    >
                        Nova
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                    {history.length === 0 ? (
                        <p className="text-xs text-center text-white/20 py-8">Nenhum projeto recente.</p>
                    ) : (
                        history.map((c) => (
                            <div
                                key={c.id}
                                onClick={() => onLoadChat(c.id)}
                                className="p-3 rounded-lg bg-white/5 hover:bg-[#16E0C1]/10 border border-transparent hover:border-[#16E0C1]/30 transition cursor-pointer group"
                            >
                                <div className="text-xs font-medium truncate group-hover:text-white/90 text-white/70">{c.title}</div>
                                <div className="text-[9px] text-white/30 mt-1">{c.date}</div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

// =============================
// CHAT AREA (CENTRAL)
// =============================
const ChatArea: React.FC<ChatAreaProps> = ({ messages, onSendMessage, isThinking, chatEndRef, onConfigApi, apiKey }) => {
    const [input, setInput] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        if (!input.trim() || isThinking) return;
        onSendMessage(input);
        setInput("");
        // Manter foco no input após enviar
        setTimeout(() => inputRef.current?.focus(), 0);
    };

    return (
        <div className="flex flex-col h-full bg-white/5 rounded-2xl shadow-2xl backdrop-blur-sm border border-white/5 overflow-hidden relative">
            {/* Header do Chat */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/20 shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#16E0C1] animate-pulse" />
                    <span className="text-sm font-medium text-white/90">Assistente Criativo</span>
                </div>
                {!apiKey && (
                    <button
                        onClick={onConfigApi}
                        className="text-[10px] flex items-center gap-1.5 bg-red-500/10 text-red-400 px-3 py-1.5 rounded-full border border-red-500/20 hover:bg-red-500/20 transition-colors"
                    >
                        <Key className="w-3 h-3" />
                        Configurar API
                    </button>
                )}
            </div>

            {/* Mensagens - ÁREA COM SCROLL PRÓPRIO */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-40">
                        <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-purple-500/20">
                            <span className="text-3xl font-bold text-white">N</span>
                        </div>
                        <p className="text-sm font-medium">Estou pronto para criar.</p>
                        <p className="text-xs mt-2">Escolha um nicho ou comece digitando.</p>
                    </div>
                ) : (
                    messages.map((msg, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.3 }}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-lg ${msg.role === 'user'
                                    ? "bg-[#7C3AED] text-white rounded-br-none"
                                    : "bg-[#1e2029] text-gray-100 border border-white/5 rounded-bl-none"
                                    }`}
                            >
                                <p className="whitespace-pre-wrap">{msg.content}</p>
                            </div>
                        </motion.div>
                    ))
                )}
                {isThinking && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                        <div className="bg-[#1e2029] border border-white/5 px-4 py-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-[#16E0C1]" />
                            <span className="text-xs text-white/50">Escrevendo...</span>
                        </div>
                    </motion.div>
                )}
                <div ref={chatEndRef} />
            </div>

            {/* Input Area - FIXO NO BOTTOM */}
            <div className="p-4 bg-black/20 border-t border-white/5 shrink-0">
                <div className="flex gap-2 relative">
                    <input
                        ref={inputRef}
                        className="flex-1 bg-[#13141a] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7C3AED] transition-colors placeholder:text-white/20"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Digite sua ideia ou comando..."
                        disabled={isThinking}
                        autoFocus
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isThinking}
                        className="px-4 bg-[#16E0C1] hover:bg-[#12c4a9] text-[#0F0B2A] rounded-xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#16E0C1]/20 font-bold"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// =============================
// DASHBOARD PRINCIPAL (SOLARIS)
// =============================
export default function App() {
    // --- ESTADOS GLOBAIS (Mantendo lógica original) ---
    const [apiKey, setApiKey] = useState("");
    const [showKeyModal, setShowKeyModal] = useState(false);
    const [keyInput, setKeyInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isThinking, setIsThinking] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<EbookTemplate | null>(null);
    const [detectedStructure, setDetectedStructure] = useState<EbookStructure | null>(null);
    const [structureApproved, setStructureApproved] = useState(false);
    const [history, setHistory] = useState<{ id: string, title: string, date: string, messages: ChatMessage[] }[]>([]);

    // Geração Reforçada
    const [generationStatus, setGenerationStatus] = useState('');
    const [generationProgress, setGenerationProgress] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [ebookData, setEbookData] = useState<MultiLanguageEbook | null>(null);

    // Refs
    // Initialize with null but cast to match the expected non-null MutableRefObject if needed, or simply let it behave as RefObject
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Carregar dados iniciais
    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) setApiKey(storedKey);

        const savedHistory = localStorage.getItem('nexus_chat_history');
        if (savedHistory) setHistory(JSON.parse(savedHistory));
    }, []);

    // Scroll Chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    // Detectar estrutura
    useEffect(() => {
        const structure = extractApprovedStructure(messages);
        if (structure) setDetectedStructure(structure);
        setStructureApproved(isStructureApproved(messages));
    }, [messages]);

    // --- LÓGICA DE NEGÓCIO ---

    const handleSaveKey = () => {
        if (keyInput.trim()) {
            setApiKey(keyInput.trim())
            localStorage.setItem('gemini_api_key', keyInput.trim())
            setShowKeyModal(false)
            setKeyInput('')
        }
    }

    const startChat = (template?: EbookTemplate) => {
        if (!apiKey) {
            setShowKeyModal(true)
            return
        }

        let templateContext = ''
        if (template) {
            setSelectedTemplate(template)
            templateContext = `O usuário selecionou o template "${template.nome}". \nEstrutura sugerida: ${template.estruturaSugerida.slice(0, 3).join(', ')}...`
        }

        const initialMessage = getInitialBriefingMessage(templateContext)
        setMessages([initialMessage])
    }

    const handleSendMessage = async (text: string) => {
        const userMessage: ChatMessage = { role: 'user', content: text }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setIsThinking(true)

        try {
            const response = await chatWithAI(apiKey, newMessages, selectedTemplate?.nome ? `Template: ${selectedTemplate.nome}` : undefined)
            setMessages([...newMessages, { role: 'assistant', content: response }])
        } catch (error: any) {
            console.error(error);
            const errorMessage = error.message || "Erro desconhecido na API.";
            setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${errorMessage}` }]);
        } finally {
            setIsThinking(false)
        }
    }

    const handleSelectNicho = (nichoNome: string) => {
        const template = getTemplateByNicho(nichoNome)
        if (template) setSelectedTemplate(template)

        if (messages.length > 0) {
            handleSendMessage(`Quero criar um eBook sobre "${nichoNome}"`)
            return
        } else {
            startChat(template || undefined)
            setTimeout(() => handleSendMessage(`Quero criar um eBook sobre "${nichoNome}"`), 500)
        }
    }

    const handleGenerate = async () => {
        if (!detectedStructure || !apiKey) return

        setIsGenerating(true)
        setGenerationProgress(0)
        setGenerationStatus('Iniciando geração...')

        try {
            const ebook = await generateEbookContent(
                apiKey,
                detectedStructure,
                (status, progress) => {
                    setGenerationStatus(status)
                    setGenerationProgress(progress)
                }
            )

            setEbookData(ebook)
        } catch (error) {
            console.error(error)
            alert('Erro ao gerar eBook: ' + error)
        } finally {
            setIsGenerating(false)
        }
    }

    const handleDownload = async (lang: keyof MultiLanguageEbook) => {
        if (!ebookData) return

        const colorTheme = getColorThemeForTema(detectedStructure?.titulo || '')
        const doc = await createPDF(ebookData[lang], { colorTheme })
        const filename = `${ebookData[lang].title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${lang}.pdf`
        doc.save(filename)
    }

    const loadChat = (chatId: string) => {
        const chat = history.find(h => h.id === chatId)
        if (chat) setMessages(chat.messages)
    }

    const handleNewChat = () => {
        setMessages([])
        setDetectedStructure(null)
        setStructureApproved(false)
        setSelectedTemplate(null)
        setEbookData(null)
        setIsGenerating(false)
        startChat()
    }


    return (
        <div className="min-h-screen bg-[#0F0B2A] text-white font-sans overflow-hidden flex flex-col">
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
            `}</style>

            {/* BACKGROUND DECORATION */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]" />
            </div>

            {/* HEADER */}
            <header className="h-16 px-6 flex items-center justify-between shrink-0 relative z-50">
                <div className="flex items-center gap-3">
                    <span className="text-2xl font-bold tracking-tight text-white drop-shadow-[0_0_15px_rgba(22,224,193,0.3)]">
                        NEXUS<span className="text-[#16E0C1]">BOOK</span>
                    </span>
                    {/* Versão removida conforme solicitado */}
                </div>

                {/* VIPNEXUS IA - BRANDING DESTAQUE */}
                <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-3">
                    <Sparkles className="w-5 h-5 text-[#16E0C1] animate-pulse" />
                    <span className="text-xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-white via-[#16E0C1] to-[#7C3AED] drop-shadow-[0_0_15px_rgba(124,58,237,0.5)]">
                        VIPNEXUS IA
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => setShowKeyModal(true)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${apiKey ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400 animate-pulse'}`}
                    >
                        <Key className="w-4 h-4" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-lg shadow-purple-500/20" />
                </div>
            </header>

            {/* MAIN GRID */}
            <main className="flex-1 p-6 pt-0 gap-6 grid grid-cols-12 h-[calc(100vh-64px)] overflow-hidden relative z-10">

                {/* ESQUERDA - 3 COLUNAS */}
                <div className="col-span-3 h-full overflow-hidden">
                    <SidebarNichos onSelectNicho={handleSelectNicho} selectedTemplate={selectedTemplate} />
                </div>

                {/* CENTRO - 6 COLUNAS */}
                <div className="col-span-6 h-full overflow-hidden">
                    <ChatArea
                        messages={messages}
                        // Removed unused setMessages prop
                        onSendMessage={handleSendMessage}
                        isThinking={isThinking}
                        chatEndRef={chatEndRef}
                        onConfigApi={() => setShowKeyModal(true)}
                        apiKey={apiKey}
                    />
                </div>

                {/* DIREITA - 3 COLUNAS */}
                <div className="col-span-3 h-full overflow-hidden">
                    <RightPanel
                        history={history}
                        onLoadChat={loadChat}
                        handleNewChat={handleNewChat}
                        detectedStructure={detectedStructure}
                        structureApproved={structureApproved}
                        onGenerate={handleGenerate}
                        isGenerating={isGenerating}
                        generationStatus={generationStatus}
                        generationProgress={generationProgress}
                        ebookData={ebookData}
                        onDownload={handleDownload}
                    />
                </div>
            </main>

            {/* MODAL API */}
            <AnimatePresence>
                {showKeyModal && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
                            className="bg-[#1e2029] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl"
                        >
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <Key className="w-5 h-5 text-[#16E0C1]" /> Configurar Acesso
                                </h3>
                                <button onClick={() => setShowKeyModal(false)} className="text-white/50 hover:text-white"><X className="w-5 h-5" /></button>
                            </div>
                            <input
                                type="text"
                                value={keyInput}
                                onChange={(e) => setKeyInput(e.target.value)}
                                placeholder="Cole sua API Key do Google Gemini aqui..."
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-[#16E0C1] focus:outline-none mb-4 font-mono"
                            />
                            <button onClick={handleSaveKey} className="w-full py-3 bg-[#16E0C1] hover:bg-[#12c4a9] text-[#0F0B2A] font-bold rounded-xl transition-all">
                                Salvar e Conectar
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
