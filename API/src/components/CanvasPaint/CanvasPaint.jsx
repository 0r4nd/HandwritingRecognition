

import { useState, useEffect, forwardRef, useRef } from "react"
import { Stack, Button, IconButton, Typography, Divider, Box, Grid } from '@mui/material'
import './CanvasPaint.css';


import BrushIcon from '@mui/icons-material/Brush'
import ClearIcon from '@mui/icons-material/Clear'

import UndoIcon from '@mui/icons-material/Undo'
import RedoIcon from '@mui/icons-material/Redo'


/* Classes */
const PensilTool = (function() {
    function PensilTool() {
        this.points = [[]];
        this.pointsDeleted = []; // for ctrlY
    }
    PensilTool.prototype.addPoint = function(x,y) {
        const pts = this.points[this.points.length-1];
        pts.push([x,y]);
    };
    PensilTool.prototype.addId = function() {
        this.points.push([]);
        this.pointsDeleted = [];
    };
    PensilTool.prototype.undo = function() {
        const len = this.points.length;
        if (len === 0) return;
        if (len > 1 && this.points[len-1].length === 0) {
            this.pointsDeleted.push(this.points.pop());
        }
        if (this.points.length === 1) {
            this.points = [[]];
        } else if (this.points.length > 0) {
            var arr = this.points.pop()
            this.pointsDeleted.push(arr);
        }
    };
    PensilTool.prototype.redo = function() {
        if (this.pointsDeleted.length > 0) {
            this.points.push(this.pointsDeleted.pop())
        }
    };
    PensilTool.prototype.reset = function() {
        this.points = [[]];
    };
    return PensilTool;
})();


/* global variables */
var isContextInitialized = false;
var isMousedown = false;
var isMouseMoved = false;
var isCtrlDown = false;
const mousePrevPos = [0,0];
const drawingTools = {
    pensil: new PensilTool(),
};


function drawPaths(canvas, points, lineWidth=20, strokeStyle="black") {
    const ctx = canvas.getContext("2d");
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
        if (pts.length === 1) {
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
function drawRect(canvas, points) {
    var ctx = canvas.getContext("2d");
    var x = points[0];
    var y = points[1];
    var width = points[2]-x;
    var height = points[3]-y;
    ctx.beginPath();
    ctx.rect(x,y,width,height);
    ctx.stroke();
}
const canvasDraw = (canvas, points) => {
    if (!isContextInitialized) {
        isContextInitialized = true;
        const ctx = canvas.getContext("2d");
        ctx.lineJoin = "round";
        ctx.lineCap = "round";
        ctx.imageSmoothingQuality = "high"

        // draw bounding-box
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 4;
        //drawRect(canvas, model_aabb);
    }
    clearCanvas(canvas);
    drawPaths(canvas, points, 80/2, 'rgba(0,0,0,0.2)');
    drawPaths(canvas, points, 65/2, 'rgba(0,0,0,0.3)');
    drawPaths(canvas, points, 50/2, 'rgba(0,0,0,0.4)');
    drawPaths(canvas, points, 35/2, 'rgba(0,0,0,0.5)');
    drawPaths(canvas, points, 20/2, 'rgba(0,0,0,1.0)');
};

const getMouseCoords = (event, elem) => {
    var rect = elem.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
}


const GrandChild = forwardRef(function (props, ref) {
    return <div ref={ref}>Deep!</div>
  })


 const CanvasPaint = forwardRef(function(props, ref) {    
    const [isLoaded, setIsLoaded] = useState(false);

    // This will run one time after the component mounts
    useEffect(() => {
        const onPageLoad = () => { setIsLoaded(true); };
        if (document.readyState === 'complete') {
            onPageLoad();
        } else {
            window.addEventListener('load', onPageLoad);
            return () => window.removeEventListener('load', onPageLoad);
        }
    }, []);


    const handleBrush = () => {
    };
    const handleClear = () => {
        clearCanvas(ref.current);
        drawingTools.pensil.reset();
    };
    const handleUndo = () => {
        drawingTools.pensil.undo();
        canvasDraw(ref.current, drawingTools.pensil.points);
    };
    const handleRedo = () => {
        drawingTools.pensil.redo();
        canvasDraw(ref.current, drawingTools.pensil.points);
    };
    const onMouseDown = (event) => {
        drawingTools.pensil.addId();
        isMouseMoved = false;
        isMousedown = true;
        //console.log("mouse down")
    };
    const onMouseUp = (event) => {
        if (isMouseMoved === false) {
            var xy = getMouseCoords(event, event.target);
            drawingTools.pensil.addPoint(xy[0],xy[1]);
        }
        isMouseMoved = false;
        isMousedown = false;
        canvasDraw(event.target, drawingTools.pensil.points);
        //handleCanvasElem(event.target);
    };
    const onMouseMove = (event) => {
        const canvas = event.target;
        const points = drawingTools.pensil.points;
        const xy = getMouseCoords(event, canvas);
        if (!(isMousedown &&
            (mousePrevPos[0]!==xy[0] && mousePrevPos[1]!==xy[1]))) return;
    
        drawingTools.pensil.addPoint(xy[0],xy[1]);
        mousePrevPos[0] = xy[0];
        mousePrevPos[1] = xy[1];
        isMouseMoved = true;
        canvasDraw(canvas, points);
    };


    return ( 
        <Stack direction='column' alignItems='flex-start'>
            <canvas
                className="CanvasPaint"
                ref={ref}
                onLoad={()=>alert("LOADED!")}
                onMouseDown={onMouseDown}
                onMouseUp={onMouseUp}
                onMouseMove={onMouseMove}
                width={props.width||200} height={props.height||200}
            ></canvas>
            <Stack spacing={0} direction='row' alignItems='flex-start'>
                <IconButton variant= "outlined" color="primary" onClick={handleBrush} aria-label='brush'><BrushIcon/></IconButton>
                <IconButton onClick={handleClear} aria-label='clear'><ClearIcon/></IconButton>
                <IconButton onClick={handleUndo} aria-label='undo'><UndoIcon/></IconButton>
                <IconButton onClick={handleRedo} aria-label='redo'><RedoIcon/></IconButton>
            </Stack>
        </Stack>
    )
});



export default CanvasPaint;
