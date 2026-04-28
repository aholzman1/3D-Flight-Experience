import '../styles/Landing.css'

function Landing({ onStartExperience, onInfo }) {
  return (
    <div className="landing">
      <div className="landing-content">
        <h1 className="landing-title">FLIGHT DREAM</h1>
        <p className="landing-credit">by Andrew Holzman</p>
        
        <div className="landing-buttons">
          <button className="landing-btn start-btn" onClick={onStartExperience}>
            Start
          </button>
          <button className="landing-btn info-btn" onClick={onInfo}>
            Info
          </button>
        </div>
      </div>
    </div>
  )
}

export default Landing
