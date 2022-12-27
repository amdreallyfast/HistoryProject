import "./DisplayEntry.css"
import React, { Component } from "react";
import { variables } from "../Variables";
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'

export function MyModalNonClass() {
  // console.log("showSelectImageModal...")

  // const cancelImageUpload = () => {
  //   console.log("cancelImageUpload")
  //   this.setState({
  //     ...this.state,
  //     selectImageModalVisible: false,
  //   });
  // }

  // const confirmImageUpload = () => {
  //   console.log("confirmImageUpload")
  //   this.setState({
  //     ...this.state,
  //     selectImageModalVisible: false,
  //   });
  // }

  const [show, setShow] = React.useState(true);
  const cancelImageUpload = () => setShow(false);
  const confirmImageUpload = () => setShow(true);

  return (
    <>
      <Modal show={show} onHide={cancelImageUpload}>
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

export class DisplayEntry extends Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      selectImageModalVisible: false,
      imageUploadFailedMsg: "",

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
    // this.getEventOfTheDay()
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

  // Thanks for react-bootstrap for this demo code. I've modified it to work in classes (replace 
  // "React.useState(...)" with "this.state.<property>"") and for my application.
  // Source:
  //  https://react-bootstrap.github.io/components/modal/


  // Note: For some reason has to use the "= () => {...}" syntax instead of normal function syntax in order for the "this" to work in the callbacks...??why javascript??.
  MyModalClassMember = () => {
    console.log("showSelectImageModal...")

    // const cancelImageUpload = () => {
    //   console.log("cancelImageUpload")
    //   this.setState({
    //     ...this.state,
    //     selectImageModalVisible: false,
    //   });
    // }

    // const confirmImageUpload = () => {
    //   console.log("confirmImageUpload")
    //   this.setState({
    //     ...this.state,
    //     selectImageModalVisible: false,
    //   });
    // }

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

  showMyModal() {
    // Set state to show the modal.
    this.setState({
      ...this.state,
      selectImageModalVisible: true,
    });
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
          <button onClick={() => this.getEventOfTheDay()}>
            getEventOfTheDay
          </button>
        </div>
        <div className="display-image-container">
          {/* <img width="100%" height="100%" src={variables.PHOTO_URL + this.state.event.imageFilePath} alt="THE ALT TEXT ANDSTUFF" data-bs-toggle="modal" data-bs-target="#imageUploadModal">
          </img> */}
          <Button variant="primary" onClick={() => this.showMyModal()}>
            Select things
          </Button>
          {/* <MyModalNonClass /> */}
          <this.MyModalClassMember />
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