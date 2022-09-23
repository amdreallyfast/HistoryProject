import React, { Component } from "react";
import { Search } from './Search'
import { Globe } from './Globe'
import { DisplayEntry } from './DisplayEntry'
import { Timeline } from './Timeline'

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
        {/* 
        How to drop components into the HTML:
        https://reactjs.org/docs/components-and-props.html#composing-components
         */}
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
      </div>
    )
  }
}