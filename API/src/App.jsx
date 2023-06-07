 
import './App.css';
import * as tf from '@tensorflow/tfjs';
import { useState, useRef, useEffect } from "react"
import { Stack, Paper, Card, Box, Alert } from "@mui/material"
import MuiButton from "./components/MuiButton/MuiButton";
import CanvasPaint from "./components/CanvasPaint/CanvasPaint";
import HandWritingPredictor from './components/HandWritingPredictor/HandWritingPredictor';


export default function App() {
  return <div className="App">
    <div>Hand writing predictor model using MNIST dataset:</div>
    <HandWritingPredictor></HandWritingPredictor>
  </div>
}

