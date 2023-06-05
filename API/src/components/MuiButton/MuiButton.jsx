

import { Button } from "@mui/material"
import './MuiButton.css'


/*
refs:
  https://mui.com/material-ui/customization/palette/

props = {
  variant: ['text', 'contained', 'outlined']
  color: ['primary', 'secondary' 'error', 'warning', 'info', 'sucess']
  size: ['small', 'medium', 'large']
}
*/
export default function MuiButton({text, onClick, variant, color, size}) {
  return (
    <Button variant={variant} color={color} size={size} onClick={onClick}>{text}</Button>
  )
  
}
