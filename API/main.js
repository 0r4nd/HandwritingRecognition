
"use strict";


const canvasWidth = 28;
const canvasHeight = 28;
const canvasRatio = 20; //window.devicePixelRatio;
var isMousedown = false;
var isMouseMoved = false;
var isCtrlDown = false;
var mousePrevPos = [0,0];



const PensilTool = (function() {
  function PensilTool() {
    this.points = [[]];
    this.pointsDeleted = []; // for ctrlY
  }
  PensilTool.prototype.addPoint = function(x,y) {
    var pts = this.points[this.points.length-1];
    pts.push([x,y]);
  };
  PensilTool.prototype.addId = function() {
    this.points.push([]);
    this.pointsDeleted = [];
  };
  PensilTool.prototype.ctrlZ = function() {
    if (this.points.length == 0) return;
    if (this.points.length > 1 && this.points[this.points.length-1].length == 0) {
      this.pointsDeleted.push(this.points.pop());
    }
    if (this.points.length == 1) {
      this.points = [[]];
    } else if (this.points.length > 0) {
      var arr = this.points.pop()
      this.pointsDeleted.push(arr);
    }
  };
  PensilTool.prototype.ctrlY = function() {
    if (this.pointsDeleted.length > 0) {
      this.points.push(this.pointsDeleted.pop())
    }
  };
  PensilTool.prototype.reset = function() {
    this.points = [[]];
  };
  return PensilTool;
})();



// '#0000AA' -> 0xAA0000
const cssToInt = c => parseInt(c.substr(5,2)+c.substr(3,2)+c.substr(1,2),16);

function irand(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min) + min);
}
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

function clear_canvas(elem) {
  var ctx = elem.getContext("2d");
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, elem.width, elem.height);
  ctx.rect(0, 0, elem.width, elem.height);
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.restore();
  return elem;
}

function getImageData_canvas(elem, width, height) {
  var ctx = elem.getContext("2d");
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  var imageData = ctx.getImageData(0,0, width, height);
  ctx.restore();
  return imageData;
}

function imageDataToString(imageData) {
  var w = imageData.width;
  var h = imageData.height;
  var str = "";
  for (var j = 0; j < h; j++) {
    for (var i = 0; i < w; i++) {
      str += imageData.data[j*w*4 + i*4]? 1:0;
    }
    str += "\n"
  }
  return str;
}


const drawingTools = {
  pensil: new PensilTool(),
};


// the local 'this' context is manager.customData object!
// we can pass our own data's throw AnimationFrameHandler functions
function game_init(manager) {

/*
  // load TFLite model into browser
  async function load_tflite_model() {
    const tfliteModel = await tflite.loadTFLiteModel("assets/model_0000.tflite");
    console.log("tfliteModel..", tfliteModel)
  }
  load_tflite_model();
*/
  var a = [[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
     [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]];


  async function loadModel() {
    //var model = await tf.loadLayersModel("https://github.com/0r4nd/HandwritingRecognition/blob/main/API/assets/model_0000/model.json");
    var model = await tf.loadLayersModel("assets/model_0000/model.json");
    var X = tf.tensor2d(a);
    X = X.expandDims(-1);

    //X.print()
    //console.warn("")
    //X.expandDims(0).print()
    //tf.tensor(X.dataSync()).print()
    //model.predict(X.expandDims(0))
    var labels = [
      "0",
      "1",
      "2",
      "3",
      "4",
      "5",
      "6",
      "7",
      "8",
      "9",
    ];


    var output = model.predict(X.expandDims(0)).dataSync();
    var idx = maxValIdx(output);
    console.log(`Prediction is ${labels[idx]} with ${toFixed(output[idx]*100)}%`);
    return model;
  }
  //this.model = loadModel();


  // Canvas Element DOM
  var elem = document.getElementById("canvas");
  this.canvasElem = elem;
  var ctx = elem.getContext("2d");
  elem.width  = canvasWidth  * canvasRatio;
  elem.height = canvasHeight * canvasRatio;
  elem.style.width  = elem.width + "px";
  elem.style.height = elem.height + "px";
  elem.style.backgroundColor = "rgb(255,255,255)";
  elem.style.border = "#000 2px solid";
  elem.style.cursor = "crosshair";
  ctx.scale(canvasRatio, canvasRatio);
}

function game_animate(manager) {
  var points = drawingTools.pensil.points;
  var ctx = this.canvasElem.getContext("2d");
  //ctx.lineJoin = "round";
  //ctx.lineCap = "round";
  ctx.lineWidth = 1;
  ctx.imageSmoothingQuality = "high"

  clear_canvas(this.canvasElem);

  for (var i = 0; i < points.length; i++) {
    var pts = points[i];
    if (pts.length == 0) continue;
    var x1 = Math.floor(pts[0][0] / canvasRatio);
    var y1 = Math.floor(pts[0][1] / canvasRatio);
    ctx.beginPath();
    ctx.moveTo(x1,y1);

    // only a point
    if (pts.length == 1) {
      ctx.lineTo(x1,y1);
      ctx.stroke();
      continue;
    } 

    // a line
    for (var j = 1; j < pts.length-1; j++) {
      var x2 = Math.floor(pts[j][0] / canvasRatio);
      var y2 = Math.floor(pts[j][1] / canvasRatio);
      ctx.lineTo(x2,y2);
      x1 = x2;
      y1 = y2;
    }
    ctx.stroke();
  }
}


function main() {
  console.clear();
  var elem = document.getElementById("canvas");
  var manager = new AnimFrameManager(elem);
  

  //AnimationFrameTime.frameSkip = 8;
  manager.elementEvent['init'].add(game_init);
  manager.elementEvent['animate'].add(game_animate);

  manager.windowEvent['focus'].add(e => {
    manager.start();
    console.log("Start");
  });
  manager.windowEvent['blur'].add(e => {
    manager.pause();
    console.log("Pause");
  });


  manager.elementEvent['mousemove'].add(event => {
    var xy = manager.getMouseCoords(event);
    if (isMousedown && (mousePrevPos[0]!=xy[0] && mousePrevPos[1]!=xy[1])) {
      drawingTools.pensil.addPoint(xy[0],xy[1]);
      mousePrevPos[0] = xy[0];
      mousePrevPos[1] = xy[1];
      isMouseMoved = true;
    }
  });


  manager.elementEvent['mouseup'].add(event => {
    if (isMouseMoved == false) {
      var xy = manager.getMouseCoords(event);
      drawingTools.pensil.addPoint(xy[0],xy[1]);
    }
    isMouseMoved = false;
    isMousedown = false;
    
    var canvasElem = manager.customData.canvasElem;
    var ctx = canvasElem.getContext("2d");
    var imageData = getImageData_canvas(canvasElem, canvasWidth,canvasHeight);
    console.clear()
    console.log(imageDataToString(imageData))
  });
  manager.elementEvent['mousedown'].add(event => {
    drawingTools.pensil.addId();
    isMouseMoved = false;
    isMousedown = true;
  });


  manager.documentEvent['keydown'].add(event => {
    switch (event.key) {
      case "Control":
        isCtrlDown = true;
        break;
      case "z":
        if (isCtrlDown) {
          drawingTools.pensil.ctrlZ();
        }
        break;
      case "y":
        if (isCtrlDown) {
          drawingTools.pensil.ctrlY();
        }
        break;
    }
  });
  manager.documentEvent['keyup'].add(event => {
    switch (event.key) {
      case "Control":
        isCtrlDown = false;
        break;
    }
  });

  //manager.start();
  //manager.log('element');
}







