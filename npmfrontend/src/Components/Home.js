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

        <div>
          <div className="projectsearch">
            <Search />
          </div>

          <div className="projectglobe">
            <Globe />
          </div>

          <div className="projectdisplayentry">
            <DisplayEntry />
          </div>
        </div>
        <div className="projecttimeline">
          <Timeline />
        </div>


        {/* 
        <div className="overmiddlediv">
          <div className="sidedivs">
            <p>left side</p>
          </div>

          <div className="centerdiv">
            <p>middle</p>
          </div>

          <div className="sidedivs">
            <p>right side</p>
          </div>
        </div> */}
      </div>
    )
  }
}