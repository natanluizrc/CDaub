// ===========================================================
// CDaub — Playful Bingo  |  Firebase Firestore real-time
// ===========================================================

const { useState, useEffect, useRef, useCallback, useMemo } = React;

const ME_KEY = "bingo_me";
const db = () => firebase.firestore();
const sessionRef = (code) => db().collection("sessions").doc(code);

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

// ---------- Host lines ----------
const HOST_LINES = [
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
];

function pickHostLine(exclude) {
  const pool = HOST_LINES.filter(x => x !== exclude);
  return pool[Math.floor(Math.random() * pool.length)] || HOST_LINES[0];
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
  background: '#fafafa', border: '2px solid #e5e5e5',
  borderRadius: 14, fontSize: 17, fontWeight: 800,
  fontFamily: 'inherit', color: '#3c3c3c', outline: 'none',
  boxShadow: '0 2px 0 #e5e5e5', boxSizing: 'border-box',
};

function ScreenShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', background: '#f7fafc',
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
        fontFamily: 'inherit', fontWeight: 900, fontSize: 'clamp(14px, 2vw, 18px)',
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

// ---------- Welcome Screen ----------
function WelcomeScreen({ onContinue, initialName }) {
  const [name, setName] = useState(initialName || '');
  const trimmed = name.trim();
  const canGo = trimmed.length >= 2;

  return (
    <ScreenShell>
      <Logo />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 30 }}>
        <span style={{ width: 24, height: 2, background: '#e5e5e5', borderRadius: 2 }} />
        <span style={{ fontSize: 12, fontWeight: 900, color: '#7a7a7a', letterSpacing: '0.22em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Cards that build moments</span>
        <span style={{ width: 24, height: 2, background: '#e5e5e5', borderRadius: 2 }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <Field label="NAME">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Natan" maxLength={20} autoFocus style={{ ...inputStyle, textAlign: 'center' }} />
        </Field>
      </div>
      <div style={{ marginTop: 28 }}>
        <BigCta disabled={!canGo} onClick={() => canGo && onContinue({ name: trimmed })}>Continue</BigCta>
      </div>
    </ScreenShell>
  );
}

// ---------- Join Screen (cast enters room code) ----------
function JoinScreen({ name, onJoin, onBack }) {
  const [room, setRoom] = useState('');
  const canGo = room.trim().length >= 1;

  return (
    <ScreenShell>
      <BackLink onClick={onBack}>← Back</BackLink>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#3c3c3c', textAlign: 'center', marginBottom: 28, marginTop: 28 }}>Enter the room code.</div>
      <div style={{ padding: '18px 20px', background: '#ffffff', border: '2px solid #ff9600', borderRadius: 20, boxShadow: '0 5px 0 #cc7700', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 900, color: '#afafaf', letterSpacing: '0.2em' }}>ROOM</span>
        <input type="text" value={room} onChange={(e) => setRoom(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="00" autoFocus style={{ ...inputStyle, letterSpacing: '0.2em', fontVariantNumeric: 'tabular-nums', fontSize: 32, textAlign: 'center', padding: '10px 16px' }} onKeyDown={(e) => e.key === 'Enter' && canGo && onJoin(room.trim())} />
      </div>
      <div style={{ marginTop: 14 }}>
        <BigCta variant="orange" disabled={!canGo} onClick={() => canGo && onJoin(room.trim())}>Join</BigCta>
      </div>
    </ScreenShell>
  );
}

// ---------- Role Screen ----------
function RoleScreen({ name, onPick, onBack, generating, genError }) {
  return (
    <ScreenShell>
      <BackLink onClick={onBack}>← Back</BackLink>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#3c3c3c', textAlign: 'center', marginBottom: 28, marginTop: 28 }}>Pick a role to enter the game.</div>
      {genError && <div style={{ color: '#ff4b4b', fontWeight: 700, fontSize: 14, textAlign: 'center', marginBottom: 16 }}>{genError}</div>}
      <div style={{ display: 'grid', gap: 14 }}>
        <RoleCard color="#58cc02" emoji="🎙️" title="HOST" tagline={generating ? 'Generating room…' : "You'll call the balls"} desc="Run the room. Draw numbers, watch the leaderboard, keep the party going." onClick={() => !generating && onPick('host')} />
        <RoleCard color="#1cb0f6" emoji="🎯" title="CAST" tagline="You'll play with a card" desc="Mark your card as numbers are drawn. Be the first to complete a line and shout it out." onClick={() => !generating && onPick('cast')} />
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
  return (
    <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(31, 41, 55, 0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 180ms ease forwards' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: '#ffffff', border: '3px solid #ff4b4b', borderRadius: 24, boxShadow: '0 12px 0 #d63030, 0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', textAlign: 'center', animation: 'modalPop 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ padding: '32px 28px 8px' }}>
          <div style={{ width: 64, height: 64, margin: '0 auto 16px', background: '#ffe9e9', border: '3px solid #ff4b4b', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 3px 0 #d63030', fontSize: 28 }}>⚠️</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c', marginBottom: 10 }}>Exit the room?</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#7a7a7a', lineHeight: 1.45 }}>You won't be able to come back to <b style={{ color: '#3c3c3c' }}>Room {String(room).padStart(2, '0')}</b>. Your card and progress will be lost.</div>
        </div>
        <div style={{ padding: '18px 20px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ChunkyButton onClick={onCancel} variant="ghost">Stay</ChunkyButton>
          <ChunkyButton onClick={onConfirm} variant="danger">Exit</ChunkyButton>
        </div>
      </div>
    </div>
  );
}

function WinOverlay({ winner, onClose, isHost }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(31, 41, 55, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 200ms ease forwards' }}>
      <div style={{ background: '#ffffff', border: '4px solid #58cc02', borderRadius: 32, boxShadow: '0 12px 0 #46a302, 0 24px 64px rgba(0,0,0,0.22)', padding: '32px 28px 24px', textAlign: 'center', maxWidth: 420, width: '100%', animation: 'modalPop 320ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>🏆</div>
        <div style={{ fontSize: 44, fontWeight: 900, color: '#58cc02', letterSpacing: '-0.02em', lineHeight: 1 }}>BINGO!</div>
        <div style={{ fontSize: 17, fontWeight: 800, color: '#3c3c3c', marginTop: 12 }}>{isHost ? `${winner} won the game!` : `Way to go, ${winner}!`}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginTop: 6, marginBottom: 22 }}>{isHost ? 'Congratulations! Keep drawing or start a new game.' : 'You completed a line. Wait for the host to confirm.'}</div>
        <BigCta onClick={onClose}>{isHost ? 'Continue' : 'Keep playing'}</BigCta>
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
      <span style={{ fontSize: 15, fontWeight: 900, color: textColor || accent, lineHeight: 1 }}>{value}</span>
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

function RotatePrompt({ message = 'The host screen works best in landscape.' }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#3c3c3c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, fontFamily: '"Nunito", system-ui, sans-serif', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 72, animation: 'rotateHint 2s ease-in-out infinite' }}>📱</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>Rotate your phone</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#afafaf', lineHeight: 1.5, maxWidth: 260 }}>{message}</div>
    </div>
  );
}

function HostScreen({ me, room, onExit }) {
  const isPortraitMobile = useIsPortraitMobile();
  const [session, setSession] = useState(null);
  const [fsError, setFsError] = useState(null);
  const [rolling, setRolling] = useState(false);
  const [previewN, setPreviewN] = useState(null);
  const [callout, setCallout] = useState(null);
  const [hostMsg, setHostMsg] = useState(null);
  const [winLines, setWinLines] = useState([]);
  const [confetti, setConfetti] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const createdRef = useRef(false);
  const rollTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);
  const hostMsgRef = useRef(null);
  const drawnRef = useRef([]);
  const prevPendingCountRef = useRef(0);

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
    if (session?.winner) setShowLeaderboard(true);
  }, [session?.winner]);

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

  function checkWins(newDrawn) {
    const set = new Set(newDrawn);
    const newWins = [];
    for (let r = 0; r < ROWS; r++) { let full = true; for (let c = 0; c < COLS; c++) { if (!set.has(r * COLS + c + 1)) { full = false; break; } } if (full) newWins.push(`row-${r}`); }
    for (let c = 0; c < COLS; c++) { let full = true; for (let r = 0; r < ROWS; r++) { if (!set.has(r * COLS + c + 1)) { full = false; break; } } if (full) newWins.push(`col-${c}`); }
    const fresh = newWins.filter(w => !winLines.includes(w));
    if (fresh.length) { setConfetti(true); setTimeout(() => setConfetti(false), 2200); }
    setWinLines(newWins);
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
          const msg = pickHostLine(hostMsgRef.current);
          hostMsgRef.current = msg;
          setHostMsg(msg);
          setCallout(pick);
          sessionRef(room).update({ drawn: newDrawn, lastDrawn: pick, lastDrawnAt: Date.now() });
          checkWins(newDrawn);
          playSound('pop');
        }, 200);
        return;
      }
      rollTimeoutRef.current = setTimeout(step, interval);
    }
    step();
  }

  if (isPortraitMobile) return <RotatePrompt />;
  if (fsError) return <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}><div style={{ color: '#ff4b4b', textAlign: 'center', padding: 40, fontWeight: 700 }}>Firestore error: {fsError}</div></div>;
  if (!session) return <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}><div style={{ color: '#afafaf', textAlign: 'center', padding: 40, fontWeight: 700 }}>Connecting…</div></div>;

  const drawn = session.drawn || [];
  const drawnSet = new Set(drawn);
  const latest = drawn[drawn.length - 1] || null;
  const left = TOTAL - drawn.length;
  const progress = drawn.length / TOTAL;
  const cells = Array.from({ length: TOTAL }, (_, i) => ({ n: i + 1, r: Math.floor(i / COLS), c: i % COLS }));
  const isWinCell = (r, c) => winLines.includes(`row-${r}`) || winLines.includes(`col-${c}`);
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
          <div style={{ gridColumn: 'span 2', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: '6vh', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1 }}>CDaub.</div>
          </div>
          <div style={{ gridColumn: 'span 5', height: '100%', background: '#ffffff', border: '2px solid #46a302', borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: '0 2px 0 #46a302', overflow: 'hidden' }}>
            <div style={{ width: `${progress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #58cc02 0%, #89e219 100%)', transition: 'width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)', animation: 'shimmer 2s ease-in-out infinite', pointerEvents: 'none' }} />
            </div>
          </div>
          <StatChip value={String(drawn.length).padStart(2, '0')} accent="#58cc02" textColor="#ffffff" style={{ width: '100%', height: '100%', background: '#58cc02', border: '2px solid #46a302', boxShadow: '0 2px 0 #46a302', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
          <StatChip value={String(left).padStart(2, '0')} accent="#ff4b4b" textColor="#ffffff" style={{ width: '100%', height: '100%', background: '#ff4b4b', border: '2px solid #d63030', boxShadow: '0 2px 0 #d63030', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
          <StatChip value={String(room).padStart(2, '0')} accent="#ff9600" textColor="#ffffff" style={{ width: '100%', height: '100%', background: '#ff9600', border: '2px solid #cc7700', boxShadow: '0 2px 0 #cc7700', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
          <IconButton onClick={() => pendingPlayers.length > 0 ? setShowPending(true) : setShowLeaderboard(true)} title={pendingPlayers.length > 0 ? `${pendingPlayers.length} waiting` : 'Room info'} style={{ width: '100%', height: '100%', background: pendingPlayers.length > 0 ? '#ff9600' : '#6b6b6b', border: `2px solid ${pendingPlayers.length > 0 ? '#cc7700' : '#555555'}`, boxShadow: `0 2px 0 ${pendingPlayers.length > 0 ? '#cc7700' : '#555555'}`, color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)', fontSize: pendingPlayers.length > 0 ? 'clamp(12px, 1.4vw, 16px)' : undefined, fontWeight: 900 }}>{pendingPlayers.length > 0 ? pendingPlayers.length : <InfoIcon />}</IconButton>
          <IconButton onClick={() => setShowExit(true)} title="Exit room" style={{ width: '100%', height: '100%', background: '#6b6b6b', border: '2px solid #555555', boxShadow: '0 2px 0 #555555', color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)' }}><ExitIcon /></IconButton>
        </div>

        {/* Number grid */}
        <div style={{ flex: 6, minHeight: 0, background: '#ffffff', borderRadius: 'clamp(14px, 2vw, 24px)', display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`, gap: 'clamp(3px, 0.7vw, 8px)', padding: 'clamp(6px, 1vw, 12px)' }}>
          {cells.map(({ n, r, c }) => {
            const isCalled = drawnSet.has(n);
            const isLatest = n === latest && !rolling;
            const isPreview = n === previewN && rolling;
            const winCell = isCalled && isWinCell(r, c);
            let bg = '#fafafa', fg = '#3c3c3c', border = '2px solid #ececec', shadow = '0 2px 0 #ececec', scale = 1;
            if (isPreview) { bg = '#1cb0f6'; fg = '#ffffff'; border = '2px solid #0d8fcc'; shadow = '0 3px 0 #0d8fcc, 0 0 0 4px rgba(28,176,246,0.22)'; scale = 1.08; }
            else if (isLatest) { bg = '#58cc02'; fg = '#ffffff'; border = '2px solid #46a302'; shadow = '0 4px 0 #46a302, 0 0 0 4px rgba(88,204,2,0.18)'; scale = 1.06; }
            else if (winCell) { bg = 'linear-gradient(180deg, #ffd84d 0%, #ffc800 100%)'; fg = '#7a5a00'; border = '2px solid #c79100'; shadow = '0 3px 0 #c79100, 0 0 0 3px rgba(255,200,0,0.3)'; }
            else if (isCalled) { bg = '#ffc800'; fg = '#7a5a00'; border = '2px solid #e0a800'; shadow = '0 3px 0 #c79100'; }
            return (
              <div key={n} style={{ background: bg, color: fg, border, borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontWeight: 900, letterSpacing: '0.02em', fontSize: 'clamp(10px, 1.4vw + 0.4rem, 17px)', transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)', transform: `scale(${scale})`, minWidth: 0, minHeight: 0 }}>
                {String(n).padStart(2, '0')}
              </div>
            );
          })}
        </div>

        {/* Draw button */}
        <DrawButton onClick={drawNext} disabled={left === 0} rolling={rolling} done={!!session.winner} height='10vh' margin='clamp(6px, 1vw, 12px)' />

        {callout && <HostCallout n={callout} msg={hostMsg} onClose={() => setCallout(null)} />}
        {confetti && <GameConfetti />}

        {showLeaderboard && <LeaderboardModal players={leaderboard} onClose={() => setShowLeaderboard(false)} totalCalled={drawn.length} room={room} />}
{showExit && <ExitModal onCancel={() => setShowExit(false)} onConfirm={() => { setShowExit(false); sessionRef(room).delete(); onExit(); }} room={room} />}
        {session.winner && <WinOverlay winner={session.winner} onClose={() => sessionRef(room).update({ winner: null })} isHost={true} />}
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
  const [pressed, setPressed] = useState(false);
  const label = rolling ? 'Drawing...' : done ? 'Done!' : disabled ? 'All drawn!' : 'Draw';
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
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(31, 41, 55, 0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 180ms ease forwards' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: '#ffffff', border: '3px solid #e5e5e5', borderRadius: 24, boxShadow: '0 12px 0 #d6d6d6, 0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden', animation: 'modalPop 280ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ padding: '20px 24px 16px', borderBottom: '2px solid #f3f3f3', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#afafaf', letterSpacing: '0.18em' }}>ROOM {String(room).padStart(2, '0')}</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c', marginTop: 2 }}>Leaderboard</div>
          </div>
          <button onClick={onClose} style={{ width: 36, height: 36, background: '#f3f3f3', border: 'none', borderRadius: 12, fontSize: 18, fontWeight: 900, color: '#afafaf', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
        </div>
        <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {players.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 14, fontWeight: 700, color: '#afafaf' }}>No players yet. Share Room {String(room).padStart(2, '0')} to get started!</div>}
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
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#afafaf', letterSpacing: '0.1em', marginTop: 2 }}>HITS</span>
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
  return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0 16px' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#3c3c3c', marginBottom: 6 }}>Waiting to join</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 20 }}>Approve or reject each player.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {players.map((p) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#ffffff', border: '2px solid #ececec', borderRadius: 16, boxShadow: '0 2px 0 #ececec' }}>
            <div style={{ width: 40, height: 40, background: '#ff960022', border: '2px solid #ff9600', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{mascotFor(p.name)}</div>
            <div style={{ flex: 1, fontSize: 16, fontWeight: 900, color: '#3c3c3c' }}>{p.name}</div>
            <button onClick={() => onReject(p)} style={{ padding: '8px 16px', background: '#fff0f0', border: '2px solid #ff4b4b', borderRadius: 10, boxShadow: '0 2px 0 #d63030', color: '#ff4b4b', fontFamily: 'inherit', fontWeight: 900, fontSize: 13, letterSpacing: '0.06em', cursor: 'pointer' }}>REJECT</button>
            <button onClick={() => onApprove(p)} style={{ padding: '8px 16px', background: '#58cc02', border: '2px solid #46a302', borderRadius: 10, boxShadow: '0 2px 0 #46a302', color: '#ffffff', fontFamily: 'inherit', fontWeight: 900, fontSize: 13, letterSpacing: '0.06em', cursor: 'pointer' }}>APPROVE</button>
          </div>
        ))}
      </div>
    </ScreenShell>
  );
}

// ---------- CAST Screen ----------
function CastScreen({ me, room, onExit }) {
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
  const [hostMsg, setHostMsg] = useState("Waiting for the host…");
  const [localBingo, setLocalBingo] = useState(false);
  const [castConfetti, setCastConfetti] = useState(false);
  const [rejected, setRejected] = useState(false);
  const prevLastDrawnRef = useRef(null);
  const hostMsgRef = useRef("Waiting for the host…");
  const castWinLinesRef = useRef([]);
  const wasInPendingRef = useRef(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ME_KEY) || '{}');
      if (saved.session === room && saved.playerId && saved.card) {
        setPlayerId(saved.playerId);
        setLocalCard(saved.card);
        // Always route through pending on reconnect — require host re-approval
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
      if (!snap.exists) { setJoinError("Room not found. Check the code with the host."); setJoining(false); return; }
      const data = snap.data();
      const takenNames = [
        ...Object.values(data.players || {}),
        ...Object.values(data.pending || {}),
      ].map(p => p.name.toLowerCase());
      if (takenNames.includes(me.name.toLowerCase())) {
        setJoinError("Name already taken in this room. Go back and choose a different name."); setJoining(false); return;
      }
      const pid = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const card = makeCard();
      return sessionRef(room).update({ [`pending.${pid}`]: { id: pid, name: me.name, joinedAt: Date.now(), card } })
        .then(() => {
          setPlayerId(pid);
          setLocalCard(card);
          localStorage.setItem(ME_KEY, JSON.stringify({ name: me.name, session: room, playerId: pid, card }));
        });
    }).catch(() => setJoinError("Connection error. Please try again.")).finally(() => setJoining(false));
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
    const msg = pickHostLine(hostMsgRef.current);
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

  useEffect(() => {
    if (session?.winner) setShowInfo(true);
  }, [session?.winner]);

  if (joinError) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>😕</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>Room not found</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>{joinError}</div>
        <BigCta onClick={onExit}>Back to start</BigCta>
      </div>
    </ScreenShell>
  );

  if (isPortraitMobile) return <RotatePrompt message="The player screen works best in landscape." />;

  if (joining || (!loaded && playerId)) return <div style={{ minHeight: '100vh', background: '#f7fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Nunito, sans-serif' }}><div style={{ color: '#afafaf', textAlign: 'center', padding: 40, fontWeight: 700 }}>Connecting…</div></div>;

  if (loaded && !session) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>Room ended</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>The host has left the room.</div>
        <BigCta onClick={onExit}>Back to start</BigCta>
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
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>Waiting for approval</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>The host will let you in shortly.</div>
        <BigCta onClick={onExit}>Cancel</BigCta>
      </div>
    </ScreenShell>
  );

  if (rejected || (!myPlayer && !isPending)) return (
    <ScreenShell>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🚫</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#3c3c3c', marginBottom: 8 }}>Request denied</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#7a7a7a', marginBottom: 24 }}>The host didn't let you in.</div>
        <BigCta onClick={onExit}>Back to start</BigCta>
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
  const daubLabel = isWinner ? 'WINS' : isGameOver ? 'LOST' : 'DAUB';
  const daubProgress = daubedCount / 24;
  const allPlayers = Object.values(session.players || {});
  const leaderboard = allPlayers.map(p => ({ name: p.name, hits: (p.marked || []).length, avatar: mascotFor(p.name), color: '#1cb0f6', bingo: p.bingo })).sort((a, b) => b.hits - a.hits);

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#f7fafc', fontFamily: '"Nunito", system-ui, sans-serif', color: '#3c3c3c', display: 'flex', justifyContent: 'center', padding: '3vh clamp(14px, 3vw, 24px)', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 1400, height: '100%', display: 'flex', flexDirection: 'column', gap: '5vh', position: 'relative' }}>

        {/* Header */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'clamp(4px, 1.5vw, 8px)', padding: '0 clamp(6px, 1vw, 12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ fontSize: '6vh', fontWeight: 900, letterSpacing: '-0.01em', lineHeight: 1 }}>CDaub.</div>
          </div>
          <div style={{ gridColumn: 'span 2', background: '#ffffff', border: '2px solid #0d8fcc', borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: '0 2px 0 #0d8fcc', overflow: 'hidden' }}>
            <div style={{ width: `${daubProgress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #1cb0f6 0%, #5bc8ff 100%)', transition: 'width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)', animation: 'shimmer 2s ease-in-out infinite', pointerEvents: 'none' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 'clamp(2px, 0.5vw, 4px)' }}>
            <StatChip value={String(daubedCount).padStart(2, '0')} accent="#1cb0f6" textColor="#ffffff" style={{ flex: 1, width: 'auto', height: '100%', background: '#1cb0f6', border: '2px solid #0d8fcc', boxShadow: '0 2px 0 #0d8fcc', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
            <StatChip value={String(room).padStart(2, '0')} accent="#ff9600" textColor="#ffffff" style={{ flex: 1, width: 'auto', height: '100%', background: '#ff9600', border: '2px solid #cc7700', boxShadow: '0 2px 0 #cc7700', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
          </div>
          <div style={{ display: 'flex', gap: 'clamp(2px, 0.5vw, 4px)' }}>
            <IconButton onClick={() => setShowInfo(true)} title="Room info" style={{ flex: 1, width: 'auto', height: '100%', background: '#6b6b6b', border: '2px solid #555555', boxShadow: '0 2px 0 #555555', color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)' }}><InfoIcon /></IconButton>
            <IconButton onClick={() => setShowExit(true)} title="Exit" style={{ flex: 1, width: 'auto', height: '100%', background: '#6b6b6b', border: '2px solid #555555', boxShadow: '0 2px 0 #555555', color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)' }}><ExitIcon /></IconButton>
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
            if (isFree || isDaubed) { bg = '#1cb0f6'; fg = '#ffffff'; border = '2px solid #0d8fcc'; shadow = '0 3px 0 #0d8fcc'; }
            else if (isLatest) { bg = '#e7f8d4'; fg = '#46a302'; border = '2px solid #58cc02'; shadow = '0 3px 0 #58cc02, 0 0 0 3px rgba(88,204,2,0.2)'; }
            else if (isCalled) { bg = '#ffffff'; fg = '#3c3c3c'; border = '2px dashed #58cc02'; shadow = '0 2px 0 #e5e5e5'; }
            return (
              <button key={`${r}-${c}`} data-cell={val} disabled
                style={{ background: bg, color: fg, border, borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontSize: isFree ? 'clamp(16px, 4vw, 24px)' : 'clamp(12px, 3.5vw, 18px)', fontWeight: 900, letterSpacing: '0.02em', cursor: 'default', opacity: 1, transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)', padding: 0, minWidth: 0, minHeight: 0 }}>
                {isFree ? <span style={{ fontSize: 'clamp(20px, 5vw, 28px)', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.18))' }}>{mascotFor(me.name)}</span> : String(val).padStart(2, '0')}
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
        {(localBingo || session.winner) && <WinOverlay winner={session.winner || me.name} onClose={() => setLocalBingo(false)} isHost={false} />}
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
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(31, 41, 55, 0.55)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16, animation: 'fadeIn 180ms ease forwards' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 460, background: '#ffffff', border: '3px solid #e5e5e5', borderRadius: 24, boxShadow: '0 12px 0 #d6d6d6, 0 24px 64px rgba(0,0,0,0.18)', padding: '20px 20px 24px', animation: 'modalPop 240ms cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>Drawn balls ({called.length})</div>
          <button onClick={onClose} style={{ width: 32, height: 32, border: 'none', background: '#f3f3f3', borderRadius: 10, fontSize: 16, fontWeight: 900, color: '#afafaf', cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {called.length === 0 && <div style={{ fontSize: 13, color: '#afafaf', fontWeight: 700 }}>No balls drawn yet.</div>}
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
  if (!available.length) throw new Error("All rooms (01–99) are currently in use. Try again later.");
  return String(available[Math.floor(Math.random() * available.length)]);
}

// ---------- Root App ----------
function App() {
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
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  function handleWelcome({ name: n }) { setName(n); setStage('role'); }
  function handleJoin(r) { setRoom(r); setStage('cast'); }
  function handleExit() { localStorage.removeItem(ME_KEY); setName(''); setRoom(''); setStage('welcome'); }

  if (stage === 'welcome') return <WelcomeScreen onContinue={handleWelcome} initialName={name} />;
  if (stage === 'role') return <RoleScreen name={name} onPick={(r) => r === 'host' ? handlePickHost() : setStage('join')} onBack={() => setStage('welcome')} generating={generating} genError={genError} />;
  if (stage === 'join') return <JoinScreen name={name} onJoin={handleJoin} onBack={() => setStage('role')} />;
  if (stage === 'host') return <HostScreen me={{ name }} room={room} onExit={handleExit} />;
  if (stage === 'cast') return <CastScreen me={{ name }} room={room} onExit={handleExit} />;
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
