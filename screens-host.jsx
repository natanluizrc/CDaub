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
          <div className="stage">
            <div className="stage-eyebrow">Last number called</div>
            <div className="ball" style={{animation:'none'}}><span className="num-text">09</span></div>
            <div className="caption"><em>Hot, hot, hot!</em> &nbsp;12 of 50 called</div>
          </div>
          <div>
            <button className="draw-random" style={{marginTop:0, marginBottom:20, width:'100%'}}>🎲 Call the next number</button>
            <div className="panel-head">
              <h2>Number board</h2>
              <span className="hint">38 left · random draw</span>
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
