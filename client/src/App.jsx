import { useState } from 'react'
import './App.css'
import {Routes , Route} from 'react-router-dom'
import IdGenerator from './components/IdGenerator'
import Room from './components/Room'
import {Toaster} from 'react-hot-toast'
import CanvasApp from './components/CanvasApp'
import.meta.env.VITE_BACKEND_URL


function App() {

  return (
    <>
    <Toaster position='top-center'></Toaster>
      <Routes>
        <Route path='/idGenerator' element={<IdGenerator/>}/>
        <Route path='/room/:roomId' element={<Room/>}/>
        <Route path='/Canvas' element={<CanvasApp/>}/>
      </Routes>
    </>
  )
}

export default App
