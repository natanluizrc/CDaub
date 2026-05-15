// ===========================================================
// BINGO! — Main app
// Two modes: Cantador (sorteia) & Jogador (marca cartela)
// Real-time sync via Firebase Firestore
// ===========================================================

const { useState, useEffect, useRef, useCallback, useMemo } = React;

const APP_VERSION = "1.4";

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
    <div style={{position:'relative', width:'100%', minHeight:'100vh', background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px'}}>
      <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.18), transparent 45%)', pointerEvents:'none'}} />
      <div className="welcome">
        <div className="eyebrow">WELCOME TO</div>
        <h1>CDaub. <span className="version-tag">v{APP_VERSION}</span></h1>
        <div className="slogan">Cards that build Moments.</div>
        <p className="sub">The excitement begins before the first number is called. Tell us who you are — and how you'll join the game.</p>

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
              <div className="icon">🎙️</div>
              <h3>Host</h3>
              <p>Create a room, call the numbers and lead the game in real time.</p>
              <div className="meta">CREATE ROOM <span className="arrow">→</span></div>
            </button>
            <button
              className="mode-card gold"
              disabled={!ok}
              onClick={() => onPick("player", name.trim())}>
              <div className="icon gold">🎟️</div>
              <h3>Player</h3>
              <p>Join a room, get your card and play until BINGO.</p>
              <div className="meta">JOIN ROOM <span className="arrow">→</span></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Top bar ----------
function TopBar({ name, role, onLeave, onInfo }) {
  return (
    <div className="top-bar">
      <div className="brand">
        <span className="logo">CDaub.</span>
        <span className="brand-slogan">Cards that build Moments.</span>
      </div>
      <div className="who">
        <span className="role-chip">{role === "caller" ? "Host" : "Player"} · {name}</span>
        {onInfo && <button className="info-btn" onClick={onInfo}>Room</button>}
        <button className="leave" onClick={onLeave}>Leave</button>
      </div>
    </div>
  );
}

// ---------- Confetti / Celebration ----------
function Celebrate({ word, sub, onClose }) {
  const pieces = useMemo(() => {
    const colors = ["#fbbf24", "#ec4899", "#a855f7", "#c084fc", "#7c3aed", "#f97316"];
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

// ---------- Info Panel ----------
function InfoPanel({ open, onClose, tabs, content }) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.key ?? null);

  if (!open) return null;

  return (
    <>
      <div className="info-backdrop" onClick={onClose} />
      <div className="info-panel">
        <div className="info-handle" onClick={onClose} />
        <div className="info-panel-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`info-tab-btn${activeTab === t.key ? " active" : ""}`}
              onClick={() => setActiveTab(t.key)}
            >
              <span className="info-tab-icon">{t.icon}</span>
              <span className="info-tab-label">{t.label}</span>
              {t.badge != null && <span className="tab-badge">{t.badge}</span>}
            </button>
          ))}
          <button className="info-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="info-panel-body">
          {activeTab && content[activeTab]}
        </div>
      </div>
    </>
  );
}

// ---------- Caller screen ----------
function CallerScreen({ me, onLeave }) {
  const [code] = useState(() => makeCode());
  const [session, setSession] = useState(null);
  const [reveal, setReveal] = useState(0);
  const [fsError, setFsError] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const createdRef = useRef(false);

  // Persist "me" + session code locally so we can reconnect on refresh
  useEffect(() => {
    localStorage.setItem(ME_KEY, JSON.stringify({ ...me, session: code }));
  }, [me, code]);

  // Connect to Firestore — create session if new, then listen for real-time updates
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

  // Derived values — safe to compute before the conditional return
  const drawn = session ? (session.drawn || []) : [];
  const drawnSet = new Set(drawn);
  const lastDrawn = session ? session.lastDrawn : null;

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
    if (!lastDrawn) return "";
    const phrases = [
      "Here it comes!",
      "One more drops!",
      "Eyes on your card!",
      "Got it? Mark it!",
      "Hot, hot, hot!",
      "Don't blink now!",
      "This one's special!"
    ];
    return phrases[lastDrawn % phrases.length];
  }, [lastDrawn]);

  if (fsError) {
    return (
      <div className="app" style={{background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)'}}>
        <TopBar name={me.name} role="caller" onLeave={onLeave} onInfo={null} />
        <div style={{ padding: 40, textAlign: "center", color: "#fca5a5" }}>
          Erro ao conectar ao Firestore:<br /><strong>{fsError}</strong>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app" style={{background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)'}}>
        <TopBar name={me.name} role="caller" onLeave={onLeave} onInfo={null} />
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-dim)" }}>
          Conectando…
        </div>
      </div>
    );
  }

  const drawRandom = () => {
    const avail = [];
    for (let i = 1; i <= 72; i++) if (!drawnSet.has(i)) avail.push(i);
    if (!avail.length) return;
    drawNumber(avail[Math.floor(Math.random() * avail.length)]);
  };

  const players = Object.values(session.players || {});

  return (
    <div className="app" style={{background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)'}}>
      <TopBar name={me.name} role="caller" onLeave={onLeave} onInfo={() => setShowInfo(true)} />
      <div className="caller">
        <div className="left">
          <div className="caller-info-col">
            <div className="session-bar">
              <div className="session-code">
                <div className="lbl">Room code</div>
                <div className="code">{code}</div>
              </div>
              <div className="players-pill">
                <div className="lbl">Players</div>
                <div className="count">
                  {players.length}
                  <span className="live-dot" />
                </div>
              </div>
            </div>

            <div className="last-called-card">
              <div className="lbl">Last called</div>
              {lastDrawn
                ? <div className="last-num reveal" key={reveal}>{String(lastDrawn).padStart(2, "0")}</div>
                : <div className="last-num empty">—</div>
              }
            </div>
          </div>

          <div className="caller-card">
            <div className="caller-card-body">
              <div className="board-section">
                <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
                  <span style={{fontFamily:'var(--font-display)', fontSize:16, fontWeight:600, letterSpacing:'-0.01em'}}>Number board</span>
                  <span style={{fontSize:12, color:'var(--ink-dimmer)'}}>{72 - drawn.length} left</span>
                </div>
                <div className="numbers-grid">
                  {Array.from({ length: 72 }, (_, i) => i + 1).map((n) => {
                    const isDrawn = drawnSet.has(n);
                    const isLast = n === lastDrawn;
                    return (
                      <div
                        key={n}
                        className={`num-btn${isLast ? " last-drawn" : isDrawn ? " drawn" : ""}`}>
                        {String(n).padStart(2, "0")}
                      </div>
                    );
                  })}
                </div>
                <button
                  className="draw-random"
                  onClick={drawRandom}
                  disabled={drawn.length >= 72}
                  style={{width:'100%'}}>
                  {drawn.length >= 72 ? "All numbers have been called" : "🎲 Call the next number"}
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>

      <InfoPanel
        open={showInfo}
        onClose={() => setShowInfo(false)}
        tabs={[
          { key: "history", icon: "🕐", label: "History", badge: drawn.length || null },
          { key: "players", icon: "👥", label: "At the table", badge: players.length || null },
        ]}
        content={{
          history: (
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
          ),
          players: (
            <div>
              <div className="panel-head">
                <h2>At the table</h2>
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
          ),
        }}
      />

      {session.winner &&
        <Celebrate
          word="BINGO!"
          sub={`${session.winner} filled the card!`}
          onClose={() => sessionRef(code).update({ winner: null })}
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
    <div style={{position:'relative', width:'100%', minHeight:'100vh', background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px'}}>
      <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.18), transparent 45%)', pointerEvents:'none'}} />
      <div className="connect-card">
        <h2>Join the room</h2>
        <p className="sub">Grab the room code (01–72) from the host calling the numbers.</p>
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
            {joining ? "Entrando…" : "Enter"}
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

  // Derived values — computed before any conditional return
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
      <div className="app" style={{background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)'}}>
        <TopBar name={me.name} role="player" onLeave={onLeave} onInfo={null} />
        <div style={{ padding: 40, textAlign: "center", color: "var(--ink-dim)" }}>
          Conectando…
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="app" style={{background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)'}}>
        <TopBar name={me.name} role="player" onLeave={onLeave} onInfo={null} />
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
    <div className="app" style={{background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)'}}>
      <TopBar name={me.name} role="player" onLeave={onLeave} onInfo={() => setShowInfo(true)} />
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
              {me_p.bingo ? "✓ BINGO confirmed" : hasBingo ? "BINGO!" : "Keep marking..."}
            </button>

            <div className="latest-panel">
              <div className="latest-head">Last number called</div>
              {lastDrawn
                ? <div className="mini-ball" key={lastDrawn}>
                    {String(lastDrawn).padStart(2, "0")}
                  </div>
                : <div className="mini-ball empty">Waiting for the host...</div>
              }
              {lastDrawn &&
                <div style={{ textAlign: "center", color: "var(--ink-dim)", fontSize: 13 }}>
                  {cardSet.has(lastDrawn) ? "🎯 it's on your card!" : "not on your card."}
                </div>
              }
            </div>
          </div>
        </div>
      </div>

      <InfoPanel
        open={showInfo}
        onClose={() => setShowInfo(false)}
        tabs={[
          { key: "called", icon: "📋", label: "Called so far", badge: drawn.length || null },
          { key: "players", icon: "👥", label: "At the table", badge: Object.keys(session.players || {}).length || null },
        ]}
        content={{
          called: (
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
          ),
          players: (
            <div>
              <div className="panel-head">
                <h2>At the table</h2>
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
          ),
        }}
      />

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
