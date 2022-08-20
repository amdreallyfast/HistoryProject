import logo from './logo.svg';
import './App.css';
import React from 'react'
import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import { Home } from './Components/Home'
import { About } from './Components/About'

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <h3 className="d-flext justify-content-center m-3">
                    History Project
                </h3>

                <nav className='navbar navbar-expand-sm bg-light navbar-dark'>
                    <ul className='navbar-nav'>
                        <li className='nav-item- m-1'>
                            <NavLink className='btn btn-light btn-outline-primary' to='/home'>
                                Home
                            </NavLink>
                        </li>
                        <li className='nav-item- m-1'>
                            <NavLink className='btn btn-light btn-outline-primary' to='/about'>
                                About
                            </NavLink>
                        </li>
                    </ul>
                </nav>

                <Routes>
                    <Route path='/home' element={<Home />} />
                    <Route path='/about' element={<About />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
