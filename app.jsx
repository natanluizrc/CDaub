// ===========================================================
// BINGO! â€” Main app
// Two modes: Cantador (sorteia) & Jogador (marca cartela)
// Real-time sync via Firebase Firestore
// ===========================================================

const { useState, useEffect, useRef, useCallback, useMemo } = React;

const APP_VERSION = "202605161030";

// ---------- Firestore helpers ----------
const ME_KEY = "bingo_me";
const db = () => firebase.firestore();
const sessionRef = (code) => db().collection("sessions").doc(code);

function makeCode() {
  return String(Math.floor(Math.random() * 72) + 1).padStart(2, "0");
}

function makeCard() {
  // Flat array of 25 elements (Firestore doesn't support nested arrays)
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

// ---------- Welcome modal ----------
function Welcome({ onPick }) {
  const [name, setName] = useState(() => {
    try { return JSON.parse(localStorage.getItem(ME_KEY) || "{}").name || ""; }
    catch { return ""; }
  });

  const ok = name.trim().length >= 2;

  return (
    <div style={{position:'fixed', inset:0, background:'radial-gradient(ellipse at top, #16162c 0%, #0d0d1c 45%, #07070f 80%)', overflow:'auto', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px'}}>
      <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.025), transparent 60%)', pointerEvents:'none'}} />
      <div className="welcome" style={{flexShrink:0}}>
        <h1>CDaub. <span className="version-tag">v{APP_VERSION}</span></h1>
        <div className="slogan">Cards that build Moments.</div>

        <div className="field">
          <label>YOUR NAME</label>
          <input
            autoFocus
            placeholder="Type your name..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={28}
          />
        </div>

        <div className="field" style={{ marginBottom: 0 }}>
          <label>YOUR ROLE</label>
          <div className="mode-pick">
            <button
              className="mode-card"
              disabled={!ok}
              onClick={() => onPick("caller", name.trim())}>
              <h3>Host</h3>
              <p>Create a room, call the numbers and lead the game in real time.</p>
              <div className="meta">CREATE ROOM <span className="arrow">â†’</span></div>
            </button>
            <button
              className="mode-card gold"
              disabled={!ok}
              onClick={() => onPick("player", name.trim())}>
              <h3>Player</h3>
              <p>Join a room, get your card and play until BINGO.</p>
              <div className="meta">JOIN ROOM <span className="arrow">â†’</span></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Top bar ----------
function TopBar({ onLeave, onInfo }) {
  return (
    <div className="top-bar">
      <div className="brand">
        <span className="logo">CDaub.</span>
      </div>
      <div className="who">
        {onInfo && <button className="info-btn" onClick={onInfo}>Info</button>}
        {onLeave && <button className="leave" onClick={onLeave}>Exit</button>}
      </div>
    </div>
  );
}

// ---------- Confetti / Celebration ----------
function Celebrate({ word, sub, onClose }) {
  const pieces = useMemo(() => {
    const colors = ["#818cf8", "#a78bfa", "#4ade80", "#fbbf24", "#f472b6", "#60a5fa"];
    return Array.from({ length: 110 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 2.4 + Math.random() * 2.2,
      color: colors[i % colors.length],
      rot: Math.random() * 360,
      w: 6 + Math.random() * 10,
      h: 12 + Math.random() * 14
    }));
  }, []);

  return (
    <div className="celebrate">
      {pieces.map((p, i) =>
        <span
          key={i}
          className="confetti"
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: `${p.w}px`,
            height: `${p.h}px`,
            animationDuration: `${p.dur}s`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rot}deg)`,
            borderRadius: i % 3 === 0 ? "50%" : "2px"
          }} />
      )}
      <div className="word">{word}</div>
      {sub && <div className="sub">{sub}</div>}
      <button className="close" onClick={onClose}>Close</button>
    </div>
  );
}

// ---------- Exit Confirm Dialog ----------
function ExitConfirmDialog({ onConfirm, onCancel }) {
  return (
    <>
      <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',zIndex:400}} onClick={onCancel} />
      <div style={{
        position:'fixed',top:'50%',left:'50%',
        transform:'translate(-50%,-50%)',
        zIndex:401,
        background:'#12121e',
        border:'1px solid rgba(239,68,68,0.32)',
        borderRadius:20,
        padding:'28px 24px',
        width:'min(340px, 90vw)',
        display:'flex',flexDirection:'column',gap:18,
        textAlign:'center',
      }}>
        <div style={{fontFamily:'var(--font-display)',fontSize:18,fontWeight:700}}>
          Exit the room?
        </div>
        <div style={{fontSize:14,color:'var(--ink-dim)',lineHeight:1.55}}>
          Once you leave, you won't be able to return to this room. The session will end for all players.
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          <button
            onClick={onConfirm}
            style={{
              padding:'12px',
              background:'rgba(239,68,68,0.14)',
              border:'1px solid rgba(239,68,68,0.42)',
              borderRadius:12,color:'#fca5a5',
              fontSize:14,fontWeight:700,cursor:'pointer',
              letterSpacing:'0.04em',
            }}>
            Exit anyway
          </button>
          <button
            onClick={onCancel}
            style={{
              padding:'12px',
              background:'rgba(255,255,255,0.05)',
              border:'1px solid rgba(255,255,255,0.1)',
              borderRadius:12,color:'var(--ink)',
              fontSize:14,fontWeight:600,cursor:'pointer',
            }}>
            Stay in room
          </button>
        </div>
      </div>
    </>
  );
}

// ---------- Info Panel ----------
function InfoPanel({ open, onClose, onExit, children }) {
  if (!open) return null;

  return (
    <>
      <div className="info-backdrop" onClick={onClose} />
      <div className="info-panel">
        <button className="info-close-btn" onClick={onClose}>âœ•</button>
        <div className="info-panel-body">
          {children}
        </div>
        {onExit && (
          <div style={{padding:'14px 20px 20px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
            <button
              onClick={onExit}
              style={{
                width:'100%',padding:'11px',
                background:'rgba(239,68,68,0.1)',
                border:'1px solid rgba(239,68,68,0.32)',
                borderRadius:12,color:'#fca5a5',
                fontSize:14,fontWeight:700,cursor:'pointer',
                letterSpacing:'0.04em',
              }}>
              Exit room
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ---------- Caller screen ----------
function CallerScreen({ me, onLeave }) {
  const [code] = useState(() => makeCode());
  const [session, setSession] = useState(null);
  const [reveal, setReveal] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinDisplay, setSpinDisplay] = useState(null);
  const [spinTick, setSpinTick] = useState(0);
  const [localLastDrawn, setLocalLastDrawn] = useState(null);
  const [fsError, setFsError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const createdRef = useRef(false);

  // Persist "me" + session code locally so we can reconnect on refresh
  useEffect(() => {
    localStorage.setItem(ME_KEY, JSON.stringify({ ...me, session: code }));
  }, [me, code]);

  // Connect to Firestore â€” create session if new, then listen for real-time updates
  useEffect(() => {
    const ref = sessionRef(code);

    const unsub = ref.onSnapshot(
      (snap) => {
        if (snap.exists) {
          setSession(snap.data());
        } else if (!createdRef.current) {
          createdRef.current = true;
          ref.set({
            code,
            callerName: me.name,
            createdAt: Date.now(),
            drawn: [],
            lastDrawn: null,
            lastDrawnAt: null,
            players: {},
            winner: null
          }).catch((err) => setFsError(err.message));
        }
      },
      (err) => setFsError(err.message)
    );

    return () => unsub();
  }, [code]);

  // Derived values â€” safe to compute before the conditional return
  const drawn = session ? (session.drawn || []) : [];
  const drawnSet = new Set(drawn);
  const lastDrawn = session ? session.lastDrawn : null;
  const effectiveLast = localLastDrawn !== null ? localLastDrawn : lastDrawn;

  // Hooks must be called before any conditional return
  const drawNumber = useCallback((n) => {
    if (drawnSet.has(n)) return;
    sessionRef(code).update({
      drawn: [...drawn, n],
      lastDrawn: n,
      lastDrawnAt: Date.now()
    });
    setReveal((x) => x + 1);
  }, [drawn, drawnSet, code]);

  const callPhrase = useMemo(() => {
    if (!effectiveLast) return "";
    const phrases = [
      "Here it comes!",
      "One more drops!",
      "Eyes on your card!",
      "Got it? Mark it!",
      "Hot, hot, hot!",
      "Don't blink now!",
      "This one's special!"
    ];
    return phrases[effectiveLast % phrases.length];
  }, [effectiveLast]);

  if (fsError) {
    return (
      <div className="app" style={{background:'radial-gradient(ellipse at top, #16162c 0%, #0d0d1c 45%, #07070f 80%)'}}>
        <TopBar name={me.name} role="caller" onLeave={onLeave} />
        <div style={{ padding: 40, textAlign: "center", color: "#fca5a5" }}>
          Erro ao conectar ao Firestore:<br /><strong>{fsError}</strong>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app" style={{background:'radial-gradient(ellipse at top, #16162c 0%, #0d0d1c 45%, #07070f 80%)'}}>
        <TopBar name={me.name} role="caller" onLeave={onLeave} />
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-dim)" }}>
          Conectandoâ€¦
        </div>
      </div>
    );
  }

  const drawRandom = () => {
    if (spinning) return;
    const avail = [];
    for (let i = 1; i <= 72; i++) if (!drawnSet.has(i)) avail.push(i);
    if (!avail.length) return;

    const finalNum = avail[Math.floor(Math.random() * avail.length)];
    // Frame delays (ms): fast â†’ slow, total â‰ˆ 1820ms
    const INTERVALS = [55, 65, 80, 95, 115, 140, 170, 205, 245, 295, 355];

    setSpinning(true);
    setSpinDisplay(avail[Math.floor(Math.random() * avail.length)]);
    setSpinTick((t) => t + 1);

    let cumulative = 0;
    INTERVALS.forEach((interval, idx) => {
      cumulative += interval;
      const isLast = idx === INTERVALS.length - 1;
      setTimeout(() => {
        if (isLast) {
          setSpinning(false);
          setSpinDisplay(null);
          setLocalLastDrawn(finalNum);
          drawNumber(finalNum);
        } else {
          const others = avail.filter((n) => n !== finalNum);
          const pool = others.length >= 3 ? others : avail;
          setSpinDisplay(pool[Math.floor(Math.random() * pool.length)]);
          setSpinTick((t) => t + 1);
        }
      }, cumulative);
    });
  };

  const players = Object.values(session.players || {});

  return (
    <div className="app app--caller" style={{background:'radial-gradient(ellipse at top, #16162c 0%, #0d0d1c 45%, #07070f 80%)'}}>
      <TopBar onInfo={() => setShowInfo(v => !v)} />
      <div className="caller">
        <div className="left">
          <div className="caller-info-col">
            <div className="session-bar">
              <div className="session-code">
                <div className="lbl">Room</div>
                <div className="code">{code}</div>
              </div>
              <div className="players-pill">
                <div className="lbl">Left</div>
                <div className="count">{String(72 - drawn.length).padStart(2, "0")}</div>
              </div>
            </div>
            <button
              className="draw-random draw-random--landscape"
              onClick={drawRandom}
              disabled={drawn.length >= 72 || spinning}>
              <span className="btn-val">{drawn.length >= 72 ? "â€”" : spinning ? "Pickingâ€¦" : "Next"}</span>
            </button>
          </div>

          <div className="caller-card">
            <div className="caller-card-body">
              <div className="board-section">
<div className="numbers-grid">
                  {Array.from({ length: 72 }, (_, i) => i + 1).map((n) => {
                    const isDrawn = drawnSet.has(n);
                    const isLast = spinning ? n === spinDisplay : n === effectiveLast;
                    return (
                      <div
                        key={n}
                        className={`num-btn${isLast ? " last-drawn" : isDrawn ? " drawn" : ""}`}>
                        {String(n).padStart(2, "0")}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="last-called-row">
            <div className="last-called-card">
              <div className="lbl">Last</div>
              {spinning
                ? <div className="last-num spinning" key={`s${spinTick}`}>{String(spinDisplay).padStart(2, "0")}</div>
                : effectiveLast
                  ? <div className="last-num reveal" key={reveal}>{String(effectiveLast).padStart(2, "0")}</div>
                  : <div className="last-num empty">â€”</div>
              }
            </div>
            <button
              className="draw-random draw-random--portrait"
              onClick={drawRandom}
              disabled={drawn.length >= 72 || spinning}>
              <span className="btn-val">{drawn.length >= 72 ? "â€”" : spinning ? "Pickingâ€¦" : "Next"}</span>
            </button>
          </div>

          <div className="ls-sidebar">
            <div className="ls-widget">
              <div className="ls-lbl">Room</div>
              <div className="ls-code">{code}</div>
            </div>
            <div className="ls-widget">
              <div className="ls-lbl">Left</div>
              <div className="ls-num-val">{String(72 - drawn.length).padStart(2, "0")}</div>
            </div>
            <div className="ls-widget">
              <div className="ls-lbl">Last</div>
              {spinning
                ? <div className="ls-num-val spinning" key={`s${spinTick}`}>{String(spinDisplay).padStart(2, "0")}</div>
                : effectiveLast
                  ? <div className="ls-num-val ls-reveal" key={reveal}>{String(effectiveLast).padStart(2, "0")}</div>
                  : <div className="ls-num-val ls-empty">â€”</div>
              }
            </div>
            <button
              className="ls-next-btn"
              onClick={drawRandom}
              disabled={drawn.length >= 72 || spinning}>
              {drawn.length >= 72 ? "â€”" : spinning ? "Pickingâ€¦" : "Next"}
            </button>
          </div>
        </div>

      </div>

      <InfoPanel
        open={showInfo}
        onClose={() => setShowInfo(false)}
        onExit={() => { setShowInfo(false); setShowExitConfirm(true); }}>
        <div>
          <div className="panel-head">
            <h2>History</h2>
            <span className="hint">Newest first</span>
          </div>
          <div className="history sheet-list">
            {drawn.length === 0 && <div className="empty-hist">No numbers called yet.</div>}
            {[...drawn].reverse().map((n, i) =>
              <div key={n} className={`h-num${i === 0 ? " newest" : ""}`}>
                {String(n).padStart(2, "0")}
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="panel-head">
            <h2>Room</h2>
            <span className="hint">{players.length} {players.length === 1 ? "player" : "players"}</span>
          </div>
          <div className="players-list sheet-list">
            {players.length === 0 &&
              <div className="empty-p">
                Share the code <strong style={{ color: "var(--purple-glow)" }}>{code}</strong> for players to join.
              </div>
            }
            {players.map((p) => {
              const marks = (p.marked || []).length;
              return (
                <div key={p.id} className={`player-row${p.bingo ? " bingo" : ""}`}>
                  <div className="avatar">{p.name.slice(0, 1).toUpperCase()}</div>
                  <div className="name">{p.name}</div>
                  <div className="marks">{p.bingo ? "BINGO!" : `${marks} mark${marks === 1 ? "" : "s"}`}</div>
                </div>
              );
            })}
          </div>
        </div>
      </InfoPanel>

      {session.winner &&
        <Celebrate
          word="BINGO!"
          sub={`${session.winner} filled the card!`}
          onClose={() => sessionRef(code).update({ winner: null })}
        />
      }

      {showExitConfirm &&
        <ExitConfirmDialog
          onConfirm={onLeave}
          onCancel={() => setShowExitConfirm(false)}
        />
      }
    </div>
  );
}

// ---------- Player connect modal ----------
function ConnectModal({ me, onConnected, onLeave }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [joining, setJoining] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const submit = async () => {
    const c = code.trim().toUpperCase();
    if (c.length < 1) {
      setError("Code is too short.");
      triggerShake();
      return;
    }

    setJoining(true);
    try {
      const snap = await sessionRef(c).get();
      if (!snap.exists) {
        setError("We couldn't find that room. Double-check the code with the host.");
        triggerShake();
        return;
      }

      const playerId = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const card = makeCard();

      await sessionRef(c).update({
        [`players.${playerId}`]: {
          id: playerId,
          name: me.name,
          joinedAt: Date.now(),
          card,
          marked: [],
          bingo: false
        }
      });

      onConnected({ code: c, playerId, card });
    } catch (err) {
      setError("Connection error. Please try again.");
      triggerShake();
    } finally {
      setJoining(false);
    }
  };

  return (
    <div style={{position:'fixed', inset:0, background:'radial-gradient(ellipse at top, #16162c 0%, #0d0d1c 45%, #07070f 80%)', overflow:'auto', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px'}}>
      <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.025), transparent 60%)', pointerEvents:'none'}} />
      <div className="connect-card">
        <h2>Join the room</h2>
        <p className="sub">Grab the room code (01â€“72) from the host calling the numbers.</p>
        <input
          className={`code-input${shake ? " shake" : ""}`}
          placeholder="07"
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(""); }}
          maxLength={2}
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && !joining && submit()}
        />
        {error && <div className="connect-error">{error}</div>}
        <div className="connect-actions">
          <button className="btn-primary" onClick={submit} disabled={code.length < 1 || joining}>
            {joining ? "Entrandoâ€¦" : "Enter"}
          </button>
          <button className="btn-ghost" onClick={onLeave}>Back</button>
        </div>
      </div>
    </div>
  );

}

// ---------- Player game screen ----------
function PlayerGame({ me, conn, onLeave }) {
  const { code, playerId } = conn;
  const [session, setSession] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Persist identity for reconnection
  useEffect(() => {
    localStorage.setItem(ME_KEY, JSON.stringify({ ...me, session: code, playerId }));
  }, [me, code, playerId]);

  // Real-time Firestore listener
  useEffect(() => {
    const unsub = sessionRef(code).onSnapshot((snap) => {
      setSession(snap.exists ? snap.data() : null);
      setLoaded(true);
    });
    return () => unsub();
  }, [code]);

  // Derived values â€” computed before any conditional return
  const me_p = session ? ((session.players || {})[playerId]) : null;
  const card = me_p ? me_p.card : null; // flat array of 25 elements
  const grid = card ? [0,1,2,3,4].map(r => card.slice(r*5, r*5+5)) : null; // 5x5 for rendering
  const drawn = session ? (session.drawn || []) : [];
  const drawnSet = new Set(drawn);
  const lastDrawn = session ? session.lastDrawn : null;
  const marked = new Set(me_p ? (me_p.marked || []) : []);
  marked.add("FREE");

  // Hook must be before any conditional return
  const hasBingo = useMemo(() => {
    if (!grid) return false;
    const isOn = (r, c) => {
      const v = grid[r][c];
      return v === "FREE" || marked.has(v);
    };
    for (let r = 0; r < 5; r++) if ([0, 1, 2, 3, 4].every((c) => isOn(r, c))) return true;
    for (let c = 0; c < 5; c++) if ([0, 1, 2, 3, 4].every((r) => isOn(r, c))) return true;
    if ([0, 1, 2, 3, 4].every((i) => isOn(i, i))) return true;
    if ([0, 1, 2, 3, 4].every((i) => isOn(i, 4 - i))) return true;
    return false;
  }, [grid, marked]);

  if (!loaded) {
    return (
      <div className="app" style={{background:'radial-gradient(ellipse at top, #16162c 0%, #0d0d1c 45%, #07070f 80%)'}}>
        <TopBar name={me.name} role="player" onLeave={onLeave} />
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-dim)" }}>
          Conectandoâ€¦
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app" style={{background:'radial-gradient(ellipse at top, #16162c 0%, #0d0d1c 45%, #07070f 80%)'}}>
        <TopBar name={me.name} role="player" onLeave={onLeave} />
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-dim)" }}>
          The room has ended.
          <div style={{ marginTop: 20 }}>
            <button className="btn-primary" onClick={onLeave}>Back to start</button>
          </div>
        </div>
      </div>
    );
  }

  if (!me_p) return null;

  const toggleMark = (val) => {
    if (val === "FREE") return;
    if (!drawnSet.has(val)) return;
    const cur = me_p.marked || [];
    const newMarked = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val];
    sessionRef(code).update({ [`players.${playerId}.marked`]: newMarked });
  };

  const callBingo = () => {
    if (!hasBingo) return;
    sessionRef(code).update({
      winner: me.name,
      [`players.${playerId}.bingo`]: true
    });
    setCelebrate(true);
  };

  const cardNums = card.filter((x) => x !== "FREE");
  const cardSet = new Set(cardNums);
  const marksCount = (me_p.marked || []).length;

  return (
    <div className="app" style={{background:'radial-gradient(ellipse at top, #16162c 0%, #0d0d1c 45%, #07070f 80%)'}}>
      <TopBar onLeave={onLeave} onInfo={() => setShowInfo(v => !v)} />
      <div className="player-shell">
        <div className="left">
          <div className="player-card-col">
            <div className="session-mini">
              <div>
                <div className="lbl">Room</div>
                <div style={{ fontSize: 13, marginTop: 2 }}>with <strong>{session.callerName}</strong></div>
              </div>
              <div className="code">{code}</div>
              <div className="live"><span className="dot" /> live</div>
            </div>

            <div className="cartela">
              <div className="cart-head">
                <h2>Your card</h2>
                <div className="progress">
                  <strong>{marksCount}</strong> / 24 marked
                </div>
              </div>
              <div className="cart-grid">
                {grid.map((row, r) => row.map((val, c) => {
                  if (val === "FREE") {
                    return (
                      <button key={`${r}-${c}`} className="cart-cell free" disabled>
                        FREE
                      </button>
                    );
                  }
                  const isDrawn = drawnSet.has(val);
                  const isMarked = (me_p.marked || []).includes(val);
                  let cls = "cart-cell";
                  if (isMarked) cls += " marked";
                  else if (isDrawn) cls += " drawable";
                  else if (drawn.length > 8) cls += " missed";
                  return (
                    <button
                      key={`${r}-${c}`}
                      className={cls}
                      onClick={() => toggleMark(val)}
                      disabled={!isDrawn && !isMarked}>
                      {String(val).padStart(2, "0")}
                    </button>
                  );
                }))}
              </div>
            </div>
          </div>

          <div className="player-action-col">
            <button
              className="bingo-btn"
              onClick={callBingo}
              disabled={!hasBingo || me_p.bingo}>
              {me_p.bingo ? "âœ“ BINGO confirmed" : hasBingo ? "BINGO!" : "Keep marking..."}
            </button>

            <div className="latest-panel">
              <div className="latest-head">Last</div>
              {lastDrawn
                ? <div className="mini-ball" key={lastDrawn}>
                    {String(lastDrawn).padStart(2, "0")}
                  </div>
                : <div className="mini-ball empty">Waiting for the host...</div>
              }
              {lastDrawn &&
                <div style={{ textAlign: "center", color: "var(--ink-dim)", fontSize: 13 }}>
                  {cardSet.has(lastDrawn) ? "ðŸŽ¯ it's on your card!" : "not on your card."}
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <InfoPanel open={showInfo} onClose={() => setShowInfo(false)}>
        <div>
          <div className="panel-head">
            <h2>Called so far</h2>
            <span className="hint">{drawn.length} of 72</span>
          </div>
          <div className="drawn-strip sheet-list">
            {drawn.length === 0 && <div className="empty-hist" style={{ padding: 10, fontStyle: "italic", color: "var(--ink-dimmer)" }}>None yet.</div>}
            {[...drawn].reverse().map((n) =>
              <div key={n} className={`ds-num${cardSet.has(n) ? " on-card" : ""}`}>
                {String(n).padStart(2, "0")}
              </div>
            )}
          </div>
        </div>
        <div>
          <div className="panel-head">
            <h2>Room</h2>
            <span className="hint">{Object.keys(session.players || {}).length} players</span>
          </div>
          <div className="players-list sheet-list">
            {Object.values(session.players || {}).map((p) => {
              const marks = (p.marked || []).length;
              return (
                <div key={p.id} className={`player-row${p.bingo ? " bingo" : ""}`}>
                  <div className="avatar">{p.name.slice(0, 1).toUpperCase()}</div>
                  <div className="name">
                    {p.name}
                    {p.id === playerId && <span style={{ color: "var(--purple-glow)", marginLeft: 6, fontSize: 12 }}>(you)</span>}
                  </div>
                  <div className="marks">{p.bingo ? "BINGO!" : `${marks} mark${marks === 1 ? "" : "s"}`}</div>
                </div>
              );
            })}
          </div>
        </div>
      </InfoPanel>

      {(celebrate || session.winner) &&
        <Celebrate
          word="BINGO!"
          sub={session.winner ? `${session.winner} filled the card!` : "You filled the card!"}
          onClose={() => setCelebrate(false)}
        />
      }
    </div>
  );
}

// ---------- Root App ----------
function App() {
  const [me, setMe] = useState(null);
  const [role, setRole] = useState(null);
  const [conn, setConn] = useState(null);

  const handlePick = (r, name) => {
    const meData = { name };
    setMe(meData);
    setRole(r);
    localStorage.setItem(ME_KEY, JSON.stringify(meData));
  };

  const leave = () => {
    setMe(null); setRole(null); setConn(null);
    localStorage.removeItem(ME_KEY);
  };

  if (!me || !role) return <Welcome onPick={handlePick} />;
  if (role === "caller") return <CallerScreen me={me} onLeave={leave} />;
  if (role === "player") {
    if (!conn) return <ConnectModal me={me} onConnected={setConn} onLeave={leave} />;
    return <PlayerGame me={me} conn={conn} onLeave={leave} />;
  }
  return null;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
