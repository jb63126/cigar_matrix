import { useState } from 'react'
import viteLogo from '/vite.svg'
import './App.css'
import Footer from './components/Footer'
import Header from './components/Header'

import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';


const theme = createTheme({
  palette: {
    primary: {
      main: '#00ADB5',
    },
    secondary: {
      main: '#888',
    },
  },
});

const App = ({children}) => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Header />
      {children}
      <Footer />
    </ThemeProvider>
  )
}

export default App
