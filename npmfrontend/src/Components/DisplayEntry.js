import "./DisplayEntry.css"
import React, { Component } from "react";
import { variables } from "../Variables";
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

// TODO: on delete, show if (window.confirm('Are you sure?')) { <do the fetch> }
// TODO: replace "if editMode === true" with "if editMode === false" and put the simple display-only HTML at the top

export class DisplayEntry extends Component {
  constructor(props) {
    super(props);

    this.titleMinLen = 10;
    this.titleMaxLen = 128;
    this.imageFilePathMaxLen = 256;
    this.summaryTextMinLen = 50;
    this.summaryTextMaxLen = 2048;

    this.state = {
      debug: false,
      editMode: true,

      selectImageModal: {
        visible: false,
        uploadedFile: null,
        uploadedDataSrc: ""
      },

      errMsgs: {
        eventTitleErrMsg: null,
        eventImgErrMsg: null,
        eventSummaryErrMsg: null,
        eventWhenErrMsg: null,
        eventRegionErrMsg: null,
        eventRevisionInfoErrMsg: null,
      },

      event: this.emptyEvent(),
      startingEvent: null,
    }
  }

  logIfDebug = (obj) => {
    if (this.state.debug) {
      console.log(obj);
    }
  }

  emptyEvent = () => {
    return {
      Id: null,
      Revision: null,
      RevisionDateTime: null,
      RevisionAuthor: null,
      Predecessor: null,
      Title: "",
      ImageFilePath: "",
      Summary: "",
      TimeLowerBoundYear: null,
      TimeLowerBoundMonth: null,
      TimeLowerBoundDay: null,
      TimeLowerBoundHour: null,
      TimeLowerBoundMin: null,
      TimeUpperBoundYear: null,
      TimeUpperBoundMonth: null,
      TimeUpperBoundDay: null,
      TimeUpperBoundHour: null,
      TimeUpperBoundMin: null,
      Locations: [],
      Sources: [],
    };
  }

  // convertFromModelJson = (modelJson) => {
  //   return {
  //     // RevisionId: ??
  //     // EventId: ??
  //     titleText: modelJson.Title,
  //     image: {
  //       file: null,
  //       dataSrc: variables.PHOTO_URL + modelJson.ImageFilePath
  //     },
  //     summaryText: modelJson.Summary,
  //     timeRange: {
  //       lowerBound: {
  //         year: modelJson.TimeRange.LowerBoundYear,
  //         month: modelJson.TimeRange.LowerBoundMonth,
  //         day: modelJson.TimeRange.LowerBoundDay,
  //         hour: modelJson.TimeRange.LowerBoundHour,
  //         min: modelJson.TimeRange.LowerBoundMin,
  //       },
  //       upperBound: {
  //         year: modelJson.TimeRange.UpperBoundYear,
  //         month: modelJson.TimeRange.UpperBoundMonth,
  //         day: modelJson.TimeRange.UpperBoundDay,
  //         hour: modelJson.TimeRange.UpperBoundHour,
  //         min: modelJson.TimeRange.UpperBoundMin,
  //       }
  //     },
  //     region: modelJson.Region.Locations.map((item) => {
  //       return {
  //         lat: item.Latitude,
  //         long: item.Longitude
  //       }
  //     }),
  //     revisionDateTime: modelJson.RevisionDateTime,
  //     revisionAuthor: modelJson.RevisionAuthor,
  //   }
  // }

  // convertToModelJson = () => {
  //   var event = this.state.event;
  //   var modelJson = {
  //     // RevisionId: ??
  //     RevisionDateTime: event.revisionDateTime,
  //     RevisionAuthor: event.revisionAuthor,
  //     // EventId: ??
  //     Title: event.titleText,
  //     ImageFilePath: event.image.dataSrc,
  //     Summary: event.summaryText,
  //     TimeRange: {
  //       LowerBoundYear: event.timeRange.lowerBound.year,
  //       LowerBoundMonth: event.timeRange.lowerBound.month,
  //       LowerBoundDay: event.timeRange.lowerBound.day,
  //       LowerBoundHour: event.timeRange.lowerBound.hour,
  //       LowerBoundMin: event.timeRange.lowerBound.min,
  //       UpperBoundYear: event.timeRange.upperBound.year,
  //       UpperBoundMonth: event.timeRange.upperBound.month,
  //       UpperBoundDay: event.timeRange.upperBound.day,
  //       UpperBoundHour: event.timeRange.upperBound.hour,
  //       UpperBoundMin: event.timeRange.upperBound.min,
  //     },
  //     Region: {
  //       Locations: event.region.map((latLong) => {
  //         return {
  //           Latitude: latLong.lat,
  //           Longitude: latLong.long
  //         }
  //       })
  //     }
  //   }

  //   console.log("Model JSON:");
  //   console.log(modelJson);
  //   return modelJson;
  // }

  // Only sets values that have changed. If not changed on the incoming json, existing event 
  // values will persist.
  setEventValues = (changeJson) => {
    this.logIfDebug("setEventValues:");
    this.logIfDebug("    changeJson:");
    this.logIfDebug(changeJson);

    let eventState = this.state.event;
    let newEvent = this.emptyEvent();

    // Id, RevisionId, RevisionDateTime, and RevisionAuthor will be handled by the server.
    newEvent.Id = changeJson.Id !== undefined ? changeJson.Id : eventState.Id;
    newEvent.Revision = changeJson.Revision !== undefined ? changeJson.Revision : eventState.Revision;
    newEvent.RevisionDateTime = changeJson.RevisionDateTime !== undefined ? changeJson.RevisionDateTime : eventState.RevisionDateTime;
    newEvent.RevisionAuthor = changeJson.RevisionAuthor !== undefined ? changeJson.RevisionAuthor : eventState.RevisionAuthor;
    newEvent.Predecessor = changeJson.Predecessor !== undefined ? changeJson.Predecessor : eventState.Predecessor;
    newEvent.Title = changeJson.Title !== undefined ? changeJson.Title : eventState.Title;
    newEvent.ImageFilePath = changeJson.ImageFilePath !== undefined ? changeJson.ImageFilePath : eventState.ImageFilePath;
    newEvent.Summary = changeJson.Summary !== undefined ? changeJson.Summary : eventState.Summary;
    newEvent.TimeLowerBoundYear = changeJson.TimeLowerBoundYear !== undefined ? changeJson.TimeLowerBoundYear : eventState.TimeLowerBoundYear;
    newEvent.TimeLowerBoundMonth = changeJson.TimeLowerBoundMonth !== undefined ? changeJson.TimeLowerBoundMonth : eventState.TimeLowerBoundMonth;
    newEvent.TimeLowerBoundDay = changeJson.TimeLowerBoundDay !== undefined ? changeJson.TimeLowerBoundDay : eventState.TimeLowerBoundDay;
    newEvent.TimeLowerBoundHour = changeJson.TimeLowerBoundHour !== undefined ? changeJson.TimeLowerBoundHour : eventState.TimeLowerBoundHour;
    newEvent.TimeLowerBoundMin = changeJson.TimeLowerBoundMin !== undefined ? changeJson.TimeLowerBoundMin : eventState.TimeLowerBoundMin;
    newEvent.TimeUpperBoundYear = changeJson.TimeUpperBoundYear !== undefined ? changeJson.TimeUpperBoundYear : eventState.TimeUpperBoundYear;
    newEvent.TimeUpperBoundMonth = changeJson.TimeUpperBoundMonth !== undefined ? changeJson.TimeUpperBoundMonth : eventState.TimeUpperBoundMonth;
    newEvent.TimeUpperBoundDay = changeJson.TimeUpperBoundDay !== undefined ? changeJson.TimeUpperBoundDay : eventState.TimeUpperBoundDay;
    newEvent.TimeUpperBoundHour = changeJson.TimeUpperBoundHour !== undefined ? changeJson.TimeUpperBoundHour : eventState.TimeUpperBoundHour;
    newEvent.TimeUpperBoundMin = changeJson.TimeUpperBoundMin !== undefined ? changeJson.TimeUpperBoundMin : eventState.TimeUpperBoundMin;
    newEvent.Locations = changeJson.Locations !== undefined ? changeJson.Locations : eventState.Locations;
    newEvent.Sources = changeJson.Sources !== undefined ? changeJson.Sources : eventState.Sources;

    this.logIfDebug("    newEvent:");
    this.logIfDebug(newEvent);

    this.setState({
      event: newEvent,
    });
  }




  errorCheckTitleOk = () => {
    let errMsg = null;
    if (this.state.event.titleText.length === 0) {
      errMsg = `Must be at least '${this.state.titleMinLen}' characters.`;
    }
    else if (this.state.event.titleText.length > this.state.titleMaxLen) {
      errMsg = `Must be less than '${this.state.titleMaxLen}' characters.`;
    }

    this.setState({
      errMsgs: {
        ...this.state.errMsgs,
        eventTitleErrMsg: errMsg
      }
    });

    this.logIfDebug(`errorCheckTitleOk: '${errMsg === null ? "Ok" : errMsg}'`);

    // Ok if no error.
    return errMsg === null;
  }

  errorCheckImageFilePathOk = () => {
    //??anything? we don't enter the file path manually, so is there any source of error??
    let errMsg = null;
    // if (this.state.event.imageFilePath.length > this.state.imageFilePathMaxLen) {
    //   errMsg = `Must be less than '${this.state.imageFilePathMaxLen} characters.`;
    // }

    this.setState({
      errMsgs: {
        ...this.state.errMsgs,
        eventImgErrMsg: errMsg
      }
    });

    this.logIfDebug(`errorCheckImageFilePathOk: '${errMsg === null ? "Ok" : errMsg}'`);

    // Ok if no error.
    return errMsg === null;
  }

  errorCheckTimeRangeOk = () => {
    let errMsg = null;
    if (this.state.event.timeRange.lowerBound.year === null || this.state.event.timeRange.upperBound.year === null) {
      errMsg = "Must select both upper and lower time boundaries.";
    }

    this.setState({
      errMsgs: {
        ...this.state.errMsgs,
        eventWhenErrMsg: errMsg
      }
    });

    this.logIfDebug(`errorCheckTimeRangeOk: '${errMsg === null ? "Ok" : errMsg}'`);

    // Ok if no error.
    return errMsg === null;
  }

  errorCheckRegionOk = () => {
    let errMsg = null;
    if (this.state.event.region.length === 0) {
      errMsg = "Must select at least one location.";
    }

    this.setState({
      errMsgs: {
        ...this.state.errMsgs,
        eventRegionErrMsg: errMsg
      }
    });

    this.logIfDebug(`errorCheckRegionOk: '${errMsg === null ? "Ok" : errMsg}'`);

    // Ok if no error.
    return errMsg === null;
  }

  errorCheckSummaryOk = () => {
    let errMsg = null;
    if (this.state.event.summaryText.length < this.state.summaryTextMinLen) {
      errMsg = `Must be at least '${this.state.summaryTextMinLen}' characters.`;
    }
    else if (this.state.event.summaryText.length > this.state.summaryTextMaxLen) {
      errMsg = `Must be at less than '${this.state.summaryTextMaxLen}' characters.`;
    }

    this.setState({
      errMsgs: {
        ...this.state.errMsgs,
        eventSummaryErrMsg: errMsg
      }
    });

    this.logIfDebug(`errorCheckSummaryOk: '${errMsg === null ? "Ok" : errMsg}'`);

    // Ok if no error.
    return errMsg === null;
  }

  errorCheckAllOk = () => {
    this.logIfDebug("errorCheckAllOk:");

    this.errorCheckTitleOk();
    this.errorCheckImageFilePathOk();
    this.errorCheckTimeRangeOk();
    this.errorCheckRegionOk();
    this.errorCheckSummaryOk();
  }

  getSelectedEvent = (eventId) => {
    this.logIfDebug(`getSelectedEvent: '${eventId}'`);

    fetch(`${variables.API_URL}Event/Get/${eventId}`)
      .then(response => response.json())
      .then(eventJson => {
        let convertedJson = this.convertFromModelJson(eventJson);
        this.setEventValues(convertedJson);
        this.errorCheckAllOk();
      });
  }

  getEventOfTheDay = () => {
    this.logIfDebug("getEventOfTheDay:");

    fetch(`${variables.API_URL}Event/GetEventOfTheDay`)
      .then(response => response.json())
      .then(eventJson => {
        let convertedJson = this.convertFromModelJson(eventJson);
        this.setEventValues(convertedJson);
        this.errorCheckAllOk();
      });
    this.logIfDebug(this.state);
  }

  componentDidMount() {
    this.logIfDebug("componentDidMount:");

    // this.getEventOfTheDay();
    this.getSelectedEvent("be9aa2f5-1569-4a8e-b31f-08dae5392545");

    this.setState({
      startingEvent: this.state.event
    });
  }

  turnOnEditMode = () => {
    this.logIfDebug("turnOnEditMode:");
    this.setState({
      ...this.state,
      editMode: true
    });
  }

  startNewEdit = () => {

  }

  submitChanges = () => {
    this.logIfDebug("submitChanges:");
    this.logIfDebug("turning off edit mode");

    // // Upload new images (if they exist).
    // // Note: The file object is only able to be generated by the file selector in the 
    // // "select image" modal, and it is only set in the event's image {} if the user submits their
    // // selection, so if this file object is _not_ null, then the user has selected a new image 
    // // for uploading.
    // if (this.state.event.image.file !== null) {
    //   // New image. Need to upload.
    //   const formData = new FormData();
    //   formData.append("formFile", this.state.event.image.file, this.state.event.image.file.name);
    //   fetch(`${variables.API_URL}Event/SaveImage`, {
    //     method: "POST",
    //     body: formData
    //   })
    //     .then(result => result.json(), (error) => {
    //       console.log("Error:");
    //       console.log(error);
    //       alert("Failed image upload");
    //     })
    //     .then(savedImageName => {
    //       console.log("image upload return data:");
    //       console.log(savedImageName);

    //       // Save the returned path.
    //       this.setState({
    //         ...this.state,
    //         event: {
    //           ...this.state.event,
    //           image: {
    //             ...this.state.event.image,
    //             dataSrc: savedImageName
    //           }
    //         }
    //       })
    //     });
    // }

    console.log("Post-image-upload state:");
    console.log(this.state.event);

    // Upload the rest of the event data.
    fetch(`${variables.API_URL}Event/Update`, {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      // body: JSON.stringify(this.convertToModelJson())
      body: JSON.stringify({
        RevisionId: 1,
        RevisionDateTime: "2022-12-06",
        RevisionAuthor: "Johnson",
        EventId: 1,
        Title: "The thing",
        ImageFilePath: "my path",
        Summary: "this is the summary",
        TimeRange: {
          LowerBoundYear: 1,
          LowerBoundMonth: 2,
          LowerBoundDay: 3,
          LowerBoundHour: 4,
          LowerBoundMin: 5,
          UpperBoundYear: 6,
          UpperBoundMonth: 7,
          UpperBoundDay: 8,
          UpperBoundHour: 9,
          UpperBoundMin: 10,
        },
        Region: {
          Locations: [
            {
              Latitude: 1.23,
              Longitude: 4.56
            }
          ]
        }
      })
    })
      .then(result => result.json())
      .then(result => {
        console.log("Event update return data:");
        console.log(result);
      }, error => {
        console.log("ERROR: failed to parse event update return data to JSON.");
        console.log(error);
        alert("Event update failed");
      });

    this.setState({
      ...this.state,
      editMode: false,
      startingEvent: this.state.event
    });
  }

  cancelChanges = () => {
    this.logIfDebug("cancelChanges:");
    this.logIfDebug("turning off edit mode");

    this.setState({
      ...this.state,
      editMode: false,
      event: this.state.startingEvent
    });
  }

  titleHtml = () => {
    this.logIfDebug("titleHtml:");

    const onTitleChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onTitleChanged: '${value}'`);

      this.setEventValues({ titleText: value });
      this.errorCheckTitleOk();
    };

    return (
      <div className="display-title-container">
        {/* Data */}
        <div className="display-title-text-container">
          {this.state.editMode === false ?
            <span>
              {this.state.event.titleText}
            </span>
            :
            <input type="text" className="form-control" value={this.state.event.titleText} onChange={onTitleChanged} />
          }
        </div>

        {/* Error */}
        <div className="display-title-err-container">
          <span className="err-msg">{this.state.errMsgs.eventTitleErrMsg}</span>
        </div>
      </div>
    );
  }

  timeRangeHtml = () => {
    this.logIfDebug("timeRangeHtml:");

    const onLowerBoundYearChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onLowerBoundYearChange: '${value}'`);

      this.setEventValues({ timeRange: { lowerBound: { year: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onLowerBoundMonthChanged = (changeEvent) => {
      let value = changeEvent.target.value
      this.logIfDebug(`onLowerBoundYearChange: '${value}'`);

      this.setEventValues({ timeRange: { lowerBound: { month: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onLowerBoundDayChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onLowerBoundDayChanged: '${value}'`);

      this.setEventValues({ timeRange: { lowerBound: { day: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onLowerBoundHourChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onLowerBoundHourChanged: '${value}'`);

      this.setEventValues({ timeRange: { lowerBound: { hour: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onLowerBoundMinChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onLowerBoundMinChanged: '${value}'`);

      this.setEventValues({ timeRange: { lowerBound: { min: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onUpperBoundYearChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onUpperBoundYearChange: '${value}'`);

      this.setEventValues({ timeRange: { upperBound: { year: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onUpperBoundMonthChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onUpperBoundYearChange: '${value}'`);

      this.setEventValues({ timeRange: { upperBound: { month: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onUpperBoundDayChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onUpperBoundDayChanged: '${value}'`);

      this.setEventValues({ timeRange: { upperBound: { day: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onUpperBoundHourChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onUpperBoundHourChanged: '${value}'`);

      this.setEventValues({ timeRange: { upperBound: { hour: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onUpperBoundMinChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onUpperBoundMinChanged: '${value}'`);

      this.setEventValues({ timeRange: { upperBound: { min: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const timePrettyStr = (year, month, day, hour, min) => {
      let dateStr = null;
      if (year !== null && month !== null && day !== null) {
        dateStr = `${year}/${month}/${day}`;
      }
      else if (year !== null && month !== null) {
        dateStr = `${year}/${month}`;
      }
      else {
        // Note: Year should never be null, so don't bother to check.
        // Also Note: Don't bother checking the combination of year != null, month == null, and 
        // day != null. Having a day without a month would be very silly.
        dateStr = `${year}`
      }

      let timeWithLeadingZeros = (num) => {
        return num < 10 ? `0${num}` : `${num}`
      };

      let timeStr = null;
      if (hour !== null && min !== null) {
        timeStr = `${timeWithLeadingZeros(hour)}:${timeWithLeadingZeros(min)}`
      }
      else if (hour !== null) {
        timeStr = `${timeWithLeadingZeros(hour)}`
      }

      this.logIfDebug(`timePrettyStr: dateStr: '${dateStr}', timeStr: '${timeStr}'`);
      return timeStr === null ? dateStr : `${dateStr} ${timeStr}`
    }

    let lowerBound = this.state.event.timeRange.lowerBound;
    let lowerBoundText = timePrettyStr(lowerBound.year, lowerBound.month, lowerBound.day, lowerBound.hour, lowerBound.min);
    this.logIfDebug(`lowerBoundText: '${lowerBoundText}'`);

    let upperBound = this.state.event.timeRange.upperBound;
    let upperBoundText = timePrettyStr(upperBound.year, upperBound.month, upperBound.day, upperBound.hour, upperBound.min);
    this.logIfDebug(`upperBoundText: '${upperBoundText}'`);

    return (
      <div className="display-when-container">
        {/* Header */}
        <div>
          <span className="when-info-header">
            Year/month/day (24hour):minute
          </span>
        </div>

        {/* Data */}
        {this.state.editMode === false ?
          <div style={{ overflow: "hidden" }}>
            <span className="float-start">{lowerBoundText}</span>
            <span className="float-end">{upperBoundText}</span>
          </div>
          :
          // Two columns side by side.
          <div style={{ position: "relative", overflow: "hidden" }}>
            <table className="table table-striped" style={{ tableLayout: "fixed", width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ width: "20%" }}></th>
                  <th style={{ width: "40%" }}>Upper bound</th>
                  <th style={{ width: "40%" }}>Lower bound</th>
                </tr>
              </thead>
              <tbody>
                {/* Year */}
                <tr>
                  <td>
                    <span>Year</span>
                  </td>
                  <td>
                    <input type="text" className="form-control" style={{ width: "100%" }} value={lowerBound.year === null ? "" : lowerBound.year} onChange={onLowerBoundYearChanged} />
                  </td>
                  <td>
                    <input type="text" className="form-control" style={{ width: "100%" }} value={upperBound.year === null ? "" : upperBound.year} onChange={onUpperBoundYearChanged} />
                  </td>
                </tr>

                {/* Month */}
                <tr>
                  <td>
                    <span>Month</span>
                  </td>
                  <td>
                    <input type="text" className="form-control" style={{ width: "100%" }} value={lowerBound.month === null ? "" : lowerBound.month} onChange={onLowerBoundMonthChanged} />
                  </td>
                  <td>
                    <input type="text" className="form-control" style={{ width: "100%" }} value={upperBound.month === null ? "" : upperBound.month} onChange={onUpperBoundMonthChanged} />
                  </td>
                </tr>

                {/* Day */}
                <tr>
                  <td>
                    <span>Day</span>
                  </td>
                  <td>
                    <input type="text" className="form-control" style={{ width: "100%" }} value={lowerBound.day === null ? "" : lowerBound.day} onChange={onLowerBoundDayChanged} />
                  </td>
                  <td>
                    <input type="text" className="form-control" style={{ width: "100%" }} value={upperBound.day === null ? "" : upperBound.day} onChange={onUpperBoundDayChanged} />
                  </td>
                </tr>

                {/* Hour */}
                <tr>
                  <td>
                    <span>Hour</span>
                  </td>
                  <td>
                    <input type="text" className="form-control" style={{ width: "100%" }} value={lowerBound.hour === null ? "" : lowerBound.hour} onChange={onLowerBoundHourChanged} />
                  </td>
                  <td>
                    <input type="text" className="form-control" style={{ width: "100%" }} value={upperBound.hour === null ? "" : upperBound.hour} onChange={onUpperBoundHourChanged} />
                  </td>
                </tr>

                {/* Min */}
                <tr>
                  <td>
                    <span>Min</span>
                  </td>
                  <td>
                    <input type="text" className="form-control" style={{ width: "100%" }} value={lowerBound.min === null ? "" : lowerBound.min} onChange={onLowerBoundMinChanged} />
                  </td>
                  <td>
                    <input type="text" className="form-control" style={{ width: "100%" }} value={upperBound.min === null ? "" : upperBound.min} onChange={onUpperBoundMinChanged} />
                  </td>
                </tr>

              </tbody>
            </table>
          </div>
        }

        {/* Error */}
        <div className="event-when-err-container">
          <span className="err-msg">
            {this.state.errMsgs.eventWhenErrMsg}
          </span>
        </div>
      </div>
    );
  }

  imageHtml = () => {
    this.logIfDebug("imageHtml:")

    const showSelectImageModal = () => {
      this.logIfDebug("showSelectImageModal:");
      this.setState({
        selectImageModal: {
          ...this.state.selectImageModal,
          visible: true
        }
      });
    };

    // Thanks for react-bootstrap for this demo code. I've modified it to work in classes (replace 
    // "React.useState(...)" with "this.state.<property>"") and for my application.
    // Source:
    //  https://react-bootstrap.github.io/components/modal/
    // Note: For some reason has to use the "= () => {...}" syntax instead of normal function 
    // syntax in order for the "this" to work in the callbacks...??why u do this javascript??.
    const SelectImageModal = () => {
      this.logIfDebug("selectImageModal:");

      // Convert the uploaded image object to dataUrl so that it can be easily used in an image 
      // src, and also save the original file for later so that it can be sent to the server.
      const tempImageUpload = (event) => {
        const reader = new FileReader();

        // After the file is converted to dataUrl, save both so that the file can be sent to the 
        // server (if the user submits it) and so that the temp image can be displayed on the 
        // main event display.
        reader.addEventListener("load", () => {
          this.setState({
            selectImageModal: {
              ...this.state.selectImageModal,
              uploadedFile: event.target.files[0],
              uploadedDataSrc: reader.result
            }
          });
        });

        // Convert the file to dataUrl.
        reader.readAsDataURL(event.target.files[0]);
      }

      const cancelSelectImage = () => {
        this.logIfDebug("cancelSelectImage:");

        this.setState({
          // useNewImage: false,
          selectImageModal: {
            visible: false,
            uploadedFile: null,
            uploadedDataSrc: ""
          }
        });
      }

      const submitSelectedImage = () => {
        this.logIfDebug("submitSelectedImage:");

        // Set the event to use the new image, and clean out the modal's state.
        // Note: At the time that this.setState(...) is called, the state has not yet been 
        // changed, and so it is okay to set the modal state to be cleared out while at the same
        // time using the modal state to set other values.
        this.setState({
          event: {
            ...this.state.event,
            image: {
              file: this.state.selectImageModal.uploadedFile,
              dataSrc: this.state.selectImageModal.uploadedDataSrc
            }
          },
          selectImageModal: {
            visible: false,
            uploadedFile: null,
            uploadedDataSrc: ""
          }
        });
      }

      return (
        <Modal show={this.state.selectImageModal.visible} onHide={cancelSelectImage}>
          <Modal.Header closeButton>
            <Modal.Title>Select image</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              {this.state.selectImageModal.uploadedDataSrc !== "" ?
                // Use new values.
                <img width="250px" height="auto" src={this.state.selectImageModal.uploadedDataSrc} alt="ERROR: Bad dataUrl." />
                :
                // No upload yet, so use what the event is using.
                this.state.event.image.dataSrc !== "" ?
                  <img width="250px" height="auto" src={this.state.event.image.dataSrc} alt="ERROR: File does not exist on server." />
                  :
                  <span>
                    No image
                  </span>
              }
            </div>
            <div>
              <input className="m-2" type="file" onChange={tempImageUpload} />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelSelectImage}>
              Cancel
            </Button>

            {/* Only enable submit if data has been uploaded. */}
            {this.state.selectImageModal.uploadedDataSrc === "" ?
              <Button variant="primary" disabled >
                Submit
              </Button>
              :
              <Button variant="primary" onClick={submitSelectedImage} >
                Submit
              </Button>
            }
          </Modal.Footer>
        </Modal>
      );
    }

    const deleteImage = (event) => {
      this.logIfDebug("deleteImage:");
      this.setState({
        event: {
          ...this.state.event,
          image: {
            file: null,
            dataSrc: ""
          }
        }
      });
    }

    return (
      <div className="display-image-container">
        {/* Data */}
        <SelectImageModal />

        {this.state.editMode !== true ?
          // _Not_ edit mode
          this.state.event.image.dataSrc !== "" ?
            // Use image as given by event
            <img className="event-image" src={this.state.event.image.dataSrc} alt="ERROR: File does not exist on server." />
            :
            // No image available. 
            <span>
              No image
            </span>
          :
          // Edit mode
          <>
            {this.state.event.image.dataSrc !== "" ?
              // Use image as given by event
              <>
                <img className="event-image" src={this.state.event.image.dataSrc} alt="ERROR: File does not exist on server." />
                <div className="edit-event-img">
                  <div>
                    <Button variant="primary" className="select-event-img-btn" onClick={showSelectImageModal}>
                      Select image
                    </Button>
                  </div>
                  <div>
                    <Button variant="secondary" onClick={deleteImage} >
                      Delete image
                    </Button>
                  </div>
                </div>
              </>
              :
              // No image available. Only show the "select image" button.
              <Button variant="primary" onClick={showSelectImageModal}>
                Select image
              </Button>
            }
          </>
        }

        {/* Error */}
        <div className="event-image-err-container">
          <span className="err-msg">{this.state.errMsgs.eventImgErrMsg}</span>
        </div>
      </div>
    );
  }

  regionHtml = () => {
    this.logIfDebug("regionHtml:");
    this.logIfDebug(this.state.event.region);
    return (
      <>
        <div>
          {this.state.event.region.map((latLong, index) => (
            // TODO: use string composed of item instead
            // Source:
            //  https://sentry.io/answers/unique-key-prop/
            <div key={index}>
              <span>'{latLong.lat}', '{latLong.long}'</span>
            </div>
          ))}
        </div>

        <div className="event-where-err-container">
          <span className="err-msg">{this.state.errMsgs.eventRegionErrMsg}</span>
        </div>
      </>
    );
  }

  summaryHtml = () => {
    this.logIfDebug("summaryHtml:");

    const onSummaryChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      this.logIfDebug(`onSummaryChanged: '${value}'`);

      this.setEventValues({ summaryText: value });
      this.errorCheckSummaryOk();
    };

    return (
      <div className="display-summary-container">
        {this.state.editMode === false ?
          <span>{this.state.event.summaryText}</span>
          :
          <>
            <input type="text" className="form-control" value={this.state.event.summaryText} onChange={onSummaryChanged} />
            <div className="event-summary-char-count-container">
              <span>{this.state.event.summaryText.length}/{this.state.summaryTextMaxLen}</span>
            </div>
          </>
        }

        <div className="event-summary-err-container">
          <span className="err-msg">{this.state.errMsgs.eventSummaryErrMsg}</span>
        </div>
      </div>
    );
  }

  revisionInfoHtml = () => {
    this.logIfDebug("revisionInfoHtml:");

    // Note: No editing this. This info will be automatically filled out upon submitting a new 
    // entry or editing an existing entry.
    return (
      <>
        <div className="display-revision-info-container">
          <span>
            Last edited by '{this.state.event.revisionAuthor}' on '{this.state.event.revisionDateTime}'.
          </span>
        </div>
      </>
    );
  }

  render() {
    this.logIfDebug("rendering:");

    return (
      <div id="main-container">
        <this.titleHtml />
        <this.timeRangeHtml />
        <this.imageHtml />

        {/* Region
        */}
        <div className="display-where-container">
          <this.regionHtml />
        </div>

        {/* Summary */}
        <this.summaryHtml />

        <this.revisionInfoHtml />

        {/* Edit/(Submit/Cancel) */}
        {/* TODO: let "escape" key also cancel edit mode */}
        {
          this.state.editMode === true ?
            <>
              {/* "Cancel" goes on the far right, and then put "Submit" next, also on the far 
            right, but since the "Cancel" button is already there, "Summary" will end up 
            immediately left of it.
            */}
              <button type="button" className="btn btn-secondary float-end" onClick={this.cancelChanges}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary float-end" onClick={this.submitChanges}>
                Submit
              </button>
            </>
            :
            <>
              <div>
                <button type="button" onClick={this.turnOnEditMode}>
                  Edit
                </button>
                <button type="button" onClick={this.startNewEdit}>
                  Create New
                </button>
              </div>

              {/* TODO: move this button elsewhere (??maybe even the App??) */}
              <button onClick={this.getEventOfTheDay}>
                getEventOfTheDay
              </button>
            </>
        }
      </div >
    );
  }
}
