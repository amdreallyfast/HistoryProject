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

    this.state = {
      editMode: true,

      titleMinLen: 10,
      titleMaxLen: 128,
      imageFilePathMaxLen: 256,
      summaryTextMinLen: 50,
      summaryTextMaxLen: 2048,

      selectImageModalVisible: false,
      defaultImagePath: variables.PHOTO_URL + "anonymous.png",
      selectImageTempStorageName: "selectImageTempStorage",

      errMsgs: {
        eventTitleErrMsg: null,
        eventImgErrMsg: null,
        eventSummaryErrMsg: null,
        eventWhenErrMsg: null,
        eventRegionErrMsg: null,
        eventRevisionInfoErrMsg: null,
      },

      event: {
        titleText: "",
        imageFilePath: "",
        summaryText: "",
        timeRange: {
          lowerBound: {
            year: 0,
            month: null,
            day: null,
            hour: null,
            min: null,
          },
          upperBound: {
            year: 0,
            month: null,
            day: null,
            hour: null,
            min: null,
          }
        },
        region: [],
        revisionDateTime: null,
        revisionAuthor: null,
      },

      startingEvent: null,
    }
  }

  convertEventJsonFromModelToFrontend = (eventJson) => {
    return {
      titleText: eventJson.Title,
      imageFilePath: eventJson.ImageFilePath,
      summaryText: eventJson.Summary,
      timeRange: {
        lowerBound: {
          year: eventJson.TimeRange.LowerBoundYear,
          month: eventJson.TimeRange.LowerBoundMonth,
          day: eventJson.TimeRange.LowerBoundDay,
          hour: eventJson.TimeRange.LowerBoundHour,
          min: eventJson.TimeRange.LowerBoundMin,
        },
        upperBound: {
          year: eventJson.TimeRange.UpperBoundYear,
          month: eventJson.TimeRange.UpperBoundMonth,
          day: eventJson.TimeRange.UpperBoundDay,
          hour: eventJson.TimeRange.UpperBoundHour,
          min: eventJson.TimeRange.UpperBoundMin,
        }
      },
      region: eventJson.Region.Locations.map((item) => {
        return {
          lat: item.Latitude,
          long: item.Longitude
        }
      }),
      revisionDateTime: eventJson.RevisionDateTime,
      revisionAuthor: eventJson.RevisionAuthor,
    }
  }

  // Only sets values that have changed. If not changed on the incoming json, existing event 
  // values will persist.
  setEventValues = (eventJson) => {
    console.log("setEventValues:");
    console.log(eventJson);

    let eventState = this.state.event;
    let newEvent = {};
    newEvent.titleText = eventJson.titleText !== undefined ? eventJson.titleText : eventState.titleText;
    newEvent.imageFilePath = eventJson.imageFilePath !== undefined ? eventJson.imageFilePath : eventState.imageFilePath;
    newEvent.summaryText = eventJson.summaryText !== undefined ? eventJson.summaryText : eventState.summaryText;

    // Time range
    if (eventJson.timeRange === undefined) {
      newEvent.timeRange = eventState.timeRange;
    }
    else {
      newEvent.timeRange = {};

      let jsonLowerBound = eventJson.timeRange.lowerBound;
      let stateLowerBound = eventState.timeRange.lowerBound;
      if (jsonLowerBound === undefined) {
        newEvent.timeRange.lowerBound = stateLowerBound;
      }
      else {
        newEvent.timeRange.lowerBound = {
          year: jsonLowerBound.year !== undefined ? jsonLowerBound.year : stateLowerBound.year,
          month: jsonLowerBound.month !== undefined ? jsonLowerBound.month : stateLowerBound.month,
          day: jsonLowerBound.day !== undefined ? jsonLowerBound.day : stateLowerBound.day,
          hour: jsonLowerBound.hour !== undefined ? jsonLowerBound.hour : stateLowerBound.hour,
          min: jsonLowerBound.min !== undefined ? jsonLowerBound.min : stateLowerBound.min,
        }
      }

      let jsonUpperBound = eventJson.timeRange.upperBound;
      let stateUpperBound = eventState.timeRange.upperBound;
      if (jsonUpperBound === undefined) {
        newEvent.timeRange.upperBound = stateUpperBound;
      }
      else {
        newEvent.timeRange.upperBound = {
          year: jsonUpperBound.year !== undefined ? jsonUpperBound.year : stateUpperBound.year,
          month: jsonUpperBound.month !== undefined ? jsonUpperBound.month : stateUpperBound.month,
          day: jsonUpperBound.day !== undefined ? jsonUpperBound.day : stateUpperBound.day,
          hour: jsonUpperBound.hour !== undefined ? jsonUpperBound.hour : stateUpperBound.hour,
          min: jsonUpperBound.min !== undefined ? jsonUpperBound.min : stateUpperBound.min,
        }
      }
    }

    // Region
    if (eventJson.region === undefined) {
      newEvent.region = eventState.region;
    }
    else {
      newEvent.region = eventJson.region;
    }

    // newEvent.region = eventJson.region.length !== 0 ? eventJson.region : eventState.region;
    newEvent.revisionDateTime = eventJson.revisionDateTime !== undefined ? eventJson.revisionDateTime : eventState.revisionDateTime;
    newEvent.revisionAuthor = eventJson.revisionAuthor !== undefined ? eventJson.revisionAuthor : eventState.revisionAuthor;

    this.setState({
      event: newEvent,
      startingEvent: newEvent
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

    console.log(`errorCheckTitleOk: '${errMsg === null ? "Ok" : errMsg}'`);

    // Ok if no error.
    return errMsg === null;
  }

  errorCheckImageFilePathOk = () => {
    let errMsg = null;
    if (this.state.event.imageFilePath.length > this.state.imageFilePathMaxLen) {
      errMsg = `Must be less than '${this.state.imageFilePathMaxLen} characters.`;
    }

    this.setState({
      errMsgs: {
        ...this.state.errMsgs,
        eventImgErrMsg: errMsg
      }
    });

    console.log(`errorCheckImageFilePathOk: '${errMsg === null ? "Ok" : errMsg}'`);

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

    console.log(`errorCheckTimeRangeOk: '${errMsg === null ? "Ok" : errMsg}'`);

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

    console.log(`errorCheckRegionOk: '${errMsg === null ? "Ok" : errMsg}'`);

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

    console.log(`errorCheckSummaryOk: '${errMsg === null ? "Ok" : errMsg}'`);

    // Ok if no error.
    return errMsg === null;
  }

  errorCheckAllOk = () => {
    console.log("errorCheckAllOk:");

    this.errorCheckTitleOk();
    this.errorCheckImageFilePathOk();
    this.errorCheckTimeRangeOk();
    this.errorCheckRegionOk();
    this.errorCheckSummaryOk();
  }

  getSelectedEvent = (eventId) => {
    console.log(`getSelectedEvent: '${eventId}'`);

    fetch(`${variables.API_URL}Event/Get/${eventId}`)
      .then(response => response.json())
      .then(eventJson => {
        let convertedJson = this.convertEventJsonFromModelToFrontend(eventJson);
        this.setEventValues(convertedJson);
        this.errorCheckAllOk();
      });
  }

  getEventOfTheDay = () => {
    console.log("getEventOfTheDay:");

    fetch(`${variables.API_URL}Event/GetEventOfTheDay`)
      .then(response => response.json())
      .then(eventJson => {
        let convertedJson = this.convertEventJsonFromModelToFrontend(eventJson);
        this.setEventValues(convertedJson);
        this.errorCheckAllOk();
      });
    console.log(this.state);
  }

  componentDidMount() {
    console.log("componentDidMount:");

    // this.getEventOfTheDay();
    this.getSelectedEvent("be9aa2f5-1569-4a8e-b31f-08dae5392545");
  }

  turnOnEditMode = () => {
    console.log("turnOnEditMode:");
    this.setState({
      ...this.state,
      editMode: true
    });
  }

  submitChanges = () => {
    // console.log("submitChanges:");
    // console.log("turning off edit mode");

    // TODO: save image
    if (this.state.event.imageFilePath !== this.state.startingEvent.imageFilePath) {
      // New image. Need to upload.
      // Note: New images should be stored in session storage as a dataUrl. Convert that to a blob and send it.

    }
    // TODO: save event

    this.setState({
      ...this.state,
      editMode: false,
      startingEvent: this.state.event
    });
  }

  cancelChanges = () => {
    // console.log("cancelChanges:");
    // console.log("turning off edit mode");

    this.setState({
      ...this.state,
      editMode: false,
      event: this.state.startingEvent
    });
  }

  titleHtml = () => {
    console.log("titleHtml:");

    const onTitleChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onTitleChanged: '${value}'`);

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
    console.log("timeRangeHtml:");

    const onLowerBoundYearChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onLowerBoundYearChange: '${value}'`);

      this.setEventValues({ timeRange: { lowerBound: { year: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onLowerBoundMonthChanged = (changeEvent) => {
      let value = changeEvent.target.value
      console.log(`onLowerBoundYearChange: '${value}'`);

      this.setEventValues({ timeRange: { lowerBound: { month: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onLowerBoundDayChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onLowerBoundDayChanged: '${value}'`);

      this.setEventValues({ timeRange: { lowerBound: { day: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onLowerBoundHourChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onLowerBoundHourChanged: '${value}'`);

      this.setEventValues({ timeRange: { lowerBound: { hour: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onLowerBoundMinChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onLowerBoundMinChanged: '${value}'`);

      this.setEventValues({ timeRange: { lowerBound: { min: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onUpperBoundYearChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onUpperBoundYearChange: '${value}'`);

      this.setEventValues({ timeRange: { upperBound: { year: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onUpperBoundMonthChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onUpperBoundYearChange: '${value}'`);

      this.setEventValues({ timeRange: { upperBound: { month: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onUpperBoundDayChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onUpperBoundDayChanged: '${value}'`);

      this.setEventValues({ timeRange: { upperBound: { day: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onUpperBoundHourChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onUpperBoundHourChanged: '${value}'`);

      this.setEventValues({ timeRange: { upperBound: { hour: value === "" ? null : value } } });
      this.errorCheckTimeRangeOk();
    };

    const onUpperBoundMinChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onUpperBoundMinChanged: '${value}'`);

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

      console.log(`timePrettyStr: dateStr: '${dateStr}', timeStr: '${timeStr}'`);
      return timeStr === null ? dateStr : `${dateStr} ${timeStr}`
    }

    let lowerBound = this.state.event.timeRange.lowerBound;
    let lowerBoundText = timePrettyStr(lowerBound.year, lowerBound.month, lowerBound.day, lowerBound.hour, lowerBound.min);
    console.log(`lowerBoundText: '${lowerBoundText}'`);

    let upperBound = this.state.event.timeRange.upperBound;
    let upperBoundText = timePrettyStr(upperBound.year, upperBound.month, upperBound.day, upperBound.hour, upperBound.min);
    console.log(`upperBoundText: '${upperBoundText}'`);

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
    console.log("imageHtml:")

    const showSelectImageModal = () => {
      // console.log("showSelectImageModal:");
      this.setState({
        selectImageModalVisible: true,
      });
    };

    const hideSelectImageModal = () => {
      // console.log("hideSelectImageModal:");
      this.setState({
        selectImageModalVisible: false,
      });
    }

    // Thanks for react-bootstrap for this demo code. I've modified it to work in classes (replace 
    // "React.useState(...)" with "this.state.<property>"") and for my application.
    // Source:
    //  https://react-bootstrap.github.io/components/modal/
    // Note: For some reason has to use the "= () => {...}" syntax instead of normal function 
    // syntax in order for the "this" to work in the callbacks...??why u do this javascript??.
    const SelectImageModal = () => {
      // console.log("selectImageModal:");

      // Adapted from:
      //  - How to Save Images to Local/Session Storage - JavaScript Tutorial
      //    https://www.youtube.com/watch?v=8K2ihr3NC40
      //  - https://www.w3schools.com/html/html5_webstorage.asp
      const tempImageUpload = (event) => {
        // Upload to HTML5 web storage (for current session only!).
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          sessionStorage.setItem(this.state.selectImageTempStorageName, reader.result);
          document.getElementById("modalSelectImagePreview").setAttribute("src", reader.result);
          document.getElementById("submitSelectImageBtn").removeAttribute("disabled");
        })
        reader.readAsDataURL(event.target.files[0]);
      }

      const cancelSelectImage = () => {
        console.log("cancelSelectImage:");

        // Restore original imageFilePath (just in case it changed).
        this.setState({
          event: {
            ...this.state.event,
            imageFilePath: this.state.startingEvent.imageFilePath
          }
        });

        hideSelectImageModal();
      }

      const submitSelectImage = () => {
        console.log("confirmImageUpload:");

        // Record something in the state to flag that the temp image needs to be accessed.
        this.setState({
          event: {
            ...this.state.event,
            imageFilePath: this.state.selectImageTempStorageName
          }
        });

        hideSelectImageModal();
      }

      return (
        <Modal show={this.state.selectImageModalVisible} onHide={cancelSelectImage}>
          <Modal.Header closeButton>
            <Modal.Title>Select image</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <div>
              {this.state.event.imageFilePath === this.state.selectImageTempStorageName ?
                <img width="250px" height="auto" id="selectImagePreview" src={sessionStorage.getItem(this.state.selectImageTempStorageName)} alt="No image selected." />
                :
                <img width="250px" height="auto" id="modalSelectImagePreview" src={variables.PHOTO_URL + this.state.event.imageFilePath} alt="No image selected." />
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

            <Button variant="primary" onClick={submitSelectImage} id="submitSelectImageBtn" disabled>
              Submit
            </Button>
          </Modal.Footer>
        </Modal>
      );
    }

    const deleteImage = (event) => {
      // console.log("deleteImage:");
      this.setState({
        event: {
          ...this.state.event,
          imageFilePath: ""
        }
      });
    }

    const WithNoImageHtml = () => {
      return this.state.editMode === true ?
        // Only show the "select image" button.
        <Button variant="primary" onClick={showSelectImageModal}>
          Select image
        </Button>
        :
        // Not in edit mode => simple message.
        <span>
          No image
        </span>
    }

    const WithImageHtml = () => {
      return this.state.editMode === true ?
        // Show the image with the "select image" button in the center.
        <>
          {this.state.event.imageFilePath === this.state.selectImageTempStorageName ?
            <img className="event-image" src={sessionStorage.getItem(this.state.selectImageTempStorageName)} alt="If you're seeing this, then the event could not be loaded. BADBADBADPANIC!!" />
            :
            <img className="event-image" src={variables.PHOTO_URL + this.state.event.imageFilePath} alt="If you're seeing this, then the event could not be loaded. BADBADBADPANIC!!" />
          }

          <div className="edit-event-img">
            <Button variant="primary" className="select-event-img-btn" onClick={showSelectImageModal}>
              Select image
            </Button>
            <Button variant="secondary" onClick={deleteImage}>
              Delete image
            </Button>
          </div>
        </>
        :
        // Not in edit mode => only show image.
        <img
          className="event-image"
          src={variables.PHOTO_URL + this.state.event.imageFilePath}
          alt="If you're seeing this, then the event could not be loaded. BADBADBADPANIC!!">
        </img>
    }

    return (
      <div className="display-image-container">
        {/* Data */}
        <SelectImageModal />
        {this.state.event.imageFilePath === "" ?
          <WithNoImageHtml />
          :
          <WithImageHtml />
        }

        {/* Error */}
        <div className="event-image-err-container">
          <span className="err-msg">{this.state.errMsgs.eventImgErrMsg}</span>
        </div>
      </div>
    );
  }

  regionHtml = () => {
    console.log("regionHtml:");
    // console.log(this.state.event.region);
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
    console.log("summaryHtml:");

    const onSummaryChanged = (changeEvent) => {
      let value = changeEvent.target.value;
      console.log(`onSummaryChanged: '${value}'`);

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
    console.log("revisionInfoHtml:");

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
    console.log("rendering:");

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
              <button type="button" onClick={this.turnOnEditMode}>
                Edit
              </button>

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
