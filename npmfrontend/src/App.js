import './App.css';
import React from 'react'
import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import AboutModal from './Components/Modal';
import { Search } from './Components/Search'
import { Globe } from './Components/Globe'
import { DisplayEntry } from './Components/DisplayEntry'
import { Timeline } from './Components/Timeline'
import { Home } from './Components/Home';

// Reference:
//  React Cards with Props | UI Card Design with React JS
//  https://www.youtube.com/watch?v=4KxHcbQ8GYQ
function Card() {
  return (
    <div className='card'>
      <div className='card__body'>
        <img src='' />
        <h2 className='card__title'>
          A fabulous title
        </h2>
        <p className='card__description'>
          This is the card description
        </p>
      </div>
      <button className='card__btn'>
        View Recipe
      </button>
    </div>
  );
}

export default function App() {
  const [aboutModalState, setModalState] = React.useState(false)

  function toggleModalState() {
    setModalState(!aboutModalState)
  }

  return (
    <BrowserRouter>
      <div className="App container">
        <h3 className="d-flext justify-content-center m-3">
          History Project
        </h3>

        {/* <nav className='navbar navbar-expand-sm bg-light navbar-dark'>
          <NavLink className='btn btn-light btn-outline-primary' to='/about'>
            About
          </NavLink>
        </nav>

        <Routes>
          <Route path='/about' element={<About />} />
        </Routes>

        <Home /> */}

        <span onClick={toggleModalState}>
          About<br/>
          Modal state: '{aboutModalState.toString()}'
        </span>
        <AboutModal toggle={aboutModalState} onClick={toggleModalState} />

      </div>
    </BrowserRouter>
  );
}
