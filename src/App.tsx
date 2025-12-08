import { useState, useEffect, useRef } from 'react'
import {
    Send, Flame, BookOpen, Sparkles, Download, Eye,
    Key, X, FileText,
    Loader2, CheckCircle2, MessageSquare, LayoutGrid
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

    // Carregar API Key do localStorage
    useEffect(() => {
        const stored = localStorage.getItem('gemini_api_key')
        if (stored) setApiKey(stored)
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

    // Recomeçar
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

    // Plataformas de venda
    const platformsInfo = {
        pt: { flag: '🇧🇷', name: 'Português', platforms: ['Hotmart', 'Eduzz', 'Amazon KDP'] },
        en: { flag: '🇺🇸', name: 'English', platforms: ['Amazon KDP', 'Gumroad', 'Payhip'] },
        es: { flag: '🇪🇸', name: 'Español', platforms: ['Hotmart', 'Amazon KDP'] },
        fr: { flag: '🇫🇷', name: 'Français', platforms: ['Amazon KDP', 'Gumroad'] }
    }

    // Histórico de Conversas
    const [history, setHistory] = useState<{ id: string, title: string, date: string, messages: ChatMessage[] }[]>([])

    // Carregar histórico
    useEffect(() => {
        const saved = localStorage.getItem('nexus_chat_history')
        if (saved) {
            setHistory(JSON.parse(saved))
        }
    }, [])

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
    }, [messages, detectedStructure])

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

    return (
        <div className="min-h-screen bg-[#080812] text-white flex flex-col overflow-hidden font-sans">
            {/* FORÇANDO O CSS AQUI PARA GARANTIR QUE CARREGUE */}
            <style>{`
                .dashboard-container {
                    display: grid;
                    grid-template-columns: 260px 1fr 300px;
                    gap: 12px;
                    height: calc(100vh - 64px);
                    padding: 12px;
                    overflow: hidden;
                }
                @media (max-width: 1200px) {
                    .dashboard-container { grid-template-columns: 220px 1fr 260px; }
                }
                @media (max-width: 1024px) {
                    .dashboard-container { grid-template-columns: 200px 1fr 240px; }
                }
                @media (max-width: 768px) {
                    .dashboard-container { 
                        display: flex; 
                        flex-direction: column; 
                        height: auto; 
                        overflow-y: auto;
                    }
                }
                
                .panel {
                    background: rgba(255, 255, 255, 0.03);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                }
                .panel-header {
                    padding: 12px;
                    background: rgba(255, 255, 255, 0.02);
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 14px;
                }
                .panel-content {
                    padding: 12px;
                    overflow-y: auto;
                    flex: 1;
                }
                
                /* Scrollbar */
                ::-webkit-scrollbar { width: 6px; height: 6px; }
                ::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
                ::-webkit-scrollbar-thumb { background: #4c1d95; border-radius: 3px; }
            `}</style>

            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-[#0f0f1a] shrink-0 z-10 box-border">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center font-bold text-white text-xl">N</div>
                        <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">NEXUSBOOK</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={handleNewChat}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium transition-colors"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Nova Conversa
                    </button>

                    <button
                        onClick={() => setShowKeyModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors text-white/70"
                    >
                        <Key className="w-4 h-4" />
                        {apiKey ? 'API Conectada' : 'Configurar API'}
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
                                API Key Google Gemini
                            </h3>
                            <button
                                onClick={() => setShowKeyModal(false)}
                                className="text-white/50 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-sm text-white/60 mb-4">
                            Cole sua chave da API do Google Gemini (gratuita):
                        </p>

                        <input
                            type="text"
                            value={keyInput}
                            onChange={(e) => setKeyInput(e.target.value)}
                            placeholder="AIzaSy..."
                            className="chat-input w-full mb-4"
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveKey()}
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowKeyModal(false)}
                                className="btn btn-secondary flex-1"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveKey}
                                className="btn btn-primary flex-1"
                                disabled={!keyInput.trim()}
                            >
                                Salvar
                            </button>
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

            {/* Main Content - Dashboard Layout */}
            <main className="dashboard-container">

                {/* COLUNA ESQUERDA: Nichos + Templates */}
                <div className="flex flex-col gap-3 overflow-hidden h-full">

                    {/* Nichos Quentes (Compacto) */}
                    <div className="panel h-1/3 min-h-[200px] flex flex-col">
                        <div className="panel-header">
                            <Flame className="w-4 h-4 text-orange-400" />
                            <span>Nichos em Alta</span>
                        </div>
                        <div className="panel-content flex-1 overflow-y-auto space-y-2">
                            {nichosQuentes.slice(0, 5).map((nicho) => (
                                <div
                                    key={nicho.nome}
                                    onClick={() => handleSelectNicho(nicho.nome)}
                                    className="niche-card py-2 px-3"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-medium truncate">{nicho.nome}</span>
                                        <span className="text-[10px] text-orange-400 font-bold">{nicho.temperatura}°</span>
                                    </div>
                                    <div className="niche-temp-bar h-1">
                                        <div className="niche-temp-fill" style={{ width: `${nicho.temperatura}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Templates */}
                    <div className="panel flex-1 flex flex-col">
                        <div className="panel-header">
                            <LayoutGrid className="w-4 h-4 text-purple-400" />
                            <span>Templates</span>
                        </div>
                        <div className="panel-content flex-1 overflow-y-auto grid grid-cols-1 gap-2">
                            {templates.map((template) => (
                                <button
                                    key={template.id}
                                    onClick={() => startChat(template)}
                                    className={`template-btn ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                                >
                                    <span className="template-icon text-lg">{template.icone}</span>
                                    <div className="flex flex-col items-start gap-0.5 min-w-0">
                                        <span className="text-xs font-medium truncate w-full">{template.nome}</span>
                                        <span className="text-[10px] text-white/40">{template.publicoAlvo}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUNA CENTRAL: Chat (Ocupa tudo se estiver "briefing" ou "generating") */}
                <div className="panel flex flex-col h-full overflow-hidden border-indigo-500/20 shadow-lg shadow-indigo-500/5">

                    {appState === 'briefing' ? (
                        <>
                            <div className="panel-header bg-white/5">
                                <MessageSquare className="w-4 h-4 text-cyan-400" />
                                <span>Assistente Criativo</span>
                                {isThinking && (
                                    <div className="flex items-center gap-2 ml-auto text-xs text-purple-300">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Processando...
                                    </div>
                                )}
                            </div>

                            <div className="chat-container flex-1 min-h-0 relative">
                                <div className="chat-messages p-4">
                                    {messages.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 h-full opacity-50">
                                            <BookOpen className="w-16 h-16 text-white/20 mb-4" />
                                            <h3 className="font-medium text-lg mb-2">Editor Vazio</h3>
                                            <p className="text-sm text-white/50 max-w-xs mx-auto">
                                                Escolha um template ao lado ou digite abaixo para começar seu eBook.
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg, i) => (
                                                <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
                                                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                                </div>
                                            ))}
                                            {isThinking && (
                                                <div className="chat-bubble chat-bubble-ai">
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span className="text-sm text-white/70">Escrevendo...</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={chatEndRef} />
                                        </>
                                    )}
                                </div>

                                <div className="chat-input-container bg-[#0f0f1a] p-4 border-t border-white/5">
                                    <input
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Digite aqui (ex: 'Quero um ebook sobre dietas')..."
                                        className="chat-input bg-[#1a1a2e]"
                                        disabled={isThinking}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!chatInput.trim() || isThinking}
                                        className="btn btn-primary btn-icon shrink-0"
                                    >
                                        <Send className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : appState === 'generating' ? (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                            <div className="generation-spinner w-20 h-20 mb-6" />
                            <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400">
                                Materializando seu eBook...
                            </h2>
                            <p className="text-white/60 mb-8 max-w-md mx-auto">{generationStatus}</p>
                            <div className="w-full max-w-md bg-white/5 rounded-full h-2 mb-2 overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-300" style={{ width: `${generationProgress}%` }} />
                            </div>
                            <p className="text-xs text-white/30">{generationProgress}% Concluído</p>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-green-500/10">
                                <CheckCircle2 className="w-10 h-10 text-green-400" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Pronto!</h2>
                            <p className="text-white/60 mb-8 max-w-lg mx-auto">
                                Seu eBook <strong>"{detectedStructure?.titulo}"</strong> foi criado com sucesso em 4 idiomas.
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                                {(['pt', 'en', 'es', 'fr'] as const).map(lang => (
                                    <div key={lang} className="bg-white/5 p-4 rounded-xl border border-white/10 hover:border-purple-500/50 transition-colors flex items-center justify-between group">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{platformsInfo[lang].flag}</span>
                                            <span className="font-medium text-sm">{platformsInfo[lang].name}</span>
                                        </div>
                                        <div className="flex gap-2 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setViewingLang(lang)} className="p-2 hover:bg-white/10 rounded-lg text-white/80"><Eye className="w-4 h-4" /></button>
                                            <button onClick={() => handleDownload(lang)} className="p-2 hover:bg-green-500/20 rounded-lg text-green-400"><Download className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={handleReset} className="mt-8 text-sm text-white/40 hover:text-white transition-colors flex items-center gap-2">
                                <Sparkles className="w-4 h-4" /> Criar novo eBook
                            </button>
                        </div>
                    )}
                </div>

                {/* COLUNA DIREITA: Histórico + Estrutura */}
                <div className="flex flex-col gap-3 overflow-hidden h-full">

                    {/* Histórico Recente */}
                    <div className="panel h-1/3 min-h-[200px] flex flex-col">
                        <div className="panel-header">
                            <MessageSquare className="w-4 h-4 text-blue-400" />
                            <span>Histórico</span>
                        </div>
                        <div className="panel-content flex-1 overflow-y-auto space-y-1">
                            {history.length === 0 ? (
                                <p className="text-xs text-white/30 text-center py-4">Nenhuma conversa salva</p>
                            ) : (
                                history.map(chat => (
                                    <div
                                        key={chat.id}
                                        onClick={() => loadChat(chat.id)}
                                        className="text-xs p-2 rounded-lg hover:bg-white/5 cursor-pointer flex flex-col gap-0.5 border border-transparent hover:border-white/10"
                                    >
                                        <span className="font-medium truncate text-white/80">{chat.title}</span>
                                        <span className="text-[10px] text-white/30">{chat.date}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Estrutura */}
                    <div className="panel flex-1 flex flex-col">
                        <div className="panel-header">
                            <FileText className="w-4 h-4 text-green-400" />
                            <span>Estrutura</span>
                        </div>
                        <div className="panel-content flex-1 overflow-y-auto p-4">
                            {detectedStructure ? (
                                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-white/40 mb-1">Título</p>
                                        <p className="font-bold text-sm leading-tight text-white/90">{detectedStructure.titulo}</p>
                                    </div>

                                    <div>
                                        <p className="text-[10px] uppercase tracking-wider text-white/40 mb-2">Capítulos</p>
                                        <div className="space-y-2">
                                            {detectedStructure.capitulos.map((cap, i) => (
                                                <div key={i} className="flex gap-2 text-xs">
                                                    <span className="font-mono text-purple-400/80">{(i + 1).toString().padStart(2, '0')}</span>
                                                    <span className="text-white/70 line-clamp-2">{cap}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {structureApproved && (
                                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
                                            <CheckCircle2 className="w-4 h-4 text-green-400" />
                                            <span className="text-xs text-green-400 font-medium">Aprovado para geração</span>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                                    <FileText className="w-8 h-8 mb-2" />
                                    <p className="text-xs">A estrutura aparecerá aqui</p>
                                </div>
                            )}
                        </div>
                        <div className="p-3 border-t border-white/5 bg-white/[0.02]">
                            <button
                                onClick={handleGenerate}
                                disabled={!structureApproved || !detectedStructure}
                                className="btn btn-primary w-full text-sm py-3 shadow-lg shadow-purple-900/20"
                            >
                                <Sparkles className="w-4 h-4" />
                                GERAR AGORA
                            </button>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    )
}
