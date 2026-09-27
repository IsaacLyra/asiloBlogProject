/* ---------- Acessibilidade: tamanho do texto e alto contraste ---------- */
(function () {
  var root = document.documentElement;
  var sizes = [18, 20, 24, 28];
  var idx = 1;
  try {
    var saved = localStorage.getItem('tc_fontIdx');
    if (saved !== null) idx = parseInt(saved, 10);
  } catch (e) {}

  function applySize() {
    root.style.fontSize = sizes[idx] + 'px';
    try { localStorage.setItem('tc_fontIdx', idx); } catch (e) {}
  }
  applySize();

  document.getElementById('maiorTexto').addEventListener('click', function () {
    idx = Math.min(idx + 1, sizes.length - 1);
    applySize();
  });
  document.getElementById('menorTexto').addEventListener('click', function () {
    idx = Math.max(idx - 1, 0);
    applySize();
  });
  document.getElementById('normalTexto').addEventListener('click', function () {
    idx = 1;
    applySize();
  });

  var contrasteBtn = document.getElementById('contrasteBtn');
  var contrastOn = false;
  try { contrastOn = localStorage.getItem('tc_contrast') === 'on'; } catch (e) {}

  function applyContrast() {
    if (contrastOn) {
      root.setAttribute('data-contrast', 'on');
      contrasteBtn.setAttribute('aria-pressed', 'true');
    } else {
      root.removeAttribute('data-contrast');
      contrasteBtn.setAttribute('aria-pressed', 'false');
    }
  }
  applyContrast();
  contrasteBtn.addEventListener('click', function () {
    contrastOn = !contrastOn;
    try { localStorage.setItem('tc_contrast', contrastOn ? 'on' : 'off'); } catch (e) {}
    applyContrast();
  });
})();

/* ---------- Jogo 1: Jogo da velha (você = X, computador = O) ---------- */
(function () {
  var tabuleiroEl = document.getElementById('velhaTabuleiro');
  var mensagemEl = document.getElementById('velhaMensagem');
  var reiniciarBtn = document.getElementById('velhaReiniciar');
  var board, fimDeJogo;

  var LINHAS = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  function checarVencedor(b) {
    for (var i = 0; i < LINHAS.length; i++) {
      var l = LINHAS[i];
      if (b[l[0]] && b[l[0]] === b[l[1]] && b[l[1]] === b[l[2]]) return b[l[0]];
    }
    if (b.every(function (c) { return c; })) return 'empate';
    return null;
  }

  function jogadaComputador() {
    // tenta vencer
    for (var i = 0; i < 9; i++) {
      if (!board[i]) {
        board[i] = 'O';
        if (checarVencedor(board) === 'O') return i;
        board[i] = '';
      }
    }
    // tenta bloquear
    for (var j = 0; j < 9; j++) {
      if (!board[j]) {
        board[j] = 'X';
        if (checarVencedor(board) === 'X') { board[j] = ''; return j; }
        board[j] = '';
      }
    }
    // centro, cantos, ou aleatório
    var preferencias = [4,0,2,6,8,1,3,5,7];
    for (var k = 0; k < preferencias.length; k++) {
      if (!board[preferencias[k]]) return preferencias[k];
    }
    return -1;
  }

  function desenhar() {
    tabuleiroEl.innerHTML = '';
    board.forEach(function (valor, i) {
      var btn = document.createElement('button');
      btn.className = 'velha-cel';
      btn.textContent = valor;
      btn.setAttribute('aria-label', 'Quadrado ' + (i + 1) + (valor ? ', ocupado por ' + valor : ', vazio'));
      if (valor || fimDeJogo) btn.disabled = true;
      btn.addEventListener('click', function () { jogar(i); });
      tabuleiroEl.appendChild(btn);
    });
  }

  function jogar(i) {
    if (fimDeJogo || board[i]) return;
    board[i] = 'X';
    var resultado = checarVencedor(board);
    if (!resultado) {
      var jogadaCpu = jogadaComputador();
      if (jogadaCpu !== -1) board[jogadaCpu] = 'O';
      resultado = checarVencedor(board);
    }
    desenhar();
    if (resultado === 'X') { mensagemEl.textContent = 'Parabéns, você venceu!'; fimDeJogo = true; }
    else if (resultado === 'O') { mensagemEl.textContent = 'O computador venceu desta vez. Tente de novo!'; fimDeJogo = true; }
    else if (resultado === 'empate') { mensagemEl.textContent = 'Empate! Bem jogado.'; fimDeJogo = true; }
    else { mensagemEl.textContent = 'Sua vez! Toque em um quadrado.'; }
  }

  function iniciar() {
    board = ['','','','','','','','',''];
    fimDeJogo = false;
    mensagemEl.textContent = 'Sua vez! Toque em um quadrado.';
    desenhar();
  }

  reiniciarBtn.addEventListener('click', iniciar);
  iniciar();
})();

/* ---------- Jogo 2: Jogo da memória ---------- */
(function () {
  var tabuleiroEl = document.getElementById('memoriaTabuleiro');
  var mensagemEl = document.getElementById('memoriaMensagem');
  var reiniciarBtn = document.getElementById('memoriaReiniciar');
  var simbolos = ['🔒', '📱', '💬', '🛡️', '☎️', '✅'];
  var cartas, viradas, travado, paresEncontrados;

  function embaralhar(lista) {
    for (var i = lista.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = lista[i]; lista[i] = lista[j]; lista[j] = tmp;
    }
    return lista;
  }

  function desenhar() {
    tabuleiroEl.innerHTML = '';
    cartas.forEach(function (carta, i) {
      var btn = document.createElement('button');
      btn.className = 'memoria-carta' + (carta.encontrada ? ' encontrada' : (carta.virada ? ' virada' : ''));
      btn.textContent = (carta.virada || carta.encontrada) ? carta.simbolo : '❔';
      btn.setAttribute('aria-label', 'Carta ' + (i + 1));
      btn.disabled = carta.encontrada;
      btn.addEventListener('click', function () { virar(i); });
      tabuleiroEl.appendChild(btn);
    });
  }

  function virar(i) {
    if (travado || cartas[i].virada || cartas[i].encontrada) return;
    cartas[i].virada = true;
    viradas.push(i);
    desenhar();

    if (viradas.length === 2) {
      travado = true;
      var a = cartas[viradas[0]], b = cartas[viradas[1]];
      if (a.simbolo === b.simbolo) {
        a.encontrada = true; b.encontrada = true;
        paresEncontrados++;
        viradas = [];
        travado = false;
        mensagemEl.textContent = paresEncontrados === simbolos.length
          ? 'Muito bem! Você encontrou todos os pares!'
          : 'Boa! Você encontrou um par.';
        desenhar();
      } else {
        mensagemEl.textContent = 'Não é igual. Tente lembrar para a próxima!';
        setTimeout(function () {
          a.virada = false; b.virada = false;
          viradas = [];
          travado = false;
          desenhar();
        }, 900);
      }
    }
  }

  function iniciar() {
    var pares = simbolos.concat(simbolos);
    embaralhar(pares);
    cartas = pares.map(function (s) { return { simbolo: s, virada: false, encontrada: false }; });
    viradas = [];
    travado = false;
    paresEncontrados = 0;
    mensagemEl.textContent = 'Toque em uma carta para começar.';
    desenhar();
  }

  reiniciarBtn.addEventListener('click', iniciar);
  iniciar();
})();

/* ---------- Jogo 3: Quiz sobre o conteúdo do blog ---------- */
(function () {
  var area = document.getElementById('quizArea');
  var perguntas = [
    {
      texto: 'Alguém liga chorando com a voz parecida com a do seu neto, pedindo dinheiro urgente. O que você faz primeiro?',
      opcoes: ['Faço o Pix rápido para ajudar', 'Desligo e ligo para o número já salvo do neto', 'Peço o número do banco dele'],
      certa: 1
    },
    {
      texto: 'Uma mensagem do "banco" pede sua senha completa pelo WhatsApp. Isso é normal?',
      opcoes: ['Sim, bancos pedem isso às vezes', 'Não, bancos nunca pedem a senha inteira por mensagem', 'Só se a mensagem tiver o logo do banco'],
      certa: 1
    },
    {
      texto: 'O que é um vídeo "deepfake"?',
      opcoes: ['Um vídeo antigo remasterizado', 'Um vídeo falso feito por computador, parecendo real', 'Um tipo de propaganda de televisão'],
      certa: 1
    },
    {
      texto: 'Qual destes é um sinal de golpe?',
      opcoes: ['A mensagem pede pressa e segredo', 'A mensagem chega de um contato salvo há anos', 'A ligação demora para atender'],
      certa: 0
    },
    {
      texto: 'Recebeu algo estranho e não sabe se é verdade. Qual a melhor atitude?',
      opcoes: ['Responder na hora para não perder tempo', 'Ignorar e apagar sem contar a ninguém', 'Confirmar com um familiar antes de fazer qualquer coisa'],
      certa: 2
    }
  ];

  var atual = 0, acertos = 0;

  function mostrarPergunta() {
    if (atual >= perguntas.length) {
      area.innerHTML =
        '<p class="quiz-resultado">Você acertou ' + acertos + ' de ' + perguntas.length + '. Muito bem por praticar!</p>' +
        '<button class="btn-secundario" id="quizReiniciar">Fazer o quiz de novo</button>';
      document.getElementById('quizReiniciar').addEventListener('click', function () {
        atual = 0; acertos = 0; mostrarPergunta();
      });
      return;
    }
    var p = perguntas[atual];
    var html = '<div class="quiz-pergunta">' +
      '<p><strong>Pergunta ' + (atual + 1) + ' de ' + perguntas.length + ':</strong> ' + p.texto + '</p>' +
      '<div class="quiz-opcoes">';
    p.opcoes.forEach(function (op, i) {
      html += '<button data-i="' + i + '">' + op + '</button>';
    });
    html += '</div><p class="game-msg" id="quizFeedback" aria-live="polite"></p></div>';
    area.innerHTML = html;

    var botoes = area.querySelectorAll('.quiz-opcoes button');
    botoes.forEach(function (btn) {
      btn.addEventListener('click', function () {
        botoes.forEach(function (b) { b.disabled = true; });
        var i = parseInt(btn.getAttribute('data-i'), 10);
        var feedback = document.getElementById('quizFeedback');
        if (i === p.certa) {
          btn.classList.add('certa');
          acertos++;
          feedback.textContent = 'Isso mesmo! Resposta certa.';
        } else {
          btn.classList.add('errada');
          botoes[p.certa].classList.add('certa');
          feedback.textContent = 'Quase! A resposta certa está em verde.';
        }
        setTimeout(function () { atual++; mostrarPergunta(); }, 1600);
      });
    });
  }

  mostrarPergunta();
})();
