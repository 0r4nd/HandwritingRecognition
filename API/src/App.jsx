 
import './App.css';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import HandWritingPredictor from './components/HandWritingPredictor/HandWritingPredictor';

/* Themes */
//const darkTheme = createTheme({ palette: { mode: 'dark' } });
const lightTheme = createTheme({ palette: { mode: 'light' } });

/* consts */
const modelURL = './assets/models/model_0000/model.json';


export default function App() {
  return <ThemeProvider theme={lightTheme}>
    <div className="App">
      <div>Hand writing predictor model using MNIST dataset:</div>
      <HandWritingPredictor modelURL={modelURL}></HandWritingPredictor>
    </div>
  </ThemeProvider>;
}

