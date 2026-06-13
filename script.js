// ==========================================================================
// 1. NAVEGAÇÃO SPA (SINGLE PAGE APPLICATION)
// ==========================================================================
function mudarPagina(idPagina, elementoClicado) {
    // Interrompe qualquer leitura de voz ao mudar de aba
    window.speechSynthesis.cancel();
    pararLeituraEstatica();

    // Remove a classe ativa das páginas e ativa apenas a selecionada
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const paginaAtiva = document.getElementById(idPagina);
    if (paginaAtiva) paginaAtiva.classList.add('active');

    // Atualiza o destaque visual no menu lateral
    document.querySelectorAll('.nav-links li').forEach(link => link.classList.remove('active'));
    if (elementoClicado) elementoClicado.classList.add('active');

    // Se entrar na aba do simulador, reinicia o jogo automaticamente
    if (idPagina === 'simulador') iniciarJogoMemoria();
}

// ==========================================================================
// 2. ALTERNADOR DE TEMA (CLARO / ESCURO)
// ==========================================================================
function mudarTema() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');
    body.classList.toggle('light-theme');
    // Troca o emoji do botão dependendo do tema ativo
    icon.textContent = body.classList.contains('light-theme') ? '🌙' : '☀️';
}

// ==========================================================================
// 3. ACESSIBILIDADE: DIMENSIONAMENTO DE FONTE
// ==========================================================================
let escalaFonte = 100; // Porcentagem base do tamanho da fonte

function alterarFonte(operacao) {
    const html = document.documentElement;
    // Aumenta ou diminui de 10 em 10% respeitando os limites de segurança
    if (operacao === 'aumentar' && escalaFonte < 140) escalaFonte += 10;
    else if (operacao === 'diminuir' && escalaFonte > 90) escalaFonte -= 10;
    html.style.fontSize = `${escalaFonte}%`;
}

// ==========================================================================
// 4. ACESSIBILIDADE: LEITOR DE TELA (SINTETIZADOR DE VOZ)
// ==========================================================================
let sintetizador = window.speechSynthesis;
let ativoLeitura = false;

function alternarLeitura() {
    // Se o leitor já estiver rodando, cancela a leitura atual
    if (ativoLeitura) {
        sintetizador.cancel();
        pararLeituraEstatica();
        return;
    }

    // Busca a seção ativa e captura o texto dentro do card de vidro
    const paginaVisivel = document.querySelector('.page.active');
    if (!paginaVisivel) return;

    const textoLimpo = paginaVisivel.querySelector('.canva-glass-card').textContent;
    const expressaoVoz = new SpeechSynthesisUtterance(textoLimpo);
    
    // Configura e escolhe a melhor voz em português disponível no sistema
    const vozes = sintetizador.getVoices();
    let vozEscolhida = vozes.find(v => v.lang.includes('pt-BR') && v.name.includes('Google')) ||
                       vozes.find(v => v.lang.includes('pt-BR') && v.name.includes('Natural')) ||
                       vozes.find(v => v.lang.includes('pt-BR'));
    
    if (vozEscolhida) expressaoVoz.voice = vozEscolhida;
    
    expressaoVoz.lang = 'pt-BR';
    expressaoVoz.rate = 0.95;  // Velocidade levemente reduzida para melhor clareza
    expressaoVoz.pitch = 1.0;
    
    // Eventos para restaurar o botão quando a voz terminar ou falhar
    expressaoVoz.onend = () => pararLeituraEstatica();
    expressaoVoz.onerror = () => pararLeituraEstatica();

    sintetizador.speak(expressaoVoz);
    ativoLeitura = true;

    // Atualiza o estado visual do botão de leitura
    const btn = document.getElementById('btn-leitura');
    btn.innerHTML = '🛑 Parar Leitura';
    btn.classList.add('lendo');
}

// Restaura o botão de leitura para o padrão inicial
function pararLeituraEstatica() {
    ativoLeitura = false;
    const btn = document.getElementById('btn-leitura');
    if (btn) {
        btn.innerHTML = '🗣️ Ler Tela';
        btn.classList.remove('lendo');
    }
}

// ==========================================================================
// 5. SIMULADOR INTERATIVO (JOGO DA MEMÓRIA)
// ==========================================================================
let primeiraCarta = null, segundaCarta = null;
let travaTabuleiro = false;
let paresEncontrados = 0;
let contagemTentativas = 0;

// Matriz contendo os pares de emojis do jogo
const bancoEmojis = ['🚜', '🚜', '🌱', '🌱', '💧', '💧', '📱', '📱', '☀️', '☀️', '🌍', '🌍', '🚁', '🚁', '🌳', '🌳'];

function iniciarJogoMemoria() {
    const tabuleiro = document.getElementById('memory-board');
    const msgVitoria = document.getElementById('mensagem-vitoria');
    const displayTentativas = document.getElementById('tentativas');

    // Reseta o placar e variáveis de controle do jogo
    paresEncontrados = 0;
    contagemTentativas = 0;
    displayTentativas.textContent = contagemTentativas;
    msgVitoria.textContent = '';
    tabuleiro.innerHTML = '';
    
    travaTabuleiro = true;
    primeiraCarta = null;
    segundaCarta = null;

    // Embaralha os elementos de forma randômica
    const embaralhados = bancoEmojis.sort(() => Math.random() - 0.5);

    // Renderiza dinamicamente as cartas no HTML
    embaralhados.forEach(emoji => {
        const carta = document.createElement('div');
        carta.classList.add('memory-card', 'flip');
        carta.dataset.item = emoji;

        carta.innerHTML = `
            <div class="front-face">${emoji}</div>
            <div class="back-face">❓</div>
        `;

        carta.addEventListener('click', executarGiro);
        tabuleiro.appendChild(carta);
    });

    // Revela as cartas por 3 segundos no início antes de esconder para o jogador memorizar
    setTimeout(() => {
        document.querySelectorAll('.memory-card').forEach(c => c.classList.remove('flip'));
        travaTabuleiro = false;
    }, 3000);
}

function executarGiro() {
    if (travaTabuleiro || this === primeiraCarta) return;

    this.classList.add('flip');

    // Salva a primeira carta clicada
    if (!primeiraCarta) {
        primeiraCarta = this;
        return;
    }

    // Salva a segunda carta e computa a tentativa
    segundaCarta = this;
    contagemTentativas++;
    document.getElementById('tentativas').textContent = contagemTentativas;
    
    validarIdentidade();
}

function validarIdentidade() {
    // Compara se os data attributes dos emojis são iguais
    let correspondencia = primeiraCarta.dataset.item === segundaCarta.dataset.item;
    if (correspondencia) consolidarAcerto();
    else estornarGiro();
}

function consolidarAcerto() {
    // Desativa os cliques nas cartas que formaram par correto
    primeiraCarta.removeEventListener('click', executarGiro);
    segundaCarta.removeEventListener('click', executarGiro);
    paresEncontrados++;

    // Verifica condição de vitória (8 pares)
    if (paresEncontrados === 8) {
        document.getElementById('mensagem-vitoria').textContent = '🎉 Vitória! Excelente desempenho socioambiental!';
    }
    resetarControles();
}

function estornarGiro() {
    travaTabuleiro = true;
    // Aguarda 1 segundo antes de desvirar os pares incorretos
    setTimeout(() => {
        primeiraCarta.classList.remove('flip');
        segundaCarta.classList.remove('flip');
        resetarControles();
    }, 1000);
}

function resetarControles() {
    travaTabuleiro = false;
    primeiraCarta = null;
    segundaCarta = null;
}