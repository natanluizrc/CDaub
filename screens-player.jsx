// Static mock: Player game screen
const PlayerScreen = () => {
  const drawn = [7, 23, 41, 12, 38, 5, 19, 44, 30, 16, 27, 9];
  const lastDrawn = 9;
  const drawnSet = new Set(drawn);
  // 5x5 card; center FREE
  const card = [
    [7, 22, 33, 41, 14],
    [19, 28, 11, 5, 36],
    [44, 8, 'FREE', 27, 17],
    [3, 30, 12, 25, 49],
    [23, 38, 16, 9, 31],
  ];
  const marked = new Set([7,41,19,5,44,27,30,12,23,38,16,9]);
  const cardNums = card.flat().filter(x=>x!=='FREE');
  const cardSet = new Set(cardNums);
  const players = [
    {id:'a', name:'Lucas', marked:[7,23,12,5], bingo:false},
    {id:'b', name:'Camila', marked:[41,38,19,44,16,27,9], bingo:false},
    {id:'me', name:'Marina', marked:[...marked], bingo:false},
    {id:'d', name:'Bia', marked:[23,41,12,38,5,19,44,30,16,27], bingo:false},
  ];
  const myId = 'me';

  return (
    <div className="app" style={{background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)'}}>
      <div className="top-bar">
        <div className="brand">
          <span className="logo">CDaub.</span>
          <span className="brand-slogan">Cards that build Moments.</span>
        </div>
        <div className="who">
          <span className="role-chip">Player</span>
          <span className="name">Marina</span>
          <button className="leave">Leave</button>
        </div>
      </div>
      <div className="player-shell">
        <div className="left">
          <div className="session-mini">
            <div>
              <div className="lbl">Room</div>
              <div style={{fontSize:14, marginTop:2}}>with <strong>Camila</strong></div>
            </div>
            <div className="code">KPQ472</div>
            <div className="live"><span className="dot" /> live</div>
          </div>
          <div className="cartela">
            <div className="cart-head">
              <h2>Your card</h2>
              <div className="progress"><strong>12</strong> / 24 marked</div>
            </div>
            <div className="cart-grid">
              {card.map((row,r)=>row.map((val,c)=>{
                if(val==='FREE') return <button key={`${r}-${c}`} className="cart-cell free" disabled>FREE</button>;
                const isDrawn = drawnSet.has(val);
                const isMarked = marked.has(val);
                let cls = 'cart-cell';
                if(isMarked) cls += ' marked';
                else if(isDrawn) cls += ' drawable';
                else cls += ' missed';
                return <button key={`${r}-${c}`} className={cls} style={{animation:'none'}} disabled={!isDrawn && !isMarked}>{String(val).padStart(2,'0')}</button>;
              }))}
            </div>
          </div>
          <button className="bingo-btn" disabled style={{marginTop:28, width:'100%', maxWidth:460}}>Keep marking...</button>
        </div>
        <div className="right">
          <div className="latest-panel">
            <div className="latest-head">Last number called</div>
            <div className="mini-ball">{String(lastDrawn).padStart(2,'0')}</div>
            <div style={{textAlign:'center', color:'var(--ink-dim)', fontSize:14}}>🎯 it's on your card!</div>
          </div>
          <div>
            <div className="panel-head">
              <h2>Called so far</h2>
              <span className="hint">12 of 50</span>
            </div>
            <div className="drawn-strip">
              {[...drawn].reverse().map(n=>(
                <div key={n} className={`ds-num${cardSet.has(n)?' on-card':''}`}>{String(n).padStart(2,'0')}</div>
              ))}
            </div>
          </div>
          <div>
            <div className="panel-head">
              <h2>At the table</h2>
              <span className="hint">4 players</span>
            </div>
            <div className="players-list">
              {players.map(p=>(
                <div key={p.id} className="player-row">
                  <div className="avatar">{p.name[0]}</div>
                  <div className="name">{p.name}{p.id===myId && <span style={{color:'var(--purple-glow)', marginLeft:6, fontSize:12}}>(you)</span>}</div>
                  <div className="marks">{p.marked.length} marks</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Celebration overlay
const CelebrateScreen = () => {
  const colors = ['#fbbf24','#ec4899','#a855f7','#c084fc','#7c3aed','#f97316'];
  const pieces = Array.from({length:90},(_,i)=>({
    left: (i*7.3)%100,
    top: ((i*13)%90)+5,
    color: colors[i%colors.length],
    rot: (i*37)%360,
    w: 6+((i*3)%10),
    h: 12+((i*5)%14),
  }));
  return (
    <div style={{position:'relative', width:'100%', height:'100%', background:'radial-gradient(ellipse at center, rgba(91,33,182,0.9), rgba(14,4,32,0.97))', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center'}}>
      {pieces.map((p,i)=>(
        <span key={i} style={{position:'absolute', left:`${p.left}%`, top:`${p.top}%`, background:p.color, width:p.w, height:p.h, transform:`rotate(${p.rot}deg)`, borderRadius: i%3===0?'50%':'2px'}} />
      ))}
      <div style={{fontFamily:'var(--font-display)', fontSize:200, fontWeight:700, letterSpacing:'-0.04em', background:'linear-gradient(135deg, #fbbf24 0%, #ec4899 50%, #c084fc 100%)', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent', textShadow:'0 0 60px rgba(251,191,36,0.4)', position:'relative', zIndex:2}}>BINGO!</div>
      <div style={{position:'absolute', bottom:80, left:'50%', transform:'translateX(-50%)', fontSize:22, color:'var(--ink)', fontFamily:'var(--font-display)'}}>Camila filled the card!</div>
      <button style={{position:'absolute', bottom:30, left:'50%', transform:'translateX(-50%)', padding:'12px 24px', borderRadius:999, background:'rgba(255,255,255,0.1)', border:'1px solid rgba(192,132,252,0.35)', fontSize:13, letterSpacing:'0.12em', textTransform:'uppercase', color:'#f5edff'}}>Close</button>
    </div>
  );
};

window.PlayerScreen = PlayerScreen;
window.CelebrateScreen = CelebrateScreen;
