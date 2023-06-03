import logo from '../../logo.svg';
import './App.css';
import '../Canvas/Canvas'


function renderCallback() {
}
function cleanCallback() {
}

function App() {
  return <div className="App">
    <div display="flex">
      <canvas className="App-canvas-input"></canvas>
      <canvas className="App-canvas-output"></canvas>
    </div>
    <div>Result: </div>
    <div display="flex">
      <button onClick={renderCallback} className="App-button">Render</button>
      <button onClick={cleanCallback} className="App-button">Clean</button>
    </div>
  </div>
  
  /*(
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );*/
}

export default App;
