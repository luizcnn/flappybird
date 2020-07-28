function novoElemento(tagName, className) {

    // Esta função serve para criarmos elementos HTML com classes definidas mais facilmente
    const elem = document.createElement(tagName)
    elem.classList.add(className)
    
    return elem
}

function Barreira (reversa = false) {

    // Construtor do elemento barreira:
    this.elemento = novoElemento('div', 'barreira')

    // Constuímos também dois elementos: Borda e Corpo
    const borda = novoElemento('div','borda')
    const corpo = novoElemento('div','corpo')

    // Caso seja uma Barreira Reversa (Barreira superior), devemos dar um append primeiramente
    // no corpo, depois na borda. Para a barreira inferior, fazemos o inverso.
    if(reversa) {
        this.elemento.appendChild(corpo)
        this.elemento.appendChild(borda)
    } else {
        this.elemento.appendChild(borda)
        this.elemento.appendChild(corpo)
    }

    // Método para definir a altura da barreira
    this.setAltura = altura => corpo.style.height = `${altura}px`
}

// Teste
// const b = new Barreira(true)
// b.setAltura(300)
// document.querySelector('[wm-flappy]').appendChild(b.elemento)

function ParDeBarreiras(altura, abertura, x) {
    // Construtor do elemento Par de Barreiras. Passamos como parâmetro a altura do jogo, a abertura
    // entre as parreiras, e a posição x com relação à lateral esquerda do par de barreiras
    this.elemento = novoElemento('div', 'par-de-barreiras')

    // Instanciamos duas barreiras, a superior e inferior.
    this.superior = new Barreira(true)
    this.inferior = new Barreira(false)

    // O objeto a ser inserido na DOM é o .elemento, como mostra a função construtora Barreira()

    this.elemento.appendChild(this.superior.elemento)
    this.elemento.appendChild(this.inferior.elemento)

    // Este método sorteia a posição da abertura, com relação à vertical.
    this.sortearAbertura = () => {
        // A altura da barreira superior é calculada aleatóriamente
        const alturaSuperior = Math.random() * (altura - abertura)
        // A altura da barreira inferior é o que resta da altura do jogo, menos o tamanho da abertura, 
        //menos a altura da barreira superior.
        const alturaInferior = altura - abertura - alturaSuperior
        this.superior.setAltura(alturaSuperior)
        this.inferior.setAltura(alturaInferior)
    }

    // Este método capta a posição em relação à lateral esquerda na qual o par de barreiras se encontra
    this.getX = () => parseInt(this.elemento.style.left.split('px')[0])
    // Este método define a posição em relação à lateral esquerda para o par de barreiras
    this.setX = (x) => this.elemento.style.left = `${x}px`
    // Este método capta a largura do elemento par de barreiras. É necessário para o cálculo da colisão
    // Do pássaro com a barreira.
    this.getLargura = () => this.elemento.clientWidth

    // Chamada do método sortearAbertura e setando a posição x do par de aberturas.
    this.sortearAbertura()
    this.setX(x)
}

// Teste par de barreiras

// const b = new ParDeBarreiras(700, 200, 800)
// document.querySelector('[wm-flappy]').appendChild(b.elemento)

// Essa função construtora irá controlar as múltiplas barreiras do jogo, e também
// Contabilizar a pontuação do jogador, quando o par de barreiras passar da posição central da tela.
function Barreiras(altura, largura, abertura, espaco, notificarPonto) {
    // A posição x da primeira barreira vai ser igual à largura do jogo, para que ela inicie exatamente fora
    // da tela de jogo, e com o movimento, adentre na área de jogo.
    this.pares = [
        new ParDeBarreiras(altura, abertura, largura),
        new ParDeBarreiras(altura, abertura, largura + espaco),
        new ParDeBarreiras(altura, abertura, largura + espaco*2),
        new ParDeBarreiras(altura, abertura, largura + espaco*3)
    ]

    const deslocamento = 3; // Quantos pixels será a "velocidade" de deslocamento da barreira

    this.animar = () => {
        this.pares.forEach(par => {
            par.setX(par.getX() - deslocamento)

            // quando o elemento sair da área do jogo, queremos traze-lo de volta:
            if(par.getX() < -par.getLargura()){
                par.setX(par.getX() + (espaco * this.pares.length))
                par.sortearAbertura()
            }

            const meio = largura/2
            const cruzouOMeio = par.getX() + deslocamento >= meio && par.getX() < meio
            if(cruzouOMeio){
                notificarPonto()
            }
        })
    }
}

function Passaro(alturaJogo) {
    
    let voando = false

    this.elemento = novoElemento('img', 'passaro')
    this.elemento.src = 'imgs/passaro.png'

    this.getY = () => parseInt(this.elemento.style.bottom.split('px')[0])
    this.setY = y => this.elemento.style.bottom = `${y}px`

    window.onkeydown = event => voando = true
    window.onkeyup = event => voando = false

    this.animar = () => {
        const novoY = this.getY() + (voando ? 8 : -5)
        const alturaMaxima = alturaJogo - this.elemento.clientHeight

        if(novoY <= 0) {
            this.setY(0)
        } else if(novoY >= alturaMaxima) {
            this.setY(alturaMaxima)
        } else {
            this.setY(novoY)
        }
    }

    this.setY(alturaJogo/2)
}


function Progresso() {
    this.elemento = novoElemento('span','progresso')
    
    this.atualizarPontos = pontos => {
        this.elemento.innerHTML = pontos
    }
    
    this.atualizarPontos(0)
}

function estaoSobrepostos(elementoA, elementoB) {
    const a = elementoA.getBoundingClientRect()
    const b = elementoB.getBoundingClientRect()

    const ladoDireitoA = a.left + a.width
    const ladoDireitoB = b.left + b.width

    const horizontal = ladoDireitoA >= b.left && ladoDireitoB >= a.left
    const vertical = a.top + a.height >= b.top && b.top + b.height >= a.top

    return horizontal && vertical
}

function colisao(passaro, barreiras) {
    let colidiu = false

    barreiras.pares.forEach(parDeBarreiras => {
        if(!colidiu){
            const superior = parDeBarreiras.superior.elemento
            const inferior = parDeBarreiras.inferior.elemento
            colidiu = estaoSobrepostos(passaro.elemento, superior) || estaoSobrepostos(passaro.elemento, inferior)
        }
    })

    return colidiu
}

function FlappyBird(){
    
    let pontos = 0

    const areaDoJogo = document.querySelector('[wm-flappy]')
    const altura = areaDoJogo.clientHeight
    const largura = areaDoJogo.clientWidth

    const progresso = new Progresso()
    const barreiras = new Barreiras(altura, largura, 200, 400, () => {
        progresso.atualizarPontos(++pontos)
    })
    const passaro = new Passaro(altura)

    areaDoJogo.appendChild(progresso.elemento)
    areaDoJogo.appendChild(passaro.elemento)
    barreiras.pares.forEach(par => areaDoJogo.appendChild(par.elemento))

    this.start = () => {
        // Loop do jogo
        const temporizador = setInterval(() => {
            barreiras.animar()
            passaro.animar()

            if(colisao(passaro, barreiras)) {
                clearInterval(temporizador)
            }
        },20)
    }
}

new FlappyBird().start()

