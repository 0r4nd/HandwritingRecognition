

import { Stack } from "@mui/material"
import './App.css';
import MuiButton from "./components/MuiButton/MuiButton";
import CanvasPaint from "./components/CanvasPaint/CanvasPaint";
import { MuiTypography } from './components/MuiTypography';

var model = undefined;
var model_aabb = [0,0,0,0];



//<canvas className="App-canvas-output"></canvas>
function App() {

  const handleClickRender = () => {
    console.log("render!")
  };
  const handleClickClean = () => {
    console.log("clean")
  };

  return <div className="App">

    {/*<MuiTypography></MuiTypography>*/}

    <Stack spacing={2} display='block' direction='row'>
      <CanvasPaint/>
      <canvas className="App-canvas-output"></canvas>
    </Stack>

    <div>Result: </div>

    <Stack spacing={2} display='block' direction='row'>
      <MuiButton onClick={handleClickRender} color='secondary' variant='contained' size='large' text="Predict"/>
      <MuiButton onClick={handleClickClean} color='secondary' variant='outlined' size='small' text="Clean"/>
      {/*<button onClick={handleClickClean} className="App-button">Clean</button>*/}
    </Stack>

  </div>
  
}

//<button onClick={predictCallback} className="App-button">Predict</button>
export default App;
