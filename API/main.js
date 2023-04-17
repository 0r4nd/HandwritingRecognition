
"use strict";


/*
function main() {

  // Define a model for linear regression. The script tag makes `tf` available
  // as a global variable.
  const model = tf.sequential();

  model.add(tf.layers.dense({units: 1, inputShape: [1]}));

  model.compile({
    loss: 'meanSquaredError',
    optimizer: 'sgd',
    metrics: ['accuracy'],
  });

  // Generate some synthetic data for training.
  const xs = tf.tensor2d([1, 2, 3, 4], [4, 1]);
  const ys = tf.tensor2d([1, 3, 5, 7], [4, 1]);

  model.fit(xs, ys, {
    epochs: 100,
    callbacks: {
      onEpochEnd: (epoch, log) => console.log(`Epoch ${epoch}: loss = ${log.loss}`),
      onBatchEnd: (batch, log) => console.log('Accuracy', log.acc),
    },
  });

//tf.keras.models.model_to_json()

}

*/
const canvasRatio = 5; //window.devicePixelRatio;
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





const drawingTools = {
  pensil: new PensilTool(),
};


// the local 'this' context is manager.customData object!
// we can pass our own data's throw AnimationFrameHandler functions
function game_init(manager) {

  // Canvas Indexed 8bits buffer
  this.canvas = new CanvasPalBuffer({
    width: 160,
    height: 100,
  });
  this.canvas.palette[0] = cssToInt('#FFFFFF');
  this.canvas.palette[1] = cssToInt('#555555');
  this.canvas.palette[2] = cssToInt('#000000');
  this.canvas.palette[3] = cssToInt('#5555FF');
  this.canvas.palette[4] = cssToInt('#0000AA');
  this.canvas.palette[5] = cssToInt('#55FF55');
  this.canvas.palette[6] = cssToInt('#00AA00');
  this.canvas.palette[7] = cssToInt('#55FFFF');
  this.canvas.palette[8] = cssToInt('#00AAAA');
  this.canvas.palette[9] = cssToInt('#FF5555');
  this.canvas.palette[10] = cssToInt('#AA0000');
  this.canvas.palette[11] = cssToInt('#FF55FF');
  this.canvas.palette[12] = cssToInt('#AA00AA');
  this.canvas.palette[13] = cssToInt('#FFFF55');
  this.canvas.palette[14] = cssToInt('#AA5500');
  this.canvas.palette[15] = cssToInt('#AAAAAA');

  // Canvas Element DOM
  var elem = document.getElementById("canvas");
  this.canvasElem = elem;
  var ctx = elem.getContext("2d");
  elem.width  = this.canvas.width  * canvasRatio;
  elem.height = this.canvas.height * canvasRatio;
  elem.style.width  = elem.width + "px";
  elem.style.height = elem.height + "px";
  elem.style.backgroundColor = "rgb(255,255,255)";
  elem.style.border = "#000 2px solid";
  elem.style.cursor = "crosshair";
  ctx.scale(canvasRatio, canvasRatio);
}




// the local context is manager.customData object!
function game_animate(manager) {
  var points = drawingTools.pensil.points;
  var color = 1;
  for (var i = 0; i < points.length; i++) {
    var pts = points[i];
    if (pts.length == 0) continue;
    var x1 = Math.floor(pts[0][0] / canvasRatio);
    var y1 = Math.floor(pts[0][1] / canvasRatio);

    // only a point
    if (pts.length == 1) {
      this.canvas.drawPixel(x1,y1, color);
      continue;
    } 
    // a line
    for (var j = 1; j < pts.length-1; j++) {
      var x2 = Math.floor(pts[j][0] / canvasRatio);
      var y2 = Math.floor(pts[j][1] / canvasRatio);
      this.canvas.drawBresenhamLine(x1,y1, x2,y2, color);
      x1 = x2;
      y1 = y2;
    }
  }
  this.canvas.draw(this.canvasElem);
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







