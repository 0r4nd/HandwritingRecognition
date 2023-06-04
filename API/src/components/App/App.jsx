import logo from '../../logo.svg';
import './App.css';
import DrawCanvas from "../DrawCanvas/DrawCanvas";

var model = undefined;
var model_aabb = [0,0,0,0];




















function predictCallback() {}
function cleanCallback() {}

//<canvas className="App-canvas-output"></canvas>
function App() {
  return <div className="App">
    <div display="flex">
      <DrawCanvas/>
      <canvas className="App-canvas-output"></canvas>
    </div>
    <div>Result: </div>
    <div display="flex">
      <button onClick={predictCallback} className="App-button">Predict</button>
      <button onClick={cleanCallback} className="App-button">Clean</button>
    </div>
  </div>
  
}

export default App;
