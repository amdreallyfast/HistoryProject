import "./DisplayEntry.css"
import React, { Component } from "react";

export class DisplayEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      titleText: ""
    }
  }

  refreshList() {
    // TODO: something like this"
    // fetch(variables.API_URL + "Department/GetAll")
    // .then(response => response.json())
    // .then(data => {
    //     this.setState({
    //         departments: data,
    //         departmentsWithoutFilter: data
    //     })
    // })
  }

  render() {
    return (
      // <div>
      //   Hello, I'm DisplayEntry
      // </div>
      <div id="main-container">
        <div className="display-title-container">
          <span>Title</span>
        </div>
        <div className="display-image-container">
          <span>Image box</span>
        </div>
        <div className="display-where-container">
          <span>Where</span>
        </div>
        <div className="display-when-container">
          <span>When</span>
        </div>
        <div className="display-description-container">
          <span>Description</span>
        </div>
      </div>
    )
  }
}