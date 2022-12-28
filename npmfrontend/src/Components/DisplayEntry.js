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

      selectImageModalVisible: false,
      imageUploadFailedMsg: "",
      defaultImagePath: variables.PHOTO_URL + "anonymous.png",

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

  setEvent = (eventJson) => {
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
  }

  getSelectedEvent = (eventId) => {
    fetch(`${variables.API_URL}Event/Get/${eventId}`)
      .then(response => response.json())
      .then(eventJson => this.setEvent(eventJson));
  }

  getEventOfTheDay = () => {
    fetch(`${variables.API_URL}Event/GetEventOfTheDay`)
      .then(response => response.json())
      .then(eventJson => this.setEvent(eventJson));
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

    //??just re-fetch??
    console.log("cancelling changes")
    console.log("turning off edit mode")
    this.setState({
      ...this.state,
      editMode: false
    })
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

  render() {
    console.log("rendering");
    return (
      <div id="main-container">
        {/* Title
            If in edit mode, use an input form, otherwise use a non-editable span. 
        */}
        <div className="display-title-container">
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

        {/* Image 
            Note: If no image, just say so.
        */}
        <div className="display-image-container">
          {this.state.event.imageFilePath === "" ?
            <span>No image</span>
            :
            <>
              <img
                className="eventImg"
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

        {this.state.editMode === true ?
          <>
            {/* "Cancel" goes on the far right, and then put "submit" next to it. */}
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