import React, { Component } from "react";
import { Search } from './Home/Search'
import { Globe } from './Home/Globe'
import { DisplayEntry } from './Home/DisplayEntry'
import { Timeline } from './Home/Timeline'

export class Home extends Component {
  constructor(props) {
    super(props);
  }

  refreshList() {
    // TODO: something like this"
    // fetch(variables.API_URL + "Department/GetAll")
    // .then(response => response.json())
    // .then(data => {
    //   this.setState({
    //     departments: data,
    //     departmentsWithoutFilter: data
    //   })
    // })
  }

  render() {
    return (
      <div>
        Hello, I'm Home

        {/* 
        How to drop components into the HTML:
        https://reactjs.org/docs/components-and-props.html#composing-components
         */}
        {/* <div>
          <div className="search">
            <Search />
          </div>

          <div className="globe">
            <Globe />
          </div>

          <div className="displayentry">
            <DisplayEntry />
          </div>
        </div>
        <div className="timeline">
          <Timeline />
        </div> */}

        {/* 
        How I expected it work:
        https://jsfiddle.net/przemcio/xLhLuzf9/3/
         */}
        {/* 
        <div class="box">
          <div class="row header">
            <p><b>header</b>
              <br />
              <br />(sized to content)</p>
          </div>
          <div class="row content">
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
            <p>
              <b>content</b> (fills remaining space)
            </p>
          </div>
          <div class="row footer">
            <p><b>footer</b> (fixed height)</p>
          </div>
        </div> */}

        {/* 
        How it actually works:
        https://developer.mozilla.org/en-US/docs/Web/CSS/overflow-y
         */}
        <ul>
          <li><code>overflow-y:hidden</code> — hides the text outside the box
            <div id="div1">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </div>
          </li>

          <li><code>overflow-y:scroll</code> — always adds a scrollbar
            <div id="div2">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </div>
          </li>

          <li><code>overflow-y:visible</code> — displays the text outside the box if needed
            <div id="div3">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </div>
          </li>

          <li><code>overflow-y:auto</code> — on most browser, equivalent to <code>scroll</code>
            <div id="div4">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </div>
          </li>

          <li><code>test</code> — as className <code>scroll</code>
            <div className="box">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </div>
          </li>

          <li><code>test</code> — as id <code>scroll</code>
            <div id="thing2">
              Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </div>
          </li>
        </ul>


      </div>
    )
  }
}