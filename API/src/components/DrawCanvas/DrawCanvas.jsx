
import './DrawCanvas.css';


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


function drawPaths(canvas, points, lineWidth=20, strokeStyle="black") {
    var ctx = canvas.getContext("2d");
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = strokeStyle;
  
    for (var i = 0; i < points.length; i++) {
      var pts = points[i];
      if (pts.length == 0) continue;
      var x1 = Math.floor(pts[0][0]);
      var y1 = Math.floor(pts[0][1]);
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
        var x2 = Math.floor(pts[j][0]);
        var y2 = Math.floor(pts[j][1]);
        ctx.lineTo(x2,y2);
        x1 = x2;
        y1 = y2;
      }
      ctx.stroke();
    }
  }

var isMousedown = false;
var isMouseMoved = false;
var isCtrlDown = false;
var mousePrevPos = [0,0];
const drawingTools = {
    pensil: new PensilTool(),
};

const onMouseDown = function() {
    //drawingTools.pensil.addId();
    isMouseMoved = false;
    isMousedown = true;
};
const onMouseUp = function(event) {
    if (isMouseMoved == false) {
        //var xy = manager.getMouseCoords(event);
        //drawingTools.pensil.addPoint(xy[0],xy[1]);
    }
    isMouseMoved = false;
    isMousedown = false;
};

export default function DrawCanvas({}) {
    return (
        <canvas
            className="DrawCanvas"
            onMouseDown={onMouseDown}
            onMouseUp={onMouseUp}
        ></canvas>
    )
}
