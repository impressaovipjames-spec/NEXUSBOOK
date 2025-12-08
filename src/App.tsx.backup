import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Zap, Sparkles, Loader2, Download, Key, CheckCircle } from 'lucide-react'
import logo from './assets/logo.png'
import { generateEbook } from './lib/gemini'
import type { MultiLanguageEbook } from './lib/gemini'
import { createPDF } from './lib/pdf'

const data = [
  { mes: 'Jan', temp: 78 },
  { mes: 'Fev', temp: 86 },
  { mes: 'Mar', temp: 92 },
  { mes: 'Abr', temp: 95 },
  { mes: 'Mai', temp: 99 },
  { mes: 'Jun', temp: 97 },
  { mes: 'Jul', temp: 99 },
]

export default function App() {
  const [topic, setTopic] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [showKeyInput, setShowKeyInput] = useState(false)
  const [ebookData, setEbookData] = useState<MultiLanguageEbook | null>(null)
  const [statusText, setStatusText] = useState('Iniciando motores...')

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key')
    if (storedKey) setApiKey(storedKey)
  }, [])

  const handleSaveKey = (key: string) => {
    setApiKey(key)
    localStorage.setItem('gemini_api_key', key)
    setShowKeyInput(false)
  }

  const handleGenerate = async () => {
    if (!apiKey) {
      setShowKeyInput(true)
      return
    }

    setLoading(true)
    setEbookData(null)

    try {
      setStatusText('Conectando com a Inteligência Artificial...')
      await new Promise(r => setTimeout(r, 1000)) // Efeito dramático

      setStatusText('Escrevendo capítulos em 4 idiomas...')
      const data = await generateEbook(apiKey, topic)

      setStatusText('Formatando PDFs profissionais...')
      await new Promise(r => setTimeout(r, 1000))

      setEbookData(data)
    } catch (error) {
      alert('Erro ao gerar: ' + error)
      setLoading(false)
    }
  }

  const downloadPDF = (lang: keyof MultiLanguageEbook) => {
    if (!ebookData) return
    const doc = createPDF(ebookData[lang])
    doc.save(`ebook-${lang}-${topic.replace(/\s+/g, '-').toLowerCase()}.pdf`)
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {/* MODAL DE API KEY */}
        {showKeyInput && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <div className="bg-gray-900 border border-purple-500/50 p-8 rounded-2xl max-w-md w-full shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                <Key className="text-yellow-400" /> Configuração Inicial
              </h3>
              <p className="text-gray-300 mb-6">
                Para gerar eBooks gratuitamente, cole sua chave da API do Google Gemini abaixo.
              </p>
              <input
                type="text"
                placeholder="Cole sua API Key aqui..."
                className="w-full bg-black/50 border border-gray-600 rounded-lg p-3 text-white mb-6 focus:border-purple-500 outline-none"
                onChange={(e) => handleSaveKey(e.target.value)}
              />
              <button
                onClick={() => setShowKeyInput(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {!loading && !ebookData ? (
          // TELA PRINCIPAL
          <motion.div
            key="main"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen bg-black text-white overflow-x-hidden"
          >
            {/* Header com sua marca */}
            <header className="relative h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 via-black to-black">
              <motion.img
                src={logo}
                alt="VIPNEXUS IA"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
                className="w-80 md:w-96 drop-shadow-2xl mb-8"
              />
              <motion.h1
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-6xl md:text-8xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-cyan-500"
              >
                NEXUSBOOK
              </motion.h1>
              <p className="text-2xl md:text-4xl mt-6 font-light opacity-90">
                Seu eBook profissional em 4 línguas com 1 clique
              </p>
            </header>

            {/* Gráfico */}
            <section className="max-w-7xl mx-auto px-8 py-24">
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 backdrop-blur-xl rounded-3xl p-12 border border-purple-500/30 shadow-2xl"
              >
                <div className="flex items-center gap-4 mb-10">
                  <Zap className="w-14 h-14 text-yellow-400 animate-pulse" />
                  <h2 className="text-5xl font-black">TEMPERATURA DOS NICHOS AGORA</h2>
                </div>
                <ResponsiveContainer width="100%" height={420}>
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="5 5" stroke="#ffffff15" />
                    <XAxis dataKey="mes" stroke="#fff" fontSize={20} />
                    <YAxis stroke="#fff" fontSize={18} />
                    <Tooltip contentStyle={{ background: '#000', border: '2px solid #ff0080', borderRadius: 16 }} />
                    <Line type="monotone" dataKey="temp" stroke="#ff0080" strokeWidth={8} dot={{ fill: '#ff0080', r: 14 }} />
                  </LineChart>
                </ResponsiveContainer>
              </motion.div>
            </section>

            {/* Input + Botão GIGANTE */}
            <section className="max-w-5xl mx-auto px-8 py-20 text-center">
              <motion.input
                initial={{ scale: 0.9, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: Como ganhar R$10.000/mês com IA em 2025"
                className="w-full px-12 py-10 text-3xl md:text-4xl rounded-3xl bg-white/10 backdrop-blur border-4 border-white/20 placeholder-white/60 focus:outline-none focus:border-cyan-400 transition-all mb-16 shadow-2xl"
              />

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGenerate}
                disabled={!topic}
                className="relative px-32 py-16 text-5xl md:text-7xl font-black rounded-3xl bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-500 disabled:opacity-50 shadow-2xl overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-8 justify-center">
                  <Sparkles className="w-20 h-20" />
                  GERAR EBOOK AGORA
                  <Sparkles className="w-20 h-20" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </motion.button>
            </section>

            <footer className="text-center py-16 text-white/60 text-xl">
              © 2025 VIPNEXUS IA • Feito com sangue, suor e amor pelos seus filhos
            </footer>
          </motion.div>
        ) : loading && !ebookData ? (
          // TELA DE CONSTRUÇÃO (cinematográfica)
          <motion.div
            key="building"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-black to-pink-900" />

            <motion.div
              initial={{ scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 1.2, type: "spring" }}
              className="text-center z-10"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="mb-16"
              >
                <img src={logo} alt="VIPNEXUS" className="w-96 mx-auto opacity-90" />
              </motion.div>

              <h1 className="text-6xl md:text-8xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 leading-tight mb-8">
                {statusText}
              </h1>

              <div className="mt-16 flex items-center justify-center gap-8">
                <Loader2 className="w-20 h-20 animate-spin text-cyan-400" />
                <p className="text-4xl text-white/80">Aguarde, a mágica está acontecendo...</p>
              </div>
            </motion.div>

            {/* Páginas voando */}
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ x: -2000, y: 800, rotate: -360 }}
                animate={{ x: 2000, y: -800, rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, delay: i * 1.5 }}
                className="absolute w-48 h-64 bg-gradient-to-br from-white/20 to-white/5 backdrop-blur border border-white/30 rounded-xl"
              />
            ))}
          </motion.div>
        ) : (
          // TELA DE SUCESSO
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-green-900/20 via-black to-black" />

            <CheckCircle className="w-32 h-32 text-green-500 mb-8 z-10" />

            <h1 className="text-6xl md:text-8xl font-black text-white mb-4 z-10 text-center">
              EBOOK PRONTO!
            </h1>
            <p className="text-2xl text-gray-400 mb-16 z-10 max-w-2xl text-center">
              Seu material foi gerado com sucesso em 4 idiomas. Baixe agora e comece a vender.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 z-10 w-full max-w-4xl">
              <button onClick={() => downloadPDF('pt')} className="flex items-center justify-center gap-4 bg-green-600 hover:bg-green-500 text-white p-8 rounded-2xl text-2xl font-bold transition-all hover:scale-105">
                <Download /> Versão Português (PT)
              </button>
              <button onClick={() => downloadPDF('en')} className="flex items-center justify-center gap-4 bg-blue-600 hover:bg-blue-500 text-white p-8 rounded-2xl text-2xl font-bold transition-all hover:scale-105">
                <Download /> English Version (EN)
              </button>
              <button onClick={() => downloadPDF('es')} className="flex items-center justify-center gap-4 bg-yellow-600 hover:bg-yellow-500 text-white p-8 rounded-2xl text-2xl font-bold transition-all hover:scale-105">
                <Download /> Versión Español (ES)
              </button>
              <button onClick={() => downloadPDF('fr')} className="flex items-center justify-center gap-4 bg-purple-600 hover:bg-purple-500 text-white p-8 rounded-2xl text-2xl font-bold transition-all hover:scale-105">
                <Download /> Version Française (FR)
              </button>
            </div>

            <button
              onClick={() => { setLoading(false); setEbookData(null); }}
              className="mt-16 text-white/50 hover:text-white underline z-10"
            >
              Criar outro eBook
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}