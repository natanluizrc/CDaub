// ===========================================================
// CDaub — Playful Bingo  |  Firebase Firestore real-time
// ===========================================================

const { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } = React;

const ME_KEY = "bingo_me";
const LANG_KEY = "bingo_lang";
const db = () => firebase.firestore();
const sessionRef = (code) => db().collection("sessions").doc(code);

// ---------- Translations ----------
const TRANSLATIONS = {
  en: {
    tagline: 'Cards that build moments',
    nameLabel: 'NAME',
    namePlaceholder: 'e.g. Natan',
    nameTooLong: 'Name must be 10 characters or less.',
    continue: 'Continue',
    back: '← Back',
    enterRoomCode: 'Enter the room code.',
    roomLabel: 'ROOM',
    roomWord: 'Room',
    join: 'Join',
    pickRole: 'Pick a role to enter the game.',
    generatingRoom: 'Generating room…',
    hostTagline: "You'll call the balls",
    hostDesc: 'Run the room. Draw numbers, watch the leaderboard, keep the party going.',
    castTagline: "You'll play with a card",
    castDesc: 'Mark your card as numbers are drawn. Be the first to complete a line and shout it out.',
    rotating: 'Rotate your phone',
    hostLandscape: 'The host screen works best in landscape.',
    castLandscape: 'The player screen works best in landscape.',
    connecting: 'Connecting…',
    waiting: 'waiting',
    roomInfo: 'Room info',
    exitRoom: 'Exit room',
    draw: 'Draw',
    drawing: 'Drawing...',
    done: 'Done!',
    exitRoomQuestion: 'Exit the room?',
    exitRoomBodyPre: "You won't be able to come back to",
    exitRoomBodyPost: '. Your card and progress will be lost.',
    exit: 'Exit',
    gotItPre: '',
    gotItPost: ' got it!',
    seeResults: 'See results',
    continueBtn: 'Continue',
    leaderboard: 'Leaderboard',
    noPlayersPre: 'No players yet. Share Room',
    noPlayersPost: 'to get started!',
    hits: 'HITS',
    waitingToJoin: 'Waiting to join',
    approveOrReject: 'Approve or reject each player.',
    reject: 'REJECT',
    approve: 'APPROVE',
    roomNotFoundTitle: 'Room not found',
    waitingForApprovalTitle: 'Waiting for approval',
    hostWillLetYouIn: 'The host will let you in shortly.',
    cancel: 'Cancel',
    requestDeniedTitle: 'Request denied',
    hostDidntLetIn: "The host didn't let you in.",
    backToStart: 'Back to start',
    roomEndedTitle: 'Room ended',
    hostLeft: 'The host has left the room.',
    waitingForHost: 'Waiting for the host…',
    daub: 'DAUB',
    wins: 'WINS',
    lost: 'LOST',
    drawnBalls: 'Drawn balls',
    noBallsDrawn: 'No balls drawn yet.',
    allRoomsInUse: 'All rooms (01–99) are currently in use. Try again later.',
    joinRoomNotFound: 'Room not found. Check the code with the host.',
    joinNameTaken: 'Name already taken in this room. Go back and choose a different name.',
    joinConnectionError: 'Connection error. Please try again.',
    cold: 'COLD',
    warm: 'WARM',
    fire: 'FIRE',
  },
  pt: {
    tagline: 'Cartelas que criam momentos',
    nameLabel: 'NOME',
    namePlaceholder: 'ex: Natan',
    nameTooLong: 'O nome deve ter no máximo 10 caracteres.',
    continue: 'Continuar',
    back: '← Voltar',
    enterRoomCode: 'Digite o código da sala.',
    roomLabel: 'SALA',
    roomWord: 'Sala',
    join: 'Entrar',
    pickRole: 'Escolha um papel para entrar no jogo.',
    generatingRoom: 'Criando sala…',
    hostTagline: 'Você vai sortear as bolas',
    hostDesc: 'Conduza a sala. Sorteie números, acompanhe o ranking e anime a galera.',
    castTagline: 'Você vai jogar com uma cartela',
    castDesc: 'Marque sua cartela conforme os números são sorteados. Seja o primeiro a completar uma linha!',
    rotating: 'Vire o celular',
    hostLandscape: 'A tela do host funciona melhor na horizontal.',
    castLandscape: 'A tela do jogador funciona melhor na horizontal.',
    connecting: 'Conectando…',
    waiting: 'aguardando',
    roomInfo: 'Info da sala',
    exitRoom: 'Sair da sala',
    draw: 'Sortear',
    drawing: 'Sorteando...',
    done: 'Concluído!',
    exitRoomQuestion: 'Sair da sala?',
    exitRoomBodyPre: 'Você não poderá voltar para a',
    exitRoomBodyPost: '. Sua cartela e progresso serão perdidos.',
    exit: 'Sair',
    gotItPre: '',
    gotItPost: ' conseguiu!',
    seeResults: 'Ver resultados',
    continueBtn: 'Continuar',
    leaderboard: 'Ranking',
    noPlayersPre: 'Nenhum jogador ainda. Compartilhe a Sala',
    noPlayersPost: 'para começar!',
    hits: 'ACERTOS',
    waitingToJoin: 'Aguardando entrar',
    approveOrReject: 'Aprove ou rejeite cada jogador.',
    reject: 'REJEITAR',
    approve: 'APROVAR',
    roomNotFoundTitle: 'Sala não encontrada',
    waitingForApprovalTitle: 'Aguardando aprovação',
    hostWillLetYouIn: 'O host vai liberar sua entrada em breve.',
    cancel: 'Cancelar',
    requestDeniedTitle: 'Solicitação negada',
    hostDidntLetIn: 'O host não te deixou entrar.',
    backToStart: 'Voltar ao início',
    roomEndedTitle: 'Sala encerrada',
    hostLeft: 'O host saiu da sala.',
    waitingForHost: 'Aguardando o host…',
    daub: 'MARCAR',
    wins: 'GANHOU',
    lost: 'PERDEU',
    drawnBalls: 'Bolas sorteadas',
    noBallsDrawn: 'Nenhuma bola sorteada ainda.',
    allRoomsInUse: 'Todas as salas (01–99) estão ocupadas. Tente novamente em breve.',
    joinRoomNotFound: 'Sala não encontrada. Confirme o código com o host.',
    joinNameTaken: 'Nome já usado nessa sala. Volte e escolha outro nome.',
    joinConnectionError: 'Erro de conexão. Tente novamente.',
    cold: 'FRIO',
    warm: 'QUENTE',
    fire: 'FOGO',
  },
  es: {
    tagline: 'Tarjetas que crean momentos',
    nameLabel: 'NOMBRE',
    namePlaceholder: 'ej: Natan',
    nameTooLong: 'El nombre debe tener 10 caracteres o menos.',
    continue: 'Continuar',
    back: '← Atrás',
    enterRoomCode: 'Ingresa el código de sala.',
    roomLabel: 'SALA',
    roomWord: 'Sala',
    join: 'Unirse',
    pickRole: 'Elige un rol para entrar al juego.',
    generatingRoom: 'Creando sala…',
    hostTagline: 'Tú cantarás los números',
    hostDesc: 'Conduce la sala. Sortea números, mira el ranking y anima a los jugadores.',
    castTagline: 'Jugarás con un cartón',
    castDesc: 'Marca tu cartón mientras se sortean los números. ¡Sé el primero en completar una línea!',
    rotating: 'Gira tu teléfono',
    hostLandscape: 'La pantalla del host funciona mejor en horizontal.',
    castLandscape: 'La pantalla del jugador funciona mejor en horizontal.',
    connecting: 'Conectando…',
    waiting: 'esperando',
    roomInfo: 'Info de sala',
    exitRoom: 'Salir de la sala',
    draw: 'Sortear',
    drawing: 'Sorteando...',
    done: '¡Listo!',
    exitRoomQuestion: '¿Salir de la sala?',
    exitRoomBodyPre: 'No podrás volver a la',
    exitRoomBodyPost: '. Tu tarjeta y progreso se perderán.',
    exit: 'Salir',
    gotItPre: '¡',
    gotItPost: ' lo logró!',
    seeResults: 'Ver resultados',
    continueBtn: 'Continuar',
    leaderboard: 'Clasificación',
    noPlayersPre: 'Sin jugadores aún. ¡Comparte la Sala',
    noPlayersPost: 'para empezar!',
    hits: 'ACIERTOS',
    waitingToJoin: 'Esperando entrar',
    approveOrReject: 'Aprueba o rechaza a cada jugador.',
    reject: 'RECHAZAR',
    approve: 'APROBAR',
    roomNotFoundTitle: 'Sala no encontrada',
    waitingForApprovalTitle: 'Esperando aprobación',
    hostWillLetYouIn: 'El host te dejará entrar pronto.',
    cancel: 'Cancelar',
    requestDeniedTitle: 'Solicitud denegada',
    hostDidntLetIn: 'El host no te dejó entrar.',
    backToStart: 'Volver al inicio',
    roomEndedTitle: 'Sala terminada',
    hostLeft: 'El host ha salido de la sala.',
    waitingForHost: 'Esperando al host…',
    daub: 'MARCAR',
    wins: 'GANÓ',
    lost: 'PERDIÓ',
    drawnBalls: 'Bolas sorteadas',
    noBallsDrawn: 'Aún no se han sorteado bolas.',
    allRoomsInUse: 'Todas las salas (01–99) están en uso. Inténtalo más tarde.',
    joinRoomNotFound: 'Sala no encontrada. Confirma el código con el host.',
    joinNameTaken: 'Nombre ya usado en esta sala. Vuelve y elige otro nombre.',
    joinConnectionError: 'Error de conexión. Inténtalo de nuevo.',
    cold: 'FRÍO',
    warm: 'CÁLIDO',
    fire: 'FUEGO',
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

function ScreenShell({ children }) {
  return (
    <div style={{
      height: '100vh', overflowY: 'auto', background: '#f7fafc',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 'clamp(16px, 4vw, 32px)',
      fontFamily: '"Nunito", system-ui, sans-serif', boxSizing: 'border-box',
    }}>
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
      <div style={{ fontSize: 48, fontWeight: 900, color: '#3c3c3c', letterSpacing: '-0.035em', lineHeight: 1 }}>CDaub.</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      <span style={{ fontSize: 11, fontWeight: 900, color: '#afafaf', letterSpacing: '0.2em' }}>{label}</span>
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
      {pulse && !disabled && <div style={{ position: 'absolute', inset: 0, borderRadius: 'clamp(12px, 1.5vw, 18px)', animation: `${variant === 'blue' ? 'buttonPulseBlue' : 'buttonPulse'} 1.8s ease-out infinite`, pointerEvents: 'none' }} />}
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
      color: '#afafaf', padding: 6,
    }}>{children}</button>
  );
}

function ChunkyButton({ onClick, variant = 'primary', children }) {
  const [pressed, setPressed] = useState(false);
  const VARIANTS = { ghost: { bg: '#ffffff', fg: '#3c3c3c', border: '#e5e5e5', shadow: '#cfcfcf' }, danger: { bg: '#ff4b4b', fg: '#ffffff', border: '#ff4b4b', shadow: '#d63030' }, primary: { bg: '#58cc02', fg: '#ffffff', border: '#58cc02', shadow: '#46a302' } };
  const v = VARIANTS[variant];
  return (
    <button onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)} onClick={onClick}
      style={{ width: '100%', padding: '14px 16px', background: v.bg, color: v.fg, border: `2px solid ${v.border}`, borderRadius: 14, boxShadow: pressed ? `0 1px 0 ${v.shadow}` : `0 4px 0 ${v.shadow}`, transform: pressed ? 'translateY(3px)' : 'translateY(0)', transition: 'transform 60ms ease, box-shadow 60ms ease', fontFamily: 'inherit', fontWeight: 900, fontSize: 15, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer' }}
    >{children}</button>
  );
}

function IconButton({ onClick, children, title, style = {} }) {
  return (
    <button onClick={onClick} title={title} style={{ width: 40, height: 40, background: '#ffffff', border: '2px solid #e5e5e5', borderRadius: 12, boxShadow: '0 2px 0 #e5e5e5', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, ...style }}>
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
function HistoryIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 0 3-6.7" stroke="#3c3c3c" strokeWidth="2.2" strokeLinecap="round" /><path d="M3 3v5h5" stroke="#3c3c3c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M12 7v5l3 2" stroke="#3c3c3c" strokeWidth="2.2" strokeLinecap="round" /></svg>;
}

// ---------- Lang Picker ----------
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
            <span style={{ fontSize: 16, lineHeight: 1 }}>{flag}</span>
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ---------- Welcome Screen ----------
function WelcomeScreen({ onContinue, initialName }) {
  const { t } = useLang();
  const [name, setName] = useState(initialName || '');
  const trimmed = name.trim();
  const canGo = trimmed.length >= 2;
  const tooLong = trimmed.length > 10;

  return (
    <ScreenShell>
      <Logo />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 22 }}>
        <span style={{ width: 24, height: 2, background: '#e5e5e5', borderRadius: 2 }} />
        <span style={{ fontSize: 12, fontWeight: 900, color: '#7a7a7a', letterSpacing: '0.22em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Developed by NL Solutions</span>
        <span style={{ width: 24, height: 2, background: '#e5e5e5', borderRadius: 2 }} />
      </div>
      <LangPicker />
      <div style={{ textAlign: 'center' }}>
        <Field label={t.nameLabel}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} autoFocus style={{ ...inputStyle, textAlign: 'center', borderColor: tooLong ? '#ff4b4b' : undefined }} />
        </Field>
        {tooLong && <div style={{ marginTop: 8, fontSize: 12, fontWeight: 800, color: '#ff4b4b' }}>{t.nameTooLong}</div>}
      </div>
      <div style={{ marginTop: 28 }}>
        <BigCta disabled={!canGo || tooLong} onClick={() => canGo && !tooLong && onContinue({ name: trimmed })}>{t.continue}</BigCta>
      </div>
    </ScreenShell>
  );
}

// ---------- Join Screen ----------
function JoinScreen({ name, onJoin, onBack }) {
  const { t } = useLang();
  const [room, setRoom] = useState('');
  const canGo = room.trim().length >= 1;

  return (
    <ScreenShell>
      <BackLink onClick={onBack}>{t.back}</BackLink>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#3c3c3c', textAlign: 'center', marginBottom: 28, marginTop: 28 }}>{t.enterRoomCode}</div>
      <div style={{ padding: '18px 20px', background: '#ffffff', border: '2px solid #ff9600', borderRadius: 20, boxShadow: '0 5px 0 #cc7700', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#afafaf', letterSpacing: '0.2em' }}>{t.roomLabel}</span>
        <input type="text" value={room} onChange={(e) => setRoom(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="00" autoFocus style={{ ...inputStyle, letterSpacing: '0.2em', fontVariantNumeric: 'tabular-nums', fontSize: 32, textAlign: 'center', padding: '10px 16px' }} onKeyDown={(e) => e.key === 'Enter' && canGo && onJoin(room.trim())} />
      </div>
      <div style={{ marginTop: 14 }}>
        <BigCta variant="orange" disabled={!canGo} onClick={() => canGo && onJoin(room.trim())}>{t.join}</BigCta>
      </div>
    </ScreenShell>
  );
}

// ---------- Role Screen ----------
function RoleScreen({ name, onPick, onBack, generating, genError }) {
  const { t } = useLang();
  return (
    <ScreenShell>
      <BackLink onClick={onBack}>{t.back}</BackLink>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#3c3c3c', textAlign: 'center', marginBottom: 28, marginTop: 28 }}>{t.pickRole}</div>
      {genError && <div style={{ color: '#ff4b4b', fontWeight: 700, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>{genError}</div>}
      <div style={{ display: 'grid', gap: 14 }}>
        <RoleCard color="#58cc02" emoji="🎙️" title="HOST" tagline={generating ? t.generatingRoom : t.hostTagline} desc={t.hostDesc} onClick={() => !generating && onPick('host')} />
        <RoleCard color="#1cb0f6" emoji="🎯" title="CAST" tagline={t.castTagline} desc={t.castDesc} onClick={() => !generating && onPick('cast')} />
      </div>
    </ScreenShell>
  );
}

function RoleCard({ color, emoji, title, tagline, desc, onClick }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)} onClick={onClick}
      style={{ textAlign: 'left', padding: 18, background: '#ffffff', border: `2px solid ${color}`, borderRadius: 20, boxShadow: pressed ? `0 1px 0 ${color}` : `0 5px 0 ${color}`, transform: pressed ? 'translateY(4px)' : 'translateY(0)', transition: 'transform 80ms ease, box-shadow 80ms ease', cursor: 'pointer', display: 'grid', gridTemplateColumns: '64px 1fr', gap: 16, alignItems: 'center', fontFamily: 'inherit' }}>
      <div style={{ width: 64, height: 64, background: color + '14', border: `2px solid ${color}`, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>{emoji}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c', letterSpacing: '0.04em' }}>{title}</span>
          <span style={{ fontSize: 13, fontWeight: 800, color }}>{tagline}</span>
        </div>
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
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#ffffff', border: '3px solid #ff4b4b', borderRadius: 24, boxShadow: '0 12px 0 #d63030, 0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', textAlign: 'center', position: 'relative', animation: 'modalPop 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <button onClick={onCancel} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, background: '#ffe9e9', border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 900, color: '#ff4b4b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
        <div style={{ padding: '32px 28px 8px' }}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c', marginBottom: 10 }}>{t.exitRoomQuestion}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#7a7a7a', lineHeight: 1.45 }}>{t.exitRoomBodyPre} <b style={{ color: '#3c3c3c' }}>{t.roomWord} {String(room).padStart(2, '0')}</b>{t.exitRoomBodyPost}</div>
        </div>
        <div style={{ padding: '18px 20px 22px' }}>
          <ChunkyButton onClick={onConfirm} variant="danger">{t.exit}</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

function LineNotif({ name, onClose }) {
  const { t } = useLang();
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
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
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#afafaf', fontWeight: 900, lineHeight: 1, padding: 4 }}>✕</button>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
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
      <div style={{ fontSize: 72, animation: 'rotateHint 2s ease-in-out infinite' }}>📱</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>{title}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#afafaf', lineHeight: 1.5, maxWidth: 260 }}>{message}</div>
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
  const [callout, setCallout] = useState(null);
  const [hostMsg, setHostMsg] = useState(null);
  const [confetti, setConfetti] = useState(false);
  const [winnerQueue, setWinnerQueue] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const createdRef = useRef(false);
  const rollTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);
  const hostMsgRef = useRef(null);
  const drawnRef = useRef([]);
  const prevPendingCountRef = useRef(0);
  const prevPlayerWinsRef = useRef(null);

  useEffect(() => {
    localStorage.setItem(ME_KEY, JSON.stringify({ name: me.name, session: room }));
  }, []);

  useEffect(() => {
    const handleUnload = () => sessionRef(room).delete();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [room]);

  useEffect(() => {
    if (!session) return;
    const count = Object.values(session.pending || {}).length;
    if (count > prevPendingCountRef.current) setShowPending(true);
    if (count === 0) setShowPending(false);
    prevPendingCountRef.current = count;
  }, [session]);

  useEffect(() => {
    const ref = sessionRef(room);
    const unsub = ref.onSnapshot(
      (snap) => {
        if (snap.exists) {
          setSession(snap.data());
          drawnRef.current = snap.data().drawn || [];
        } else if (!createdRef.current) {
          createdRef.current = true;
          ref.set({ code: room, callerName: me.name, createdAt: Date.now(), drawn: [], lastDrawn: null, lastDrawnAt: null, players: {}, winner: null })
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
        setConfetti(true);
        setTimeout(() => setConfetti(false), 2200);
        setWinnerQueue(q => [...q, { name: p.name, isBingo: !!p.bingo }]);
      }
    }
    prevPlayerWinsRef.current = next;
  }, [session]);

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
    setCallout(null);

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
          setHostMsg(msg);
          setCallout(pick);
          sessionRef(room).update({ drawn: newDrawn, lastDrawn: pick, lastDrawnAt: Date.now() });
          playSound('pop');
        }, 200);
        return;
      }
      rollTimeoutRef.current = setTimeout(step, interval);
    }
    step();
  }

  if (isPortraitMobile) return <RotatePrompt title={t.rotating} message={t.hostLandscape} />;
  if (fsError) return <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}><div style={{ color: '#ff4b4b', textAlign: 'center', padding: 40, fontWeight: 700 }}>Firestore error: {fsError}</div></div>;
  if (!session) return <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}><div style={{ color: '#afafaf', textAlign: 'center', padding: 40, fontWeight: 700 }}>{t.connecting}</div></div>;

  const drawn = session.drawn || [];
  const drawnSet = new Set(drawn);
  const latest = drawn[drawn.length - 1] || null;
  const left = TOTAL - drawn.length;
  const progress = drawn.length / TOTAL;
  const cells = Array.from({ length: TOTAL }, (_, i) => ({ n: i + 1, r: Math.floor(i / COLS), c: i % COLS }));
  const players = Object.values(session.players || {});
  const leaderboard = players.map(p => ({ name: p.name, hits: (p.marked || []).length, avatar: mascotFor(p.name), color: '#1cb0f6', isYou: false, bingo: p.bingo })).sort((a, b) => b.hits - a.hits);
  const pendingPlayers = Object.values(session.pending || {});

  const approvePending = (p) => {
    sessionRef(room).update({
      [`players.${p.id}`]: { ...p, marked: [], bingo: false },
      [`pending.${p.id}`]: firebase.firestore.FieldValue.delete(),
    });
  };
  const rejectPending = (p) => {
    sessionRef(room).update({ [`pending.${p.id}`]: firebase.firestore.FieldValue.delete() });
  };

  if (showPending) return <PendingScreen players={pendingPlayers} onApprove={approvePending} onReject={rejectPending} onClose={() => setShowPending(false)} />;

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#f7fafc', fontFamily: '"Nunito", system-ui, sans-serif', color: '#3c3c3c', display: 'flex', justifyContent: 'center', padding: '3vh clamp(14px, 3vw, 24px)', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 1400, height: '100%', display: 'flex', flexDirection: 'column', gap: '5vh', position: 'relative' }}>

        {/* Header */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: '1fr', gap: 'clamp(3px, 0.7vw, 8px)', padding: '0 clamp(6px, 1vw, 12px)', alignItems: 'stretch' }}>
          <div style={{ gridColumn: 'span 2', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 3 }}>
            <div style={{ fontSize: '6vh', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1 }}>CDaub.</div>
            <div style={{ fontSize: 'clamp(9px, 1.1vw, 11px)', fontWeight: 800, color: '#afafaf', letterSpacing: '0.14em', lineHeight: 1.5 }}>
              <div>HOST</div>
              <div>{me.name}</div>
            </div>
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
          <IconButton onClick={() => pendingPlayers.length > 0 ? setShowPending(true) : setShowLeaderboard(true)} title={pendingPlayers.length > 0 ? `${pendingPlayers.length} ${t.waiting}` : t.roomInfo} style={{ width: '100%', height: '100%', background: pendingPlayers.length > 0 ? '#ff9600' : '#6b6b6b', border: `2px solid ${pendingPlayers.length > 0 ? '#cc7700' : '#555555'}`, boxShadow: `0 2px 0 ${pendingPlayers.length > 0 ? '#cc7700' : '#555555'}`, color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)', fontSize: pendingPlayers.length > 0 ? 'clamp(12px, 1.4vw, 16px)' : undefined, fontWeight: 900 }}>{pendingPlayers.length > 0 ? pendingPlayers.length : <InfoIcon />}</IconButton>
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
        <DrawButton onClick={drawNext} disabled={left === 0} rolling={rolling} done={!!session.winner} height='10vh' margin='clamp(6px, 1vw, 12px)' />

        {callout && <HostCallout n={callout} msg={hostMsg} onClose={() => setCallout(null)} />}
        {confetti && <GameConfetti />}

        {winnerQueue[0] && !winnerQueue[0].isBingo && <LineNotif name={winnerQueue[0].name} onClose={() => setWinnerQueue(q => q.slice(1))} />}
        {winnerQueue[0] && winnerQueue[0].isBingo && <WinNotif name={winnerQueue[0].name} onClose={() => { setWinnerQueue(q => q.slice(1)); setShowLeaderboard(true); }} />}
        {showLeaderboard && <LeaderboardModal players={leaderboard} onClose={() => setShowLeaderboard(false)} totalCalled={drawn.length} room={room} />}
        {showExit && <ExitModal onCancel={() => setShowExit(false)} onConfirm={() => { setShowExit(false); sessionRef(room).delete(); onExit(); }} room={room} />}
      </div>
    </div>
  );
}

function StatTile({ label, value, accent }) {
  return (
    <div style={{ height: '100%', boxSizing: 'border-box', background: '#ffffff', border: '2px solid #e5e5e5', borderRadius: 18, boxShadow: '0 3px 0 #e5e5e5', padding: 'clamp(10px, 1.5vw, 14px) clamp(12px, 2vw, 18px)', display: 'flex', alignItems: 'center', gap: 'clamp(8px, 1.5vw, 14px)', minWidth: 0 }}>
      <div style={{ width: 4, height: 'clamp(28px, 4vw, 36px)', background: accent, borderRadius: 4, flexShrink: 0 }} />
      <span style={{ fontSize: 'clamp(20px, 3vw, 26px)', fontWeight: 900, color: '#3c3c3c', lineHeight: 1, letterSpacing: '-0.02em' }}>{value}</span>
      <span style={{ marginLeft: 'auto', fontSize: 'clamp(10px, 1.3vw, 12px)', color: '#afafaf', fontWeight: 800, letterSpacing: '0.16em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{label}</span>
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
    const t = setTimeout(onClose, 3000);
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
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, maxHeight: 'min(80vh, 560px)', background: '#ffffff', border: '3px solid #e5e5e5', borderRadius: 24, boxShadow: '0 12px 0 #d6d6d6, 0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', textAlign: 'center', position: 'relative', animation: 'modalPop 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards', display: 'flex', flexDirection: 'column' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 14, right: 14, width: 36, height: 36, background: '#f3f3f3', border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 900, color: '#afafaf', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>✕</button>
        <div style={{ padding: '32px 28px 8px', flexShrink: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#afafaf', letterSpacing: '0.18em', marginBottom: 4 }}>{t.roomLabel} {String(room).padStart(2, '0')}</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c' }}>{t.leaderboard}</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 20px 22px', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '2px solid #f3f3f3' }}>
          {players.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 14, fontWeight: 700, color: '#afafaf' }}>{t.noPlayersPre} {String(room).padStart(2, '0')} {t.noPlayersPost}</div>}
          {players.map((p, i) => {
            const pct = totalCalled > 0 ? p.hits / totalCalled : 0;
            return (
              <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#ffffff', border: '2px solid #ececec', borderRadius: 16, boxShadow: '0 2px 0 #ececec' }}>
                <div style={{ width: 28, textAlign: 'center', fontSize: 15, fontWeight: 900, color: i === 0 ? '#ffc800' : i === 1 ? '#afafaf' : i === 2 ? '#cd7f32' : '#cfcfcf' }}>#{i + 1}</div>
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
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#afafaf', letterSpacing: '0.1em', marginTop: 2 }}>{t.hits}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PendingScreen({ players, onApprove, onReject }) {
  const { t } = useLang();
  return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#3c3c3c', marginBottom: 6 }}>{t.waitingToJoin}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 20 }}>{t.approveOrReject}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {players.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#ffffff', border: '2px solid #ececec', borderRadius: 16, boxShadow: '0 2px 0 #ececec' }}>
            <div style={{ width: 40, height: 40, background: '#ff960022', border: '2px solid #ff9600', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{mascotFor(p.name)}</div>
            <div style={{ flex: 1, fontSize: 16, fontWeight: 900, color: '#3c3c3c' }}>{p.name}</div>
            <button onClick={() => onReject(p)} style={{ padding: '8px 16px', background: '#fff0f0', border: '2px solid #ff4b4b', borderRadius: 10, boxShadow: '0 2px 0 #d63030', color: '#ff4b4b', fontFamily: 'inherit', fontWeight: 900, fontSize: 13, letterSpacing: '0.06em', cursor: 'pointer' }}>{t.reject}</button>
            <button onClick={() => onApprove(p)} style={{ padding: '8px 16px', background: '#58cc02', border: '2px solid #46a302', borderRadius: 10, boxShadow: '0 2px 0 #46a302', color: '#ffffff', fontFamily: 'inherit', fontWeight: 900, fontSize: 13, letterSpacing: '0.06em', cursor: 'pointer' }}>{t.approve}</button>
          </div>
        ))}
      </div>
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
  const [playerId, setPlayerId] = useState(null);
  const [localCard, setLocalCard] = useState(null);
  const [callout, setCallout] = useState(null);
  const [showExit, setShowExit] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [hostMsg, setHostMsg] = useState(t.waitingForHost);
  const [localBingo, setLocalBingo] = useState(false);
  const [castConfetti, setCastConfetti] = useState(false);
  const [rejected, setRejected] = useState(false);
  const prevLastDrawnRef = useRef(null);
  const hostMsgRef = useRef(t.waitingForHost);
  const castWinLinesRef = useRef([]);
  const wasInPendingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ME_KEY) || '{}');
      if (saved.session === room && saved.playerId && saved.card) {
        setPlayerId(saved.playerId);
        setLocalCard(saved.card);
        sessionRef(room).get().then(snap => {
          if (!snap.exists) return;
          const data = snap.data();
          const inPending = !!(data.pending || {})[saved.playerId];
          if (!inPending) {
            const updates = { [`pending.${saved.playerId}`]: { id: saved.playerId, name: me.name, joinedAt: Date.now(), card: saved.card } };
            if ((data.players || {})[saved.playerId]) updates[`players.${saved.playerId}`] = firebase.firestore.FieldValue.delete();
            sessionRef(room).update(updates);
          }
        }).catch(() => {});
        return;
      }
    } catch {}

    setJoining(true);
    sessionRef(room).get().then((snap) => {
      if (!snap.exists) { setJoinError(t.joinRoomNotFound); setJoining(false); return; }
      const data = snap.data();
      const takenNames = [
        ...Object.values(data.players || {}),
        ...Object.values(data.pending || {}),
      ].map(p => p.name.toLowerCase());
      if (takenNames.includes(me.name.toLowerCase())) {
        setJoinError(t.joinNameTaken); setJoining(false); return;
      }
      const pid = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const card = makeCard();
      return sessionRef(room).update({ [`pending.${pid}`]: { id: pid, name: me.name, joinedAt: Date.now(), card } })
        .then(() => {
          setPlayerId(pid);
          setLocalCard(card);
          localStorage.setItem(ME_KEY, JSON.stringify({ name: me.name, session: room, playerId: pid, card }));
        });
    }).catch(() => setJoinError(t.joinConnectionError)).finally(() => setJoining(false));
  }, [room]);

  useEffect(() => {
    if (!playerId) return;
    const unsub = sessionRef(room).onSnapshot((snap) => { setSession(snap.exists ? snap.data() : null); setLoaded(true); });
    return () => unsub();
  }, [playerId, room]);

  useEffect(() => {
    if (!playerId) return;
    const cleanup = () => sessionRef(room).update({
      [`players.${playerId}`]: firebase.firestore.FieldValue.delete(),
      [`pending.${playerId}`]: firebase.firestore.FieldValue.delete(),
    });
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, [playerId, room]);

  useEffect(() => {
    if (!session?.lastDrawn || session.lastDrawn === prevLastDrawnRef.current) return;
    prevLastDrawnRef.current = session.lastDrawn;
    const msg = pickHostLine(hostMsgRef.current, lang);
    hostMsgRef.current = msg;
    setHostMsg(msg);
    setCallout(session.lastDrawn);
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
    const fresh = wins.filter(w => !castWinLinesRef.current.includes(w));
    if (fresh.length) { setCastConfetti(true); setTimeout(() => setCastConfetti(false), 2200); }
    castWinLinesRef.current = wins;
  }, [session, localCard, playerId]);

  useEffect(() => {
    if (!session || !playerId) return;
    const inPending = !!(session.pending || {})[playerId];
    const inPlayers = !!(session.players || {})[playerId];
    if (inPending) wasInPendingRef.current = true;
    if (wasInPendingRef.current && !inPending && !inPlayers) setRejected(true);
  }, [session, playerId]);

  if (joinError) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>{t.roomNotFoundTitle}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>{joinError}</div>
        <BigCta onClick={onExit}>{t.backToStart}</BigCta>
      </div>
    </ScreenShell>
  );

  if (isPortraitMobile) return <RotatePrompt title={t.rotating} message={t.castLandscape} />;

  if (joining || (!loaded && playerId)) return <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}><div style={{ color: '#afafaf', textAlign: 'center', padding: 40, fontWeight: 700 }}>{t.connecting}</div></div>;

  if (loaded && !session) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>{t.roomEndedTitle}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>{t.hostLeft}</div>
        <BigCta onClick={onExit}>{t.backToStart}</BigCta>
      </div>
    </ScreenShell>
  );

  if (!session || !localCard || !playerId) return null;

  const myPlayer = (session.players || {})[playerId];
  const isPending = !!(session.pending || {})[playerId];

  if (!myPlayer && isPending) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>{t.waitingForApprovalTitle}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>{t.hostWillLetYouIn}</div>
        <BigCta onClick={onExit}>{t.cancel}</BigCta>
      </div>
    </ScreenShell>
  );

  if (rejected || (!myPlayer && !isPending)) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>{t.requestDeniedTitle}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>{t.hostDidntLetIn}</div>
        <BigCta onClick={onExit}>{t.backToStart}</BigCta>
      </div>
    </ScreenShell>
  );

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
    { word: 'FREE',  anim: 'freePulse 5.0s ease-in-out infinite' },
    { word: t.cold,  anim: 'freePulse 2.4s ease-in-out infinite' },
    { word: t.warm,  anim: 'freePulse 1.1s ease-in-out infinite' },
    { word: t.fire,  anim: 'freePulse 0.38s ease-in-out infinite' },
  ];
  const tempStage = tempStages[daubProgress < 0.5 ? 0 : daubProgress < 0.7 ? 1 : daubProgress < 0.9 ? 2 : 3];
  const allPlayers = Object.values(session.players || {});
  const leaderboard = allPlayers.map(p => ({ name: p.name, hits: (p.marked || []).length, avatar: mascotFor(p.name), color: '#1cb0f6', bingo: p.bingo })).sort((a, b) => b.hits - a.hits);

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#f7fafc', fontFamily: '"Nunito", system-ui, sans-serif', color: '#3c3c3c', display: 'flex', justifyContent: 'center', padding: '3vh clamp(14px, 3vw, 24px)', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 1400, height: '100%', display: 'flex', flexDirection: 'column', gap: '5vh', position: 'relative' }}>

        {/* Header */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'clamp(3px, 0.7vw, 8px)', padding: '0 clamp(6px, 1vw, 12px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center', gap: 3 }}>
            <div style={{ fontSize: '6vh', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1 }}>CDaub.</div>
            <div style={{ fontSize: 'clamp(9px, 1.1vw, 11px)', fontWeight: 800, color: '#afafaf', letterSpacing: '0.14em', lineHeight: 1.5 }}>
              <div>CAST</div>
              <div>{me.name}</div>
            </div>
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
            if (isFree) { bg = '#fafafa'; fg = '#afafaf'; border = '2px solid #ececec'; shadow = '0 2px 0 #ececec'; }
            else if (isDaubed) { bg = '#1cb0f6'; fg = '#ffffff'; border = '2px solid #0d8fcc'; shadow = '0 3px 0 #0d8fcc'; }
            else if (isLatest) { bg = '#e7f8d4'; fg = '#46a302'; border = '2px solid #58cc02'; shadow = '0 3px 0 #58cc02, 0 0 0 3px rgba(88,204,2,0.2)'; }
            else if (isCalled) { bg = '#ffffff'; fg = '#3c3c3c'; border = '2px dashed #58cc02'; shadow = '0 2px 0 #e5e5e5'; }
            return (
              <button key={`${r}-${c}`} data-cell={val} disabled
                style={{ background: bg, color: fg, border, borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontSize: isFree ? 'clamp(16px, 4vw, 24px)' : 'clamp(12px, 3.5vw, 18px)', fontWeight: 900, letterSpacing: '0.02em', cursor: 'default', opacity: 1, transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)', padding: 0, minWidth: 0, minHeight: 0 }}>
                {isFree ? <span style={{ fontSize: 'clamp(9px, 1.9vw, 13px)', fontWeight: 900, color: '#afafaf', letterSpacing: '0.08em', animation: tempStage.anim, lineHeight: 1 }}>{tempStage.word}</span> : String(val).padStart(2, '0')}
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

        {callout && <CastCallout n={callout} msg={hostMsg} onClose={() => setCallout(null)} />}
        {(castConfetti || localBingo) && <GameConfetti />}
        {showInfo && <LeaderboardModal players={leaderboard} onClose={() => setShowInfo(false)} totalCalled={drawn.length} room={room} />}
        {showExit && <ExitModal onCancel={() => setShowExit(false)} onConfirm={() => {
          if (playerId) sessionRef(room).update({ [`players.${playerId}`]: firebase.firestore.FieldValue.delete(), [`pending.${playerId}`]: firebase.firestore.FieldValue.delete() });
          setShowExit(false); onExit();
        }} room={room} />}
      </div>
    </div>
  );
}

function CastCallout({ n, msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
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

function CalledList({ called, latest, onClose }) {
  const { t } = useLang();
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(31, 41, 55, 0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16, animation: 'fadeIn 180ms ease forwards' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: '#ffffff', border: '3px solid #e5e5e5', borderRadius: 24, boxShadow: '0 12px 0 #d6d6d6, 0 24px 64px rgba(0,0,0,0.18)', padding: '20px 20px 24px', animation: 'modalPop 240ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>{t.drawnBalls} ({called.length})</div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', background: '#f3f3f3', borderRadius: 10, fontSize: 16, fontWeight: 900, color: '#afafaf', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {called.length === 0 && <div style={{ fontSize: 13, color: '#afafaf', fontWeight: 700 }}>{t.noBallsDrawn}</div>}
          {called.map((n) => (
            <div key={n} style={{ padding: '6px 10px', background: n === latest ? '#58cc02' : '#ffc800', color: n === latest ? '#ffffff' : '#7a5a00', border: `1.5px solid ${n === latest ? '#46a302' : '#e0a800'}`, borderRadius: 10, fontSize: 13, fontWeight: 900, boxShadow: `0 2px 0 ${n === latest ? '#46a302' : '#c79100'}` }}>{String(n).padStart(2, '0')}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------- Room generation ----------
async function generateUniqueRoom() {
  const snap = await db().collection("sessions").get();
  const taken = new Set(
    snap.docs.map(d => parseInt(d.id, 10)).filter(n => n >= 1 && n <= 99)
  );
  const available = [];
  for (let i = 1; i <= 99; i++) if (!taken.has(i)) available.push(i);
  if (!available.length) throw new Error('ALL_ROOMS_IN_USE');
  return String(available[Math.floor(Math.random() * available.length)]);
}

// ---------- Root App ----------
function App() {
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || 'en');
  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  const setLang = useCallback((l) => {
    setLangState(l);
    localStorage.setItem(LANG_KEY, l);
  }, []);

  const [stage, setStage] = useState('welcome');
  const [name, setName] = useState(() => { try { return JSON.parse(localStorage.getItem(ME_KEY) || '{}').name || ''; } catch { return ''; } });
  const [room, setRoom] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState(null);

  async function handlePickHost() {
    setGenerating(true);
    setGenError(null);
    try {
      const r = await generateUniqueRoom();
      setRoom(r);
      setStage('host');
    } catch (err) {
      setGenError(err.message === 'ALL_ROOMS_IN_USE' ? t.allRoomsInUse : err.message);
    } finally {
      setGenerating(false);
    }
  }

  function handleWelcome({ name: n }) { setName(n); setStage('role'); }
  function handleJoin(r) { setRoom(r); setStage('cast'); }
  function handleExit() { localStorage.removeItem(ME_KEY); setName(''); setRoom(''); setStage('welcome'); }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {stage === 'welcome' && <WelcomeScreen onContinue={handleWelcome} initialName={name} />}
      {stage === 'role' && <RoleScreen name={name} onPick={(r) => r === 'host' ? handlePickHost() : setStage('join')} onBack={() => setStage('welcome')} generating={generating} genError={genError} />}
      {stage === 'join' && <JoinScreen name={name} onJoin={handleJoin} onBack={() => setStage('role')} />}
      {stage === 'host' && <HostScreen me={{ name }} room={room} onExit={handleExit} />}
      {stage === 'cast' && <CastScreen me={{ name }} room={room} onExit={handleExit} />}
    </LangContext.Provider>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
