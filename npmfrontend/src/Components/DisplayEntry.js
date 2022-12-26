import "./DisplayEntry.css"
import React, { Component } from "react";
import { variables } from "../Variables";

export class DisplayEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,

      event: {
        titleText: "",
        imageFilePath: "",
        summaryText: "",
        timeRange: {
          lowerBound: {
            Year: 0,
            Month: 0,
            Day: 0,
            Hour: 0,
            Sec: 0,
          },
          upperBound: {
            Year: 0,
            Month: 0,
            Day: 0,
            Hour: 0,
            Sec: 0,
          }
        },
        region: [],
        revisionDateTime: "",
        revisionAuthor: "",
      }
    }
  }

  getEventOfTheDay() {
    fetch(variables.API_URL + "Event/GetEventOfTheDay")
      .then(response => response.json())
      .then(event => {
        // newRegion = []
        // event.Region.Locations.forEach((item, index, arr) => {
        //   // console.log(`lat: '${item.Latitude}', lon: '${item.Longitude}'`)
        //   newRegion.push({
        //     lat: item.Latitude,
        //     long: item.Longitude
        //   })
        // })

        this.setState({
          ...this.state,
          event: {
            // Don't need to preserve any exist event state. Everything will be overwritten by 
            // the incoming object.
            titleText: event.Title,
            imageFilePath: event.ImageFilePath,
            summaryText: event.Summary,
            timeRange: {
              lowerBound: {
                Year: event.TimeRange.LowerBoundYear,
                Month: event.TimeRange.LowerBoundMonth,
                Day: event.TimeRange.LowerBoundDay,
                Hour: event.TimeRange.LowerBoundHour,
                Min: event.TimeRange.LowerBoundMin,
              },
              upperBound: {
                Year: event.TimeRange.UpperBoundYear,
                Month: event.TimeRange.UpperBoundMonth,
                Day: event.TimeRange.UpperBoundDay,
                Hour: event.TimeRange.UpperBoundHour,
                Min: event.TimeRange.UpperBoundMin,
              }
            },
            region: event.Region.Locations.map((item) => {
              return {
                lat: item.Latitude,
                long: item.Longitude
              }
            }),
            revisionDateTime: event.RevisionDateTime,
            revisionAuthor: event.RevisionAuthor,
          }
        })
      })
    console.log(this.state)
  }

  componentDidMount() {
    this.getEventOfTheDay()
  }

  switchEditMode() {
    if (this.state.editMode) {
      console.log("turning off edit mode")
      this.setState({
        ...this.state,
        editMode: false
      })
    }
    else {
      console.log("turning on edit mode")
      this.setState({
        ...this.state,
        editMode: true
      })
    }
  }

  render() {
    console.log("rendering")
    return (
      // <div>
      //   Hello, I'm DisplayEntry
      // </div>
      <div id="main-container">
        <div className="display-title-container">
          {/* {this.state.editMode === true ?
            <span>Edit le title</span>
            : <span>normal mode title</span>
          }
          <button type="button" onClick={() => this.switchEditMode()}>
            Things
          </button> */}
          <span>{this.state.titleText}</span>
          <button onClick={() => this.getEventOfTheDay()}>things</button>
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
        <div className="display-summary-container">
          <span>{this.state.summaryText}</span>
        </div>
      </div >
    )
  }
}