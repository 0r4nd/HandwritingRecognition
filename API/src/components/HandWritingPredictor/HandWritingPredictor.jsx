 

import * as tf from '@tensorflow/tfjs';
import { useState, useRef, useEffect } from "react"
import { Stack, Paper, Card, Box, Alert } from "@mui/material"

import './HandWritingPredictor.css';
import MuiButton from "../MuiButton/MuiButton";
import CanvasPaint from "../CanvasPaint/CanvasPaint";

const URL = {
    model: './assets/models/model_0000/model.json',
};



function toFixed(x, count = 2) {
  x = Math.floor(x * 100) / 100;
  return x.toFixed(count);
}
function maxValIdx(arr) {
  var maxIdx = 0;
  for (var i = 1; i < arr.length; i++) {
    if (arr[i] > arr[maxIdx]) maxIdx = i;
  }
  return maxIdx;
}

function imageDataToString(imageData) {
  var w = imageData.width;
  var h = imageData.height;
  var str = "";
  for (var j = 0; j < h; j++) {
    for (var i = 0; i < w; i++) {
      str += imageData.data[j*w*4 + i*4]>128? 0:1;
    }
    str += "\n"
  }
  return str;
}

function imageDataToTensor(imageData) {
  var w = imageData.width;
  var h = imageData.height;
  var arr3d = [];
  for (var j = 0; j < h; j++) {
    var arr = []
    arr3d.push(arr);
    for (var i = 0; i < w; i++) {
      arr.push([imageData.data[j*w*4 + i*4]/255.0]);
    }
  }
  return tf.tensor3d(arr3d);
  //return tf.tensor2d(arr3d).expandDims(-1);
}
function predictModel(model, x) {
  var labels = ["0","1","2","3","4","5","6","7","8","9"];
  var output = model.predict(x.expandDims(0));
  var predict = [output[0].dataSync(), output[1].dataSync()]
  var idx = maxValIdx(predict[0]);
  var res = {
    predict: predict,
    bestId: idx,
    bestLabel: labels[idx],
    labels: labels,
  };
  return res;
}



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


export default function HandWritingPredictor() {
  const canvasInputRef = useRef(null);
  const canvasOutputRef = useRef(null);
  const [canvasSize, canvasSetSize] = useState({width:28, height:28});
  const [canvasInputRatio] = useState(10);
  const [canvasOutputRatio] = useState(8);
  const [model, setModel] = useState(null);
  const [objectsBbox, setObjectsBbox] = useState([]);

  async function loadModel(url) {
    try {
      // For layered model
      const model = await tf.loadLayersModel(url.model);
      // For graph model
      //const model = await tf.loadGraphModel(url.model);
      setModel(model);
      console.log("Load model success");
      //console.log(model);
      return model;
    } catch (err) {
      console.error("Error loading model:", err);
    }
  }

  useEffect(() => {
    tf.ready().then(() => {
      setModel(loadModel(URL));
    });
  }, []);

  const handleClickRender = () => {
    const canvasInput = canvasInputRef.current;
    const canvasOutput = canvasOutputRef.current;
    const ctxOutput = canvasOutput.getContext('2d');
    //console.log("render: ", "paint:", canvasInput, "mini:", canvasOutput);
    canvasOutput.imageSmoothingQuality = "high";
    canvasOutput.filter = 'invert(1)';
    copyCanvas(canvasInput, canvasOutput);

    //ctxMini.drawImage(canvas,0,0,canvas.width,canvas.height, 0,0,28,28);
    const imageData = ctxOutput.getImageData(0,0, canvasOutput.width, canvasOutput.height);
    console.clear();
    //console.log(imageDataToString(imageData));

    // prediction
    const pred = predictModel(model, imageDataToTensor(imageData));

    var objectsBboxCopy = [...objectsBbox];
    objectsBboxCopy = [];
    objectsBboxCopy.push({
      bestLabel: pred.bestLabel,
      bbox: pred.predict[1].map(a => a*canvasInput.width),
      accuracy: toFixed(pred.predict[0][pred.bestId]*100),
    });
    setObjectsBbox(objectsBboxCopy);

    //console.log(pred.predict[1].map(a => a*canvasInput.width));

    //console.error(pred.predict[1].map(a => a*20))
    //if (pred.predict[0][pred.bestId] > 0.8) resultDiv.style.backgroundColor = "rgb(128,255,128)";
    //else resultDiv.style.backgroundColor = "rgb(255,128,128)";

    //resultDiv.innerHTML = `Prediction is "${pred.bestLabel}" with ${toFixed(pred.predict[0][pred.bestId]*100)}%`;
    //console.log(`The best prediction is ${objectsBboxCopy[0].bestLabel} with ${objectsBboxCopy[0].accuracy}%`);
    
    console.log(Array.from(pred.predict[0])/*.map(a => toFixed(a))*/)
    console.log(objectsBbox, objectsBboxCopy);
  };


  const ShowResult = () => {
    var severity = "info";
    var result = "Draw something and let the model predict what it is.";
    if (objectsBbox.length > 0) {
      var acc = objectsBbox[0].accuracy;
      severity = "success";
      if (acc < 70) severity = "error";
      else if (acc < 90) severity = "warning";
      result = `The best prediction is ${objectsBbox[0].bestLabel} with ${objectsBbox[0].accuracy}%`;
    }
    return <Alert severity={severity}>{result}</Alert>;
  };

  return <div className="HandWritingPredictor">
    <Box sx={{ width: 600, height: 600 }}>
      <Card variant="outlined">
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
          {/*<Paper variant="outlined" elevation={3}>Result:</Paper>*/}
          {ShowResult()}
        </Stack>
      </Card>
    </Box>
  </div>
  
}

