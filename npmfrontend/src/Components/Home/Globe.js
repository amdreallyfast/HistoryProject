import React, { Component } from "react";

export class Globe extends Component {
  constructor(props) {
    super(props);
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
      <div>
        <p>
          Hello, I'm Globe
        </p>
        <p>
          Hello, I'm Globe
        </p>
        <p>
          Hello, I'm Globe
        </p>
        <p>
          Hello, I'm Globe
        </p>
        <p>
          Hello, I'm Globe
        </p>
        <p>
          Hello, I'm Globe
        </p>
      </div>
    )
  }
}