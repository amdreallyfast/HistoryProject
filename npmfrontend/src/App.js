import './App.css';
import React from 'react'
import { BrowserRouter, Route, Routes, NavLink } from "react-router-dom";
import AboutModal from './Components/About/AboutModal';
import { Search } from './Components/Search'
import { Globe } from './Components/Globe'
import { DisplayEntry } from './Components/DisplayEntry'
import { Timeline } from './Components/Timeline'
import { Home } from './Components/Home';

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
        <span onClick={toggleModalState} className="aboutlinktext">
          About (Modal state: '{aboutModalState.toString()}')
        </span>

        <div>
          <div id="search-window">
            <Search />
          </div>

          <div id="globe-window">
            <Globe />
          </div>

          <div id="display-entry-window">
            <DisplayEntry />
          </div>
        </div>
        <div id="timeline-window">
          <Timeline />
        </div>

        <AboutModal toggle={aboutModalState} onClick={toggleModalState} />
      </div>
    </BrowserRouter>
  );
}
