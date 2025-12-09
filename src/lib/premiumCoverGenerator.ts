// Gerador de Capas PREMIUM com Canvas HTML
// Cria capas profissionais sem depender de APIs externas

export interface PremiumCoverOptions {
    titulo: string;
    subtitulo?: string;
    autor: string;
    tema: string;
    corPrincipal?: string;
    corSecundaria?: string;
}

// Paletas de cores premium por categoria
const COLOR_PALETTES = {
    negocios: {
        bg: ['#0f172a', '#1e293b'],
        accent: '#3b82f6',
        text: '#ffffff'
    },
    saude: {
        bg: ['#064e3b', '#065f46'],
        accent: '#10b981',
        text: '#ffffff'
    },
    autoajuda: {
        bg: ['#581c87', '#6b21a8'],
        accent: '#a78bfa',
        text: '#ffffff'
    },
    financas: {
        bg: ['#1e3a8a', '#1e40af'],
        accent: '#22c55e',
        text: '#ffffff'
    },
    tecnologia: {
        bg: ['#111827', '#1f2937'],
        accent: '#06b6d4',
        text: '#ffffff'
    },
    relacionamentos: {
        bg: ['#9f1239', '#be123c'],
        accent: '#fb7185',
        text: '#ffffff'
    },
    culinaria: {
        bg: ['#7c2d12', '#9a3412'],
        accent: '#f97316',
        text: '#ffffff'
    },
    default: {
        bg: ['#1e1b4b', '#312e81'],
        accent: '#8b5cf6',
        text: '#ffffff'
    }
};

function detectCategory(tema: string): keyof typeof COLOR_PALETTES {
    const temaLower = tema.toLowerCase();

    if (temaLower.includes('negócio') || temaLower.includes('empreend')) return 'negocios';
    if (temaLower.includes('saúde') || temaLower.includes('fitness')) return 'saude';
    if (temaLower.includes('finança') || temaLower.includes('dinheiro')) return 'financas';
    if (temaLower.includes('amor') || temaLower.includes('relaciona')) return 'relacionamentos';
    if (temaLower.includes('culinária') || temaLower.includes('receita')) return 'culinaria';
    if (temaLower.includes('tecnologia') || temaLower.includes('ia')) return 'tecnologia';

    return 'default';
}

export async function generatePremiumCover(options: PremiumCoverOptions): Promise<string> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    // Dimensões da capa (proporção eBook padrão)
    canvas.width = 1600;
    canvas.height = 2400;

    const category = detectCategory(options.tema);
    const palette = COLOR_PALETTES[category];

    // ===== BACKGROUND GRADIENT =====
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, palette.bg[0]);
    gradient.addColorStop(1, palette.bg[1]);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // ===== DECORATIVE ELEMENTS =====
    // Círculos decorativos com transparência
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(1200, 300, 400, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(200, 2000, 300, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // ===== ACCENT LINE =====
    ctx.fillStyle = palette.accent;
    ctx.fillRect(100, 800, 1400, 8);

    // ===== TITULO =====
    ctx.fillStyle = palette.text;
    ctx.font = 'bold 140px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';

    // Quebrar título em múltiplas linhas se necessário
    const maxWidth = 1300;
    const words = options.titulo.toUpperCase().split(' ');
    let lines: string[] = [];
    let currentLine = '';

    words.forEach(word => {
        const testLine = currentLine + (currentLine ? ' ' : '') + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
            lines.push(currentLine);
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    lines.push(currentLine);

    // Desenhar título
    const titleStartY = 1000;
    lines.forEach((line, i) => {
        ctx.fillText(line, canvas.width / 2, titleStartY + (i * 160));
    });

    // ===== SUBTITULO =====
    if (options.subtitulo) {
        ctx.font = '60px Inter, Arial, sans-serif';
        ctx.fillStyle = palette.accent;
        const subtitleY = titleStartY + (lines.length * 160) + 100;
        ctx.fillText(options.subtitulo.toUpperCase(), canvas.width / 2, subtitleY);
    }

    // ===== AUTOR =====
    ctx.font = 'bold 70px Inter, Arial, sans-serif';
    ctx.fillStyle = palette.text;
    ctx.fillText(options.autor.toUpperCase(), canvas.width / 2, 2200);

    // ===== ACCENT DETAIL (Bottom) =====
    ctx.fillStyle = palette.accent;
    ctx.fillRect(600, 2100, 400, 4);

    // Converter canvas para data URL
    return canvas.toDataURL('image/png', 1.0);
}

// Função para baixar a capa
export function downloadCover(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    link.click();
}
