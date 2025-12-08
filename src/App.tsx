import { useState, useEffect, useRef } from 'react'
import {
    Send, Flame, BookOpen, Sparkles, Download, Eye,
    Key, X, ChevronRight, FileText, ExternalLink,
    Loader2, CheckCircle2, MessageSquare, LayoutGrid
} from 'lucide-react'
import logo from './assets/logo.png'
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

    return (
        <div className="min-h-screen bg-[#080812]">
            {/* DEBUG TEST */}
            <div style={{ background: 'red', color: 'white', padding: '20px', fontSize: '24px', textAlign: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
                ⚠️ NEXUSBOOK v3.1 TEST - SE VOCÊ VER ISSO, O CÓDIGO NOVO ESTÁ FUNCIONANDO ⚠️
            </div>

            {/* Header */}
            <header className="h-14 border-b border-white/10 flex items-center justify-between px-4 mt-16">
                <div className="flex items-center gap-3">
                    <img src={logo} alt="NEXUSBOOK" className="h-8" />
                    <span className="font-bold text-lg">NEXUSBOOK</span>
                </div>

                <button
                    onClick={() => setShowKeyModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-sm transition-colors"
                >
                    <Key className="w-4 h-4" />
                    <span className="hidden sm:inline">
                        {apiKey ? 'API Key ✓' : 'Configurar API'}
                    </span>
                </button>
            </header>

            {/* Modal de API Key */}
            {showKeyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-[#12121f] border border-white/10 rounded-2xl p-6 max-w-md w-full">
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

                        <p className="text-xs text-white/40 mt-4 text-center">
                            Sua chave fica salva apenas no seu navegador 🔒
                        </p>
                    </div>
                </div>
            )}

            {/* FlipBook Viewer */}
            {viewingLang && ebookData && (
                <FlipBookViewer
                    ebook={ebookData[viewingLang]}
                    onClose={() => setViewingLang(null)}
                    onDownload={() => handleDownload(viewingLang)}
                    colorTheme={getColorThemeForTema(detectedStructure?.titulo || '')}
                />
            )}

            {/* Main Content */}
            <main className="h-[calc(100vh-56px)] p-3 overflow-hidden">

                {/* ESTADO: BRIEFING */}
                {appState === 'briefing' && (
                    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-3 dashboard-grid">

                        {/* Coluna Esquerda: Nichos e Templates */}
                        <div className="flex flex-col gap-3 overflow-hidden">
                            {/* Nichos Quentes */}
                            <div className="panel flex-1 min-h-0 flex flex-col">
                                <div className="panel-header">
                                    <Flame className="w-4 h-4 text-orange-400" />
                                    <span>Nichos Quentes</span>
                                </div>
                                <div className="panel-content flex-1 overflow-y-auto space-y-2">
                                    {nichosQuentes.slice(0, 6).map((nicho) => (
                                        <div
                                            key={nicho.nome}
                                            onClick={() => handleSelectNicho(nicho.nome)}
                                            className="niche-card"
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium">{nicho.nome}</span>
                                                <span className="text-xs text-orange-400 font-bold">
                                                    {nicho.temperatura}°
                                                </span>
                                            </div>
                                            <div className="niche-temp-bar">
                                                <div
                                                    className="niche-temp-fill"
                                                    style={{ width: `${nicho.temperatura}%` }}
                                                />
                                            </div>
                                            <div className="text-xs text-white/40 mt-1">
                                                {nicho.sugestaoPreco}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Templates */}
                            <div className="panel">
                                <div className="panel-header">
                                    <LayoutGrid className="w-4 h-4 text-purple-400" />
                                    <span>Templates</span>
                                </div>
                                <div className="panel-content grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                                    {templates.slice(0, 6).map((template) => (
                                        <button
                                            key={template.id}
                                            onClick={() => startChat(template)}
                                            className={`template-btn ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                                        >
                                            <span className="template-icon">{template.icone}</span>
                                            <span className="text-xs">{template.nome.split(' ')[0]}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Coluna Central: Chat */}
                        <div className="panel flex flex-col min-h-0 lg:col-span-1">
                            <div className="panel-header">
                                <MessageSquare className="w-4 h-4 text-cyan-400" />
                                <span>Chat com IA</span>
                                {isThinking && (
                                    <Loader2 className="w-4 h-4 animate-spin ml-auto text-purple-400" />
                                )}
                            </div>

                            <div className="chat-container flex-1 min-h-0">
                                <div className="chat-messages">
                                    {messages.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                                            <BookOpen className="w-12 h-12 text-white/20 mb-4" />
                                            <h3 className="font-medium mb-2">Vamos criar seu eBook!</h3>
                                            <p className="text-sm text-white/50 mb-4">
                                                Selecione um nicho quente ou template para começar
                                            </p>
                                            <button
                                                onClick={() => startChat()}
                                                className="btn btn-primary text-sm"
                                                disabled={!apiKey}
                                            >
                                                <Sparkles className="w-4 h-4" />
                                                Começar Conversa
                                            </button>
                                            {!apiKey && (
                                                <p className="text-xs text-orange-400 mt-2">
                                                    Configure sua API Key primeiro
                                                </p>
                                            )}
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((msg, i) => (
                                                <div
                                                    key={i}
                                                    className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                                                        }`}
                                                >
                                                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                                                </div>
                                            ))}
                                            {isThinking && (
                                                <div className="chat-bubble chat-bubble-ai">
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        <span className="text-sm">Pensando...</span>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={chatEndRef} />
                                        </>
                                    )}
                                </div>

                                {messages.length > 0 && (
                                    <div className="chat-input-container">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Digite sua mensagem..."
                                            className="chat-input"
                                            disabled={isThinking}
                                        />
                                        <button
                                            onClick={handleSendMessage}
                                            disabled={!chatInput.trim() || isThinking}
                                            className="btn btn-primary btn-icon"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Coluna Direita: Estrutura + Ações */}
                        <div className="flex flex-col gap-3 overflow-hidden">
                            {/* Estrutura Detectada */}
                            <div className="panel flex-1 min-h-0 flex flex-col">
                                <div className="panel-header">
                                    <FileText className="w-4 h-4 text-green-400" />
                                    <span>Estrutura do eBook</span>
                                </div>
                                <div className="panel-content flex-1 overflow-y-auto">
                                    {detectedStructure ? (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-xs text-white/50 mb-1">Título</p>
                                                <p className="font-medium text-sm">{detectedStructure.titulo}</p>
                                            </div>

                                            {detectedStructure.subtitulo && (
                                                <div>
                                                    <p className="text-xs text-white/50 mb-1">Subtítulo</p>
                                                    <p className="text-sm text-white/70">{detectedStructure.subtitulo}</p>
                                                </div>
                                            )}

                                            <div>
                                                <p className="text-xs text-white/50 mb-2">
                                                    Capítulos ({detectedStructure.capitulos.length})
                                                </p>
                                                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                                    {detectedStructure.capitulos.map((cap, i) => (
                                                        <div key={i} className="structure-item">
                                                            <span className="structure-number">{i + 1}</span>
                                                            <span className="text-xs truncate">{cap}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {structureApproved && (
                                                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                                                    <span className="text-sm text-green-400">Estrutura aprovada!</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-center p-4 text-white/40">
                                            <FileText className="w-10 h-10 mb-3 opacity-30" />
                                            <p className="text-sm">
                                                A estrutura do eBook aparecerá aqui quando a IA propor
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botão de Gerar */}
                            <div className="panel">
                                <div className="panel-content">
                                    <button
                                        onClick={handleGenerate}
                                        disabled={!structureApproved || !detectedStructure}
                                        className="btn btn-primary w-full text-lg py-4"
                                    >
                                        <Sparkles className="w-5 h-5" />
                                        GERAR EBOOK
                                        <ChevronRight className="w-5 h-5" />
                                    </button>

                                    {!structureApproved && detectedStructure && (
                                        <p className="text-xs text-center text-orange-400 mt-2">
                                            Aprove a estrutura no chat para continuar
                                        </p>
                                    )}

                                    {!detectedStructure && messages.length > 0 && (
                                        <p className="text-xs text-center text-white/40 mt-2">
                                            Continue a conversa até a IA propor a estrutura
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* ESTADO: GERANDO */}
                {appState === 'generating' && (
                    <div className="h-full flex items-center justify-center">
                        <div className="generation-status max-w-md w-full">
                            <div className="generation-spinner" />

                            <h2 className="text-2xl font-bold mb-2">
                                Gerando seu eBook...
                            </h2>

                            <p className="text-white/60 mb-6">
                                {generationStatus}
                            </p>

                            <div className="progress-bar w-full max-w-xs mx-auto mb-4">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${generationProgress}%` }}
                                />
                            </div>

                            <p className="text-sm text-white/40">
                                Criando conteúdo em 4 idiomas...
                            </p>
                        </div>
                    </div>
                )}

                {/* ESTADO: SUCESSO */}
                {appState === 'success' && ebookData && (
                    <div className="h-full overflow-y-auto">
                        <div className="max-w-4xl mx-auto py-8">
                            {/* Header de Sucesso */}
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8 text-white" />
                                </div>
                                <h1 className="text-3xl font-bold mb-2">eBook Criado com Sucesso!</h1>
                                <p className="text-white/60">
                                    Seu eBook está pronto em 4 idiomas. Baixe e comece a vender!
                                </p>
                            </div>

                            {/* Grid de Idiomas */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                {(['pt', 'en', 'es', 'fr'] as const).map((lang) => {
                                    const info = platformsInfo[lang]
                                    return (
                                        <div key={lang} className="lang-card">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="text-3xl">{info.flag}</span>
                                                <div>
                                                    <h3 className="font-bold">{info.name}</h3>
                                                    <p className="text-xs text-white/50">
                                                        {ebookData[lang].metadata.pageCount} páginas
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="text-xs text-white/50 mb-4">
                                                <p className="mb-1">Venda em:</p>
                                                <p className="text-white/70">{info.platforms.join(' • ')}</p>
                                            </div>

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setViewingLang(lang)}
                                                    className="btn btn-secondary flex-1 text-sm"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    Ver
                                                </button>
                                                <button
                                                    onClick={() => handleDownload(lang)}
                                                    className="btn btn-success flex-1 text-sm"
                                                >
                                                    <Download className="w-4 h-4" />
                                                    Baixar
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Guia de Venda */}
                            <div className="panel mb-6">
                                <div className="panel-header">
                                    <ExternalLink className="w-4 h-4 text-green-400" />
                                    <span>Próximos Passos - Comece a Vender</span>
                                </div>
                                <div className="panel-content space-y-3">
                                    <div className="guide-step">
                                        <span className="guide-step-number">1</span>
                                        <div>
                                            <p className="font-medium text-sm">Baixe os PDFs</p>
                                            <p className="text-xs text-white/50">
                                                Baixe todos os idiomas que deseja vender
                                            </p>
                                        </div>
                                    </div>

                                    <div className="guide-step">
                                        <span className="guide-step-number">2</span>
                                        <div>
                                            <p className="font-medium text-sm">Crie conta na plataforma</p>
                                            <p className="text-xs text-white/50">
                                                Hotmart, Amazon KDP ou Eduzz (gratuito)
                                            </p>
                                        </div>
                                    </div>

                                    <div className="guide-step">
                                        <span className="guide-step-number">3</span>
                                        <div>
                                            <p className="font-medium text-sm">Cadastre seu produto</p>
                                            <p className="text-xs text-white/50">
                                                Faça upload do PDF e defina o preço
                                            </p>
                                        </div>
                                    </div>

                                    <div className="guide-step">
                                        <span className="guide-step-number">4</span>
                                        <div>
                                            <p className="font-medium text-sm">Publique e divulgue</p>
                                            <p className="text-xs text-white/50">
                                                Compartilhe nas redes sociais e comece a vender!
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Preço Sugerido */}
                            {selectedTemplate && (
                                <div className="text-center p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-6">
                                    <p className="text-sm text-white/60 mb-1">Preço sugerido para este nicho:</p>
                                    <p className="text-2xl font-bold text-purple-400">
                                        {selectedTemplate.precoSugerido}
                                    </p>
                                </div>
                            )}

                            {/* Botão de Criar Outro */}
                            <div className="text-center">
                                <button
                                    onClick={handleReset}
                                    className="btn btn-primary"
                                >
                                    <Sparkles className="w-5 h-5" />
                                    Criar Outro eBook
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </main>
        </div>
    )
}
