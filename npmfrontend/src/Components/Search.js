import "./Search.css"
import React, { Component } from "react";

export class Search extends Component {
  constructor(props) {
    super(props);

    this.state = {
      searchTerm: "", // required (??how??)
      fromDate: "", // default "beginning of time"
      toDate: ""    // default "end of time"
    }
  }

  onSearchTextChanged(e) {
  }

  onSearchDateFromChanged(e) {
  }

  onSearchDateToChanged(e) {
  }

  onSearchClick() {
  }

  myLoop() {
    let htmlString = ""
    for (let i = 0; i < 10; i++) {
      htmlString += `<div>${i}</div>\n` // inserting variables requires backtics
    }
    console.log("htmlString:")
    console.log(htmlString)

    const thing = document.querySelector("#mine");
    console.log(thing)
    thing.innerHTML = htmlString
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
      <div id="main-container">
        <div className="search-container">
          <div className="search-text-container">
            <span>Search (titles, descriptions, sources, tags):</span>
            <input type="text" className="search-text-box" value={this.searchTerm} onChange={(e) => this.onSearchChanged(e)}></input>
          </div>

          <div>
            <div className="search-date-container">
              <span className="search-date-span">From:</span>
              <input className="search-date-select" type="datetime-local" onChange={(e) => this.onSearchDateFromChanged(e)}></input>
            </div>

            <div className="search-date-container">
              <span className="search-date-span">To:</span>
              <input className="search-date-select" type="datetime-local" onChange={(e) => this.onSearchDateToChanged(e)}></input>
            </div>
          </div>

          <div className="search-button-container">
            <button className="search-button" type="button" onClick={() => this.myLoop()}>Search</button>
          </div>

        </div>
        <div id="mine" className="search-results-container">

          {/* <select className="search-results-list" type="text">

          </select> */}
        </div>
        {/* {
          Can't do this here. The html hasn't finished ??something? what is it?? and as a result calling ".innerHTML" here ??does what? why does it screw it up??
          document.querySelector("#mine").innerHTML = "<div>hi there</div>"
        } */}
      </div>
    )
  }
}