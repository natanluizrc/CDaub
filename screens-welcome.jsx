// Static mock: Welcome + Connect screens
const WelcomeScreen = () => (
  <div style={{position:'relative', width:'100%', height:'100%', background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)', overflow:'hidden'}}>
    <div style={{position:'absolute', inset:0, background:'radial-gradient(circle at 20% 20%, rgba(124,58,237,0.25), transparent 40%), radial-gradient(circle at 80% 80%, rgba(236,72,153,0.18), transparent 45%)'}} />
    <div className="modal-shroud" style={{position:'absolute', animation:'none'}}>
      <div className="welcome" style={{animation:'none'}}>
        <div className="eyebrow">WELCOME TO</div>
        <h1>CDaub.</h1>
        <div className="slogan">Cards that build Moments.</div>
        <p className="sub">The excitement begins before the first number is called. Tell us who you are — and how you'll join the game.</p>
        <div className="field">
          <label>YOUR NAME</label>
          <input placeholder="Type your name..." defaultValue="Marina" />
        </div>
        <div className="field" style={{marginBottom:0}}>
          <label>YOUR ROLE</label>
          <div className="mode-pick">
            <button className="mode-card">
              <div className="icon">🎙️</div>
              <h3>Host</h3>
              <p>Create a room, call the numbers and lead the game in real time.</p>
              <div className="meta">CREATE ROOM <span className="arrow">→</span></div>
            </button>
            <button className="mode-card gold">
              <div className="icon gold">🎟️</div>
              <h3>Player</h3>
              <p>Join a room, get your card and play until BINGO.</p>
              <div className="meta">JOIN ROOM <span className="arrow">→</span></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const ConnectScreen = () => (
  <div style={{position:'relative', width:'100%', height:'100%', background:'radial-gradient(ellipse at top, #2a0e54 0%, #1a0838 35%, #0e0420 70%)', overflow:'hidden'}}>
    <div className="modal-shroud" style={{position:'absolute', animation:'none'}}>
      <div className="connect-card" style={{animation:'none'}}>
        <h2>Join the room</h2>
        <p className="sub">Grab the 6-character code from the host calling the numbers.</p>
        <input className="code-input" defaultValue="KPQ472" />
        <div className="connect-actions">
          <button className="btn-primary">Enter</button>
          <button className="btn-ghost">Back</button>
        </div>
      </div>
    </div>
  </div>
);

window.WelcomeScreen = WelcomeScreen;
window.ConnectScreen = ConnectScreen;
