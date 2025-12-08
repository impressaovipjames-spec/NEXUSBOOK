import { useState, useEffect, useRef } from 'react'
import {
    Send, Flame, BookOpen, Sparkles,
    Key, X, FileText,
    Loader2, MessageSquare, LayoutGrid
} from 'lucide-react'

import {
    chatWithAI,
    getInitialBriefingMessage,
    extractApprovedStructure,
    isStructureApproved,
    generateEbookContent
} from './lib/gemini'
import type { ChatMessage, EbookStructure, MultiLanguageEbook } from './lib/gemini'
import { createPDF } from './lib/pdf'
import { templates, getTemplateByNicho } from './lib/templates'
import type { EbookTemplate } from './lib/templates'
import { nichosQuentes } from './lib/nichos'
import { FlipBookViewer } from './lib/FlipBookViewer'
import { getColorThemeForTema } from './lib/coverGenerator'

type AppState = 'briefing' | 'generating' | 'success'

// NEXUSBOOK v3.1 - Build 20231207_2237 - Dashboard com Chat de Briefing
export default function App() {
    // Estado da aplicação
    const [appState, setAppState] = useState<AppState>('briefing')

    // API Key
    const [apiKey, setApiKey] = useState('')
    const [showKeyModal, setShowKeyModal] = useState(false)
    const [keyInput, setKeyInput] = useState('')

    // Chat e Briefing
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [chatInput, setChatInput] = useState('')
    const [isThinking, setIsThinking] = useState(false)
    const [selectedTemplate, setSelectedTemplate] = useState<EbookTemplate | null>(null)
    const [detectedStructure, setDetectedStructure] = useState<EbookStructure | null>(null)
    const [structureApproved, setStructureApproved] = useState(false)

    // Geração
    const [generationStatus, setGenerationStatus] = useState('')
    const [generationProgress, setGenerationProgress] = useState(0)

    // Resultado
    const [ebookData, setEbookData] = useState<MultiLanguageEbook | null>(null)
    const [viewingLang, setViewingLang] = useState<keyof MultiLanguageEbook | null>(null)

    // Refs
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Histórico de Conversas
    const [history, setHistory] = useState<{ id: string, title: string, date: string, messages: ChatMessage[] }[]>([])

    // Carregar API Key do localStorage
    useEffect(() => {
        const stored = localStorage.getItem('gemini_api_key')
        if (stored) setApiKey(stored)
    }, [])

    // Carregar histórico
    useEffect(() => {
        const saved = localStorage.getItem('nexus_chat_history')
        if (saved) {
            setHistory(JSON.parse(saved))
        }
    }, [])

    // Auto-scroll do chat
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // Detectar estrutura nas mensagens
    useEffect(() => {
        const structure = extractApprovedStructure(messages)
        if (structure) {
            setDetectedStructure(structure)
        }
        setStructureApproved(isStructureApproved(messages))
    }, [messages])

    // Salvar no histórico
    useEffect(() => {
        if (messages.length > 0) {
            const currentId = localStorage.getItem('current_chat_id') || Date.now().toString()
            localStorage.setItem('current_chat_id', currentId)

            const title = detectedStructure?.titulo || messages[0]?.content.slice(0, 30) || 'Novo eBook'

            const newHistoryItem = {
                id: currentId,
                title: title,
                date: new Date().toLocaleDateString(),
                messages: messages
            }

            const otherHistory = history.filter(h => h.id !== currentId)
            const newHistory = [newHistoryItem, ...otherHistory]

            setHistory(newHistory)
            localStorage.setItem('nexus_chat_history', JSON.stringify(newHistory))
        }
    }, [messages, detectedStructure]) // Removed 'history' from dependency array to avoid infinite loop if reference changes

    // Salvar API Key
    const handleSaveKey = () => {
        if (keyInput.trim()) {
            setApiKey(keyInput.trim())
            localStorage.setItem('gemini_api_key', keyInput.trim())
            setShowKeyModal(false)
            setKeyInput('')

            // Iniciar chat se ainda não começou
            if (messages.length === 0) {
                startChat()
            }
        }
    }

    // Iniciar chat
    const startChat = (template?: EbookTemplate) => {
        if (!apiKey) {
            setShowKeyModal(true)
            return
        }

        let templateContext = ''
        if (template) {
            setSelectedTemplate(template)
            templateContext = `O usuário selecionou o template "${template.nome}". 
Estrutura sugerida para este tipo: ${template.estruturaSugerida.slice(0, 3).join(', ')}...
Público-alvo típico: ${template.publicoAlvo}
Preço sugerido: ${template.precoSugerido}`
        }

        const initialMessage = getInitialBriefingMessage(templateContext)
        setMessages([initialMessage])
    }

    // Enviar mensagem
    const handleSendMessage = async () => {
        if (!chatInput.trim() || isThinking) return

        const userMessage: ChatMessage = { role: 'user', content: chatInput.trim() }
        const newMessages = [...messages, userMessage]
        setMessages(newMessages)
        setChatInput('')
        setIsThinking(true)

        try {
            const response = await chatWithAI(
                apiKey,
                newMessages,
                selectedTemplate ? `Template: ${selectedTemplate.nome}` : undefined
            )

            setMessages([...newMessages, { role: 'assistant', content: response }])
        } catch (error) {
            console.error(error)
            setMessages([
                ...newMessages,
                { role: 'assistant', content: '❌ Erro ao processar. Verifique sua API Key e tente novamente.' }
            ])
        } finally {
            setIsThinking(false)
        }
    }

    // Gerar eBook
    const handleGenerate = async () => {
        if (!detectedStructure || !apiKey) return

        setAppState('generating')
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
            setAppState('success')
        } catch (error) {
            console.error(error)
            alert('Erro ao gerar eBook: ' + error)
            setAppState('briefing')
        }
    }

    // Download PDF
    const handleDownload = async (lang: keyof MultiLanguageEbook) => {
        if (!ebookData) return

        const colorTheme = getColorThemeForTema(detectedStructure?.titulo || '')
        const doc = await createPDF(ebookData[lang], { colorTheme })
        const filename = `${ebookData[lang].title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${lang}.pdf`
        doc.save(filename)
    }

    // Selecionar nicho
    const handleSelectNicho = (nichoNome: string) => {
        const template = getTemplateByNicho(nichoNome)
        if (template) {
            setSelectedTemplate(template)
        }

        // Adicionar mensagem do usuário
        if (messages.length > 0) {
            const nichoMessage = `Quero criar um eBook sobre "${nichoNome}"`
            setChatInput(nichoMessage)
        } else {
            startChat(template || undefined)
            setTimeout(() => {
                setChatInput(`Quero criar um eBook sobre "${nichoNome}"`)
            }, 500)
        }
    }

    // Carregar conversa do histórico
    const loadChat = (chatId: string) => {
        const chat = history.find(h => h.id === chatId)
        if (chat) {
            setMessages(chat.messages)
            localStorage.setItem('current_chat_id', chat.id)
            // Tentar recuperar estrutura também se possível (simplificado aqui)
        }
    }

    // Novo Chat
    const handleNewChat = () => {
        setMessages([])
        setDetectedStructure(null)
        setStructureApproved(false)
        setEbookData(null)
        setSelectedTemplate(null)
        localStorage.removeItem('current_chat_id')
        startChat()
    }

    /*
    const handleReset = () => {
        setAppState('briefing')
        setMessages([])
        setDetectedStructure(null)
        setStructureApproved(false)
        setEbookData(null)
        setSelectedTemplate(null)
        setGenerationProgress(0)
        setGenerationStatus('')
    }
    */

    // UI Render
    return (
        <div className="h-screen w-full flex flex-col bg-[#0f1115] text-white overflow-hidden font-sans">
            <style>{`
                /* Layout Defaults & New Color Palette (Google AI Studio Inspired) */
                :root {
                    --bg-darker: #0f1115; /* Charcoal Black */
                    --bg-dark: #181b21;   /* Dark Zinc */
                    --bg-panel: #1e2229;  /* Panel Grey */
                    --border-subtle: rgba(255, 255, 255, 0.08);
                    --accent-primary: #3b82f6; /* Blue */
                    --accent-secondary: #8b5cf6; /* Purple */
                    --text-primary: #e2e8f0;
                    --text-secondary: #94a3b8;
                }

                .dashboard-container { display: flex; height: calc(100vh - 64px - 30px); gap: 16px; padding: 16px; background: var(--bg-darker); color: var(--text-primary); overflow: hidden; }
                
                .panel { 
                    background: var(--bg-panel); 
                    border: 1px solid var(--border-subtle); 
                    border-radius: 16px; 
                    display: flex; 
                    flex-direction: column; 
                    overflow: hidden; 
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }

                .panel-header { 
                    padding: 14px 18px; 
                    background: rgba(255, 255, 255, 0.02); 
                    border-bottom: 1px solid var(--border-subtle); 
                    font-weight: 600; 
                    font-size: 0.875rem; 
                    color: white; 
                    display: flex; 
                    items-center; 
                    gap: 10px; 
                    shrink: 0; 
                    letter-spacing: 0.01em;
                }

                .panel-content { flex: 1; overflow-y: auto; scrollbar-width: thin; scrollbar-color: #4b5563 #1f2937; }
                
                /* Styled Scrollbar */
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: #6b7280; }

                /* NICHE CARDS */
                .niche-card {
                    padding: 12px;
                    border-radius: 8px;
                    border: 1px solid transparent;
                    background: transparent;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    margin-bottom: 4px;
                }
                .niche-card:hover {
                    background: rgba(255, 255, 255, 0.04);
                    border-color: rgba(255, 255, 255, 0.1);
                    transform: translateX(2px);
                }

                /* TEMPLATE CARDS */
                .template-btn-compact { 
                    width: 100%; 
                    text-align: left; 
                    padding: 12px; 
                    border-bottom: 1px solid var(--border-subtle);
                    transition: all 0.2s; 
                    display: flex; 
                    items-center; 
                    gap: 12px; 
                    background: transparent; 
                    color: var(--text-secondary); 
                }
                .template-btn-compact:hover { background: rgba(59, 130, 246, 0.05); color: white; }
                .template-btn-compact.selected { background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; }
                .template-btn-compact:last-child { border-bottom: none; }

                /* Chat */
                .chat-area { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 16px; background: #13151a; }
                .chat-input-area { padding: 16px; background: var(--bg-panel); border-top: 1px solid var(--border-subtle); }
                
                .chat-bubble-user { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; border-radius: 12px 12px 2px 12px; padding: 12px 16px; }
                .chat-bubble-ai { background: #27272a; border: 1px solid var(--border-subtle); color: #e2e8f0; border-radius: 12px 12px 12px 2px; padding: 12px 16px; }

                /* Footer */
                .app-footer {
                    height: 30px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 10px;
                    color: var(--text-secondary);
                    border-top: 1px solid var(--border-subtle);
                    background: var(--bg-darker);
                    letter-spacing: 1px;
                    text-transform: uppercase;
                }
            `}</style>

            {/* Header - Fixed & Styled */}
            <header className="h-16 flex items-center justify-between px-6 bg-[#0f1115] border-b border-white/5 shrink-0 relative z-50">
                <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <span className="font-bold text-white text-lg">N</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight text-white hidden md:block">NEXUSBOOK</span>
                </div>

                <h1 className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-medium text-white/40 text-sm tracking-widest uppercase hidden lg:block">
                    VIPNEXUS IA
                </h1>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleNewChat}
                        className="h-9 px-4 rounded-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wide transition-all shadow-lg shadow-blue-900/20 flex items-center gap-2"
                    >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Nova Conversa</span>
                    </button>

                    <button
                        onClick={() => setShowKeyModal(true)}
                        className={`h-9 px-4 rounded-full border flex items-center gap-2 text-xs font-medium transition-all ${apiKey ? 'border-green-500/30 text-green-400 bg-green-500/10' : 'border-white/10 text-gray-400 hover:bg-white/5'}`}
                    >
                        <Key className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{apiKey ? 'API Conectada' : 'Configurar API'}</span>
                    </button>
                </div>
            </header>

            {/* Modal de API Key */}
            {showKeyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#12121f] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                <Key className="w-5 h-5 text-yellow-400" />
                                Configurar Google Gemini
                            </h3>
                            <button onClick={() => setShowKeyModal(false)} className="text-white/50 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <p className="text-sm text-white/60 mb-4">Cole sua chave da API do Google Gemini (gratuita):</p>
                        <input
                            type="text"
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            placeholder="Cole sua chave AIzaSy... aqui"
                            className="w-full bg-[#080812] border border-white/10 rounded-lg p-3 text-sm text-white focus:border-purple-500 focus:outline-none mb-4"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowKeyModal(false)} className="flex-1 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm">Cancelar</button>
                            <button onClick={handleSaveKey} className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold">Salvar Chave</button>
                        </div>
                    </div>
                </div>
            )}

            {/* FlipBook Viewer Overlay */}
            {viewingLang && ebookData && (
                <FlipBookViewer
                    ebook={ebookData[viewingLang]}
                    onClose={() => setViewingLang(null)}
                    onDownload={() => handleDownload(viewingLang)}
                    colorTheme={getColorThemeForTema(detectedStructure?.titulo || '')}
                />
            )}

            {/* Main Dashboard */}
            <main className="dashboard-container">
                {/* COLUNA ESQUERDA: Nichos + Templates */}
                <div className="flex flex-col gap-3 h-full overflow-hidden w-1/4 min-w-[250px] max-w-[350px]">
                    <div className="panel h-1/3 min-h-[180px]">
                        <div className="panel-header">
                            <Flame className="w-3 h-3 text-orange-400" />
                            Nichos em Alta
                        </div>
                        <div className="panel-content overflow-hidden p-4 flex items-end justify-between gap-2 h-full">
                            {nichosQuentes.slice(0, 5).map((nicho) => (
                                <div
                                    key={nicho.nome}
                                    onClick={() => handleSelectNicho(nicho.nome)}
                                    className="group flex flex-col items-center justify-end w-full cursor-pointer h-full relative"
                                >
                                    <div className="mb-2 text-[10px] text-white/50 group-hover:text-white font-medium text-center leading-tight w-full truncate px-1 transition-colors z-10">
                                        {nicho.nome.split(' ')[0]} {/* Show only first word for space */}
                                    </div>
                                    <div className="w-full bg-white/5 rounded-t-lg relative overflow-hidden transition-all group-hover:bg-white/10" style={{ height: '80%' }}>
                                        <div
                                            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-orange-600 to-yellow-400 rounded-t-lg transition-all duration-1000 ease-out group-hover:from-orange-500 group-hover:to-yellow-300"
                                            style={{ height: `${nicho.temperatura}%` }}
                                        />
                                        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-black/60">{nicho.temperatura}°</span>
                                    </div>
                                    {/* Tooltip on hover for full name */}
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none transition-opacity">
                                        {nicho.nome}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="panel flex-1">
                        <div className="panel-header">
                            <LayoutGrid className="w-3 h-3 text-purple-400" />
                            Templates
                        </div>
                        <div className="panel-content overflow-y-auto p-0">
                            {templates.map((template) => (
                                <button key={template.id} onClick={() => startChat(template)} className={`template-btn-compact ${selectedTemplate?.id === template.id ? 'selected' : ''}`}>
                                    <span className="text-xl">{template.icone}</span>
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="text-sm font-medium truncate">{template.nome}</span>
                                        <span className="text-[10px] text-white/40 truncate">{template.publicoAlvo}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUNA CENTRAL: Chat */}
                <div className="panel h-full flex-1 border-t-2 border-t-purple-500">
                    <div className="panel-header bg-[#151520]">
                        <MessageSquare className="w-3 h-3 text-cyan-400" />
                        Assistente Criativo
                        {isThinking && <span className="ml-auto text-xs text-purple-300 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Criando...</span>}
                        {appState === 'generating' && (
                            <span className="ml-auto text-xs text-green-400 flex items-center gap-2">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                {generationStatus} ({generationProgress}%)
                            </span>
                        )}
                    </div>

                    <div className="chat-area">
                        {messages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-8">
                                <BookOpen className="w-12 h-12 mb-4 text-white/20" />
                                <p className="text-sm">Selecione um nicho/template ao lado<br />ou digite abaixo para começar.</p>
                            </div>
                        ) : (
                            messages.map((msg, i) => (
                                <div key={i} className={`max-w-[85%] ${msg.role === 'user' ? 'self-end chat-bubble-user' : 'self-start chat-bubble-ai'}`}>
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</div>
                                </div>
                            ))
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <div className="chat-input-area">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Descreva seu eBook..."
                                className="flex-1 bg-[#080812] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 focus:outline-none"
                                disabled={isThinking}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={!chatInput.trim() || isThinking}
                                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl w-12 flex items-center justify-center transition-colors"
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* COLUNA DIREITA: Histórico + Estrutura */}
                <div className="flex flex-col gap-3 h-full overflow-hidden w-1/4 min-w-[250px] max-w-[350px]">
                    <div className="panel h-1/3 min-h-[150px]">
                        <div className="panel-header">
                            <MessageSquare className="w-3 h-3 text-blue-400" />
                            Histórico
                        </div>
                        <div className="panel-content overflow-y-auto p-2 space-y-1">
                            {history.length === 0 ? (
                                <p className="text-xs text-center text-white/30 py-4">Vazio</p>
                            ) : (
                                history.map(chat => (
                                    <div key={chat.id} onClick={() => loadChat(chat.id)} className="p-2 rounded hover:bg-white/5 cursor-pointer text-xs border border-transparent hover:border-white/10">
                                        <div className="font-medium truncate text-white/80">{chat.title}</div>
                                        <div className="text-[10px] text-white/30">{chat.date}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="panel flex-1 flex flex-col">
                        <div className="panel-header justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-3 h-3 text-green-400" />
                                Estrutura do eBook
                            </div>
                            {detectedStructure && <span className="text-[10px] bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full border border-green-500/20">Pronto</span>}
                        </div>
                        <div className="panel-content overflow-y-auto p-0 bg-[#0f1115]/50 flex-1">
                            {detectedStructure ? (
                                <div className="space-y-3">
                                    <div>
                                        <div className="text-[10px] text-purple-400 mb-0.5 font-bold uppercase">Título</div>
                                        <div className="text-sm font-bold leading-snug">{detectedStructure.titulo}</div>
                                    </div>
                                    <div>
                                        <div className="text-[10px] text-white/40 mb-1 font-bold uppercase">Capítulos</div>
                                        {detectedStructure.capitulos.map((cap, i) => (
                                            <div key={i} className="flex gap-2 text-xs py-1 border-b border-white/5 last:border-0">
                                                <span className="text-purple-500 font-mono w-4">{i + 1}</span>
                                                <span className="text-white/70">{cap}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!structureApproved}
                                        className="w-full mt-2 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:bg-white/10 rounded-lg text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 transition-all"
                                    >
                                        <Sparkles className="w-3 h-3" />
                                        {structureApproved ? 'Gerar eBook' : 'Aprove no Chat'}
                                    </button>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-20 space-y-4 p-8">
                                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium text-white/50">Aguardando Briefing</p>
                                        <p className="text-[10px] max-w-[150px] mx-auto">Converse com a IA para gerar a estrutura automaticamente aqui.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </main>

            {/* FOOTER ASSINATURA */}
            <footer className="app-footer">
                By Antigravity - UM PRESENTE PRA MEU AMIGO QUE QUER VENCER NA VIDA COM IA
            </footer>
        </div>
    )
}
