 

import * as tf from '@tensorflow/tfjs';
import { useState, useRef, useEffect } from "react"
import { Stack, Paper, Button, Alert } from "@mui/material"

import './HandWritingPredictor.css';
import MuiTextFieldImageURL from "../MuiTextFieldImageURL";
import CanvasPaint from "../CanvasPaint/CanvasPaint";


/***********************************************************************/
/* Utils */
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


/***********************************************************************/
/* Tensorflow functions */
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
async function loadModel(modelURL, setModel) {
  try {
    // For layered model
    const model = await tf.loadLayersModel(modelURL);
    // For graph model
    //const model = await tf.loadGraphModel(modelURL);
    setModel(model);
    console.log("Load model success");
    //console.log(model);
    return model;
  } catch (err) {
    console.error("Error loading model:", err);
  }
}


/***********************************************************************/
/* Canvas drawing functions */
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
  var dstCtx = dstCanvas.getContext('2d');
  clearCanvas(dstCanvas);
  dstCtx.imageSmoothingQuality = "high";
  dstCtx.filter = 'invert(1)';
  dstCtx.drawImage(srcCanvas,0,0,srcCanvas.width,srcCanvas.height,
                             0,0,dstCanvas.width,dstCanvas.height);
}
function copyURLtoCanvas(canvas, url) {
  var ctx = canvas.getContext('2d');
  var img = new Image();
  //img.crossOrigin = "anonymous";
  img.onload = () => {
    ctx.drawImage(img,0,0, canvas.width, canvas.height);
  };
  img.src = url;
}


/***********************************************************************/
/* React */
function RenderButton({onClick, variant='contained', color='primary', size='large'}) {
  return <Button onClick={onClick} variant={variant} color={color} size={size}>Predict</Button>
}
function ShowResult({objectsBbox}) {
  var severity = "info";
  var result = "Draw something and let the model predict what it is.";
  if (objectsBbox.length > 0) {
    var acc = objectsBbox[0].accuracy;
    severity = "success";
    if (acc < 70) severity = "error";
    else if (acc < 90) severity = "warning";
    result = `The best prediction is ${objectsBbox[0].bestLabel} with ${objectsBbox[0].accuracy}%`;
  }
  return (
    <Paper elevation={3}>
      <Alert sx={{fontWeight:900,fontSize:"20px"}}
        variant="filled"
        severity={severity}>{result}
      </Alert>
    </Paper>
  );
}



/***********************************************************************/
/* main */
export default function HandWritingPredictor({modelURL=''}) {
  const canvasInputRef = useRef(null);
  const canvasOutputRef = useRef(null);
  const [imageParams] = useState({
    width:28, height:28,
    inputScale:10, outputScale:8,
  });
  const [model, setModel] = useState(null);
  const [objectsBbox, setObjectsBbox] = useState([]);

  useEffect(() => {
    tf.ready().then(() => {
      setModel(loadModel(modelURL,setModel));
    });
  }, []);

  const handleClickRender = () => {
    const canvasInput = canvasInputRef.current;
    const canvasOutput = canvasOutputRef.current;
    const ctxOutput = canvasOutput.getContext('2d');
    canvasOutput.imageSmoothingQuality = "high";
    canvasOutput.filter = 'invert(1)';
    copyCanvas(canvasInput, canvasOutput);
    const imageData = ctxOutput.getImageData(0,0, imageParams.width, imageParams.height);
    console.clear();
    console.log(imageDataToString(imageData));

    // prediction
    const pred = predictModel(model, imageDataToTensor(imageData));

    var objectsBboxCopy = [...objectsBbox];
    objectsBboxCopy = [];
    objectsBboxCopy.push({
      bestLabel: pred.bestLabel,
      bbox: pred.predict[1].map(a => a*imageParams.width),
      accuracy: toFixed(pred.predict[0][pred.bestId]*100),
    });
    setObjectsBbox(objectsBboxCopy);
    console.log(Array.from(pred.predict[0])/*.map(a => toFixed(a))*/)
    console.log(objectsBbox, objectsBboxCopy);
  };


  return <div className="HandWritingPredictor">
        <Paper style={{width: 600,padding: 16}} elevation={8}>

          <Stack spacing={2}>
            <Stack spacing={2} direction='row' alignItems='flex-start'>
              <CanvasPaint ref={canvasInputRef}
                           width={imageParams.width*imageParams.inputScale}
                           height={imageParams.height*imageParams.inputScale}/>

              <Stack spacing={2}>
                <canvas ref={canvasOutputRef} className="HandWritingPredictor-canvas-output"
                        width={imageParams.width}
                        height={imageParams.height}
                        style={{ width:imageParams.width*imageParams.outputScale,
                                 height:imageParams.height*imageParams.outputScale }}/>

                <MuiTextFieldImageURL onChange={(ev) => {
                    copyURLtoCanvas(canvasInputRef.current, ev.target.value)}}/>
              </Stack>
            </Stack>

            <Stack spacing={2}  direction='row'>
              <RenderButton onClick={handleClickRender}/>
              <ShowResult objectsBbox={objectsBbox}/>
            </Stack>

          </Stack>
        </Paper>
  </div>
}


