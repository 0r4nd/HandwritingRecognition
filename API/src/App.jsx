 
import { useState, useRef } from "react"
import { Stack } from "@mui/material"
import './App.css';
import MuiButton from "./components/MuiButton/MuiButton";
import CanvasPaint from "./components/CanvasPaint/CanvasPaint";
import { MuiTypography } from './components/MuiTypography';

var model = undefined;
var model_aabb = [0,0,0,0];


function clearCanvas(canvas) {
  var ctx = canvas.getContext("2d");
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.restore();
  return canvas;
}
function copyCanvas(srcCanvas, dstCanvas) {
  var srcCtx = srcCanvas.getContext("2d");
  var dstCtx = dstCanvas.getContext('2d');
  clearCanvas(dstCanvas);
  dstCtx.imageSmoothingQuality = "high";
  dstCtx.filter = 'invert(1)';
  dstCtx.drawImage(srcCanvas,0,0,srcCanvas.width,srcCanvas.height, 0,0,28,28);
}


//<canvas className="App-canvas-output"></canvas>
export default function App() {
  const canvasInputRef = useRef(null);
  const canvasOutputRef = useRef(null);
  const [canvasSize, canvasSetSize] = useState({width:28, height:28});
  const [canvasInputRatio] = useState(10);
  const [canvasOutputRatio] = useState(8);

  const handleClickRender = () => {
    const canvasInput = canvasInputRef.current;
    const canvasOutput = canvasOutputRef.current;
    console.log("render!")
    console.log("paint:", canvasInput, "mini:", canvasOutput);

    canvasOutput.imageSmoothingQuality = "high";
    canvasOutput.filter = 'invert(1)'
    copyCanvas(canvasInput, canvasOutput);
  };


  return <div className="App">

    <Stack spacing={2} direction='row' alignItems='flex-start'>
      <CanvasPaint ref={canvasInputRef}
                   width={canvasSize.width*canvasInputRatio}
                   height={canvasSize.height*canvasInputRatio}></CanvasPaint>

      <canvas ref={canvasOutputRef} className="App-canvas-output"
              width={canvasSize.width} height={canvasSize.height}
              style={{ width:canvasSize.width*canvasOutputRatio,
                       height:canvasSize.height*canvasOutputRatio }}></canvas>
    </Stack>

    <Stack spacing={2}  direction='row'>
      <MuiButton onClick={handleClickRender} color='secondary' variant='contained' size='large' text="Predict"/>
      <div>Result: </div>
    </Stack>

  </div>
  
}

