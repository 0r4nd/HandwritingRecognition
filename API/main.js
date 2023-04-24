
"use strict";


const canvasWidth = 28;
const canvasHeight = 28;
const canvasRatio = 20; //window.devicePixelRatio;
var isMousedown = false;
var isMouseMoved = false;
var isCtrlDown = false;
var mousePrevPos = [0,0];
var model = undefined;


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
  var imageData = ctx.getImageData(0,0, width||elem.width, height||elem.height);
  ctx.restore();
  return imageData;
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
      arr.push([imageData.data[j*w*4 + i*4]>127? 0:1]);
    }
  }
  return tf.tensor3d(arr3d)/*.expandDims(-1)*/;
}

function copyStyle(elem, style) {
  if (!style) return;
  Object.keys(style).forEach((key,i) => {
    elem.style[key] = style[key];
  });
}
const mouseEventTypes = [
  "onclick","oncontextmenu","ondblclick","onmousedown","onmouseenter",
  "onmouseleave","onmousemove","onmouseout","onmouseover","onmouseup",
];
function copyMouseEventTypes(dst, src) {
  for (var i = 0; i < mouseEventTypes.length; i++) {
    var key = mouseEventTypes[i];
    if (src[key]) dst[key] = src[key];
  }
}
function commonDivReturn(elem, opts) {
  var parent = opts.parent;
  copyMouseEventTypes(elem, opts);
  copyStyle(elem, opts.style);
  if (!parent) parent = document.body;
  parent.appendChild(elem);
  return elem;
}
function createCanvas(opts = {}) {
  const elem = document.createElement("canvas");
  if (opts.id) elem.id = opts.id;
  elem.width = opts.width;
  elem.height = opts.height;
  if (elem.style.zIndex === undefined) elem.style.zIndex = 1;
  if (!elem.style.position) elem.style.position = "absolute";
  return commonDivReturn(elem, opts);
}
function createButton(opts = {}) {
  const elem = document.createElement("input");
  elem.setAttribute("type", "button");
  if (opts.id) elem.id = opts.id;
  if (opts.class) elem.class = opts.class;
  if (opts.value) elem.value = opts.value;
  return commonDivReturn(elem, opts);
}
function createDiv(opts = {}) {
  const elem = document.createElement("div");
  if (opts.id) elem.id = opts.id;
  if (opts.className) elem.className = opts.className;
  if (opts.contentEditable) elem.contentEditable = opts.contentEditable;
  if (typeof(opts.innerHTML) == "string") {
    elem.innerHTML = opts.innerHTML;
  }
  return commonDivReturn(elem, opts);
}



async function loadModel() {
  model = await tf.loadLayersModel("assets/model_0000/model.json");
  return model;
}
function predict(model, x) {
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
  var output = model.predict(x.expandDims(0)).dataSync();
  var idx = maxValIdx(output);
  var res = {
    predict: output,
    bestId: idx,
    bestLabel: labels[idx],
    labels: labels,
  };
  return res;
}




const drawingTools = {
  pensil: new PensilTool(),
};


// the local 'this' context is manager.customData object!
// we can pass our own data's throw AnimationFrameHandler functions
function game_init(manager) {
  loadModel();
}

function game_animate(manager) {
  var points = drawingTools.pensil.points;
  var ctx = manager.target.getContext("2d");
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 2;
  ctx.imageSmoothingQuality = "high"

  clear_canvas(manager.target);

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

  // Canvas Element DOM
  var canvas = createCanvas({
    width: canvasWidth/* * canvasRatio*/,
    height: canvasHeight/* * canvasRatio*/,
    style: {
      width: (28 * canvasRatio) + "px",
      height: (28 * canvasRatio) + "px",
      backgroundColor: "rgb(255,255,255)",
      border: "#000 2px solid",
      cursor: "crosshair",
    }
  });

  // Result div
  var resultDiv = createDiv({
    style: {
      top: (28 * canvasRatio + 12) + "px",
      left: (28 * canvasRatio / 3)*2 + "px",
      width: (28 * canvasRatio / 3) + "px",
      height: 94 + "px",
      position: "absolute",
      fontSize: "20px",
      border: "#000 2px solid",
    },
    innerHTML: "1. Draw something<br>2. Predict"
  })

  // Prediction BUTTON
  createButton({
    value: "Prediction",
    style: {
      top: (28 * canvasRatio + 12) + "px",
      left: 10 + "px",
      width: (28 * canvasRatio / 3) + "px",
      height: 100 + "px",
      position: "absolute",
      fontSize: "30px",
    },
    onclick: function() {
      var ctx = canvas.getContext("2d");
      //var imageData = getImageData_canvas(canvas, canvasWidth,canvasHeight);
      var imageData = ctx.getImageData(0,0, canvas.width, canvas.height);
      console.clear();
      console.log(imageDataToString(imageData));

      // prediction
      var pred = predict(model, imageDataToTensor(imageData))
      resultDiv.innerHTML = `Prediction is ${pred.bestLabel} with ${toFixed(pred.predict[pred.bestId]*100)}%`;
      console.log(`Prediction is ${pred.bestLabel} with ${toFixed(pred.predict[pred.bestId]*100)}%`);
    },
  })

  // Reset BUTTON
  createButton({
    value: "Reset",
    style: {
      top: (28 * canvasRatio + 12) + "px",
      left: (28 * canvasRatio / 3) + "px",
      width: (28 * canvasRatio / 3) + "px",
      height: 100 + "px",
      position: "absolute",
      fontSize: "30px",
    },
    onclick: function() {
      drawingTools.pensil.reset();
      resultDiv.innerHTML = "1. Draw something<br>2. Predict";
    },
  })


  var manager = new AnimFrameManager(canvas);
  
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

