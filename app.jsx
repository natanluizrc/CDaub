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

function BigCta({ children, onClick, disabled }) {
  const [pressed, setPressed] = useState(false);
  return (
    <button
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '18px 0',
        background: disabled ? '#cfd2d6' : '#58cc02',
        color: '#ffffff', border: 'none', borderRadius: 18,
        boxShadow: disabled ? '0 2px 0 #b3b6ba' : pressed ? '0 1px 0 #46a302' : '0 5px 0 #46a302',
        transform: pressed && !disabled ? 'translateY(4px)' : 'translateY(0)',
        transition: 'transform 80ms ease, box-shadow 80ms ease',
        fontFamily: 'inherit', fontWeight: 900, fontSize: 18,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >{children}</button>
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
      <Field label="YOUR NAME">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Natan" maxLength={20} autoFocus style={inputStyle} />
      </Field>
      <div style={{ marginTop: 28 }}>
        <BigCta disabled={!canGo} onClick={() => canGo && onContinue({ name: trimmed })}>Continue →</BigCta>
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
      <Logo />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 30 }}>
        <span style={{ width: 24, height: 2, background: '#e5e5e5', borderRadius: 2 }} />
        <span style={{ fontSize: 12, fontWeight: 900, color: '#7a7a7a', letterSpacing: '0.22em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Enter the room code from the host</span>
        <span style={{ width: 24, height: 2, background: '#e5e5e5', borderRadius: 2 }} />
      </div>
      <Field label="ROOM CODE">
        <input type="text" value={room} onChange={(e) => setRoom(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))} placeholder="00" autoFocus style={{ ...inputStyle, letterSpacing: '0.2em', fontVariantNumeric: 'tabular-nums' }} />
      </Field>
      <div style={{ marginTop: 28 }}>
        <BigCta disabled={!canGo} onClick={() => canGo && onJoin(room.trim())}>Join →</BigCta>
      </div>
    </ScreenShell>
  );
}

// ---------- Role Screen ----------
function RoleScreen({ name, onPick, onBack, generating, genError }) {
  return (
    <ScreenShell>
      <BackLink onClick={onBack}>← Back</BackLink>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#afafaf', textAlign: 'center', marginBottom: 28, marginTop: 28 }}>Pick a role to enter the game.</div>
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
          <div style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c', marginBottom: 10 }}>Leave the room?</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#7a7a7a', lineHeight: 1.45 }}>You won't be able to come back to <b style={{ color: '#3c3c3c' }}>Room {String(room).padStart(2, '0')}</b>. Your card and progress will be lost.</div>
        </div>
        <div style={{ padding: '18px 20px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <ChunkyButton onClick={onCancel} variant="ghost">Stay</ChunkyButton>
          <ChunkyButton onClick={onConfirm} variant="danger">Leave</ChunkyButton>
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


function StatChip({ value, accent, textColor, style = {} }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, background: '#ffffff', border: '2px solid #e5e5e5', borderRadius: 12, boxShadow: '0 2px 0 #e5e5e5', ...style }}>
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

function RotatePrompt() {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#3c3c3c', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24, fontFamily: '"Nunito", system-ui, sans-serif', padding: 32, textAlign: 'center' }}>
      <div style={{ fontSize: 72, animation: 'rotateHint 2s ease-in-out infinite' }}>📱</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em' }}>Gire o celular</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#afafaf', lineHeight: 1.5, maxWidth: 260 }}>A tela do host funciona melhor na horizontal. Gire o aparelho para continuar.</div>
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
  const [showExit, setShowExit] = useState(false);
  const createdRef = useRef(false);
  const rollTimeoutRef = useRef(null);
  const audioCtxRef = useRef(null);
  const hostMsgRef = useRef(null);
  const drawnRef = useRef([]);

  useEffect(() => {
    localStorage.setItem(ME_KEY, JSON.stringify({ name: me.name, session: room }));
  }, []);

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

  return (
    <div style={{ width: '100%', height: '100vh', overflow: 'hidden', background: '#f7fafc', fontFamily: '"Nunito", system-ui, sans-serif', color: '#3c3c3c', display: 'flex', justifyContent: 'center', padding: '3vh clamp(14px, 3vw, 24px)', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 1400, height: '100%', display: 'flex', flexDirection: 'column', gap: '5vh', position: 'relative' }}>

        {/* Header */}
        <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'clamp(3px, 0.7vw, 8px)', padding: '0 clamp(6px, 1vw, 12px)', alignItems: 'center' }}>
          <div style={{ gridColumn: 'span 4' }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.01em' }}>CDaub.</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#afafaf', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Room {String(room).padStart(2, '0')} · {me.name}</div>
          </div>
          <div style={{ gridColumn: 'span 4', height: '100%', background: '#ffffff', border: '2px solid #e5e5e5', borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: '0 2px 0 #e5e5e5', overflow: 'hidden' }}>
            <div style={{ width: `${progress * 100}%`, height: '100%', background: 'linear-gradient(90deg, #58cc02 0%, #89e219 100%)', borderRadius: 10, transition: 'width 400ms cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.12)' }} />
          </div>
          <StatChip value={String(drawn.length).padStart(2, '0')} accent="#58cc02" textColor="#ffffff" style={{ width: '100%', height: '100%', background: '#58cc02', border: '2px solid #46a302', boxShadow: '0 2px 0 #46a302', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
          <StatChip value={String(left).padStart(2, '0')} accent="#ff4b4b" textColor="#ffffff" style={{ width: '100%', height: '100%', background: '#ff4b4b', border: '2px solid #d63030', boxShadow: '0 2px 0 #d63030', borderRadius: 'clamp(8px, 1.2vw, 14px)' }} />
          <IconButton onClick={() => setShowLeaderboard(true)} title="Room info" style={{ width: '100%', height: '100%', background: '#6b6b6b', border: '2px solid #555555', boxShadow: '0 2px 0 #555555', color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)' }}><InfoIcon /></IconButton>
          <IconButton onClick={() => setShowExit(true)} title="Exit room" style={{ width: '100%', height: '100%', background: '#6b6b6b', border: '2px solid #555555', boxShadow: '0 2px 0 #555555', color: '#ffffff', borderRadius: 'clamp(8px, 1.2vw, 14px)' }}><ExitIcon /></IconButton>
        </div>

        {/* Number grid */}
        <div style={{ flex: 6, minHeight: 0, display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`, gap: 'clamp(3px, 0.7vw, 8px)', padding: 'clamp(6px, 1vw, 12px)' }}>
          {cells.map(({ n, r, c }) => {
            const isCalled = drawnSet.has(n);
            const isLatest = n === latest && !rolling;
            const isPreview = n === previewN && rolling;
            const winCell = isCalled && isWinCell(r, c);
            let bg = '#fafafa', fg = '#c8c8c8', border = '2px solid #ececec', shadow = '0 2px 0 #ececec', weight = 700, scale = 1;
            if (isPreview) { bg = '#1cb0f6'; fg = '#ffffff'; border = '2px solid #0d8fcc'; shadow = '0 3px 0 #0d8fcc, 0 0 0 4px rgba(28,176,246,0.22)'; weight = 900; scale = 1.08; }
            else if (isLatest) { bg = '#58cc02'; fg = '#ffffff'; border = '2px solid #46a302'; shadow = '0 4px 0 #46a302, 0 0 0 4px rgba(88,204,2,0.18)'; weight = 900; scale = 1.06; }
            else if (winCell) { bg = 'linear-gradient(180deg, #ffd84d 0%, #ffc800 100%)'; fg = '#7a5a00'; border = '2px solid #c79100'; shadow = '0 3px 0 #c79100, 0 0 0 3px rgba(255,200,0,0.3)'; weight = 900; }
            else if (isCalled) { bg = '#ffc800'; fg = '#7a5a00'; border = '2px solid #e0a800'; shadow = '0 3px 0 #c79100'; weight = 900; }
            return (
              <div key={n} style={{ background: bg, color: fg, border, borderRadius: 'clamp(8px, 1.2vw, 14px)', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: weight, fontSize: 'clamp(10px, 1.4vw + 0.4rem, 17px)', transition: 'all 280ms cubic-bezier(0.34, 1.56, 0.64, 1)', transform: `scale(${scale})`, minWidth: 0, minHeight: 0 }}>
                {String(n).padStart(2, '0')}
              </div>
            );
          })}
        </div>

        {/* Draw button */}
        <DrawButton onClick={drawNext} disabled={left === 0} rolling={rolling} height='10vh' margin='clamp(6px, 1vw, 12px)' />

        {callout && <HostCallout n={callout} msg={hostMsg} />}
        {confetti && <GameConfetti />}

        {showLeaderboard && <LeaderboardModal players={leaderboard} onClose={() => setShowLeaderboard(false)} totalCalled={drawn.length} room={room} />}
        {showExit && <ExitModal onCancel={() => setShowExit(false)} onConfirm={() => { setShowExit(false); onExit(); }} room={room} />}
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

function DrawButton({ onClick, disabled, rolling, height = '15vh', margin }) {
  const [pressed, setPressed] = useState(false);
  const label = rolling ? 'Drawing...' : disabled ? 'All drawn!' : 'Draw Next';
  return (
    <button onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)} onClick={onClick} disabled={disabled}
      style={{ width: '100%', height, flexShrink: 0, padding: 0, ...(margin ? { marginLeft: margin, marginRight: margin, width: `calc(100% - 2 * ${margin})` } : {}), background: rolling ? '#1cb0f6' : disabled ? '#cfd2d6' : '#58cc02', color: '#ffffff', border: 'none', borderRadius: 'clamp(14px, 2vw, 20px)', boxShadow: rolling ? '0 5px 0 #0d8fcc' : disabled ? '0 2px 0 #b3b6ba' : pressed ? '0 1px 0 #46a302' : '0 5px 0 #46a302', transform: pressed && !disabled && !rolling ? 'translateY(4px)' : 'translateY(0)', transition: 'transform 60ms ease, box-shadow 60ms ease, background 200ms ease', fontFamily: 'inherit', fontWeight: 900, fontSize: 'clamp(15px, 2vw, 20px)', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: disabled && !rolling ? 'not-allowed' : rolling ? 'progress' : 'pointer' }}>
      {label}
    </button>
  );
}

function HostCallout({ n, msg }) {
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

// ---------- CAST Screen ----------
function CastScreen({ me, room, onExit }) {
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(null);
  const [playerId, setPlayerId] = useState(null);
  const [localCard, setLocalCard] = useState(null);
  const [callout, setCallout] = useState(null);
  const [showExit, setShowExit] = useState(false);
  const [showCalled, setShowCalled] = useState(false);
  const [hostMsg, setHostMsg] = useState("Waiting for the host…");
  const [localBingo, setLocalBingo] = useState(false);
  const prevLastDrawnRef = useRef(null);
  const hostMsgRef = useRef("Waiting for the host…");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(ME_KEY) || '{}');
      if (saved.session === room && saved.playerId && saved.card) {
        setPlayerId(saved.playerId);
        setLocalCard(saved.card);
        return;
      }
    } catch {}

    setJoining(true);
    sessionRef(room).get().then((snap) => {
      if (!snap.exists) { setJoinError("Room not found. Check the code with the host."); setJoining(false); return; }
      const pid = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const card = makeCard();
      return sessionRef(room).update({ [`players.${pid}`]: { id: pid, name: me.name, joinedAt: Date.now(), card, marked: [], bingo: false } })
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
    if (!session?.lastDrawn || session.lastDrawn === prevLastDrawnRef.current) return;
    prevLastDrawnRef.current = session.lastDrawn;
    const msg = pickHostLine(hostMsgRef.current);
    hostMsgRef.current = msg;
    setHostMsg(msg);
    setCallout(session.lastDrawn);
  }, [session?.lastDrawn]);

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
  if (!myPlayer) return null;

  const grid = [0,1,2,3,4].map(r => localCard.slice(r*5, r*5+5));
  const drawn = session.drawn || [];
  const drawnSet = new Set(drawn);
  const lastDrawn = session.lastDrawn;
  const markedArr = myPlayer.marked || [];
  const marked = new Set(markedArr);

  const isOn = (r, c) => { const v = grid[r][c]; return v === 'FREE' || marked.has(v); };
  let hasBingo = false;
  for (let r = 0; r < 5 && !hasBingo; r++) if ([0,1,2,3,4].every(c => isOn(r,c))) hasBingo = true;
  for (let c = 0; c < 5 && !hasBingo; c++) if ([0,1,2,3,4].every(r => isOn(r,c))) hasBingo = true;
  if (!hasBingo && [0,1,2,3,4].every(i => isOn(i,i))) hasBingo = true;
  if (!hasBingo && [0,1,2,3,4].every(i => isOn(i,4-i))) hasBingo = true;

  const toggleMark = (val) => {
    if (val === 'FREE' || !drawnSet.has(val)) {
      if (val !== 'FREE') {
        const el = document.querySelector(`[data-cell="${val}"]`);
        if (el) { el.style.animation = 'cellShake 360ms'; setTimeout(() => { el.style.animation = ''; }, 400); }
      }
      return;
    }
    const newMarked = markedArr.includes(val) ? markedArr.filter(x => x !== val) : [...markedArr, val];
    sessionRef(room).update({ [`players.${playerId}.marked`]: newMarked });
  };

  const callBingo = () => {
    if (!hasBingo || myPlayer.bingo) return;
    sessionRef(room).update({ winner: me.name, [`players.${playerId}.bingo`]: true });
    setLocalBingo(true);
  };

  const daubedCount = markedArr.length;
  const lastBalls = drawn.slice(-5).reverse();

  return (
    <div style={{ width: '100%', minHeight: '100vh', background: '#f7fafc', fontFamily: '"Nunito", system-ui, sans-serif', color: '#3c3c3c', display: 'flex', justifyContent: 'center', padding: 'clamp(12px, 3vw, 20px) clamp(12px, 3vw, 18px) clamp(20px, 5vw, 28px)', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2vw, 14px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#afafaf', letterSpacing: '0.2em' }}>ROOM {String(room).padStart(2, '0')} · CAST</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#3c3c3c', marginTop: 2 }}>{me.name}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <IconButton onClick={() => setShowCalled(true)} title="Drawn balls"><HistoryIcon /></IconButton>
            <IconButton onClick={() => setShowExit(true)} title="Exit"><ExitIcon /></IconButton>
          </div>
        </div>

        {/* Last drawn banner */}
        <div style={{ background: '#ffffff', border: '2px solid #e5e5e5', borderRadius: 20, padding: '14px 16px', boxShadow: '0 3px 0 #e5e5e5', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 64, height: 64, background: lastDrawn ? '#58cc02' : '#fafafa', border: `2px solid ${lastDrawn ? '#46a302' : '#e5e5e5'}`, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900, color: lastDrawn ? '#ffffff' : '#cfcfcf', boxShadow: lastDrawn ? '0 3px 0 #46a302' : '0 2px 0 #e5e5e5', flexShrink: 0, transition: 'all 280ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            {lastDrawn ? String(lastDrawn).padStart(2, '0') : '··'}
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#afafaf', letterSpacing: '0.18em' }}>LAST DRAWN</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#3c3c3c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hostMsg}</div>
          </div>
        </div>

        {/* Recent balls + daub count */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', padding: '4px 2px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 900, color: '#afafaf', letterSpacing: '0.18em', marginRight: 4 }}>RECENT</span>
          {lastBalls.length === 0 && <span style={{ fontSize: 12, fontWeight: 700, color: '#cfcfcf' }}>—</span>}
          {lastBalls.map((n, i) => (
            <div key={n} style={{ padding: '4px 10px', background: i === 0 ? '#58cc02' : '#ffc800', color: i === 0 ? '#ffffff' : '#7a5a00', border: `1.5px solid ${i === 0 ? '#46a302' : '#e0a800'}`, borderRadius: 10, fontSize: 12, fontWeight: 900, boxShadow: `0 2px 0 ${i === 0 ? '#46a302' : '#c79100'}` }}>{String(n).padStart(2, '0')}</div>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', background: '#ffffff', border: '1.5px solid #1cb0f6', borderRadius: 10, boxShadow: '0 2px 0 #1cb0f6' }}>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#1cb0f6', letterSpacing: '0.14em' }}>DAUBED</span>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#3c3c3c' }}>{String(daubedCount).padStart(2, '0')}/24</span>
          </div>
        </div>

        {/* Card grid */}
        <div style={{ background: '#ffffff', border: '3px solid #e5e5e5', borderRadius: 24, padding: 'clamp(8px, 2vw, 12px)', boxShadow: '0 4px 0 #e5e5e5', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gridTemplateRows: 'repeat(5, 1fr)', gap: 'clamp(5px, 1.2vw, 8px)', aspectRatio: '1 / 1', maxWidth: 'min(100%, 70vh)', alignSelf: 'center', width: '100%' }}>
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
              <button key={`${r}-${c}`} data-cell={val} onClick={() => !isFree && toggleMark(val)} disabled={isFree}
                style={{ background: bg, color: fg, border, borderRadius: 'clamp(10px, 2vw, 14px)', boxShadow: shadow, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontSize: isFree ? 'clamp(18px, 3.5vw, 26px)' : 'clamp(14px, 3vw, 20px)', fontWeight: 900, letterSpacing: '0.02em', cursor: isFree ? 'default' : 'pointer', transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)', padding: 0, minWidth: 0, minHeight: 0 }}>
                {isFree ? <span style={{ fontSize: 'clamp(22px, 4.5vw, 32px)', filter: 'drop-shadow(0 1px 0 rgba(0,0,0,0.18))' }}>{mascotFor(me.name)}</span> : String(val).padStart(2, '00')}
              </button>
            );
          }))}
        </div>

        <div style={{ fontSize: 12, fontWeight: 800, color: '#afafaf', textAlign: 'center', letterSpacing: '0.02em' }}>Tap a number to daub it — only drawn numbers count.</div>

        {/* BINGO button */}
        <BigCta onClick={callBingo} disabled={!hasBingo || myPlayer.bingo}>
          {myPlayer.bingo ? '✓ BINGO confirmed' : hasBingo ? 'BINGO!' : 'Keep marking…'}
        </BigCta>

        {callout && <CastCallout n={callout} msg={hostMsg} onClose={() => setCallout(null)} />}
        {(localBingo || session.winner) && <WinOverlay winner={session.winner || me.name} onClose={() => setLocalBingo(false)} isHost={false} />}
        {(myPlayer.bingo || localBingo) && <GameConfetti />}
        {showCalled && <CalledList called={drawn} latest={lastDrawn} onClose={() => setShowCalled(false)} />}
        {showExit && <ExitModal onCancel={() => setShowExit(false)} onConfirm={() => { setShowExit(false); onExit(); }} room={room} />}
      </div>
    </div>
  );
}

function CastCallout({ n, msg, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2400);
    return () => clearTimeout(t);
  }, [n]);
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'auto' }}>
      <div style={{ background: '#ffffff', border: '4px solid #58cc02', borderRadius: 28, boxShadow: '0 10px 0 #46a302, 0 20px 60px rgba(0,0,0,0.18)', padding: '22px 44px 26px', display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: 'min(86vw, 380px)', animation: 'calloutPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: '#58cc02', letterSpacing: '0.22em' }}>DRAWN</div>
        <div style={{ fontSize: 90, fontWeight: 900, color: '#3c3c3c', lineHeight: 1, letterSpacing: '-0.04em', marginTop: 4 }}>{String(n).padStart(2, '0')}</div>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#58cc02', textAlign: 'center', marginTop: 10 }}>"{msg}"</div>
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
            <div key={n} style={{ padding: '6px 10px', background: n === latest ? '#58cc02' : '#ffc800', color: n === latest ? '#ffffff' : '#7a5a00', border: `1.5px solid ${n === latest ? '#46a302' : '#e0a800'}`, borderRadius: 10, fontSize: 13, fontWeight: 900, boxShadow: `0 2px 0 ${n === latest ? '#46a302' : '#c79100'}` }}>{String(n).padStart(2, '00')}</div>
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
