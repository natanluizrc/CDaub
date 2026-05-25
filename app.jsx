// ===========================================================
// DaubCard — Playful Bingo  |  Firebase Firestore real-time
// ===========================================================

const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;

const ME_KEY = "bingo_me";
const LANG_KEY = "bingo_lang";
const INACTIVE_MS = 15 * 60 * 1000;
const HEARTBEAT_MS =  5 * 60 * 1000;
const db = () => firebase.firestore();
const sessionRef = (code) => db().collection("sessions").doc(code);
const nameRef_fs = (name) => db().collection('names').doc(name.toLowerCase());

async function claimName(name, uid) {
  const ref = nameRef_fs(name);
  return firebase.firestore().runTransaction(async tx => {
    const snap = await tx.get(ref);
    const now = Date.now();
    if (snap.exists) {
      const d = snap.data();
      const expired = (now - d.lastActive) > INACTIVE_MS;
      if (!expired && d.uid !== uid) throw { code: 'name-taken' };
    }
    tx.set(ref, { uid, name, lastActive: now });
  });
}

function releaseName(name) {
  if (!name) return;
  nameRef_fs(name).delete().catch(() => {});
}

function heartbeatName(name) {
  if (!name) return;
  nameRef_fs(name).update({ lastActive: Date.now() }).catch(() => {});
}

function trackUser(uid) {
  const ref = db().collection('users').doc(uid);
  ref.get().then(snap => {
    const now = firebase.firestore.FieldValue.serverTimestamp();
    if (snap.exists) {
      ref.update({ lastSeen: now, sessionCount: firebase.firestore.FieldValue.increment(1) });
    } else {
      ref.set({ uid, firstSeen: now, lastSeen: now, sessionCount: 1 });
    }
  }).catch(() => {});
}

// ---------- Sound FX ----------
function playFx(type) {
  try {
    const buzz = (p) => { try { if (navigator.vibrate) navigator.vibrate(p); } catch(e) {} };
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const play = (freq, start, dur, vol = 0.25, wave = 'sine') => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = wave; o.frequency.value = freq;
      g.gain.setValueAtTime(0.001, ctx.currentTime + start);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + start + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur + 0.05);
    };
    if (type === 'ad') {
      buzz([150, 80, 150, 80, 150]);
      play(523, 0,    0.12, 0.22, 'sawtooth');
      play(659, 0.12, 0.12, 0.22, 'sawtooth');
      play(784, 0.24, 0.12, 0.22, 'sawtooth');
      play(1047,0.36, 0.30, 0.28, 'sawtooth');
    } else if (type === 'triviaReady') {
      buzz([100, 50, 100, 50, 300]);
      play(220, 0,    0.18, 0.30, 'square');
      play(293, 0.22, 0.18, 0.30, 'square');
      play(440, 0.44, 0.40, 0.35, 'square');
    } else if (type === 'triviaStart') {
      buzz([50]);
      play(880, 0,    0.07, 0.20, 'sine');
      play(660, 0.08, 0.07, 0.20, 'sine');
    } else if (type === 'triviaCorrect') {
      buzz([50, 30, 50, 30, 200]);
      play(523, 0,    0.10, 0.28, 'sine');
      play(659, 0.11, 0.10, 0.28, 'sine');
      play(784, 0.22, 0.10, 0.28, 'sine');
      play(1047,0.33, 0.28, 0.32, 'sine');
    } else if (type === 'triviaWrong') {
      buzz([400]);
      play(440, 0,    0.22, 0.28, 'sawtooth');
      play(349, 0.24, 0.22, 0.28, 'sawtooth');
      play(294, 0.48, 0.35, 0.28, 'sawtooth');
    } else if (type === 'number') {
      buzz([60]);
      play(660, 0,    0.07, 0.20, 'sine');
      play(880, 0.08, 0.18, 0.22, 'sine');
    }
  } catch (e) {}
}

// ---------- Translations ----------
const TRANSLATIONS = {
  en: {
    nameLabel: 'NAME',
    namePlaceholder: 'e.g. John/Mary',
    nameTooLong: 'Name must be 12 characters or less.',
    continue: 'Continue',
    back: '← Back',
    enterRoomCode: 'Enter the room code.',
    roomLabel: 'ROOM',
    join: 'Join',
    greeting: 'Hello, {name}!',
    generatingRoom: 'Generating room…',
    rotating: 'Rotate your phone',
    hostLandscape: 'The host screen works best in landscape.',
    castLandscape: 'The player screen works best in landscape.',
    connecting: 'Connecting…',
    roomInfo: 'Room info',
    exitRoom: 'Exit room',
    draw: 'Draw',
    drawing: 'Drawing...',
    done: 'Done!',
    exitRoomQuestion: 'Exit the room?',
    exitRoomBody: 'Your card and progress will be lost.',
    exit: 'Exit',
    gotItPre: '',
    gotItPost: ' got it!',
    seeResults: 'See results',
    leaderboard: 'Leaderboard',
    noPlayersPre: 'No players yet. Share Room',
    noPlayersPost: 'to get started!',
    hits: 'HITS',
    reject: 'REJECT',
    approve: 'APPROVE',
    roomNotFoundTitle: 'Room not found',
    nameTakenTitle: 'Name already taken',
    connectionErrorTitle: 'Connection error',
    waitingForApprovalTitle: 'Waiting for approval',
    hostWillLetYouIn: 'The host will let you in shortly.',
    cancel: 'Cancel',
    requestDeniedTitle: 'Request denied',
    hostDidntLetIn: "The host didn't let you in.",
    backToStart: 'Back to start',
    roomEndedTitle: 'Room ended',
    roomClosedByHost: 'The host closed the room.',
    waitingForHost: 'Waiting to start…',
    daub: 'DAUB',
    wins: 'WINS',
    lost: 'LOST',
    allRoomsInUse: 'All rooms (01–99) are currently in use. Try again later.',
    joinRoomNotFound: 'Room not found. Check the code with the host.',
    joinNameTaken: 'Name already taken in this room. Go back and choose a different name.',
    joinConnectionError: 'Connection error. Please try again.',
    retry: 'Try again',
    developedBy: 'By NL Consultancy',
    cold: 'COLD',
    warm: 'WARM',
    fire: 'FIRE',
    globalNameTaken: 'This name is already in use by another player.',
    startGame: 'Start game',
    roomFullTitle: 'Room Full',
    joinRoomFull: 'This room already has 12 players.',
    you: 'YOU',
    creator: 'HOST',
    roomCodeLabel: 'ROOM CODE',
    shareCode: 'Share this code with your friends',
    players: 'PLAYERS',
    waitingPlayers: 'Waiting for players…',
    whatToDo: 'What do you want to do?',
    createRoom: 'Create Room',
    joinRoom: 'Join Room',
    createDesc: 'Create a new room and share the code with your friends.',
    joinDesc: 'Join an existing room using the 2-digit code.',
    triviaStartQuestion: 'Start Question →',
    triviaGuestWaiting: 'Host is preparing the question…',
    triviaWaitingAnswer: 'Waiting for {name} to answer…',
    triviaWaitingContinue: 'Waiting for host to continue…',
    triviaYourTurn: "It's your turn!",
    triviaCorrect: 'Correct! 🎉',
    triviaWrong: 'Wrong! 😅',
    triviaTimeout: "Time's up! ⏰",
    triviaClose: 'Continue',
    triviaPoints: 'Trivia',
    triviaPodiumTitle: 'TRIVIA RANKING',
    triviaPodiumSubtitle: 'Who got the most right?',
  },
  pt: {
    nameLabel: 'NOME',
    namePlaceholder: 'ex: João/Maria',
    nameTooLong: 'O nome deve ter no máximo 12 caracteres.',
    continue: 'Continuar',
    back: '← Voltar',
    enterRoomCode: 'Digite o código da sala.',
    roomLabel: 'SALA',
    join: 'Entrar',
    greeting: 'Olá, {name}!',
    generatingRoom: 'Criando sala…',
    rotating: 'Vire o celular',
    hostLandscape: 'A tela do host funciona melhor na horizontal.',
    castLandscape: 'A tela do jogador funciona melhor na horizontal.',
    connecting: 'Conectando…',
    roomInfo: 'Info da sala',
    exitRoom: 'Sair da sala',
    draw: 'Sortear',
    drawing: 'Sorteando...',
    done: 'Concluído!',
    exitRoomQuestion: 'Sair da sala?',
    exitRoomBody: 'Sua cartela e progresso serão perdidos.',
    exit: 'Sair',
    gotItPre: '',
    gotItPost: ' conseguiu!',
    seeResults: 'Ver resultados',
    leaderboard: 'Ranking',
    noPlayersPre: 'Nenhum jogador ainda. Compartilhe a Sala',
    noPlayersPost: 'para começar!',
    hits: 'ACERTOS',
    reject: 'REJEITAR',
    approve: 'APROVAR',
    roomNotFoundTitle: 'Sala não encontrada',
    nameTakenTitle: 'Nome já em uso',
    connectionErrorTitle: 'Erro de conexão',
    waitingForApprovalTitle: 'Aguardando aprovação',
    hostWillLetYouIn: 'O host vai liberar sua entrada em breve.',
    cancel: 'Cancelar',
    requestDeniedTitle: 'Solicitação negada',
    hostDidntLetIn: 'O host não te deixou entrar.',
    backToStart: 'Voltar ao início',
    roomEndedTitle: 'Sala encerrada',
    roomClosedByHost: 'O criador encerrou a sala.',
    waitingForHost: 'Aguardando início…',
    daub: 'MARCAR',
    wins: 'GANHOU',
    lost: 'PERDEU',
    allRoomsInUse: 'Todas as salas (01–99) estão ocupadas. Tente novamente em breve.',
    joinRoomNotFound: 'Sala não encontrada. Confirme o código com o host.',
    joinNameTaken: 'Nome já usado nessa sala. Volte e escolha outro nome.',
    joinConnectionError: 'Erro de conexão. Tente novamente.',
    retry: 'Tentar novamente',
    developedBy: 'Por NL Consultoria',
    cold: 'FRIO',
    warm: 'QUENTE',
    fire: 'FOGO',
    globalNameTaken: 'Este nome já está sendo usado por outro jogador.',
    startGame: 'Iniciar jogo',
    roomFullTitle: 'Sala Cheia',
    joinRoomFull: 'Esta sala já tem 12 jogadores.',
    you: 'VOCÊ',
    creator: 'CRIADOR',
    roomCodeLabel: 'CÓDIGO DA SALA',
    shareCode: 'Compartilhe este código com seus amigos',
    players: 'JOGADORES',
    waitingPlayers: 'Aguardando jogadores…',
    whatToDo: 'O que deseja fazer?',
    createRoom: 'Criar Sala',
    joinRoom: 'Entrar na Sala',
    createDesc: 'Crie uma nova sala e compartilhe o código com seus amigos.',
    joinDesc: 'Entre em uma sala existente usando o código de 2 dígitos.',
    triviaStartQuestion: 'Iniciar Pergunta →',
    triviaGuestWaiting: 'O host está preparando a pergunta…',
    triviaWaitingAnswer: 'Aguardando {name} responder…',
    triviaWaitingContinue: 'Aguardando o host continuar…',
    triviaYourTurn: 'É a sua vez!',
    triviaCorrect: 'Correto! 🎉',
    triviaWrong: 'Errado! 😅',
    triviaTimeout: 'Tempo esgotado! ⏰',
    triviaClose: 'Continuar',
    triviaPoints: 'Trivia',
    triviaPodiumTitle: 'RANKING DE TRIVIA',
    triviaPodiumSubtitle: 'Quem mais acertou?',
  },
  es: {
    nameLabel: 'NOMBRE',
    namePlaceholder: 'ej: Juan/María',
    nameTooLong: 'El nombre debe tener 12 caracteres o menos.',
    continue: 'Continuar',
    back: '← Atrás',
    enterRoomCode: 'Ingresa el código de sala.',
    roomLabel: 'SALA',
    join: 'Unirse',
    greeting: '¡Hola, {name}!',
    generatingRoom: 'Creando sala…',
    rotating: 'Gira tu teléfono',
    hostLandscape: 'La pantalla del host funciona mejor en horizontal.',
    castLandscape: 'La pantalla del jugador funciona mejor en horizontal.',
    connecting: 'Conectando…',
    roomInfo: 'Info de sala',
    exitRoom: 'Salir de la sala',
    draw: 'Sortear',
    drawing: 'Sorteando...',
    done: '¡Listo!',
    exitRoomQuestion: '¿Salir de la sala?',
    exitRoomBody: 'Tu tarjeta y progreso se perderán.',
    exit: 'Salir',
    gotItPre: '¡',
    gotItPost: ' lo logró!',
    seeResults: 'Ver resultados',
    leaderboard: 'Clasificación',
    noPlayersPre: 'Sin jugadores aún. ¡Comparte la Sala',
    noPlayersPost: 'para empezar!',
    hits: 'ACIERTOS',
    reject: 'RECHAZAR',
    approve: 'APROBAR',
    roomNotFoundTitle: 'Sala no encontrada',
    nameTakenTitle: 'Nombre ya en uso',
    connectionErrorTitle: 'Error de conexión',
    waitingForApprovalTitle: 'Esperando aprobación',
    hostWillLetYouIn: 'El host te dejará entrar pronto.',
    cancel: 'Cancelar',
    requestDeniedTitle: 'Solicitud denegada',
    hostDidntLetIn: 'El host no te dejó entrar.',
    backToStart: 'Volver al inicio',
    roomEndedTitle: 'Sala terminada',
    roomClosedByHost: 'El creador cerró la sala.',
    waitingForHost: 'Esperando inicio…',
    daub: 'MARCAR',
    wins: 'GANÓ',
    lost: 'PERDIÓ',
    allRoomsInUse: 'Todas las salas (01–99) están en uso. Inténtalo más tarde.',
    joinRoomNotFound: 'Sala no encontrada. Confirma el código con el host.',
    joinNameTaken: 'Nombre ya usado en esta sala. Vuelve y elige otro nombre.',
    joinConnectionError: 'Error de conexión. Inténtalo de nuevo.',
    retry: 'Intentar de nuevo',
    developedBy: 'Por NL Consultoría',
    cold: 'FRÍO',
    warm: 'CÁLIDO',
    fire: 'FUEGO',
    globalNameTaken: 'Este nombre ya lo está usando otro jugador.',
    startGame: 'Iniciar juego',
    roomFullTitle: 'Sala Llena',
    joinRoomFull: 'Esta sala ya tiene 12 jugadores.',
    you: 'TÚ',
    creator: 'CREADOR',
    roomCodeLabel: 'CÓDIGO DE SALA',
    shareCode: 'Comparte este código con tus amigos',
    players: 'JUGADORES',
    waitingPlayers: 'Esperando jugadores…',
    whatToDo: '¿Qué deseas hacer?',
    createRoom: 'Crear Sala',
    joinRoom: 'Entrar a la Sala',
    createDesc: 'Crea una nueva sala y comparte el código con tus amigos.',
    joinDesc: 'Únete a una sala existente usando el código de 2 dígitos.',
    triviaStartQuestion: 'Iniciar Pregunta →',
    triviaGuestWaiting: 'El host está preparando la pregunta…',
    triviaWaitingAnswer: 'Esperando respuesta de {name}…',
    triviaWaitingContinue: 'Esperando que el host continúe…',
    triviaYourTurn: '¡Es tu turno!',
    triviaCorrect: '¡Correcto! 🎉',
    triviaWrong: '¡Incorrecto! 😅',
    triviaTimeout: '¡Tiempo agotado! ⏰',
    triviaClose: 'Continuar',
    triviaPoints: 'Trivia',
    triviaPodiumTitle: 'RANKING DE TRIVIA',
    triviaPodiumSubtitle: '¿Quién acertó más?',
  },
};

// ---------- Host lines per language ----------
const HOST_LINES_MAP = {
  en: [
    "Anyone got it?", "Eyes on your card!", "Could be your lucky one!",
    "Mark it if you got it!", "Another one for the books.", "Here we go!",
    "Don't blink!", "Hot ball coming through.",
    "Missed it? Breathe deep.", "Tension's building!",
    "Hope's still alive!", "Every ball counts.",
    "We're cooking now!", "The crowd holds its breath…", "Daub it down!",
    "Got it? Lucky you.", "Missed it? Next round!",
    "Could this be the game-winner?", "Steady hands, everyone.",
    "The room just got tighter.", "Lady Luck's on duty!",
    "Halfway through your card?", "Numbers don't lie!", "Did everyone catch that?",
    "Lock it in, players.", "Add it to the collection.", "Hot streak incoming?",
    "Don't lose your spot!", "Beautiful number, that one.",
    "Whisper it to your card.", "Anyone close to a line?",
    "Wins are hiding somewhere!", "Keep your eyes peeled!",
    "One step closer.", "That's how the ball bounces.", "Could be the one!",
  ],
  pt: [
    "Alguém tem?", "Olhos na cartela!", "Pode ser o seu!",
    "Marque se tiver!", "Mais um para a história.", "Lá vai!",
    "Não pisque!", "Bola quente chegando.",
    "Perdeu? Respira fundo.", "A tensão aumenta!",
    "A esperança continua!", "Cada bola conta.",
    "Tá esquentando!", "A sala prende a respiração…", "Marque aí!",
    "Teve sorte?", "Perdeu? Próxima rodada!",
    "Será o decisivo?", "Mãos firmes, galera.",
    "A sala ficou mais tensa.", "A sorte está no ar!",
    "Já tá na metade?", "Os números não mentem!", "Todo mundo viu?",
    "Confirma aí, jogadores.", "Mais um na coleção.", "Sequência boa chegando?",
    "Não perde o lugar!", "Que número bonito.",
    "Fala baixinho pra cartela.", "Alguém perto de uma linha?",
    "As vitórias estão escondidas!", "Fique ligado!",
    "Um passo mais perto.", "É assim que a bola rola.", "Pode ser esse!",
  ],
  es: [
    "¿Alguien lo tiene?", "¡Ojo a tu tarjeta!", "¡Puede ser el tuyo!",
    "¡Márcalo si lo tienes!", "Otro para la historia.", "¡Allá vamos!",
    "¡No parpadees!", "Bola caliente en camino.",
    "¿La perdiste? Respira.", "¡La tensión crece!",
    "¡La esperanza sigue viva!", "Cada bola cuenta.",
    "¡Esto se calienta!", "La sala contiene la respiración…", "¡Márcalo!",
    "¿Tuviste suerte?", "¿La perdiste? ¡Próxima ronda!",
    "¿Será la decisiva?", "Manos firmes, jugadores.",
    "La sala se tensó más.", "¡La suerte está en el aire!",
    "¿Ya vas por la mitad?", "¡Los números no mienten!", "¿Todos lo vieron?",
    "Confírmenlo, jugadores.", "Otra a la colección.", "¿Racha caliente?",
    "¡No pierdas tu lugar!", "Qué número tan bonito.",
    "Susúrraselo a tu tarjeta.", "¿Alguien cerca de una línea?",
    "¡Las victorias están escondidas!", "¡Mantén los ojos abiertos!",
    "Un paso más cerca.", "Así ruedan las bolas.", "¡Podría ser este!",
  ],
};

function pickHostLine(exclude, lang) {
  const lines = HOST_LINES_MAP[lang] || HOST_LINES_MAP.en;
  const pool = lines.filter(x => x !== exclude);
  return pool[Math.floor(Math.random() * pool.length)] || lines[0];
}

// ---------- Trivia Question Bank ----------
const TRIVIA_QUESTIONS = {
  en: [
      { q: "What color is the 'black box' on commercial aircraft?", opts: ['Black', 'Blue', 'Orange', 'Fluorescent green'], ans: 2 },
      { q: 'In which country was dictator Adolf Hitler born?', opts: ['Germany', 'Austria', 'Poland', 'Hungary'], ans: 1 },
      { q: 'Which of these animals is NOT a bird?', opts: ['Penguin', 'Ostrich', 'Bat', 'Emu'], ans: 2 },
      { q: 'How long does a day on Venus last?', opts: ['24 hours', '10 hours', 'Longer than a year on Venus', '30 days'], ans: 2 },
      { q: 'Which country has the most time zones in the world?', opts: ['Russia', 'USA', 'China', 'France'], ans: 3 },
      { q: "Where is the 'Sea of Tranquility'?", opts: ['In the Indian Ocean', 'On the Moon', 'In Antarctica', 'In Egypt'], ans: 1 },
      { q: 'What is the natural color of a female peacock?', opts: ['Bright blue', 'Metallic green', 'Gray or brown', 'White'], ans: 2 },
      { q: 'What happens if you put a grape in the microwave?', opts: ['It turns into a raisin', 'It explodes into plasma', "It doesn't heat up", 'It melts'], ans: 1 },
      { q: 'What was the original color of the Statue of Liberty?', opts: ['Green', 'Gold', 'Copper (like a coin)', 'White'], ans: 2 },
      { q: 'How many stomachs does a cow have?', opts: ['1', '2', '3', '4'], ans: 0 },
      { q: 'Which of these is NOT one of the Three Musketeers?', opts: ['Athos', 'Porthos', "D'Artagnan", 'Aramis'], ans: 2 },
      { q: 'Where did the original French Fries come from?', opts: ['France', 'Belgium', 'USA', 'England'], ans: 1 },
      { q: 'What is the only animal that cannot jump?', opts: ['Rhinoceros', 'Elephant', 'Hippopotamus', 'Sloth'], ans: 1 },
      { q: 'What grows on a cashew tree?', opts: ['Only the cashew fruit', 'Cashew fruit and the nut', 'Only the nut', 'Cashew fruit and mango'], ans: 1 },
      { q: "What does 'Avatar' mean originally in Sanskrit?", opts: ['Profile', 'Descent of a god', 'Blue warrior', 'Soul'], ans: 1 },
      { q: 'How many hearts does an earthworm have?', opts: ['1', '2', '5', 'None'], ans: 2 },
      { q: 'What is the capital of Morocco?', opts: ['Casablanca', 'Marrakech', 'Rabat', 'Cairo'], ans: 2 },
      { q: "What is 'Pneumonoultramicroscopicsilicovolcanoconiosis'?", opts: ['A volcano', 'A lung disease', 'A type of soil', 'A dinosaur'], ans: 1 },
      { q: 'Which historical figure survived 638 assassination attempts?', opts: ['Winston Churchill', 'Fidel Castro', 'Queen Elizabeth II', 'Stalin'], ans: 1 },
      { q: 'The Panama hat is originally from which country?', opts: ['Panama', 'Ecuador', 'Mexico', 'Brazil'], ans: 1 },
      { q: 'Which metal is liquid at room temperature?', opts: ['Lead', 'Mercury', 'Aluminum', 'Copper'], ans: 1 },
      { q: 'Who painted the ceiling of the Sistine Chapel?', opts: ['Leonardo da Vinci', 'Michelangelo', 'Donatello', 'Raphael'], ans: 1 },
      { q: 'Which of these animals has pink milk?', opts: ['Elephant', 'Hippopotamus', 'Pig', 'Whale'], ans: 1 },
      { q: 'How many teeth does a mosquito have?', opts: ['None', '2', '32', '47'], ans: 3 },
      { q: 'Where was sushi invented?', opts: ['Japan', 'China', 'Korea', 'Vietnam'], ans: 1 },
      { q: 'What is the largest island in the world?', opts: ['Australia', 'Greenland', 'Madagascar', 'Iceland'], ans: 1 },
      { q: 'Who invented the bra?', opts: ['Leonardo da Vinci', 'Mary Phelps Jacob', 'Coco Chanel', 'Isaac Newton'], ans: 1 },
      { q: 'What is the fastest animal in the world on land?', opts: ['Cheetah', 'Antelope', 'Lion', 'Horse'], ans: 0 },
      { q: "What is the 'Midnight Sun'?", opts: ['An eclipse', 'A polar phenomenon', 'A shooting star', 'A desert'], ans: 1 },
      { q: 'Which of these is NOT one of the Seven Dwarfs?', opts: ['Sleepy', 'Grumpy', 'Glutton', 'Doc'], ans: 2 },
      { q: 'What ingredient is essential to make a meringue?', opts: ['Egg yolk', 'Egg white', 'Condensed milk', 'Flour'], ans: 1 },
      { q: "In which city is the original 'Manneken Pis' statue?", opts: ['Paris', 'Brussels', 'Berlin', 'Amsterdam'], ans: 1 },
      { q: 'What is the tallest mountain in the world from base to top?', opts: ['Everest', 'Mauna Kea', 'K2', 'Mount Fuji'], ans: 1 },
      { q: "Who wrote 'Don Quixote'?", opts: ['Shakespeare', 'Machado de Assis', 'Miguel de Cervantes', 'Dante Alighieri'], ans: 2 },
      { q: "Which chemical element has the symbol 'Au'?", opts: ['Silver', 'Gold', 'Copper', 'Aluminum'], ans: 1 },
      { q: "How many years did the Hundred Years' War last?", opts: ['100', '99', '116', '150'], ans: 2 },
      { q: "What is 'Thyme'?", opts: ['A bird', 'An herb', 'A fish', 'A mineral'], ans: 1 },
      { q: 'What is the largest animal that has ever lived on Earth?', opts: ['Megalodon', 'Blue whale', 'Tyrannosaurus Rex', 'Mammoth'], ans: 1 },
      { q: "Which city is known as the 'Eternal City'?", opts: ['Athens', 'Rome', 'Jerusalem', 'Cairo'], ans: 1 },
      { q: 'How many colors does a rainbow have?', opts: ['5', '6', '7', '8'], ans: 2 },
      { q: 'Who discovered penicillin?', opts: ['Albert Einstein', 'Alexander Fleming', 'Marie Curie', 'Louis Pasteur'], ans: 1 },
      { q: 'Which of these countries does NOT have an army?', opts: ['Costa Rica', 'Brazil', 'Israel', 'North Korea'], ans: 0 },
      { q: 'What is the official language of Angola?', opts: ['French', 'English', 'Portuguese', 'Spanish'], ans: 2 },
      { q: "Who is the author of 'The Little Prince'?", opts: ['Monteiro Lobato', 'Saint-Exupéry', 'Ziraldo', 'J.K. Rowling'], ans: 1 },
      { q: 'In what year did man first walk on the Moon?', opts: ['1965', '1969', '1972', '1959'], ans: 1 },
      { q: 'What is the longest bone in the human body?', opts: ['Radius', 'Femur', 'Tibia', 'Rib'], ans: 1 },
      { q: "What does 'Entomology' study?", opts: ['Insects', 'Fish', 'Birds', 'Reptiles'], ans: 0 },
      { q: 'What is the name of the phobia of spiders?', opts: ['Claustrophobia', 'Arachnophobia', 'Acrophobia', 'Agoraphobia'], ans: 1 },
      { q: "Which planet is known as the 'Red Planet'?", opts: ['Jupiter', 'Mars', 'Venus', 'Saturn'], ans: 1 },
      { q: 'Where was navigator Christopher Columbus born?', opts: ['Spain', 'Portugal', 'Italy', 'France'], ans: 2 },
  ],
  pt: [
      { q: "Qual é a cor da 'caixa-preta' dos aviões comerciais?", opts: ['Preta', 'Azul', 'Laranja', 'Verde fluorescente'], ans: 2 },
      { q: 'Em qual país nasceu o ditador Adolf Hitler?', opts: ['Alemanha', 'Áustria', 'Polônia', 'Hungria'], ans: 1 },
      { q: 'Qual destes animais NÃO é um pássaro?', opts: ['Pinguim', 'Avestruz', 'Morcego', 'Emu'], ans: 2 },
      { q: 'Quanto tempo dura um dia em Vênus?', opts: ['24 horas', '10 horas', 'Mais que um ano em Vênus', '30 dias'], ans: 2 },
      { q: 'Qual é o país com mais fusos horários no mundo?', opts: ['Rússia', 'EUA', 'China', 'França'], ans: 3 },
      { q: "Onde fica o 'Mar da Tranquilidade'?", opts: ['No Oceano Índico', 'Na Lua', 'Na Antártida', 'No Egito'], ans: 1 },
      { q: 'Qual é a cor natural da fêmea do pavão?', opts: ['Azul brilhante', 'Verde metálico', 'Cinza ou marrom', 'Branca'], ans: 2 },
      { q: 'O que acontece se você colocar uma uva no micro-ondas?', opts: ['Ela vira passa', 'Ela explode em plasma', 'Ela não esquenta', 'Ela derrete'], ans: 1 },
      { q: 'Qual era a cor original da Estátua da Liberdade?', opts: ['Verde', 'Dourada', 'Cobre (tipo uma moeda)', 'Branca'], ans: 2 },
      { q: 'Quantos estômagos tem uma vaca?', opts: ['1', '2', '3', '4'], ans: 0 },
      { q: 'Qual destes nomes NÃO faz parte dos três mosqueteiros?', opts: ['Athos', 'Porthos', "D'Artagnan", 'Aramis'], ans: 2 },
      { q: 'De onde veio a batata frita original (French Fries)?', opts: ['França', 'Bélgica', 'EUA', 'Inglaterra'], ans: 1 },
      { q: 'Qual é o único animal que não consegue pular?', opts: ['Rinoceronte', 'Elefante', 'Hipopótamo', 'Preguiça'], ans: 1 },
      { q: "Qual fruto dá em uma árvore chamada 'Cajueiro'?", opts: ['Apenas o Caju', 'Caju e a Castanha', 'Apenas a Castanha', 'Caju e Manga'], ans: 1 },
      { q: "O que o termo 'Avatar' significa originalmente no sânscrito?", opts: ['Perfil', 'Descida de um deus', 'Guerreiro azul', 'Alma'], ans: 1 },
      { q: 'Quantos corações tem uma minhoca?', opts: ['1', '2', '5', 'Nenhum'], ans: 2 },
      { q: 'Qual a capital do Marrocos?', opts: ['Casablanca', 'Marraquexe', 'Rabat', 'Cairo'], ans: 2 },
      { q: "O que é um 'Pneumoultramicroscopicsilicovolcanoconiótico'?", opts: ['Um vulcão', 'Uma doença pulmonar', 'Um tipo de solo', 'Um dinossauro'], ans: 1 },
      { q: 'Qual personagem histórico sobreviveu a 638 tentativas de assassinato?', opts: ['Winston Churchill', 'Fidel Castro', 'Rainha Elizabeth II', 'Stalin'], ans: 1 },
      { q: "O 'Panamá' (chapéu) é originário de qual país?", opts: ['Panamá', 'Equador', 'México', 'Brasil'], ans: 1 },
      { q: 'Qual é o metal que é líquido em temperatura ambiente?', opts: ['Chumbo', 'Mercúrio', 'Alumínio', 'Cobre'], ans: 1 },
      { q: 'Quem pintou o teto da Capela Sistina?', opts: ['Leonardo da Vinci', 'Michelangelo', 'Donatello', 'Rafael'], ans: 1 },
      { q: 'Qual destes animais tem leite cor-de-rosa?', opts: ['Elefante', 'Hipopótamo', 'Porco', 'Baleia'], ans: 1 },
      { q: 'Quantos dentes tem um mosquito?', opts: ['Nenhum', '2', '32', '47'], ans: 3 },
      { q: 'Onde o sushi foi inventado?', opts: ['Japão', 'China', 'Coreia', 'Vietnã'], ans: 1 },
      { q: 'Qual a maior ilha do mundo?', opts: ['Austrália', 'Groenlândia', 'Madagascar', 'Islândia'], ans: 1 },
      { q: 'Quem inventou o sutiã?', opts: ['Leonardo da Vinci', 'Mary Phelps Jacob', 'Coco Chanel', 'Isaac Newton'], ans: 1 },
      { q: 'Qual o animal mais rápido do mundo (em terra)?', opts: ['Guepardo', 'Antílope', 'Leão', 'Cavalo'], ans: 0 },
      { q: "O que é o 'Sol da Meia-Noite'?", opts: ['Um eclipse', 'Um fenômeno nos polos', 'Uma estrela cadente', 'Um deserto'], ans: 1 },
      { q: 'Qual destes NÃO é um dos sete anões?', opts: ['Soneca', 'Dunga', 'Guloso', 'Mestre'], ans: 2 },
      { q: 'Qual ingrediente é essencial para fazer um merengue?', opts: ['Gema de ovo', 'Clara de ovo', 'Leite condensado', 'Farinha'], ans: 1 },
      { q: "Em qual cidade fica a estátua original do 'Manneken Pis'?", opts: ['Paris', 'Bruxelas', 'Berlim', 'Amsterdã'], ans: 1 },
      { q: 'Qual é a montanha mais alta do mundo (da base ao topo)?', opts: ['Everest', 'Mauna Kea', 'K2', 'Monte Fuji'], ans: 1 },
      { q: "Quem escreveu 'Dom Quixote'?", opts: ['Shakespeare', 'Machado de Assis', 'Miguel de Cervantes', 'Dante Alighieri'], ans: 2 },
      { q: "Qual elemento químico tem o símbolo 'Au'?", opts: ['Prata', 'Ouro', 'Cobre', 'Alumínio'], ans: 1 },
      { q: 'Quantos anos durou a Guerra dos Cem Anos?', opts: ['100', '99', '116', '150'], ans: 2 },
      { q: "O que é um 'Tomilho'?", opts: ['Um pássaro', 'Uma erva', 'Um peixe', 'Um mineral'], ans: 1 },
      { q: 'Qual o maior animal que já existiu na Terra?', opts: ['Megalodonte', 'Baleia-azul', 'Tiranossauro Rex', 'Mamute'], ans: 1 },
      { q: "Qual cidade é conhecida como a 'Cidade Eterna'?", opts: ['Atenas', 'Roma', 'Jerusalém', 'Cairo'], ans: 1 },
      { q: 'Quantas cores tem o arco-íris?', opts: ['5', '6', '7', '8'], ans: 2 },
      { q: 'Quem descobriu a penicilina?', opts: ['Albert Einstein', 'Alexander Fleming', 'Marie Curie', 'Louis Pasteur'], ans: 1 },
      { q: 'Qual destes países NÃO possui exército?', opts: ['Costa Rica', 'Brasil', 'Israel', 'Coreia do Norte'], ans: 0 },
      { q: 'Qual a língua oficial de Angola?', opts: ['Francês', 'Inglês', 'Português', 'Espanhol'], ans: 2 },
      { q: "Quem é o autor de 'O Pequeno Príncipe'?", opts: ['Monteiro Lobato', 'Saint-Exupéry', 'Ziraldo', 'J.K. Rowling'], ans: 1 },
      { q: 'Em que ano o homem pisou na Lua pela primeira vez?', opts: ['1965', '1969', '1972', '1959'], ans: 1 },
      { q: 'Qual é o osso mais longo do corpo humano?', opts: ['Rádio', 'Fêmur', 'Tíbia', 'Costela'], ans: 1 },
      { q: "O que estuda a 'Entomologia'?", opts: ['Insetos', 'Peixes', 'Aves', 'Répteis'], ans: 0 },
      { q: 'Qual o nome da fobia de aranhas?', opts: ['Claustrofobia', 'Aracnofobia', 'Acrofobia', 'Agorafobia'], ans: 1 },
      { q: "Qual planeta é conhecido como o 'Planeta Vermelho'?", opts: ['Júpiter', 'Marte', 'Vênus', 'Saturno'], ans: 1 },
      { q: 'Onde nasceu o navegador Cristóvão Colombo?', opts: ['Espanha', 'Portugal', 'Itália', 'França'], ans: 2 },
  ],
  es: [
      { q: "¿De qué color es la 'caja negra' de los aviones comerciales?", opts: ['Negra', 'Azul', 'Naranja', 'Verde fluorescente'], ans: 2 },
      { q: '¿En qué país nació el dictador Adolf Hitler?', opts: ['Alemania', 'Austria', 'Polonia', 'Hungría'], ans: 1 },
      { q: '¿Cuál de estos animales NO es un pájaro?', opts: ['Pingüino', 'Avestruz', 'Murciélago', 'Emú'], ans: 2 },
      { q: '¿Cuánto dura un día en Venus?', opts: ['24 horas', '10 horas', 'Más que un año en Venus', '30 días'], ans: 2 },
      { q: '¿Qué país tiene más husos horarios en el mundo?', opts: ['Rusia', 'EE.UU.', 'China', 'Francia'], ans: 3 },
      { q: "¿Dónde está el 'Mar de la Tranquilidad'?", opts: ['En el Océano Índico', 'En la Luna', 'En la Antártida', 'En Egipto'], ans: 1 },
      { q: '¿Cuál es el color natural de la pava real?', opts: ['Azul brillante', 'Verde metálico', 'Gris o marrón', 'Blanca'], ans: 2 },
      { q: '¿Qué pasa si metes una uva al microondas?', opts: ['Se convierte en pasa', 'Explota en plasma', 'No se calienta', 'Se derrite'], ans: 1 },
      { q: '¿Cuál era el color original de la Estatua de la Libertad?', opts: ['Verde', 'Dorada', 'Cobre (como una moneda)', 'Blanca'], ans: 2 },
      { q: '¿Cuántos estómagos tiene una vaca?', opts: ['1', '2', '3', '4'], ans: 0 },
      { q: '¿Cuál de estos NO es uno de los tres mosqueteros?', opts: ['Athos', 'Porthos', "D'Artagnan", 'Aramis'], ans: 2 },
      { q: '¿De dónde vienen las papas fritas originales (French Fries)?', opts: ['Francia', 'Bélgica', 'EE.UU.', 'Inglaterra'], ans: 1 },
      { q: '¿Cuál es el único animal que no puede saltar?', opts: ['Rinoceronte', 'Elefante', 'Hipopótamo', 'Perezoso'], ans: 1 },
      { q: '¿Qué fruto da el árbol del anacardo?', opts: ['Solo el marañón', 'El marañón y la nuez', 'Solo la nuez', 'Marañón y mango'], ans: 1 },
      { q: "¿Qué significa el término 'Avatar' en sánscrito?", opts: ['Perfil', 'Descenso de un dios', 'Guerrero azul', 'Alma'], ans: 1 },
      { q: '¿Cuántos corazones tiene una lombriz?', opts: ['1', '2', '5', 'Ninguno'], ans: 2 },
      { q: '¿Cuál es la capital de Marruecos?', opts: ['Casablanca', 'Marrakech', 'Rabat', 'El Cairo'], ans: 2 },
      { q: "¿Qué es la 'Pneumonoultramicroscopicsilicovolcanoconiosis'?", opts: ['Un volcán', 'Una enfermedad pulmonar', 'Un tipo de suelo', 'Un dinosaurio'], ans: 1 },
      { q: '¿Qué personaje histórico sobrevivió 638 intentos de asesinato?', opts: ['Winston Churchill', 'Fidel Castro', 'Reina Isabel II', 'Stalin'], ans: 1 },
      { q: '¿El sombrero Panamá es originario de qué país?', opts: ['Panamá', 'Ecuador', 'México', 'Brasil'], ans: 1 },
      { q: '¿Cuál es el metal líquido a temperatura ambiente?', opts: ['Plomo', 'Mercurio', 'Aluminio', 'Cobre'], ans: 1 },
      { q: '¿Quién pintó el techo de la Capilla Sixtina?', opts: ['Leonardo da Vinci', 'Miguel Ángel', 'Donatello', 'Rafael'], ans: 1 },
      { q: '¿Cuál de estos animales tiene leche rosada?', opts: ['Elefante', 'Hipopótamo', 'Cerdo', 'Ballena'], ans: 1 },
      { q: '¿Cuántos dientes tiene un mosquito?', opts: ['Ninguno', '2', '32', '47'], ans: 3 },
      { q: '¿Dónde fue inventado el sushi?', opts: ['Japón', 'China', 'Corea', 'Vietnam'], ans: 1 },
      { q: '¿Cuál es la isla más grande del mundo?', opts: ['Australia', 'Groenlandia', 'Madagascar', 'Islandia'], ans: 1 },
      { q: '¿Quién inventó el sostén?', opts: ['Leonardo da Vinci', 'Mary Phelps Jacob', 'Coco Chanel', 'Isaac Newton'], ans: 1 },
      { q: '¿Cuál es el animal más rápido del mundo en tierra?', opts: ['Guepardo', 'Antílope', 'León', 'Caballo'], ans: 0 },
      { q: "¿Qué es el 'Sol de Medianoche'?", opts: ['Un eclipse', 'Un fenómeno polar', 'Una estrella fugaz', 'Un desierto'], ans: 1 },
      { q: '¿Cuál de estos NO es uno de los siete enanitos?', opts: ['Dormilón', 'Gruñón', 'Glotón', 'Sabio'], ans: 2 },
      { q: '¿Qué ingrediente es esencial para un merengue?', opts: ['Yema de huevo', 'Clara de huevo', 'Leche condensada', 'Harina'], ans: 1 },
      { q: "¿En qué ciudad está la estatua original del 'Manneken Pis'?", opts: ['París', 'Bruselas', 'Berlín', 'Ámsterdam'], ans: 1 },
      { q: '¿Cuál es la montaña más alta del mundo de la base a la cima?', opts: ['Everest', 'Mauna Kea', 'K2', 'Monte Fuji'], ans: 1 },
      { q: "¿Quién escribió 'Don Quijote'?", opts: ['Shakespeare', 'Machado de Assis', 'Miguel de Cervantes', 'Dante Alighieri'], ans: 2 },
      { q: "¿Qué elemento químico tiene el símbolo 'Au'?", opts: ['Plata', 'Oro', 'Cobre', 'Aluminio'], ans: 1 },
      { q: '¿Cuántos años duró la Guerra de los Cien Años?', opts: ['100', '99', '116', '150'], ans: 2 },
      { q: "¿Qué es el 'Tomillo'?", opts: ['Un pájaro', 'Una hierba', 'Un pez', 'Un mineral'], ans: 1 },
      { q: '¿Cuál es el animal más grande que ha existido en la Tierra?', opts: ['Megalodón', 'Ballena azul', 'Tiranosaurio Rex', 'Mamut'], ans: 1 },
      { q: "¿Qué ciudad es conocida como la 'Ciudad Eterna'?", opts: ['Atenas', 'Roma', 'Jerusalén', 'El Cairo'], ans: 1 },
      { q: '¿Cuántos colores tiene el arcoíris?', opts: ['5', '6', '7', '8'], ans: 2 },
      { q: '¿Quién descubrió la penicilina?', opts: ['Albert Einstein', 'Alexander Fleming', 'Marie Curie', 'Louis Pasteur'], ans: 1 },
      { q: '¿Cuál de estos países NO tiene ejército?', opts: ['Costa Rica', 'Brasil', 'Israel', 'Corea del Norte'], ans: 0 },
      { q: '¿Cuál es el idioma oficial de Angola?', opts: ['Francés', 'Inglés', 'Portugués', 'Español'], ans: 2 },
      { q: "¿Quién es el autor de 'El Principito'?", opts: ['Monteiro Lobato', 'Saint-Exupéry', 'Ziraldo', 'J.K. Rowling'], ans: 1 },
      { q: '¿En qué año pisó el hombre la Luna por primera vez?', opts: ['1965', '1969', '1972', '1959'], ans: 1 },
      { q: '¿Cuál es el hueso más largo del cuerpo humano?', opts: ['Radio', 'Fémur', 'Tibia', 'Costilla'], ans: 1 },
      { q: "¿Qué estudia la 'Entomología'?", opts: ['Insectos', 'Peces', 'Aves', 'Reptiles'], ans: 0 },
      { q: '¿Cómo se llama la fobia a las arañas?', opts: ['Claustrofobia', 'Aracnofobia', 'Acrofobia', 'Agorafobia'], ans: 1 },
      { q: "¿Qué planeta es conocido como el 'Planeta Rojo'?", opts: ['Júpiter', 'Marte', 'Venus', 'Saturno'], ans: 1 },
      { q: '¿Dónde nació el navegante Cristóbal Colón?', opts: ['España', 'Portugal', 'Italia', 'Francia'], ans: 2 },
  ],
};

// ---------- Fake Ads ----------
const FAKE_ADS = {
  pt: [
    { title: 'ARMAZÉM PARAÍBA', tagline: 'O sofá dura dois anos. O carnê, vinte.' },
    { title: 'BRISANET', tagline: 'Internet de fibra óptica. Fibra que desaparece quando chove.' },
    { title: 'POSTO SÃO LUIZ', tagline: 'Gasolina a preço de uísque importado. Café a preço de gasolina.' },
    { title: 'REAL BUS', tagline: 'O único ônibus do Nordeste com clima de Sibéria.' },
    { title: 'CAGEPA', tagline: 'Cobramos com precisão pela água que o cano ainda não conhece.' },
    { title: 'SÃO BRAZ', tagline: 'O café que acorda. O cuscuz que sustenta. A conta que assusta.' },
    { title: 'ENERGISA', tagline: 'A conta chega antes da luz.' },
    { title: 'UNIMED JP', tagline: 'Cuide da sua saúde — a consulta é só daqui seis meses.' },
    { title: 'ALPARGATAS', tagline: 'Resistente a tudo. Exceto ao chão.' },
    { title: 'UNIFACISA', tagline: 'Diplomas entregues com vento incluso.' },
    { title: 'REDE COMPRAS', tagline: 'Promoção todo dia. Desconto, só no cartaz.' },
    { title: 'MANAÍRA SHOPPING', tagline: 'Você entra de carteira cheia. A gente trata do resto.' },
  ],
  en: [
    { title: 'ARMAZÉM PARAÍBA', tagline: 'The sofa lasts two years. The installment plan, twenty.' },
    { title: 'BRISANET', tagline: 'Fiber optic internet. Fiber that vanishes when it rains.' },
    { title: 'POSTO SÃO LUIZ', tagline: 'Gas at imported whiskey prices. Coffee at gas prices.' },
    { title: 'REAL BUS', tagline: 'The only bus in the Northeast with a Siberian climate setting.' },
    { title: 'CAGEPA', tagline: 'Precision billing for water the pipes have yet to meet.' },
    { title: 'SÃO BRAZ', tagline: 'The coffee that wakes you. The cuscuz that feeds you. The bill that haunts you.' },
    { title: 'ENERGISA', tagline: 'The bill arrives before the power does.' },
    { title: 'UNIMED JP', tagline: 'Take care of your health — your appointment is in six months.' },
    { title: 'ALPARGATAS', tagline: 'Built to last. Except on pavement.' },
    { title: 'UNIFACISA', tagline: 'Degrees delivered with complimentary wind.' },
    { title: 'REDE COMPRAS', tagline: 'Sales every day. Discounts only on the sign.' },
    { title: 'MANAÍRA SHOPPING', tagline: 'You walk in with a full wallet. We handle the rest.' },
  ],
  es: [
    { title: 'ARMAZÉM PARAÍBA', tagline: 'El sofá dura dos años. El carnê, veinte.' },
    { title: 'BRISANET', tagline: 'Internet de fibra óptica. Fibra que desaparece cuando llueve.' },
    { title: 'POSTO SÃO LUIZ', tagline: 'Gasolina a precio de whisky importado. Café a precio de gasolina.' },
    { title: 'REAL BUS', tagline: 'El único autobús del Nordeste con clima de Siberia.' },
    { title: 'CAGEPA', tagline: 'Cobramos con precisión por el agua que el caño aún no conoce.' },
    { title: 'SÃO BRAZ', tagline: 'El café que despierta. El cuscuz que alimenta. La factura que asusta.' },
    { title: 'ENERGISA', tagline: 'La factura llega antes que la luz.' },
    { title: 'UNIMED JP', tagline: 'Cuida tu salud — la consulta es en seis meses.' },
    { title: 'ALPARGATAS', tagline: 'Resistente a todo. Excepto al suelo.' },
    { title: 'UNIFACISA', tagline: 'Títulos entregados con viento incluido.' },
    { title: 'REDE COMPRAS', tagline: 'Ofertas todos los días. Descuentos, solo en el cartel.' },
    { title: 'MANAÍRA SHOPPING', tagline: 'Entras con la billetera llena. Nosotros nos encargamos del resto.' },
  ],
};

// ---------- Lang Context ----------
const LangContext = createContext({ lang: 'en', setLang: () => {}, t: TRANSLATIONS.en });
function useLang() { return useContext(LangContext); }

// ---------- Card generation ----------
function makeCard() {
  const pool = [];
  for (let i = 1; i <= 72; i++) pool.push(i);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const nums = pool.slice(0, 24);
  const flat = [];
  let idx = 0;
  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      if (r === 2 && c === 2) flat.push("FREE");
      else flat.push(nums[idx++]);
    }
  }
  return flat;
}

const MASCOT_POOL = ['🦊','🐱','🦋','🐸','🦉','🦄','🐧','🐯','🐼','🦝','🐨','🦁','🐙','🦕','🐢','🦔'];
function mascotFor(name) {
  if (!name) return MASCOT_POOL[0];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return MASCOT_POOL[h % MASCOT_POOL.length];
}

// ---------- Shared UI ----------

const inputStyle = {
  width: '100%', padding: '14px 16px',
  background: '#fafafa', border: '2px solid #afafaf',
  borderRadius: 14, fontSize: 17, fontWeight: 800,
  fontFamily: 'inherit', color: '#3c3c3c', outline: 'none',
  boxShadow: '0 2px 0 #afafaf', boxSizing: 'border-box',
};

function ScreenShell({ children, back }) {
  return (
    <div style={{
      minHeight: '100vh', overflowY: 'auto', background: '#f7fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(16px, 4vw, 32px)',
      fontFamily: '"Nunito", system-ui, sans-serif', boxSizing: 'border-box',
      position: 'relative',
    }}>
      {back}
      <div style={{
        width: '100%', maxWidth: 460,
        background: '#ffffff', border: '2px solid #e5e5e5',
        borderRadius: 28, boxShadow: '0 6px 0 #e5e5e5',
        padding: 'clamp(22px, 4vw, 32px) clamp(20px, 4vw, 28px)',
        position: 'relative',
        animation: 'screenIn 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        boxSizing: 'border-box',
      }}>
        {children}
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 48, fontWeight: 900, color: '#3c3c3c', letterSpacing: '-0.035em', lineHeight: 1 }}>DaubCard</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <span style={{ fontSize: 11, fontWeight: 900, color: '#6b6b6b', letterSpacing: '0.2em' }}>{label}</span>
      {children}
    </label>
  );
}

function BigCta({ children, onClick, disabled, pulse, variant = 'green' }) {
  const [pressed, setPressed] = useState(false);
  const bg    = variant === 'blue' ? '#1cb0f6' : variant === 'orange' ? '#ff9600' : '#58cc02';
  const shade = variant === 'blue' ? '#0d8fcc' : variant === 'orange' ? '#cc7700' : '#46a302';
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', height: '100%', boxSizing: 'border-box',
        padding: 'clamp(12px, 1.5vh, 18px) 0',
        background: disabled ? '#cfd2d6' : bg,
        color: '#ffffff', border: 'none', borderRadius: 'clamp(12px, 1.5vw, 18px)',
        boxShadow: disabled ? '0 2px 0 #b3b6ba' : pressed ? `0 1px 0 ${shade}` : `0 5px 0 ${shade}`,
        transform: pressed && !disabled ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 80ms ease, box-shadow 80ms ease',
        fontFamily: 'inherit', fontWeight: 900, fontSize: 'clamp(15px, 2vw, 20px)',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
      }}
    >
      {pulse && !disabled && <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', animation: `${variant === 'blue' ? 'buttonPulseBlue' : 'buttonPulse'} 1.8s ease-out infinite`, pointerEvents: 'none' }} />}
      {children}
    </button>
  );
}

function BackLink({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      position: 'absolute', top: 18, left: 22,
      background: 'transparent', border: 'none', cursor: 'pointer',
      fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
      color: '#6b6b6b', padding: 6,
    }}>{children}</button>
  );
}

function ChunkyButton({ onClick, variant = 'primary', children, disabled }) {
  const [pressed, setPressed] = useState(false);
  const VARIANTS = { ghost: { bg: '#ffffff', fg: '#3c3c3c', border: '#e5e5e5', shadow: '#cfcfcf' }, danger: { bg: '#ff4b4b', fg: '#ffffff', border: '#ff4b4b', shadow: '#d63030' }, primary: { bg: '#58cc02', fg: '#ffffff', border: '#58cc02', shadow: '#46a302' } };
  const v = VARIANTS[variant] || VARIANTS.primary;
  return (
    <button onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)} onClick={onClick} disabled={disabled}
      style={{ width: '100%', padding: '14px 16px', background: disabled ? '#cfd2d6' : v.bg, color: disabled ? '#fff' : v.fg, border: `2px solid ${disabled ? '#b3b6ba' : v.border}`, borderRadius: 14, boxShadow: pressed && !disabled ? `0 1px 0 ${v.shadow}` : `0 4px 0 ${v.shadow}`, transform: pressed && !disabled ? 'translateY(3px)' : 'translateY(0)', transition: 'transform 60ms ease, box-shadow 60ms ease', fontFamily: 'inherit', fontWeight: 900, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: disabled ? 'not-allowed' : 'pointer' }}
    >{children}</button>
  );
}

function IconButton({ onClick, children, title, style: extraStyle = {} }) {
  return (
    <button onClick={onClick} title={title} style={{ width: 40, height: 40, background: '#ffffff', border: '2px solid #e5e5e5', borderRadius: 12, boxShadow: '0 2px 0 #e5e5e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, ...extraStyle }}>
      {children}
    </button>
  );
}

function InfoIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" /><circle cx="12" cy="7.5" r="1.3" fill="currentColor" /><path d="M12 11v6.5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" /></svg>;
}
function ExitIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M15 4h3.5a1.5 1.5 0 0 1 1.5 1.5v13a1.5 1.5 0 0 1-1.5 1.5H15" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /><path d="M10 8l-4 4 4 4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M6 12h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>;
}

// ---------- Lang Picker ----------
function TwemojiFlag({ emoji }) {
  const html = window.twemoji
    ? twemoji.parse(emoji, { folder: 'svg', ext: '.svg', attributes: () => ({ style: 'height:1.1em;width:1.1em;vertical-align:-0.15em' }) })
    : emoji;
  return <span dangerouslySetInnerHTML={{ __html: html }} style={{ display: 'inline-flex', alignItems: 'center' }} />;
}

function LangPicker() {
  const { lang, setLang } = useLang();
  const options = [
    { code: 'pt', flag: '🇧🇷', label: 'PT' },
    { code: 'en', flag: '🇺🇸', label: 'EN' },
    { code: 'es', flag: '🇪🇸', label: 'ES' },
  ];
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
      {options.map(({ code, flag, label }) => {
        const active = lang === code;
        return (
          <button key={code} onClick={() => setLang(code)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 99,
            background: active ? '#afafaf' : '#ffffff',
            color: active ? '#ffffff' : '#7a7a7a',
            border: `2px solid ${active ? '#afafaf' : '#e5e5e5'}`,
            boxShadow: active ? '0 2px 0 #8a8a8a' : '0 2px 0 #e5e5e5',
            fontFamily: 'inherit', fontWeight: 900, fontSize: 13, letterSpacing: '0.08em',
            cursor: 'pointer', transition: 'all 120ms ease',
          }}>
            <TwemojiFlag emoji={flag} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Welcome Screen ----------
function WelcomeScreen({ onContinue, initialName, error, claiming }) {
  const { t } = useLang();
  const [name, setName] = useState(initialName || '');
  const trimmed = name.trim();
  const canGo = trimmed.length >= 2;
  const tooLong = trimmed.length > 12;
  const showError = !tooLong && error;

  return (
    <ScreenShell>
      <Logo />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
        <span style={{ width: 24, height: 2, background: '#e5e5e5', borderRadius: 2 }} />
        <span style={{ fontSize: 12, fontWeight: 900, color: '#7a7a7a', letterSpacing: '0.22em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{t.developedBy}</span>
        <span style={{ width: 24, height: 2, background: '#e5e5e5', borderRadius: 2 }} />
      </div>
      <LangPicker />
      <div style={{ textAlign: 'center' }}>
        <Field label={t.nameLabel}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} autoFocus style={{ ...inputStyle, textAlign: 'center', borderColor: tooLong || showError ? '#ff4b4b' : undefined }} onKeyDown={(e) => e.key === 'Enter' && canGo && !tooLong && !claiming && onContinue({ name: trimmed })} />
        </Field>
        {tooLong && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: '#ff4b4b' }}>{t.nameTooLong}</div>}
        {showError && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: '#ff4b4b' }}>{error}</div>}
      </div>
      <div style={{ marginTop: 28 }}>
        <BigCta disabled={!canGo || tooLong || claiming} onClick={() => canGo && !tooLong && !claiming && onContinue({ name: trimmed })}>
          {t.continue}
        </BigCta>
      </div>
    </ScreenShell>
  );
}

// ---------- Join Screen ----------
function JoinScreen({ onJoin, onBack, error }) {
  const { t } = useLang();
  const [room, setRoom] = useState('');
  const canGo = room.trim().length >= 1;

  return (
    <ScreenShell>
      <BackLink onClick={onBack}>{t.back}</BackLink>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#3c3c3c', textAlign: 'center', marginBottom: 28, marginTop: 28 }}>{t.enterRoomCode}</div>
      <div style={{ padding: '18px 20px', background: '#ffffff', border: '2px solid #ff9600', borderRadius: 20, boxShadow: '0 5px 0 #cc7700', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#6b6b6b', letterSpacing: '0.2em' }}>{t.roomLabel}</span>
        <input type="text" value={room} onChange={(e) => setRoom(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="00" autoFocus style={{ ...inputStyle, letterSpacing: '0.2em', fontVariantNumeric: 'tabular-nums', fontSize: 32, textAlign: 'center', padding: '10px 16px' }} onKeyDown={(e) => e.key === 'Enter' && canGo && onJoin(room.trim())} />
      </div>
      {error && <div style={{ marginTop: 12, fontSize: 13, fontWeight: 800, color: '#ff4b4b', textAlign: 'center' }}>{error}</div>}
      <div style={{ marginTop: 14 }}>
        <BigCta variant="orange" disabled={!canGo} onClick={() => canGo && onJoin(room.trim())}>{t.join}</BigCta>
      </div>
    </ScreenShell>
  );
}

// ---------- Home Screen ----------
function HomeScreen({ name, onPick, onBack, generating, genError }) {
  const { t } = useLang();
  return (
    <ScreenShell>
      <BackLink onClick={onBack}>{t.back}</BackLink>
      <div style={{ textAlign: 'center', marginBottom: 28, marginTop: 28 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: '#3c3c3c' }}>{t.greeting.replace('{name}', name)}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginTop: 6 }}>{t.whatToDo}</div>
      </div>
      {genError && <div style={{ color: '#ff4b4b', fontWeight: 700, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>{genError}</div>}
      <div style={{ display: 'grid', gap: 14 }}>
        <HomeCard color="#58cc02" emoji="🎙️" title={t.createRoom} desc={t.createDesc} onClick={() => !generating && onPick('host')} />
        <HomeCard color="#1cb0f6" emoji="🎟️" title={t.joinRoom} desc={t.joinDesc} onClick={() => !generating && onPick('cast')} />
      </div>
    </ScreenShell>
  );
}

function HomeCard({ color, emoji, title, desc, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)} onClick={onClick}
      style={{ textAlign: 'left', padding: 18, background: '#ffffff', border: `2px solid ${color}`, borderRadius: 20, boxShadow: pressed ? `0 1px 0 ${color}` : `0 5px 0 ${color}`, transform: pressed ? 'translateY(4px)' : 'translateY(0)', transition: 'transform 80ms ease, box-shadow 80ms ease', cursor: 'pointer', display: 'grid', gridTemplateColumns: '64px 1fr', gap: 16, alignItems: 'center', fontFamily: 'inherit' }}>
      <div style={{ width: 64, height: 64, background: color + '14', border: `2px solid ${color}`, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{emoji}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c', letterSpacing: '0.04em' }}>{title}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#7a7a7a', lineHeight: 1.4 }}>{desc}</div>
      </div>
    </button>
  );
}

// ---------- Shared overlays ----------

function ExitModal({ onCancel, onConfirm, room }) {
  const { t } = useLang();
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(31, 41, 55, 0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 180ms ease forwards' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: 'min(80vh, 560px)', background: '#ffffff', border: '3px solid #ff9600', borderRadius: 24, boxShadow: '0 12px 0 #cc7700, 0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', textAlign: 'center', position: 'relative', animation: 'modalPop 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards', display: 'flex', flexDirection: 'column' }}>
        <button onClick={onCancel} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, background: '#fff3e0', border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 900, color: '#ff9600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
        <div style={{ padding: '32px 28px 8px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#6b6b6b', letterSpacing: '0.18em', marginBottom: 4 }}>{t.roomLabel} {String(room).padStart(2, '0')}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c' }}>{t.exitRoomQuestion}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 22px', display: 'flex', flexDirection: 'column', gap: 16, borderTop: '2px solid #f3f3f3' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#7a7a7a', lineHeight: 1.45 }}>{t.exitRoomBody}</div>
          <ChunkyButton onClick={onConfirm} variant="danger">{t.exit}</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

function LineNotif({ name, onClose }) {
  const { t } = useLang();
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [name]);
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 70 }}>
      <div style={{ background: '#ffffff', border: '4px solid #1cb0f6', borderRadius: 32, boxShadow: '0 10px 0 #0d8fcc, 0 20px 60px rgba(0,0,0,0.18)', padding: '4vh 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1vh', width: '50vw', height: '50vh', animation: 'calloutPop 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ fontSize: 'clamp(48px, 10vw, 112px)', fontWeight: 900, color: '#1cb0f6', letterSpacing: '-0.04em', lineHeight: 1 }}>LINE!</div>
        <div style={{ fontSize: 'clamp(18px, 2.8vw, 32px)', fontWeight: 900, color: '#3c3c3c' }}>{t.gotItPre}{name}{t.gotItPost}</div>
      </div>
    </div>
  );
}

function WinNotif({ name, onClose }) {
  const { t } = useLang();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 200ms ease forwards' }}>
      <div style={{ background: '#ffffff', border: '4px solid #58cc02', borderRadius: 32, boxShadow: '0 12px 0 #46a302, 0 24px 64px rgba(0,0,0,0.22)', padding: '40px 32px 28px', textAlign: 'center', maxWidth: 360, width: '100%', animation: 'modalPop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b6b6b', fontWeight: 900, lineHeight: 1, padding: 4 }}>✕</button>
        <div role="img" aria-label="Troféu" style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
        <div style={{ fontSize: 36, fontWeight: 900, color: '#58cc02', letterSpacing: '-0.02em', lineHeight: 1 }}>BINGO!</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#3c3c3c', marginTop: 10, marginBottom: 22 }}>{t.gotItPre}{name}{t.gotItPost}</div>
        <BigCta onClick={onClose}>{t.seeResults}</BigCta>
      </div>
    </div>
  );
}

function GameConfetti() {
  const colors = ['#58cc02', '#ffc800', '#1cb0f6', '#ff4b4b', '#ce82ff', '#ff9600'];
  const pieces = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    left: Math.random() * 100, delay: Math.random() * 0.5, dur: 1.6 + Math.random() * 1.2,
    color: colors[i % colors.length], size: 8 + Math.random() * 8, rot: Math.random() * 360,
  })), []);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 60 }}>
      {pieces.map((p, i) => (
        <div key={i} style={{ position: 'absolute', top: -20, left: `${p.left}%`, width: p.size, height: p.size * 0.5, background: p.color, borderRadius: 2, transform: `rotate(${p.rot}deg)`, animation: `confettiFall ${p.dur}s ${p.delay}s linear forwards` }} />
      ))}
    </div>
  );
}

// ---------- Fake Ad Modal ----------
function FakeAdModal({ ad, lang, onClose, isHost = false }) {
  useEffect(() => { playFx('ad'); }, []);
  const header = lang === 'pt' ? 'OFERECIMENTO:' : lang === 'es' ? 'PRESENTADO POR:' : 'BROUGHT TO YOU BY:';
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 96, background: '#100800', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 250ms ease forwards' }}>
      {isHost && (
        <button onClick={onClose} style={{ position: 'absolute', top: 18, right: 18, width: 44, height: 44, background: 'rgba(255,150,0,0.15)', border: '2px solid rgba(255,150,0,0.4)', borderRadius: 14, fontSize: 20, fontWeight: 900, color: '#ff9600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>✕</button>
      )}
      <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#ff9600', letterSpacing: '0.28em', marginBottom: 24 }}>{header}</div>
        <div style={{ fontSize: 'clamp(28px, 6vw, 52px)', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em', lineHeight: 1.1, marginBottom: 28, textTransform: 'uppercase' }}>{ad.title}</div>
        <div style={{ fontSize: 'clamp(16px, 2.8vw, 24px)', fontWeight: 700, color: '#ffe0a0', fontStyle: 'italic', lineHeight: 1.5 }}>"{ad.tagline}"</div>
      </div>
    </div>
  );
}

// ---------- PendingApprovalModal ----------

function PendingApprovalModal({ pending, onApprove, onReject }) {
  const { t } = useLang();
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(31,41,55,0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 180ms ease forwards' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#ffffff', border: '3px solid #ff9600', borderRadius: 24, boxShadow: '0 12px 0 #cc7700, 0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', animation: 'modalPop 280ms cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
        <div style={{ padding: '24px 24px 8px', borderBottom: '2px solid #f3f3f3' }}>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c' }}>🚪 {t.waitingForApprovalTitle}</div>
        </div>
        <div style={{ padding: '12px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {pending.map(p => (
            <div key={p.uid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#fafafa', border: '2px solid #e5e5e5', borderRadius: 14 }}>
              <div style={{ fontSize: 20, flexShrink: 0 }}>{mascotFor(p.name)}</div>
              <div style={{ flex: 1, fontWeight: 800, color: '#3c3c3c', fontSize: 15 }}>{p.name}</div>
              <button onClick={() => onReject(p.uid)} style={{ padding: '7px 12px', background: '#fff0f0', border: '2px solid #ff4b4b', borderRadius: 10, fontFamily: 'inherit', fontWeight: 900, fontSize: 12, color: '#ff4b4b', cursor: 'pointer', letterSpacing: '0.06em' }}>{t.reject}</button>
              <button onClick={() => onApprove(p.uid, p.name, p.card)} style={{ padding: '7px 12px', background: '#f0fff0', border: '2px solid #58cc02', borderRadius: 10, fontFamily: 'inherit', fontWeight: 900, fontSize: 12, color: '#46a302', cursor: 'pointer', letterSpacing: '0.06em' }}>{t.approve}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Trivia Modal ----------

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

function TriviaActiveModal({ trivia, room, playerId, isHost, lang }) {
  const { t } = useLang();
  const [timeLeft, setTimeLeft] = useState(60);
  const [chosen, setChosen] = useState(null);
  const isPlayer = !isHost && trivia.playerId === playerId;
  const isReady = trivia.state === 'ready';
  const answered = trivia.state === 'answered';

  const bank = TRIVIA_QUESTIONS[lang] || TRIVIA_QUESTIONS.en;
  const qData = bank[trivia.questionIdx] || bank[0];

  useEffect(() => {
    if (trivia.state !== 'question' || !trivia.startedAt) return;
    const tick = () => {
      const elapsed = (Date.now() - trivia.startedAt) / 1000;
      const rem = Math.max(0, 60 - Math.floor(elapsed));
      setTimeLeft(rem);
      if (rem === 0 && isPlayer && !trivia.answer) {
        sessionRef(room).update({ 'trivia.answer': 'timeout', 'trivia.state': 'answered' });
      }
    };
    tick();
    const id = setInterval(tick, 500);
    return () => clearInterval(id);
  }, [trivia.state, trivia.startedAt, trivia.answer]);

  function submitAnswer(idx) {
    if (!isPlayer || trivia.state !== 'question' || chosen !== null) return;
    setChosen(idx);
    const isCorrect = idx === qData.ans;
    const update = { 'trivia.answer': String(idx), 'trivia.state': 'answered' };
    if (isCorrect) update[`triviaScores.${playerId}`] = firebase.firestore.FieldValue.increment(1);
    sessionRef(room).update(update);
  }

  function startQuestion() {
    sessionRef(room).update({ 'trivia.state': 'question', 'trivia.startedAt': Date.now() });
  }

  function close() {
    sessionRef(room).update({ trivia: firebase.firestore.FieldValue.delete() });
  }

  useEffect(() => {
    if (trivia.state === 'ready') playFx('triviaReady');
    else if (trivia.state === 'question') playFx('triviaStart');
    else if (trivia.state === 'answered') {
      const b = TRIVIA_QUESTIONS[lang] || TRIVIA_QUESTIONS.en;
      const q = b[trivia.questionIdx] || b[0];
      playFx(trivia.answer !== 'timeout' && parseInt(trivia.answer) === q?.ans ? 'triviaCorrect' : 'triviaWrong');
    }
  }, [trivia.state]);

  const answeredIdx = answered && trivia.answer !== 'timeout' ? parseInt(trivia.answer) : null;
  const isCorrect = answeredIdx === qData?.ans;
  const timerColor = timeLeft > 20 ? '#58cc02' : timeLeft > 10 ? '#ff9600' : '#ff4b4b';
  if (isReady) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(31,41,55,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 180ms ease forwards' }}>
        <div style={{ width: '100%', maxWidth: 480, background: '#ffffff', border: '3px solid #1cb0f6', borderRadius: 24, boxShadow: '0 12px 0 #0d8fcc, 0 24px 64px rgba(0,0,0,0.2)', padding: '28px 28px 24px', textAlign: 'center', animation: 'modalPop 280ms cubic-bezier(0.34,1.56,0.64,1) forwards' }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🎯</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 22 }}>{t.gotItPre}{trivia.playerName}{t.gotItPost}</div>
          {isHost ? (
            <button onClick={startQuestion} style={{ width: '100%', padding: '14px 0', background: '#1cb0f6', border: 'none', borderRadius: 14, boxShadow: '0 4px 0 #0d8fcc', fontFamily: 'inherit', fontWeight: 900, fontSize: 16, color: '#ffffff', letterSpacing: '0.06em', cursor: 'pointer' }}>{t.triviaStartQuestion}</button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0,1,2].map(i => <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#1cb0f6', animation: `rollDots 1.2s ${i * 0.2}s ease-in-out infinite` }} />)}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a' }}>{t.triviaGuestWaiting}</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 88, background: 'rgba(31,41,55,0.6)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 180ms ease forwards' }}>
      <div style={{ width: '100%', maxWidth: 680, background: '#ffffff', border: '3px solid #1cb0f6', borderRadius: 24, boxShadow: '0 12px 0 #0d8fcc, 0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'modalPop 280ms cubic-bezier(0.34,1.56,0.64,1) forwards' }}>

        {/* Header */}
        <div style={{ padding: '12px 20px', background: '#e8f7ff', borderBottom: '2px solid #f3f3f3', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#3c3c3c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {answered ? (trivia.answer === 'timeout' ? t.triviaTimeout : isCorrect ? t.triviaCorrect : t.triviaWrong) : (isPlayer ? t.triviaYourTurn : t.triviaWaitingAnswer.replace('{name}', trivia.playerName))}
            </span>
          </div>
          {!answered && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, flexShrink: 0 }}>
              <span style={{ fontSize: 26, fontWeight: 900, color: timerColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{timeLeft}</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#afafaf', letterSpacing: '0.1em' }}>S</span>
            </div>
          )}
        </div>

        {/* Question + Options */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: 15, fontWeight: 900, color: '#3c3c3c', lineHeight: 1.45, marginBottom: 14 }}>{qData?.q}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {qData?.opts.map((opt, i) => {
              let bg = '#fafafa', border = '2px solid #e5e5e5', color = '#3c3c3c';
              if (answered) {
                if (i === qData.ans) { bg = '#e7f8d4'; border = '2px solid #58cc02'; color = '#46a302'; }
                else if (i === answeredIdx && !isCorrect) { bg = '#fff0f0'; border = '2px solid #ff4b4b'; color = '#ff4b4b'; }
                else { color = '#afafaf'; border = '2px solid #ececec'; }
              }
              const clickable = isPlayer && !answered && chosen === null;
              return (
                <button key={i} onClick={() => clickable && submitAnswer(i)} disabled={!clickable}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: bg, border, borderRadius: 12, fontFamily: 'inherit', cursor: clickable ? 'pointer' : 'default', transition: 'all 120ms ease', textAlign: 'left' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 7, background: answered && i === qData.ans ? '#58cc02' : answered && i === answeredIdx && !isCorrect ? '#ff4b4b' : '#ececec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 900, color: answered && (i === qData.ans || (i === answeredIdx && !isCorrect)) ? '#fff' : '#6b6b6b', flexShrink: 0 }}>{OPTION_LABELS[i]}</span>
                  <span style={{ fontSize: 13, fontWeight: 800, color, lineHeight: 1.3 }}>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        {answered && isHost && (
          <div style={{ padding: '4px 20px 16px' }}>
            <button onClick={close} style={{ width: '100%', padding: '12px 0', background: '#58cc02', border: 'none', borderRadius: 12, boxShadow: '0 3px 0 #46a302', fontFamily: 'inherit', fontWeight: 900, fontSize: 14, color: '#fff', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}>{t.triviaClose}</button>
          </div>
        )}
        {answered && !isHost && (
          <div style={{ padding: '8px 20px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#afafaf' }}>{t.triviaWaitingContinue}</div>
        )}
        {!answered && !isHost && !isPlayer && (
          <div style={{ padding: '8px 20px 14px', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#afafaf' }}>{t.triviaWaitingAnswer.replace('{name}', trivia.playerName)}</div>
        )}
      </div>
    </div>
  );
}

// ---------- HOST Screen ----------
const TOTAL = 72, COLS = 12, ROWS = 6;

function StatChip({ value, accent, textColor, style = {}, pulse = false }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: '#ffffff', border: '2px solid #e5e5e5', borderRadius: 12, boxShadow: '0 2px 0 #e5e5e5', position: 'relative', ...style }}>
      {pulse && <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', animation: 'chipPulse 1.8s ease-out infinite', pointerEvents: 'none' }} />}
      <span style={{ fontSize: 'clamp(12px, 1.4vw, 16px)', fontWeight: 900, color: textColor || accent, lineHeight: 1 }}>{value}</span>
    </div>
  );
}

function useIsPortraitMobile() {
  const check = () => window.innerHeight > window.innerWidth;
  const [val, setVal] = useState(check);
  useEffect(() => {
    const handler = () => setVal(check());
    window.addEventListener('resize', handler);
    window.addEventListener('orientationchange', handler);
    return () => { window.removeEventListener('resize', handler); window.removeEventListener('orientationchange', handler); };
  }, []);
  return val;
}

function RotatePrompt({ title, message }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#3c3c3c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, fontFamily: '"Nunito", system-ui, sans-serif', padding: 32, textAlign: 'center' }}>
      <div role="img" aria-label="Celular — gire para horizontal" style={{ fontSize: 72, animation: 'rotateHint 2s ease-in-out infinite' }}>📱</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#c0c0c0', lineHeight: 1.5, maxWidth: 260 }}>{message}</div>
    </div>
  );
}

function HostScreen({ me, room, onExit }) {
  const { t, lang } = useLang();
  const isPortraitMobile = useIsPortraitMobile();
  const [session, setSession] = useState(null);
  const [fsError, setFsError] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [previewN, setPreviewN] = useState(null);
  const [showAd, setShowAd] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const [winnerQueue, setWinnerQueue] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showTriviaPodium, setShowTriviaPodium] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const prevPendingCount = useRef(0);
  const createdRef = useRef(false);
  const rollTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);
  const hostMsgRef = useRef(null);
  const drawnRef = useRef([]);
  const prevPlayerWinsRef = useRef(null);
  const lastAdTickRef = useRef(0);
  const currentAdTickRef = useRef(0);
  const cells = useMemo(() => Array.from({ length: TOTAL }, (_, i) => ({ n: i + 1, r: Math.floor(i / COLS), c: i % COLS })), []);
  const leaderboard = useMemo(() => Object.values((session?.players) || {}).filter(p => p.uid !== session?.hostUid).map(p => ({ name: p.name, hits: (p.marked || []).length, avatar: mascotFor(p.name), bingo: p.bingo, triviaScore: (session?.triviaScores || {})[p.id] || 0 })).sort((a, b) => b.hits - a.hits).map((p, i) => ({ ...p, color: i === 0 ? '#ffc800' : i === 1 ? '#afafaf' : i === 2 ? '#cd7f32' : '#6b6b6b' })), [session]);


  useEffect(() => {
    const ref = sessionRef(room);
    const unsub = ref.onSnapshot(
      (snap) => {
        if (snap.exists) {
          setSession(snap.data());
          drawnRef.current = snap.data().drawn || [];
          const d = snap.data().drawn || [];
          const adTick = Math.floor(d.length / 5);
          if (adTick > 0 && adTick > lastAdTickRef.current) {
            lastAdTickRef.current = adTick;
            currentAdTickRef.current = adTick;
            const ads = FAKE_ADS[lang] || FAKE_ADS.en;
            setCurrentAd(ads[(adTick - 1) % ads.length]);
            setShowAd(true);
          }
        } else if (!createdRef.current) {
          createdRef.current = true;
          ref.set({ code: room, callerName: me.name, hostUid: me.uid || null, createdAt: Date.now(), phase: 'lobby', drawn: [], lastDrawn: null, lastDrawnAt: null, players: { [me.uid || `host_${me.name}`]: { id: me.uid || `host_${me.name}`, name: me.name, uid: me.uid || null, joinedAt: Date.now(), card: [], marked: [], bingo: false } }, winner: null })
            .catch((err) => setFsError(err.message));
        }
      },
      (err) => setFsError(err.message)
    );
    return () => { unsub(); clearTimeout(rollTimeoutRef.current); };
  }, [room]);

  useEffect(() => {
    if (!session?.players) return;
    const players = Object.values(session.players);
    const computeWins = (p) => {
      const card = p.card || [];
      const ms = new Set(p.marked || []);
      const g = [0,1,2,3,4].map(r => card.slice(r*5, r*5+5));
      let count = 0;
      for (let r = 0; r < 5; r++) if (g[r].every(v => v === 'FREE' || ms.has(v))) count++;
      for (let c = 0; c < 5; c++) if ([0,1,2,3,4].every(r => g[r][c] === 'FREE' || ms.has(g[r][c]))) count++;
      return count;
    };
    if (prevPlayerWinsRef.current === null) {
      const init = {};
      for (const p of players) init[p.id] = computeWins(p);
      prevPlayerWinsRef.current = init;
      return;
    }
    const prev = prevPlayerWinsRef.current;
    const next = {};
    for (const p of players) {
      next[p.id] = computeWins(p);
      if (next[p.id] > (prev[p.id] ?? 0)) {
        setWinnerQueue(q => [...q, { type: p.bingo ? 'bingo' : 'line', name: p.name }]);
        if (!p.bingo && !session.trivia) {
          const usedTrivia = session.usedTrivia || [];
          const bank = TRIVIA_QUESTIONS[lang] || TRIVIA_QUESTIONS.en;
          const avail = bank.map((_, i) => i).filter(i => !usedTrivia.includes(i));
          const idx = avail.length > 0 ? avail[Math.floor(Math.random() * avail.length)] : Math.floor(Math.random() * bank.length);
          sessionRef(room).update({
            trivia: { state: 'ready', playerId: p.id, playerName: p.name, questionIdx: idx },
            usedTrivia: firebase.firestore.FieldValue.arrayUnion(idx),
          });
        }
      }
    }
    prevPlayerWinsRef.current = next;
  }, [session]);

  const pendingList = Object.values(session?.pending || {});

  useEffect(() => {
    if (pendingList.length > prevPendingCount.current) setShowPending(true);
    prevPendingCount.current = pendingList.length;
    if (pendingList.length === 0) setShowPending(false);
  }, [pendingList.length]);

  async function handleApprove(pendingUid, pendingName, pendingCard) {
    await sessionRef(room).update({
      [`players.${pendingUid}`]: { id: pendingUid, name: pendingName, uid: pendingUid, joinedAt: Date.now(), card: pendingCard || makeCard(), marked: [], bingo: false },
      [`pending.${pendingUid}`]: firebase.firestore.FieldValue.delete(),
    }).catch(() => {});
  }

  async function handleReject(pendingUid) {
    await sessionRef(room).update({
      [`pending.${pendingUid}`]: firebase.firestore.FieldValue.delete(),
    }).catch(() => {});
  }

  function playSound(type) {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = audioCtxRef.current;
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      if (type === 'tick') {
        o.type = 'square'; o.frequency.setValueAtTime(1200, ctx.currentTime);
        g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.06, ctx.currentTime + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
        o.start(); o.stop(ctx.currentTime + 0.05);
      } else {
        o.type = 'sine'; o.frequency.setValueAtTime(660, ctx.currentTime); o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        g.gain.setValueAtTime(0.0001, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
        o.start(); o.stop(ctx.currentTime + 0.2);
      }
    } catch (e) {}
  }

  function drawNext() {
    if (rolling || !session) return;
    const currentDrawn = drawnRef.current;
    const drawnSet = new Set(currentDrawn);
    const remaining = [];
    for (let i = 1; i <= TOTAL; i++) if (!drawnSet.has(i)) remaining.push(i);
    if (!remaining.length) return;

    const pick = remaining[Math.floor(Math.random() * remaining.length)];
    setRolling(true);

    const DURATION = 3000, start = performance.now();
    const pool = remaining.length > 1 ? remaining : Array.from({ length: TOTAL }, (_, i) => i + 1);
    let curPreview = null;

    function step() {
      const elapsed = performance.now() - start;
      const interval = 50 + Math.pow(Math.min(elapsed / DURATION, 1), 2.5) * 320;
      let next, attempts = 0;
      do { next = pool[Math.floor(Math.random() * pool.length)]; attempts++; } while (next === curPreview && attempts < 5);
      curPreview = next;
      setPreviewN(next);
      playSound('tick');

      if (elapsed >= DURATION) {
        setPreviewN(pick);
        rollTimeoutRef.current = setTimeout(() => {
          setPreviewN(null);
          setRolling(false);
          const newDrawn = [...currentDrawn, pick];
          const msg = pickHostLine(hostMsgRef.current, lang);
          hostMsgRef.current = msg;
          setWinnerQueue(q => [...q, { type: 'number', n: pick, msg }]);
          sessionRef(room).update({ drawn: newDrawn, lastDrawn: pick, lastDrawnAt: Date.now() });
          playSound('pop');
        }, 200);
        return;
      }
      rollTimeoutRef.current = setTimeout(step, interval);
    }
    step();
  }

  if (fsError) return <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}><div style={{ color: '#ff4b4b', textAlign: 'center', padding: 40, fontWeight: 700 }}>Firestore error: {fsError}</div></div>;
  if (!session) return <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}><div style={{ color: '#6b6b6b', textAlign: 'center', padding: 40, fontWeight: 700 }}>{t.connecting}</div></div>;
  if (session.phase === 'lobby') return (
    <>
      <HostLobbyScreen me={me} room={room} session={session}
        onStart={() => sessionRef(room).update({ phase: 'playing' })}
        onExit={() => { sessionRef(room).delete(); onExit(); }}
      />
      {showPending && pendingList.length > 0 && <PendingApprovalModal pending={pendingList} onApprove={handleApprove} onReject={handleReject} />}
      {!showPending && pendingList.length > 0 && (
        <button onClick={() => setShowPending(true)} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 80, background: '#1cb0f6', color: '#fff', border: 'none', borderRadius: 99, padding: '10px 16px', fontFamily: 'inherit', fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 0 #0d8fcc' }}>
          🚪 {pendingList.length}
        </button>
      )}
    </>
  );
  if (isPortraitMobile) return <RotatePrompt title={t.rotating} message={t.hostLandscape} />;

  const drawn = session.drawn || [];
  const drawnSet = new Set(drawn);
  const latest = drawn[drawn.length - 1] || null;
  const left = TOTAL - drawn.length;
  const progress = drawn.length / TOTAL;
  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#f7fafc', fontFamily: '"Nunito", system-ui, sans-serif', color: '#3c3c3c', display: 'flex', justifyContent: 'center', padding: '3vh clamp(14px, 3vw, 24px)', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 1400, height: '100%', display: 'flex', flexDirection: 'column', gap: '5vh', position: 'relative' }}>

        {/* Header */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: '1fr', gap: 'clamp(3px, 0.7vw, 8px)', padding: '0 clamp(6px, 1vw, 12px)', alignItems: 'stretch' }}>
          <div style={{ gridColumn: 'span 2', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 3 }}>
            <div style={{ fontSize: '4vh', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1 }}>DaubCard</div>
            <div style={{ fontSize: '4vh', fontWeight: 900, color: '#6b6b6b', letterSpacing: '-0.01em', lineHeight: 1 }}>{me.name}</div>
          </div>
          <div style={{ gridColumn: 'span 5', height: '100%', position: 'relative' }}>
            <div style={{ height: '100%', background: '#ffffff', border: '2px solid #46a302', borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: '0 2px 0 #46a302', overflow: 'hidden' }}>
              <div style={{ width: `${progress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #58cc02 0%, #89e219 100%)', transition: 'width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)', animation: 'shimmer 2s ease-in-out infinite', pointerEvents: 'none' }} />
              </div>
            </div>
            <div style={{ position: 'absolute', top: '50%', left: `${progress * 100}%`, transform: `translateY(-50%) translateX(${progress >= 0.7 ? 'calc(-100% - 8px)' : '6px'})`, color: progress >= 0.7 ? '#ffffff' : '#46a302', fontSize: 'clamp(12px, 1.4vw, 16px)', fontWeight: 900, whiteSpace: 'nowrap', pointerEvents: 'none', transition: 'left 400ms cubic-bezier(0.34, 1.56, 0.64, 1)', letterSpacing: '0.04em', zIndex: 1 }}>
              {String(Math.round(progress * 100)).padStart(2, '0')}%
            </div>
          </div>
          <StatChip value={String(drawn.length).padStart(2, '0')} accent="#58cc02" textColor="#ffffff" style={{ width: '100%', height: '100%', background: '#58cc02', border: '2px solid #46a302', boxShadow: '0 2px 0 #46a302', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
          <StatChip value={String(left).padStart(2, '0')} accent="#ff4b4b" textColor="#ffffff" style={{ width: '100%', height: '100%', background: '#ff4b4b', border: '2px solid #d63030', boxShadow: '0 2px 0 #d63030', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
          <StatChip value={String(room).padStart(2, '0')} accent="#ff9600" textColor="#ffffff" style={{ width: '100%', height: '100%', background: '#ff9600', border: '2px solid #cc7700', boxShadow: '0 2px 0 #cc7700', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
          <IconButton onClick={() => setShowLeaderboard(true)} title={t.roomInfo} style={{ width: '100%', height: '100%', background: '#6b6b6b', border: '2px solid #555555', boxShadow: '0 2px 0 #555555', color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)' }}><InfoIcon /></IconButton>
          <IconButton onClick={() => setShowExit(true)} title={t.exitRoom} style={{ width: '100%', height: '100%', background: '#6b6b6b', border: '2px solid #555555', boxShadow: '0 2px 0 #555555', color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)' }}><ExitIcon /></IconButton>
        </div>

        {/* Number grid */}
        <div style={{ flex: 6, minHeight: 0, background: '#ffffff', borderRadius: 'clamp(14px, 2vw, 24px)', display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`, gap: 'clamp(3px, 0.7vw, 8px)', padding: 'clamp(6px, 1vw, 12px)' }}>
          {cells.map(({ n, r, c }) => {
            const isCalled = drawnSet.has(n);
            const isLatest = n === latest && !rolling;
            const isPreview = n === previewN && rolling;
            let bg = '#fafafa', fg = '#3c3c3c', border = '2px solid #ececec', shadow = '0 2px 0 #ececec', scale = 1;
            if (isPreview) { bg = '#1cb0f6'; fg = '#ffffff'; border = '2px solid #0d8fcc'; shadow = '0 3px 0 #0d8fcc, 0 0 0 4px rgba(28,176,246,0.22)'; scale = 1.08; }
            else if (isLatest) { bg = '#58cc02'; fg = '#ffffff'; border = '2px solid #46a302'; shadow = '0 4px 0 #46a302, 0 0 0 4px rgba(88,204,2,0.18)'; scale = 1.06; }
            else if (isCalled) { bg = '#ffc800'; fg = '#7a5a00'; border = '2px solid #e0a800'; shadow = '0 3px 0 #c79100'; }
            return (
              <div key={n} style={{ background: bg, color: fg, border, borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontWeight: 900, letterSpacing: '0.02em', fontSize: 'clamp(10px, 1.5vw, 17px)', transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)', transform: `scale(${scale})`, minWidth: 0, minHeight: 0 }}>
                {String(n).padStart(2, '0')}
              </div>
            );
          })}
        </div>

        {/* Draw button */}
        <DrawButton onClick={drawNext} disabled={left === 0 || !!session.trivia} rolling={rolling} done={!!session.winner} height='10vh' margin='clamp(6px, 1vw, 12px)' />

        {showPending && pendingList.length > 0 && <PendingApprovalModal pending={pendingList} onApprove={handleApprove} onReject={handleReject} />}
        {!showPending && pendingList.length > 0 && (
          <button onClick={() => setShowPending(true)} style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 80, background: '#ff9600', color: '#fff', border: 'none', borderRadius: 99, padding: '10px 16px', fontFamily: 'inherit', fontWeight: 900, fontSize: 14, cursor: 'pointer', boxShadow: '0 4px 0 #cc7700' }}>
            🚪 {pendingList.length}
          </button>
        )}

        {winnerQueue[0]?.type === 'number' && <HostCallout n={winnerQueue[0].n} msg={winnerQueue[0].msg} onClose={() => setWinnerQueue(q => q.slice(1))} />}
        {winnerQueue[0]?.type === 'line'   && <LineNotif name={winnerQueue[0].name} onClose={() => setWinnerQueue(q => q.slice(1))} />}
        {winnerQueue[0]?.type === 'bingo'  && <WinNotif  name={winnerQueue[0].name} onClose={() => { setWinnerQueue(q => q.slice(1)); setShowLeaderboard(true); }} />}
        {showLeaderboard && <LeaderboardModal players={leaderboard} onClose={() => {
          setShowLeaderboard(false);
          if (session.winner) {
            const hasTriviaScores = Object.values(session?.triviaScores || {}).some(s => s > 0);
            if (hasTriviaScores) { setShowTriviaPodium(true); } else { sessionRef(room).delete(); onExit(); }
          }
        }} totalCalled={drawn.length} room={room} />}
        {showTriviaPodium && <TriviaPodiumModal players={leaderboard} onClose={() => { setShowTriviaPodium(false); sessionRef(room).delete(); onExit(); }} />}
        {showExit && <ExitModal onCancel={() => setShowExit(false)} onConfirm={() => { setShowExit(false); sessionRef(room).delete(); onExit(); }} room={room} />}
        {session.trivia && (session.trivia.state === 'ready' || session.trivia.state === 'question' || session.trivia.state === 'answered') && <TriviaActiveModal trivia={session.trivia} room={room} playerId={me.uid} isHost lang={lang} />}
        {showAd && currentAd && <FakeAdModal ad={currentAd} lang={lang} isHost onClose={() => { sessionRef(room).update({ adClosedTick: currentAdTickRef.current }); setShowAd(false); }} />}
      </div>
    </div>
  );
}


function DrawButton({ onClick, disabled, rolling, done, height = '15vh', margin }) {
  const { t } = useLang();
  const [pressed, setPressed] = useState(false);
  const label = rolling ? t.drawing : done ? t.done : disabled ? t.done : t.draw;
  disabled = disabled || done;
  return (
    <button onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)} onClick={onClick} disabled={disabled}
      style={{ width: '100%', height, flexShrink: 0, padding: 0, ...(margin ? { marginLeft: margin, marginRight: margin, width: `calc(100% - 2 * ${margin})` } : {}), background: rolling ? '#1cb0f6' : disabled ? '#cfd2d6' : '#58cc02', color: '#ffffff', border: 'none', borderRadius: 'clamp(14px, 2vw, 20px)', boxShadow: rolling ? '0 5px 0 #0d8fcc' : disabled ? '0 2px 0 #b3b6ba' : pressed ? '0 1px 0 #46a302' : '0 5px 0 #46a302', transform: pressed && !disabled && !rolling ? 'translateY(4px)' : 'translateY(0)', transition: 'transform 60ms ease, box-shadow 60ms ease, background 200ms ease', fontFamily: 'inherit', fontWeight: 900, fontSize: 'clamp(15px, 2vw, 20px)', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: disabled && !rolling ? 'not-allowed' : rolling ? 'progress' : 'pointer', position: 'relative' }}>
      {!disabled && !rolling && <div style={{ position: 'absolute', inset: 0, borderRadius: 'clamp(14px, 2vw, 20px)', animation: 'buttonPulse 1.8s ease-out infinite', pointerEvents: 'none' }} />}
      {label}
    </button>
  );
}

function HostCallout({ n, msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 50 }}>
      <div style={{ background: '#ffffff', border: '4px solid #58cc02', borderRadius: 32, boxShadow: '0 10px 0 #46a302, 0 20px 60px rgba(0,0,0,0.18)', padding: '4vh 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, width: '50vw', height: '50vh', animation: 'calloutPop 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ fontSize: 128, fontWeight: 900, color: '#58cc02', lineHeight: 1, letterSpacing: '-0.04em' }}>{String(n).padStart(2, '0')}</div>
        {msg && <div style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', fontWeight: 800, color: '#3c3c3c', textAlign: 'center', whiteSpace: 'nowrap' }}>"{msg}"</div>}
      </div>
    </div>
  );
}

function LeaderboardModal({ players, onClose, totalCalled, room }) {
  const { t } = useLang();
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(31, 41, 55, 0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 180ms ease forwards' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: 'min(80vh, 560px)', background: '#ffffff', border: '3px solid #ff9600', borderRadius: 24, boxShadow: '0 12px 0 #cc7700, 0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', textAlign: 'center', position: 'relative', animation: 'modalPop 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards', display: 'flex', flexDirection: 'column' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, background: '#fff3e0', border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 900, color: '#ff9600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
        <div style={{ padding: '32px 28px 8px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#6b6b6b', letterSpacing: '0.18em', marginBottom: 4 }}>{t.roomLabel} {String(room).padStart(2, '0')}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c' }}>{t.leaderboard}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 22px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '2px solid #f3f3f3' }}>
          {players.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 14, fontWeight: 700, color: '#6b6b6b' }}>{t.noPlayersPre} {String(room).padStart(2, '0')} {t.noPlayersPost}</div>}
          {players.map((p, i) => {
            const pct = totalCalled > 0 ? p.hits / totalCalled : 0;
            return (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#ffffff', border: '2px solid #ececec', borderRadius: 16, boxShadow: '0 2px 0 #ececec' }}>
                <div style={{ width: 28, textAlign: 'center', fontSize: 15, fontWeight: 900, color: p.color }}>#{i + 1}</div>
                <div style={{ width: 40, height: 40, background: p.color + '22', border: `2px solid ${p.color}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{p.avatar}</div>
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 900, color: '#3c3c3c' }}>{p.name}</span>
                    {i === 0 && p.hits > 0 && <span style={{ fontSize: 14 }}>👑</span>}
                    {p.bingo && <span style={{ fontSize: 9, fontWeight: 900, letterSpacing: '0.14em', padding: '2px 6px', borderRadius: 6, background: '#58cc02', color: '#ffffff' }}>BINGO!</span>}
                  </div>
                  <div style={{ height: 6, background: '#ececec', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pct * 100}%`, height: '100%', background: p.color, borderRadius: 999, transition: 'width 400ms ease' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 52 }}>
                  <span style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', lineHeight: 1 }}>{p.hits}</span>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#6b6b6b', letterSpacing: '0.1em', marginTop: 2 }}>{t.hits}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TriviaPodiumModal({ players, onClose }) {
  const { t } = useLang();
  const MEDAL = ['🥇', '🥈', '🥉'];
  const COLORS = ['#ffc800', '#afafaf', '#cd7f32'];
  const ranked = [...players]
    .filter(p => p.triviaScore > 0)
    .sort((a, b) => b.triviaScore - a.triviaScore)
    .slice(0, 3);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(31, 41, 55, 0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 180ms ease forwards' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#ffffff', border: '3px solid #1cb0f6', borderRadius: 24, boxShadow: '0 12px 0 #0d8fcc, 0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', textAlign: 'center', position: 'relative', animation: 'modalPop 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, background: '#e8f7ff', border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 900, color: '#1cb0f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
        <div style={{ padding: '32px 28px 16px' }}>
          <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 8 }}>🧠</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c' }}>{t.triviaPodiumTitle}</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6b6b6b', marginTop: 4 }}>{t.triviaPodiumSubtitle}</div>
        </div>
        <div style={{ padding: '8px 20px 28px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '2px solid #f3f3f3' }}>
          {ranked.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#ffffff', border: `2px solid ${COLORS[i]}55`, borderRadius: 16, boxShadow: `0 2px 0 ${COLORS[i]}33` }}>
              <div style={{ width: 28, textAlign: 'center', fontSize: 22 }}>{MEDAL[i]}</div>
              <div style={{ width: 40, height: 40, background: COLORS[i] + '22', border: `2px solid ${COLORS[i]}`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{p.avatar}</div>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 900, color: '#3c3c3c', textAlign: 'left' }}>{p.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: 40 }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: COLORS[i], lineHeight: 1 }}>{p.triviaScore}</span>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#6b6b6b', letterSpacing: '0.1em', marginTop: 2 }}>{t.triviaPoints}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HostLobbyScreen({ me, room, session, onStart, onExit }) {
  const { t } = useLang();
  const players = Object.values(session.players || {}).sort((a, b) => a.joinedAt - b.joinedAt);
  const canStart = players.length >= 2;

  return (
    <ScreenShell>
      <BackLink onClick={onExit}>{t.back}</BackLink>
        <div style={{ background: '#fff7e6', border: '2px solid #ffd580', borderRadius: 20, padding: '16px 20px', marginTop: 28, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6b6b6b', letterSpacing: '0.2em', marginBottom: 6 }}>{t.roomCodeLabel}</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#ff9600', letterSpacing: '0.15em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{String(room).padStart(2, '0')}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7a7a7a', marginTop: 8 }}>{t.shareCode}</div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 900, color: '#6b6b6b', letterSpacing: '0.2em', marginBottom: 10 }}>{t.players} — {players.length}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20, maxHeight: 200, overflowY: 'auto' }}>
          {players.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#ffffff', border: '2px solid #ececec', borderRadius: 14, boxShadow: '0 2px 0 #ececec' }}>
              <div style={{ width: 36, height: 36, background: '#ececec', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{mascotFor(p.name)}</div>
              <div style={{ flex: 1, fontSize: 15, fontWeight: 900, color: '#3c3c3c' }}>{p.name}</div>
              {p.uid === session.hostUid && (
                <span style={{ fontSize: 11, fontWeight: 900, color: '#ff9600', letterSpacing: '0.08em', background: '#fff7e6', border: '2px solid #ffd580', borderRadius: 8, padding: '3px 8px', flexShrink: 0 }}>{t.creator}</span>
              )}
              {p.uid === me.uid && (
                <span style={{ fontSize: 11, fontWeight: 900, color: '#1cb0f6', letterSpacing: '0.08em', background: '#e8f7ff', border: '2px solid #9ae0ff', borderRadius: 8, padding: '3px 8px', flexShrink: 0 }}>{t.you}</span>
              )}
            </div>
          ))}
        </div>
        <BigCta onClick={onStart} disabled={!canStart} pulse={canStart}>{canStart ? t.startGame : t.waitingPlayers}</BigCta>
    </ScreenShell>
  );
}

// ---------- CAST Screen ----------
function CastScreen({ me, room, onExit }) {
  const { t, lang } = useLang();
  const isPortraitMobile = useIsPortraitMobile();
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [joinCanRetry, setJoinCanRetry] = useState(false);
  const [joinAttempt, setJoinAttempt] = useState(0);
  const [joinErrorTitle, setJoinErrorTitle] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [localCard, setLocalCard] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [pendingCard, setPendingCard] = useState(null);
  const [isRejected, setIsRejected] = useState(false);
  const [calloutQueue, setCalloutQueue] = useState([]);
  const [showExit, setShowExit] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [localBingo, setLocalBingo] = useState(false);
  const [showAd, setShowAd] = useState(false);
  const [currentAd, setCurrentAd] = useState(null);
  const prevLastDrawnRef = useRef(null);
  const hostMsgRef = useRef(t.waitingForHost);
  const castWinLinesRef = useRef([]);
  const lastAdTickRef = useRef(0);

  useEffect(() => {
    setJoining(true);
    setJoinCanRetry(false);
    const pid = me.uid || `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    let card = makeCard();
    const txn = firebase.firestore().runTransaction(async (tx) => {
      const snap = await tx.get(sessionRef(room));
      if (!snap.exists) throw { code: 'not-found' };
      const data = snap.data();
      if (data.phase !== 'lobby') throw { code: 'game-started' };
      const takenNames = Object.values(data.players || {}).map(p => p.name.toLowerCase());
      if (takenNames.includes(me.name.toLowerCase())) throw { code: 'name-taken' };
      const takenCards = Object.values(data.players || {}).map(p => JSON.stringify(p.card));
      for (let i = 0; i < 10 && takenCards.includes(JSON.stringify(card)); i++) card = makeCard();
      tx.update(sessionRef(room), { [`players.${pid}`]: { id: pid, name: me.name, uid: me.uid || null, joinedAt: Date.now(), card, marked: [], bingo: false } });
    });
    Promise.race([txn, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 8000))])
      .then(() => {
        setPlayerId(pid);
        setLocalCard(card);
      })
      .catch((err) => {
        if (err?.code === 'not-found') { setJoinErrorTitle(t.roomNotFoundTitle); setJoinError(t.joinRoomNotFound); setJoinCanRetry(false); }
        else if (err?.code === 'name-taken') { setJoinErrorTitle(t.nameTakenTitle); setJoinError(t.joinNameTaken); setJoinCanRetry(false); }
        else if (err?.code === 'game-started') {
          sessionRef(room).update({ [`pending.${pid}`]: { uid: me.uid, name: me.name, card, requestedAt: Date.now() } })
            .then(() => { setPendingId(pid); setPendingCard(card); })
            .catch(() => { setJoinErrorTitle(t.connectionErrorTitle); setJoinError(t.joinConnectionError); setJoinCanRetry(true); });
        }
        else { setJoinErrorTitle(t.connectionErrorTitle); setJoinError(t.joinConnectionError); setJoinCanRetry(true); }
      })
      .finally(() => setJoining(false));
  }, [room, joinAttempt]);

  useEffect(() => {
    if (!playerId) return;
    let unsub;
    let retryTimeout;
    let retries = 0;
    const subscribe = () => {
      unsub = sessionRef(room).onSnapshot(
        (snap) => { retries = 0; setSession(snap.exists ? snap.data() : null); setLoaded(true); },
        () => { if (retries++ < 3) retryTimeout = setTimeout(subscribe, 5000); }
      );
    };
    subscribe();
    return () => { if (unsub) unsub(); clearTimeout(retryTimeout); };
  }, [playerId, room]);

  useEffect(() => {
    if (!pendingId) return;
    let unsub;
    let retryTimeout;
    let retries = 0;
    const subscribe = () => {
      unsub = sessionRef(room).onSnapshot(
        (snap) => {
          retries = 0;
          const data = snap.exists ? snap.data() : null;
          if (!data) { setIsRejected(true); return; }
          if (data.players?.[pendingId]) {
            setPlayerId(pendingId);
            setLocalCard(pendingCard);
            setPendingId(null);
          } else if (!data.pending?.[pendingId]) {
            setIsRejected(true);
          }
        },
        () => { if (retries++ < 3) retryTimeout = setTimeout(subscribe, 5000); }
      );
    };
    subscribe();
    return () => { if (unsub) unsub(); clearTimeout(retryTimeout); };
  }, [pendingId, room]);

  useEffect(() => {
    if (!session?.lastDrawn || session.lastDrawn === prevLastDrawnRef.current) return;
    prevLastDrawnRef.current = session.lastDrawn;
    playFx('number');
    const msg = pickHostLine(hostMsgRef.current, lang);
    hostMsgRef.current = msg;
    setCalloutQueue(q => [...q, { n: session.lastDrawn, msg }]);
  }, [session?.lastDrawn]);

  useEffect(() => {
    if (!session || !localCard || !playerId) return;
    const player = (session.players || {})[playerId];
    if (!player) return;
    const ms = new Set(player.marked || []);
    const g = [0,1,2,3,4].map(r => localCard.slice(r*5, r*5+5));
    const wins = [];
    for (let r = 0; r < 5; r++) if (g[r].every(v => v === 'FREE' || ms.has(v))) wins.push(`row-${r}`);
    for (let c = 0; c < 5; c++) if ([0,1,2,3,4].every(r => g[r][c] === 'FREE' || ms.has(g[r][c]))) wins.push(`col-${c}`);
    castWinLinesRef.current = wins;
  }, [session, localCard, playerId]);

  useEffect(() => {
    if (!session?.drawn) return;
    const adTick = Math.floor(session.drawn.length / 5);
    if (adTick > 0 && adTick > lastAdTickRef.current) {
      lastAdTickRef.current = adTick;
      const ads = FAKE_ADS[lang] || FAKE_ADS.en;
      setCurrentAd(ads[(adTick - 1) % ads.length]);
      setShowAd(true);
    }
  }, [session?.drawn?.length]);

  useEffect(() => {
    if (session?.adClosedTick >= lastAdTickRef.current) setShowAd(false);
  }, [session?.adClosedTick]);

  if (isRejected) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>{t.requestDeniedTitle}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>{t.hostDidntLetIn}</div>
        <BigCta onClick={onExit}>{t.backToStart}</BigCta>
      </div>
    </ScreenShell>
  );

  if (pendingId) return (
    <ScreenShell>
      <BackLink onClick={() => {
        sessionRef(room).update({ [`pending.${pendingId}`]: firebase.firestore.FieldValue.delete() }).catch(() => {});
        onExit();
      }}>{t.back}</BackLink>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚪</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>{t.waitingForApprovalTitle}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>{t.hostWillLetYouIn}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 28 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: '#1cb0f6', animation: `rollDots 1.2s ${i * 0.2}s ease-in-out infinite` }} />
          ))}
        </div>
        <BigCta variant="blue" onClick={() => {
          sessionRef(room).update({ [`pending.${pendingId}`]: firebase.firestore.FieldValue.delete() }).catch(() => {});
          onExit();
        }}>{t.cancel}</BigCta>
      </div>
    </ScreenShell>
  );

  if (joinError) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div role="img" aria-label="Cara confusa" style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>{joinErrorTitle}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>{joinError}</div>
        {joinCanRetry && <BigCta onClick={() => { setJoinError(null); setJoinAttempt(a => a + 1); }} style={{ marginBottom: 12 }}>{t.retry}</BigCta>}
        <BigCta onClick={onExit}>{t.backToStart}</BigCta>
      </div>
    </ScreenShell>
  );

  if (joining || (!loaded && playerId)) return <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}><div style={{ color: '#6b6b6b', textAlign: 'center', padding: 40, fontWeight: 700 }}>{t.connecting}</div></div>;

  if (loaded && !session) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>{t.roomEndedTitle}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>{t.roomClosedByHost}</div>
        <BigCta onClick={onExit}>{t.backToStart}</BigCta>
      </div>
    </ScreenShell>
  );

  if (!session || !localCard || !playerId) return null;

  const myPlayer = (session.players || {})[playerId];

  if (session.phase === 'lobby') {
    const lobbyPlayers = Object.values(session.players || {}).sort((a, b) => a.joinedAt - b.joinedAt);
    return (
      <ScreenShell>
        <BackLink onClick={() => {
          if (playerId) sessionRef(room).update({ [`players.${playerId}`]: firebase.firestore.FieldValue.delete() });
          onExit();
        }}>{t.back}</BackLink>
        <div style={{ background: '#fff7e6', border: '2px solid #ffd580', borderRadius: 20, padding: '16px 20px', marginTop: 28, marginBottom: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6b6b6b', letterSpacing: '0.2em', marginBottom: 6 }}>{t.roomCodeLabel}</div>
          <div style={{ fontSize: 52, fontWeight: 900, color: '#ff9600', letterSpacing: '0.15em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{String(room).padStart(2, '0')}</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#7a7a7a', marginTop: 8 }}>{t.shareCode}</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 900, color: '#6b6b6b', letterSpacing: '0.2em', marginBottom: 10 }}>{t.players} — {lobbyPlayers.length}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lobbyPlayers.map(p => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: '#ffffff', border: '2px solid #ececec', borderRadius: 14, boxShadow: '0 2px 0 #ececec' }}>
                <div style={{ width: 36, height: 36, background: '#ececec', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{mascotFor(p.name)}</div>
                <div style={{ flex: 1, fontSize: 15, fontWeight: 900, color: '#3c3c3c' }}>{p.name}</div>
                {p.uid === session.hostUid && (
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#ff9600', letterSpacing: '0.08em', background: '#fff7e6', border: '2px solid #ffd580', borderRadius: 8, padding: '3px 8px', flexShrink: 0 }}>{t.creator}</span>
                )}
                {p.id === playerId && (
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#1cb0f6', letterSpacing: '0.08em', background: '#e8f7ff', border: '2px solid #9ae0ff', borderRadius: 8, padding: '3px 8px', flexShrink: 0 }}>{t.you}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <BigCta disabled>{t.waitingForHost}</BigCta>
      </ScreenShell>
    );
  }

  if (!myPlayer) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>{t.roomEndedTitle}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>{t.roomClosedByHost}</div>
        <BigCta onClick={onExit}>{t.backToStart}</BigCta>
      </div>
    </ScreenShell>
  );

  if (isPortraitMobile) return <RotatePrompt title={t.rotating} message={t.castLandscape} />;

  const grid = [0,1,2,3,4].map(r => localCard.slice(r*5, r*5+5));
  const drawn = session.drawn || [];
  const drawnSet = new Set(drawn);
  const lastDrawn = session.lastDrawn;
  const markedArr = myPlayer.marked || [];
  const marked = new Set(markedArr);

  const pendingDaub = drawn.length > 0 && localCard.some(v => v !== 'FREE' && drawnSet.has(v) && !marked.has(v));

  const daub = () => {
    const newMarked = localCard.filter(v => v !== 'FREE' && drawnSet.has(v));
    const isFullCard = localCard.filter(v => v !== 'FREE').every(v => new Set(newMarked).has(v));
    const update = { [`players.${playerId}.marked`]: newMarked };
    if (isFullCard && !myPlayer.bingo) {
      update.winner = me.name;
      update[`players.${playerId}.bingo`] = true;
      setLocalBingo(true);
    }
    sessionRef(room).update(update);
  };

  const daubedCount = markedArr.length;
  const isWinner = myPlayer.bingo || localBingo;
  const isGameOver = !isWinner && !!session.winner;
  const daubLabel = isWinner ? t.wins : isGameOver ? t.lost : t.daub;
  const daubProgress = daubedCount / 24;
  const tempStages = [
    { word: t.cold,  anim: 'freePulse 2.4s ease-in-out infinite' },
    { word: t.warm,  anim: 'freePulse 1.1s ease-in-out infinite' },
    { word: t.fire,  anim: 'freePulse 0.38s ease-in-out infinite' },
  ];
  const tempStage = tempStages[daubProgress < 0.5 ? 0 : daubProgress < 0.7 ? 1 : 2];
  const allPlayers = Object.values(session.players || {});
  const leaderboard = allPlayers.filter(p => p.uid !== session?.hostUid).map(p => ({ name: p.name, hits: (p.marked || []).length, avatar: mascotFor(p.name), bingo: p.bingo, triviaScore: (session?.triviaScores || {})[p.id] || 0 })).sort((a, b) => b.hits - a.hits).map((p, i) => ({ ...p, color: i === 0 ? '#ffc800' : i === 1 ? '#afafaf' : i === 2 ? '#cd7f32' : '#6b6b6b' }));
  const myRank = Math.max(1, leaderboard.findIndex(p => p.name === me.name) + 1);
  const FREE_CELL = { bg: '#3c3c3c', border: '2px solid #222222', shadow: '0 2px 0 #222222', fg: '#ffffff' };

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#f7fafc', fontFamily: '"Nunito", system-ui, sans-serif', color: '#3c3c3c', display: 'flex', justifyContent: 'center', padding: '3vh clamp(14px, 3vw, 24px)', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 1400, height: '100%', display: 'flex', flexDirection: 'column', gap: '5vh', position: 'relative' }}>

        {/* Header */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'clamp(3px, 0.7vw, 8px)', padding: '0 clamp(6px, 1vw, 12px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 3 }}>
            <div style={{ fontSize: '4vh', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1 }}>DaubCard</div>
            <div style={{ fontSize: '4vh', fontWeight: 900, color: '#6b6b6b', letterSpacing: '-0.01em', lineHeight: 1 }}>{me.name}</div>
          </div>
          <div style={{ gridColumn: 'span 2', position: 'relative' }}>
            <div style={{ height: '100%', background: '#ffffff', border: '2px solid #0d8fcc', borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: '0 2px 0 #0d8fcc', overflow: 'hidden' }}>
              <div style={{ width: `${daubProgress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #1cb0f6 0%, #5bc8ff 100%)', transition: 'width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)', animation: 'shimmer 2s ease-in-out infinite', pointerEvents: 'none' }} />
              </div>
            </div>
            <div style={{ position: 'absolute', top: '50%', left: `${daubProgress * 100}%`, transform: `translateY(-50%) translateX(${daubProgress >= 0.7 ? 'calc(-100% - 8px)' : '6px'})`, color: daubProgress >= 0.7 ? '#ffffff' : '#0d8fcc', fontSize: 'clamp(12px, 1.4vw, 16px)', fontWeight: 900, whiteSpace: 'nowrap', pointerEvents: 'none', transition: 'left 400ms cubic-bezier(0.34, 1.56, 0.64, 1)', letterSpacing: '0.04em', zIndex: 1 }}>
              {String(Math.round(daubProgress * 100)).padStart(2, '0')}%
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(3px, 0.7vw, 8px)' }}>
            <StatChip value={String(daubedCount).padStart(2, '0')} accent="#1cb0f6" textColor="#ffffff" style={{ flex: 1, width: 'auto', height: '100%', background: '#1cb0f6', border: '2px solid #0d8fcc', boxShadow: '0 2px 0 #0d8fcc', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
            <StatChip value={String(room).padStart(2, '0')} accent="#ff9600" textColor="#ffffff" style={{ flex: 1, width: 'auto', height: '100%', background: '#ff9600', border: '2px solid #cc7700', boxShadow: '0 2px 0 #cc7700', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
          </div>
          <div style={{ display: 'flex', gap: 'clamp(3px, 0.7vw, 8px)' }}>
            <IconButton onClick={() => setShowInfo(true)} title={t.roomInfo} style={{ flex: 1, width: 'auto', height: '100%', background: '#6b6b6b', border: '2px solid #555555', boxShadow: '0 2px 0 #555555', color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)' }}><InfoIcon /></IconButton>
            <IconButton onClick={() => setShowExit(true)} title={t.exitRoom} style={{ flex: 1, width: 'auto', height: '100%', background: '#6b6b6b', border: '2px solid #555555', boxShadow: '0 2px 0 #555555', color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)' }}><ExitIcon /></IconButton>
          </div>
        </div>

        {/* Card grid */}
        <div style={{ flex: 6, minHeight: 0, background: '#ffffff', border: 'none', borderRadius: 'clamp(14px, 2vw, 24px)', padding: 'clamp(6px, 1vw, 12px)', boxShadow: 'none', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', gap: 'clamp(3px, 0.7vw, 8px)' }}>
          {grid.flatMap((row, r) => row.map((val, c) => {
            const isFree = val === 'FREE';
            const isDaubed = !isFree && marked.has(val);
            const isCalled = !isFree && drawnSet.has(val);
            const isLatest = !isFree && val === lastDrawn;
            let bg = '#fafafa', fg = '#3c3c3c', border = '2px solid #ececec', shadow = '0 2px 0 #ececec';
            if (isFree) { bg = FREE_CELL.bg; fg = FREE_CELL.fg; border = FREE_CELL.border; shadow = FREE_CELL.shadow; }
            else if (isDaubed) { bg = '#1cb0f6'; fg = '#ffffff'; border = '2px solid #0d8fcc'; shadow = '0 3px 0 #0d8fcc'; }
            else if (isLatest) { bg = '#e7f8d4'; fg = '#46a302'; border = '2px solid #58cc02'; shadow = '0 3px 0 #58cc02, 0 0 0 3px rgba(88,204,2,0.2)'; }
            else if (isCalled) { bg = '#ffffff'; fg = '#3c3c3c'; border = '2px dashed #58cc02'; shadow = '0 2px 0 #e5e5e5'; }
            return (
              <button key={`${r}-${c}`} data-cell={val} disabled
                style={{ background: bg, color: fg, border, borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontSize: 'clamp(12px, 3.5vw, 18px)', fontWeight: 900, letterSpacing: '0.02em', cursor: 'default', opacity: 1, transition: 'background 200ms ease, color 200ms ease, border 200ms ease', padding: 0, minWidth: 0, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
                {isFree ? (
                  <span style={{ fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', fontSize: 'clamp(14px, 3.5vw, 22px)', color: FREE_CELL.fg }}>
                    {myRank}<sup style={{ fontSize: '0.5em', verticalAlign: 'super' }}>°</sup>
                  </span>
                ) : String(val).padStart(2, '0')}
              </button>
            );
          }))}
        </div>

        {/* DAUB / BINGO button */}
        <div style={{ flexShrink: 0, height: '10vh', padding: '0 clamp(6px, 1vw, 12px)' }}>
          <BigCta onClick={daub} disabled={isWinner || isGameOver || !pendingDaub} pulse={pendingDaub && !isWinner && !isGameOver} variant="blue">
            {daubLabel}
          </BigCta>
        </div>

        {calloutQueue[0] && <CastCallout n={calloutQueue[0].n} msg={calloutQueue[0].msg} onClose={() => setCalloutQueue(q => q.slice(1))} />}
        {session.trivia && (session.trivia.state === 'ready' || session.trivia.state === 'question' || session.trivia.state === 'answered') && <TriviaActiveModal trivia={session.trivia} room={room} playerId={playerId} isHost={false} lang={lang} />}
        {showAd && currentAd && <FakeAdModal ad={currentAd} lang={lang} onClose={() => setShowAd(false)} />}
        {showInfo && <LeaderboardModal players={leaderboard} onClose={() => setShowInfo(false)} totalCalled={drawn.length} room={room} />}
        {showExit && <ExitModal onCancel={() => setShowExit(false)} onConfirm={() => {
          if (playerId) sessionRef(room).update({ [`players.${playerId}`]: firebase.firestore.FieldValue.delete() });
          setShowExit(false); onExit();
        }} room={room} />}
      </div>
    </div>
  );
}

function CastCallout({ n, msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 5000);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
      <div onClick={onClose} style={{ pointerEvents: 'auto', cursor: 'pointer', background: '#ffffff', border: '4px solid #58cc02', borderRadius: 32, boxShadow: '0 10px 0 #46a302, 0 20px 60px rgba(0,0,0,0.18)', padding: '4vh 56px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0, width: '50vw', height: '50vh', animation: 'calloutPop 1.1s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ fontSize: 128, fontWeight: 900, color: '#58cc02', lineHeight: 1, letterSpacing: '-0.04em' }}>{String(n).padStart(2, '0')}</div>
        {msg && <div style={{ fontSize: 'clamp(13px, 1.4vw, 18px)', fontWeight: 800, color: '#3c3c3c', textAlign: 'center', whiteSpace: 'nowrap' }}>"{msg}"</div>}
      </div>
    </div>
  );
}



// ---------- Room generation ----------
const SESSION_TTL_MS = 4 * 60 * 60 * 1000; // sessions older than 4h are stale

async function generateUniqueRoom() {
  const snap = await db().collection("sessions").get();
  const now = Date.now();
  const taken = new Set(
    snap.docs
      .filter(d => {
        const data = d.data();
        return data.createdAt && (now - data.createdAt) < SESSION_TTL_MS;
      })
      .map(d => parseInt(d.id, 10))
      .filter(n => n >= 1 && n <= 99)
  );
  const available = [];
  for (let i = 1; i <= 99; i++) if (!taken.has(i)) available.push(i);
  if (!available.length) throw new Error('ALL_ROOMS_IN_USE');
  return String(available[Math.floor(Math.random() * available.length)]).padStart(2, '0');
}

// ---------- Root App ----------
function App() {
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || 'en');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const setLang = useCallback((l) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  const [uid, setUid] = useState(null);
  const [name, setName] = useState(() => {
    try {
      const stored = localStorage.getItem(ME_KEY);
      if (!stored) return '';
      try { const p = JSON.parse(stored); if (p && typeof p.name === 'string') return p.name; } catch {}
      return stored;
    } catch { return ''; }
  });

  useEffect(() => {
    firebase.auth().signInAnonymously()
      .then(cred => {
        setUid(cred.user.uid);
        trackUser(cred.user.uid);
      })
      .catch(() => {});
  }, []);

  const [screen, setScreen] = useState('welcome');
  const [room, setRoom] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [welcomeError, setWelcomeError] = useState(null);
  const [claiming, setClaiming] = useState(false);

  const currentNameRef = useRef(name);
  useEffect(() => { currentNameRef.current = name; }, [name]);
  const screenRef = useRef('welcome');
  useEffect(() => { screenRef.current = screen; }, [screen]);
  const roomRef = useRef('');
  useEffect(() => { roomRef.current = room; }, [room]);
  const uidRef = useRef(null);
  useEffect(() => { uidRef.current = uid; }, [uid]);

  const inactivityTimerRef = useRef(null);

  function resetInactivityTimer() {
    clearTimeout(inactivityTimerRef.current);
    inactivityTimerRef.current = setTimeout(() => {
      if (screen === 'host' && room) sessionRef(room).delete().catch(() => {});
      else if (screen === 'cast' && room && uid) sessionRef(room).update({
        [`players.${uid}`]: firebase.firestore.FieldValue.delete(),
        [`pending.${uid}`]: firebase.firestore.FieldValue.delete(),
      }).catch(() => {});
      releaseName(currentNameRef.current);
      setRoom('');
      setScreen('welcome');
    }, INACTIVE_MS);
  }

  useEffect(() => {
    if (screen === 'welcome') { clearTimeout(inactivityTimerRef.current); return; }
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
      clearTimeout(inactivityTimerRef.current);
    };
  }, [screen]);

  useEffect(() => {
    if (screen === 'welcome' || !name) return;
    const id = setInterval(() => heartbeatName(name), HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [screen, name]);

  // beforeunload: show confirmation dialog when in room
  useEffect(() => {
    const guard = (e) => {
      const sc = screenRef.current;
      if (sc === 'host' || sc === 'cast') { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', guard);
    return () => window.removeEventListener('beforeunload', guard);
  }, []);

  // pagehide: actual cleanup (fires after user confirms dialog, or on iOS without dialog)
  useEffect(() => {
    const cleanup = () => {
      const sc = screenRef.current;
      const r  = roomRef.current;
      const u  = uidRef.current;
      const n  = currentNameRef.current;
      const BASE = 'https://firestore.googleapis.com/v1/projects/nl-daubcard/databases/(default)/documents';

      if (sc === 'host' && r) {
        const writes = [{ delete: `projects/nl-daubcard/databases/(default)/documents/sessions/${r}` }];
        if (n) writes.push({ delete: `projects/nl-daubcard/databases/(default)/documents/names/${encodeURIComponent(n.toLowerCase())}` });
        navigator.sendBeacon(`${BASE}:commit`, new Blob([JSON.stringify({ writes })], { type: 'application/json' }));
      } else if (sc === 'cast' && r && u) {
        fetch(`${BASE}/sessions/${r}?updateMask.fieldPaths=players.${u}`, {
          method: 'PATCH', keepalive: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: `projects/nl-daubcard/databases/(default)/documents/sessions/${r}`, fields: {} }),
        }).catch(() => {});
        if (n) {
          navigator.sendBeacon(`${BASE}:commit`, new Blob([JSON.stringify({
            writes: [{ delete: `projects/nl-daubcard/databases/(default)/documents/names/${encodeURIComponent(n.toLowerCase())}` }],
          })], { type: 'application/json' }));
        }
      }
    };
    window.addEventListener('pagehide', cleanup);
    return () => window.removeEventListener('pagehide', cleanup);
  }, []);

  async function handlePickHost() {
    setGenerating(true);
    setGenError(null);
    try {
      const r = await generateUniqueRoom();
      setRoom(r);
      setScreen('host');
    } catch (err) {
      setGenError(err.message === 'ALL_ROOMS_IN_USE' ? t.allRoomsInUse : err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleWelcome({ name: n }) {
    setClaiming(true);
    setWelcomeError(null);
    try {
      await claimName(n, uid);
      setName(n);
      try { localStorage.setItem(ME_KEY, n); } catch {}
      setScreen('home');
    } catch (err) {
      setWelcomeError(err?.code === 'name-taken' ? t.globalNameTaken : t.joinConnectionError);
    } finally {
      setClaiming(false);
    }
  }

  async function handleJoin(r) {
    setJoinError(null);
    const padded = String(r).padStart(2, '0');
    try {
      const snap = await sessionRef(padded).get();
      if (!snap.exists) { setJoinError(t.joinRoomNotFound); return; }
      setRoom(padded);
      setScreen('cast');
    } catch (_) {
      setJoinError(t.joinConnectionError);
    }
  }
  function handleExit() { setRoom(''); setScreen('home'); }

  function handleBack() {
    if (screen === 'home') { releaseName(currentNameRef.current); setScreen('welcome'); }
    else if (screen === 'join') { setJoinError(null); setScreen('home'); }
  }

  if (!uid) {
    return (
      <LangContext.Provider value={{ lang, setLang, t }}>
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: '"Nunito", system-ui, sans-serif', color: '#7a7a7a', fontWeight: 700 }}>
          {t.connecting}
        </div>
      </LangContext.Provider>
    );
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {screen === 'welcome' && <WelcomeScreen onContinue={handleWelcome} initialName={name} error={welcomeError} claiming={claiming} />}
      {screen === 'home' && <HomeScreen name={name} onPick={(r) => r === 'host' ? handlePickHost() : setScreen('join')} onBack={handleBack} generating={generating} genError={genError} />}
      {screen === 'join' && <JoinScreen onJoin={handleJoin} onBack={handleBack} error={joinError} />}
      {screen === 'host' && <HostScreen me={{ name, uid }} room={room} onExit={handleExit} />}
      {screen === 'cast' && <CastScreen me={{ name, uid }} room={room} onExit={handleExit} />}
    </LangContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
