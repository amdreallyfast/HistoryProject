import React, { Component } from "react";
import { variables } from "./Variables";

export class Employee extends Component {

    constructor(props) {
        super(props);

        this.state = {
            employees: [],
            departments: [],
            modalTitle: "",

            selected: {
                Id: 0,
                Name: "",
                DateOfJoining: "",
                PhotoFileName: "anonymous.jpg",
                PhotoPath: variables.PHOTO_URL,
                Department: ""
            }
        }
    }

    refreshList() {
        fetch(variables.API_URL + "Employee/GetAll")
            .then(response => {
                let thing = response.json()
                console.log(thing)
                return thing
            })
            .then(data => {
                this.setState({
                    employees: data
                })
                console.log("employees: " + data)
            })

        fetch(variables.API_URL + "Department/GetAll")
            .then(response => response.json())
            .then(data => {
                this.setState({
                    departments: data
                })
                console.log("departments: " + data)
            })
    }

    componentDidMount() {
        this.refreshList()
    }

    onChangeInputTextEmployeeName(changeEvent) {
        this.setState({
            ...this.state,
            selected: {
                ...this.state.selected,
                Name: changeEvent.target.value
            }
        })
    }

    onChangeInputTextDateOfJoining(changeEvent) {
        this.setState({
            ...this.state,
            selected: {
                ...this.state.selected,
                DateOfJoining: changeEvent.target.value
            }
        })
    }

    onChangeInputTextPhotoFileName(changeEvent) {
        this.setState({
            ...this.state,
            selected: {
                ...this.state.selected,
                PhotoFileName: changeEvent.target.value
            }
        })
    }

    onChangeInputTextDepartment(changeEvent) {
        this.setState({
            ...this.state,
            selected: {
                ...this.state.selected,
                Department: changeEvent.target.value
            }
        })
    }

    addClick() {
        this.setState({
            ...this.state,
            modalTitle: "Add employee",
            selected: {
                ...this.state.selected,
                Id: 0,
                Name: "",
                DateOfJoining: "",
                PhotoFileName: "anonymous.jpg",
                Department: ""
            }
        })
    }

    editClick(selectedDbEntry) {
        this.setState({
            ...this.state,
            modalTitle: "Edit employee",
            selected: {
                ...this.state.selected,
                Id: selectedDbEntry.Id,
                Name: selectedDbEntry.Name,
                DateOfJoining: selectedDbEntry.DateOfJoining,
                PhotoFileName: selectedDbEntry.PhotoFileName,
                Department: selectedDbEntry.Department
            }
        })
    }

    createClick() {
        fetch(variables.API_URL + "Employee/Create", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                Name: this.state.selected.Name,
                DateOfJoining: this.state.selected.DateOfJoining,
                PhotoFileName: this.state.selected.PhotoFileName,
                Department: this.state.selected.Department
            })
        })
            .then(result => result.json())
            .then((result) => {
                console.log(result)
                this.refreshList()
            }, (error) => {
                console.log(error)
                alert("Failed")
            })
    }

    updateClick() {
        fetch(variables.API_URL + "Employee/Update", {
            method: "PUT",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                Id: this.state.selected.Id,
                Name: this.state.selected.Name,
                DateOfJoining: this.state.selected.DateOfJoining,
                PhotoFileName: this.state.selected.PhotoFileName,
                Department: this.state.selected.Department
            })
        })
            .then(result => result.json())
            .then((result) => {
                console.log(result);
                this.refreshList()
            }, (error) => {
                console.log(error)
                alert("Failed")
            })
    }

    deleteClick(id) {
        if (window.confirm("Are you sure?")) {
            fetch(variables.API_URL + "Employee/Delete/" + id, {
                method: "DELETE",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                }
            })
                .then(result => result.json())
                .then((result) => {
                    console.log(result);
                    this.refreshList()
                }, (error) => {
                    console.log(error)
                    alert("Failed")
                })
        }
    }

    render() {
        console.log("start render")
        console.log("employees: " + this.state.employees)
        console.log("departments: " + this.state.departments)
        return (
            <div>
                <button type="button" className="btn btn-primary m-2 float-end" data-bs-toggle="modal" data-bs-target="#exampleModal"
                    onClick={() => this.addClick()}>
                    Add employee
                </button>

                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>EmployeeId</th>
                            <th>EmployeeName</th>
                            <th>DateOfJoining</th>
                            <th>Department</th>
                            <th>Options</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.employees.map(selectedDbEntry =>
                            <tr key={selectedDbEntry.Id}>
                                <td>{selectedDbEntry.Id}</td>
                                <td>{selectedDbEntry.Name}</td>
                                <td>{selectedDbEntry.DateOfJoining}</td>
                                <td>{selectedDbEntry.Department}</td>
                                <td>
                                    {/* options */}

                                    {/* Edit button */}
                                    <button type="button" className="btn btn-light mr-1" data-bs-toggle="modal" data-bs-target="#exampleModal" onClick={() => this.editClick(selectedDbEntry)}>
                                        {/* Source: https://icons.getbootstrap.com/icons/pencil-square/ */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-square" viewBox="0 0 16 16">
                                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                                            <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z" />
                                        </svg>
                                    </button>

                                    {/* Delete button */}
                                    <button type="button" className="btn btn-light mr-1" onClick={() => this.deleteClick(selectedDbEntry.Id)}>
                                        {/* Source: https://icons.getbootstrap.com/icons/trash-fill/ */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash-fill" viewBox="0 0 16 16">
                                            <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div className="modal fade" id="exampleModal" tabIndex={-1} aria-hidden="true">
                    {console.log("rendering modal!")}
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{this.state.modalTitle}</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>

                            <div className="modal-body">
                                <div className="d-flex flex-row bd-highlight mb-3">
                                    <div className="input-group mb-3">
                                        {/* Employee name */}
                                        <div className="input-group mb-3">
                                            <span className="input-group-text">EmployeeName</span>
                                            <input type="text" className="form-control" value={this.state.selected.Name} onChange={(changeEvent) => this.onChangeInputTextEmployeeName(changeEvent)}></input>
                                        </div>

                                        {/* Department name */}
                                        <div className="input-group mb-3">
                                            <span className="input-group-text">Department</span>
                                            <select type="text" className="form-select" value={this.state.selected.Department} onChange={(changeEvent) => this.onChangeInputTextDepartment(changeEvent)}>
                                                {
                                                    this.state.departments.map(selectedDbEntry =>
                                                        <option key={selectedDbEntry.Id}>
                                                            selectedDbEntry.Name
                                                        </option>)
                                                }
                                            </select>
                                        </div>

                                        {/* Date of joining */}
                                        <div className="input-group mb-3">
                                            <span className="input-group-text">DateOfJoining</span>
                                            <input type="date" className="form-control" value={this.state.selected.DateOfJoining} onChange={(changeEvent) => this.onChangeInputTextDateOfJoining(changeEvent)}></input>
                                        </div>

                                        {/* Photo file name TODO ??change to one word??*/}
                                        <div className="input-group mb-3">
                                            <span className="input-group-text">PhotoFileName</span>
                                            <input type="text" className="form-control" value={this.state.selected.PhotoFileName} onChange={(changeEvent) => this.onChangeInputTextPhotoFileName(changeEvent)}></input>
                                        </div>
                                    </div>

                                    {console.log(this.state.selected.PhotoPath + this.state.selected.PhotoFileName)}

                                    {/* Photo */}
                                    <div className="p-2 w-50 bd-highlight"  >
                                        <img width="250px" height="250px" src={this.state.selected.PhotoPath + this.state.selected.PhotoFileName} />
                                    </div>

                                    {/* Create button (only visible if Id == 0) */}
                                    {this.state.selected.Id === 0 ?
                                        <button type="button" className="btn btn-primary float-start" data-bs-dismiss="modal" onClick={() => this.createClick()}>
                                            Create
                                        </button>
                                        : null}

                                    {/* Update button (only visible if Id != 0) */}
                                    {this.state.selected.Id !== 0 ?
                                        <button type="button" className="btn btn-primary float-start" data-bs-dismiss="modal" onClick={() => this.updateClick()}>
                                            Update
                                        </button>
                                        : null}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}
