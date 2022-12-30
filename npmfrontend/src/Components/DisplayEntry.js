import "./DisplayEntry.css"
import React, { Component } from "react";
import { variables } from "../Variables";
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

// TODO: delete: if (window.confirm('Are you sure?')) { <do the fetch> }

export class DisplayEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,

      titleMinLen: 10,
      titleMaxLen: 128,
      imageFilePathMaxLen: 256,
      summaryTextMinLen: 50,
      summaryTextMaxLen: 2048,

      selectImageModalVisible: false,
      defaultImagePath: variables.PHOTO_URL + "anonymous.png",

      // TODO: switch "" -> null; null would be preferred rather than requiring the generation of a new string object
      // TODO: also switch 0 -> null because some time elements ( hour, min) can be 0. "Missing data" should be null.
      errMsgs: {
        eventTitleErrMsg: "title error message",
        eventImgErrMsg: "image error message",
        eventSummaryErrMsg: "summary error message",
        eventWhenErrMsg: "when error message",
        eventRegionErrMsg: "region error message",
        eventRevisionInfoErrMsg: "revision info error message",
      },

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
            Min: 0,
          },
          upperBound: {
            Year: 0,
            Month: 0,
            Day: 0,
            Hour: 0,
            Mon: 0,
          }
        },
        region: [],
        revisionDateTime: "",
        revisionAuthor: "",
      }
    }
  }

  setEvent = (eventJson) => {
    console.log("setting event:");
    console.log(eventJson);

    this.setState({
      ...this.state,
      event: {
        // Don't need to preserve any exist eventJson state. Everything will be overwritten by 
        // the incoming object.
        titleText: eventJson.Title,
        imageFilePath: eventJson.ImageFilePath,
        summaryText: eventJson.Summary,
        timeRange: {
          lowerBound: {
            Year: eventJson.TimeRange.LowerBoundYear,
            Month: eventJson.TimeRange.LowerBoundMonth,
            Day: eventJson.TimeRange.LowerBoundDay,
            Hour: eventJson.TimeRange.LowerBoundHour,
            Min: eventJson.TimeRange.LowerBoundMin,
          },
          upperBound: {
            Year: eventJson.TimeRange.UpperBoundYear,
            Month: eventJson.TimeRange.UpperBoundMonth,
            Day: eventJson.TimeRange.UpperBoundDay,
            Hour: eventJson.TimeRange.UpperBoundHour,
            Min: eventJson.TimeRange.UpperBoundMin,
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
    });

    console.log(`title: '${this.state.event.titleText}'`)
    // this.generateWhereHtml();
    // this.generateWhenHtml();
    // this.generateSummaryHtml();
  }

  checkEventForErrors = (eventJson) => {
    console.log("checkEventForErrors:");
    console.log(eventJson);

    // Title
    let titleErrMsg = null;
    if (eventJson.Title.length === 0) {
      titleErrMsg = `Must be at least '${this.state.titleMinLen}' characters.`;
    }
    else if (eventJson.Title.length > this.state.titleMaxLen) {
      titleErrMsg = `Must be less than '${this.state.titleMaxLen}' characters.`;
    }

    // Image file path
    let imgErrMsg = null;
    if (eventJson.ImageFilePath.length > this.state.imageFilePathMaxLen) {
      imgErrMsg = `Must be less than '${this.state.imageFilePathMaxLen} characters.`;
    }

    // Summary
    let summaryErrMsg = null;
    if (eventJson.Summary.length < this.state.summaryTextMinLen) {
      summaryErrMsg = `Must be at least '${this.state.summaryTextMinLen}' characters.`;
    }
    else if (eventJson.Summary.length > this.state.summaryTextMaxLen) {
      summaryErrMsg = `Must be at less than '${this.state.summaryTextMaxLen}' characters.`;
    }

    // Time range
    let whenErrMsg = null;
    if (eventJson.TimeRange.LowerBoundYear === null || eventJson.TimeRange.UpperBoundYear === null) {
      whenErrMsg = "Must select both upper and lower time boundaries.";
    }

    // Region
    let whereErrMsg = null;
    if (eventJson.Region.length === 0) {
      whereErrMsg = "Must select at least one location.";
    }

    // Set the error message.    
    this.setState({
      // ...this.state,
      errMsgs: {
        ...this.state.errMsgs,
        eventTitleErrMsg: titleErrMsg,
        eventImgErrMsg: imgErrMsg,
        eventSummaryErrMsg: summaryErrMsg,
        eventWhenErrMsg: whenErrMsg,
        eventRegionErrMsg: whereErrMsg,
      }
    });
  }

  getSelectedEvent = (eventId) => {
    fetch(`${variables.API_URL}Event/Get/${eventId}`)
      .then(response => response.json())
      .then(eventJson => {
        this.setEvent(eventJson);
        this.checkEventForErrors(eventJson);
      });
  }

  getEventOfTheDay = () => {
    fetch(`${variables.API_URL}Event/GetEventOfTheDay`)
      .then(response => response.json())
      .then(eventJson => {
        this.setEvent(eventJson);
        this.checkEventForErrors(eventJson);
      });
    console.log(this.state)
  }

  componentDidMount() {
    // this.getEventOfTheDay();
    this.getSelectedEvent("be9aa2f5-1569-4a8e-b31f-08dae5392545")
  }

  turnOnEditMode = () => {
    console.log("turning on edit mode")
    this.setState({
      ...this.state,
      editMode: true
    })
  }

  submitChanges = () => {
    // TODO: this

    console.log("submitting changes")
    console.log("turning off edit mode")
    this.setState({
      ...this.state,
      editMode: false
    })
  }

  cancelChanges = () => {
    // TODO: this

    //??just re-fetch? keep a backup event state from when it was loaded and then restore that??
    console.log("cancelling changes")
    console.log("turning off edit mode")
    this.setState({
      ...this.state,
      editMode: false
    })
  }


  showMyModal = () => {
    // Set state to show the modal.
    console.log("showMyModal")
    this.setState({
      ...this.state,
      selectImageModalVisible: true,
    });
  }

  onTitleChanged = (changeEvent) => {
    console.log("onTitleChanged");
    this.setState({
      ...this.state,
      event: {
        ...this.state.event,
        titleText: changeEvent.target.value
      }
    });
  }

  titleHtml = () => {
    console.log("titleHtml:");

    return (
      <>
        {/* Data */}
        <div className="display-title-text-container">
          {this.state.editMode === true ?
            <input type="text"
              className="form-control"
              value={this.state.event.titleText}
              onChange={this.onTitleChanged}>
            </input>
            :
            <span>{this.state.event.titleText}</span>
          }
        </div>

        {/* Error */}
        {this.state.errMsgs.eventTitleErrMsg === "" ?
          null
          :
          <div className="display-title-err-container">
            <span className="err-msg">{this.state.errMsgs.eventTitleErrMsg}</span>
          </div>
        }
      </>
    );
  }

  timePrettyStr = (year, month, day, hour, min) => {
    let dateStr = null;
    if (year !== null && month !== null && day !== null) {
      dateStr = `${year}/${month}/${day}`;
    }
    else if (year !== null && month !== null) {
      dateStr = `${year}/${month}`;
    }
    else {
      // Note: Year should never be null, so don't bother to check.
      // Also Note: Don't bother checking the combination if year != null, month == null, and 
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

    // console.log(`dateStr: '${dateStr}', timeStr: '${timeStr}'`);
    return timeStr === null ? dateStr : `${dateStr} ${timeStr}`
  }

  timeRangeHtml = () => {
    console.log("timeRangeHtml:");

    let lowerBound = this.state.event.timeRange.lowerBound;
    let lowerBoundText = this.timePrettyStr(lowerBound.Year, lowerBound.Month, lowerBound.Day, lowerBound.Hour, lowerBound.Min);
    console.log(`lowerBoundText: '${lowerBoundText}'`);

    let upperBound = this.state.event.timeRange.upperBound;
    let upperBoundText = this.timePrettyStr(upperBound.Year, upperBound.Month, upperBound.Day, upperBound.Hour, upperBound.Min);
    console.log(`upperBoundText: '${upperBoundText}'`);

    return (
      <>
        <div>
          {/* TODO: make small text, like a header note */}
          <span>
            Year/month/day hour:min
          </span>
        </div>
        <div>
          <span className="float-start">{lowerBoundText}</span>
          <span className="float-end">{upperBoundText}</span>
        </div>
        {this.state.errMsgs.eventWhenErrMsg === null ?
          null
          :
          <div className="event-when-err-container">
            <span className="err-msg">
              {this.state.errMsgs.eventWhenErrMsg}
            </span>
          </div>
        }
      </>
    );
  }

  // Thanks for react-bootstrap for this demo code. I've modified it to work in classes (replace 
  // "React.useState(...)" with "this.state.<property>"") and for my application.
  // Source:
  //  https://react-bootstrap.github.io/components/modal/
  // Note: For some reason has to use the "= () => {...}" syntax instead of normal function syntax in order for the "this" to work in the callbacks...??why javascript??.
  editEventImgModal = () => {
    console.log("showSelectImageModal...")

    const cancelImageUpload = () => {
      console.log("cancel image upload");
      this.setState({
        ...this.state,
        selectImageModalVisible: false,
      });
    }

    const confirmImageUpload = () => {
      console.log("confirm image upload");
      this.setState({
        ...this.state,
        selectImageModalVisible: false,
      });
    }

    return (
      <>
        <Modal show={this.state.selectImageModalVisible} onHide={cancelImageUpload}>
          <Modal.Header closeButton>
            <Modal.Title>Select image</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>hi there!</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={cancelImageUpload}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmImageUpload}>
              Submit
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }

  imageHtml = () => {
    console.log("imageHtml:")

    return (
      <>
        {/* Data */}
        {this.state.event.imageFilePath === "" ?
          <span>No image</span>
          :
          <>
            <img
              className="event-image"
              src={variables.PHOTO_URL + this.state.event.imageFilePath}
              alt="If you're seeing this, then the event could not be loaded. BADBADBADPANIC!!">
            </img>

            {this.state.editMode === true ?
              <Button variant="primary" className="imageEditButtonselectEventImageBtn" onClick={this.showMyModal}>
                Select image
              </Button>
              :
              null
            }
            <this.editEventImgModal />
          </>
        }

        {/* Error */}
        {this.state.errMsgs.eventImgErrMsg === "" ?
          null :
          <div className="event-image-err-container">
            <span className="err-msg">{this.state.errMsgs.eventImgErrMsg}</span>
          </div>
        }
      </>
    );
  }

  regionHtml = () => {
    console.log("regionHtml:");
    return (
      <>
        <div>
          {this.state.event.region.map((latLong) => (
            <div>
              <span>'{latLong.lat}', '{latLong.long}'</span>
            </div>
          ))}
        </div>

        {/* TODO: remove the trinary operator and just use the div and span. If contents are null, then they will not be visible when the HTML renders. */}
        {this.state.errMsgs.eventRegionErrMsg === null ?
          null
          :
          <div className="event-where-err-container">
            <span className="err-msg">
              {this.state.errMsgs.eventRegionErrMsg}
            </span>
          </div>
        }
      </>
    );
  }

  summaryHtml = () => {
    console.log("generateSummaryHtml:");

    return (
      <>
        <div>
          <span>{this.state.event.summaryText}</span>
        </div>

        <div className="event-summary-char-count-container">
          <span>{this.state.event.summaryText.length}/{this.state.summaryTextMaxLen}</span>
        </div>

        {this.state.errMsgs.eventSummaryErrMsg === null ?
          null :
          <div className="event-summary-err-container">
            <span className="err-msg">
              {this.state.errMsgs.eventSummaryErrMsg}
            </span>
          </div>
        }
      </>
    );
  }

  render() {
    console.log("rendering");
    return (
      <div id="main-container">
        {/* Title
            If in edit mode, use an input form, otherwise use a non-editable span. 
        */}
        <div className="display-title-container">
          <this.titleHtml />
        </div>

        {/* When
        */}
        <div className="display-when-container">
          <this.timeRangeHtml />
        </div>

        {/* Image 
            Note: If no image, just say so.
        */}
        <div className="display-image-container">
          <this.imageHtml />
        </div>

        {/* Region
        */}
        <div className="display-where-container">
          <this.regionHtml />
        </div>

        {/* Summary */}
        <div className="display-summary-container">
          <this.summaryHtml />
        </div>

        {/* Edit/(Submit/Cancel) */}
        {/* TODO: let "escape" key also cancel edit mode */}
        {this.state.editMode === true ?
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