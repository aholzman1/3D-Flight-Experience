import '../styles/Info.css'

function Info({ onBack }) {
  // Info page with navy overlay and lavender gradient background
  return (
    <div className="info">
      <div className="info-fade-overlay"></div>
      <div className="info-box">
        <h1>ABOUT FLIGHT DREAM</h1>
        
        <section>
          <h2>Experience the Magic</h2>
          <p>
            Immerse yourself in a serene 3D forest environment. Drift through a procedurally generated landscape filled with trees, grass, and natural details. The experience dynamically shifts through different weather conditions - from calm sunny days to gentle rain and overcast skies.
          </p>
        </section>

        <section>
          <h2>Features</h2>
          <ul>
            <li>Dynamic weather system with rain and varying atmospheric conditions</li>
            <li>Procedurally generated forest with 1200+ trees</li>
            <li>Ambient soundscape with wind, birdsong, and rain</li>
            <li>Smooth first-person flight controls</li>
            <li>60-second immersive experience</li>
          </ul>
        </section>

        <section>
          <h2>Controls</h2>
          <p>
            <strong>Movement:</strong> WASD keys to move, Space to ascend, Shift to descend<br />
            <strong>Camera:</strong> Move your mouse to look around (click to enable)
          </p>
        </section>

        <section>
          <h2>Created by</h2>
          <p>Andrew Holzman</p>
        </section>

        <button className="back-btn" onClick={onBack}>
          Back to Home
        </button>
      </div>
    </div>
  )
}

export default Info
