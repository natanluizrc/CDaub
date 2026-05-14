// Static mock: Host / Caller screen
const HostScreen = () => {
  const drawn = [7, 23, 41, 12, 38, 5, 19, 44, 30, 16, 27, 9];
  const lastDrawn = 9;
  const drawnSet = new Set(drawn);
  const players = [
    {id:'a', name:'Lucas', marked:[7,23,12,5], bingo:false},
    {id:'b', name:'Camila', marked:[41,38,19,44,16,27,9], bingo:false},
    {id:'c', name:'João', marked:[7,30,9], bingo:false},
    {id:'d', name:'Bia', marked:[23,41,12,38,5,19,44,30,16,27], bingo:false},
  ];

  return (
    <div className="app" style={{background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)'}}>
      <div className="top-bar">
        <div className="brand">
          <span className="logo">CDaub.</span>
          <span className="brand-slogan">Cards that build Moments.</span>
        </div>
        <div className="who">
          <span className="role-chip">Host</span>
          <span className="name">Marina</span>
          <button className="leave">Leave</button>
        </div>
      </div>
      <div className="caller">
        <div className="left">
          <div className="session-bar">
            <div className="session-code">
              <div>
                <div className="lbl">Room code</div>
                <div className="code">KPQ472</div>
              </div>
              <button className="copy">Copy</button>
            </div>
            <div className="players-pill">
              <div className="lbl">Players</div>
              <div className="count">4<span className="live-dot" /></div>
            </div>
          </div>
          <div style={{
            background:'rgba(255,255,255,0.03)',
            border:'1px solid rgba(192,132,252,0.28)',
            borderRadius:20,
            padding:'16px 18px 18px',
            display:'flex',
            flexDirection:'column',
            gap:14,
            flex:1,
            minHeight:0,
          }}>
            <div style={{display:'flex', gap:18, alignItems:'center'}}>
              <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:6, flexShrink:0}}>
                <div style={{fontSize:10, textTransform:'uppercase', letterSpacing:'0.22em', color:'var(--ink-dimmer)'}}>
                  Last called
                </div>
                <div className="ball" style={{animation:'none', width:96, height:96, fontSize:52}}>
                  <span className="num-text">09</span>
                </div>
                <div style={{fontSize:12, textAlign:'center', color:'var(--ink-dim)'}}>
                  <em style={{fontStyle:'normal', background:'linear-gradient(90deg,var(--magenta),var(--gold))', WebkitBackgroundClip:'text', backgroundClip:'text', color:'transparent'}}>Hot, hot, hot!</em>{' · '}12/50
                </div>
              </div>
              <div style={{flex:1, display:'flex', flexDirection:'column', gap:8}}>
                <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between'}}>
                  <span style={{fontFamily:'var(--font-display)', fontSize:16, fontWeight:600, letterSpacing:'-0.01em'}}>Number board</span>
                  <span style={{fontSize:12, color:'var(--ink-dimmer)'}}>38 left</span>
                </div>
                <div className="numbers-grid">
                  {Array.from({length:50},(_,i)=>i+1).map(n=>{
                    const isDrawn = drawnSet.has(n);
                    const isLast = n === lastDrawn;
                    return <div key={n} className={`num-btn${isLast?' last-drawn':isDrawn?' drawn':''}`} style={isLast?{animation:'none'}:{}}>{String(n).padStart(2,'0')}</div>;
                  })}
                </div>
              </div>
            </div>
            <button className="draw-random" style={{marginTop:2, width:'100%'}}>🎲 Call the next number</button>
          </div>
        </div>
        <div className="right">
          <div>
            <div className="panel-head">
              <h2>History</h2>
              <span className="hint">Newest first</span>
            </div>
            <div className="history">
              {[...drawn].reverse().map((n,i)=>(
                <div key={n} className={`h-num${i===0?' newest':''}`}>{String(n).padStart(2,'0')}</div>
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
                  <div className="name">{p.name}</div>
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

window.HostScreen = HostScreen;
