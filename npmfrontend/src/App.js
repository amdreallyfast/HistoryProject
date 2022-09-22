import './App.css';
import React from 'react'
import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import { Home } from './Components/Home'
import { About } from './Components/About'
import Modal from './Components/Modal';

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
  const [modalState, setModalState] = React.useState(false)

  function toggleModalState() {
    setModalState(!modalState)
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
          About
          Modal state: '{modalState.toString()}'
        </span>
        <Modal toggle={modalState} onClickAction={toggleModalState} />

      </div>
    </BrowserRouter>
  );
}
