import React, { Component } from "react";
import { variables } from "./Variables";

export class Department extends Component {

    constructor(props) {
        super(props);

        this.state = {
            departments: [],
            departmentsWithoutFilter: [],

            sortAscending: {
                Id: true,
                Name: true
            },

            filters: {
                Id: "",
                Name: ""
            },

            modalTitle: "",

            selected: {
                Id: 0,
                Name: ""
            }
        }
    }

    // filterFunction() {
    //     // console.log("Filter function : filter state: '" + JSON.stringify(this.state.filters) + "'")
    //     var idFilter = this.state.filters.Id
    //     var nameFilter = this.state.filters.Name
    //     var filteredData = this.state.departmentsWithoutFilter.filter(
    //         function (el) {
    //             var includesId = el.Id.toString().toLowerCase().includes(
    //                 idFilter.toString().trim().toLocaleLowerCase()
    //             )
    //             var includesName = el.Name.toString().toLowerCase().includes(
    //                 nameFilter.toString().trim().toLocaleLowerCase()
    //             )
    //             console.log("element Id '" + el.Id + "' contains filter '" + idFilter + "': '" + includesId + "'")
    //             console.log("element Name '" + el.Name + "' contains filter '" + nameFilter + "': '" + includesName + "'")
    //             console.log("result: '" + (includesId && includesName) + "'")
    //             return includesId && includesName
    //         }
    //     )

    //     this.setState({
    //         ...this.state,
    //         departments: filteredData
    //     })
    // }

    // changeIdFilter = (event) => {
    //     console.log("New Id filter: '" + event.target.value + "'")

    //     // Note: _Must_ call the followup function as a callback because the state setting is not immediate. If we try to call it immediately following this.setState(...), then the new values may not be in the expected state by the time the function runs.
    //     this.setState({
    //         ...this.state,
    //         filters: {
    //             ...this.state.filters,
    //             Id: event.target.value
    //         }
    //     }, () => this.filterFunction())
    // }

    // sortResult(property, ascending) {
    //     // Note: Overwrites the filtered data. 
    //     var sortedData = this.state.departments.sort(function (a, b) {
    //         if (ascending) {
    //             if (a[property] > b[property]) return 1
    //             else if (a[property] < b[property]) return -1
    //             else return 0
    //         }
    //         else {
    //             if (b[property] > a[property]) return 1
    //             else if (b[property] < a[property]) return -1
    //             else return 0
    //         }
    //     })

    //     this.setState({
    //         ...this.state,
    //         departments: sortedData
    //     })
    // }

    // sortById(ascending) {
    //     this.setState({
    //         ...this.state,
    //         sortAscending: {
    //             ...this.state.sortAscending,
    //             Id: ascending
    //         }
    //     }, () => {
    //         this.sortResult("Id", this.state.sortAscending.Id)
    //         this.sortResult("Name", this.state.sortAscending.Name)
    //     })
    // }

    // sortByName(ascending){
    //     this.setState({
    //         ...this.state,
    //         sortAscending: {
    //             ...this.state.sortAscending,
    //             Name: ascending
    //         }
    //     }, () => {
    //         this.sortResult("Id", this.state.sortAscending.Id)
    //         this.sortResult("Name", this.state.sortAscending.Name)
    //     })
    // }

    // setNameFilter = (event) => {
    //     this.setState({
    //         ...this.state,
    //         filters: {
    //             ...this.state.filters,
    //             Name: event.target.value
    //         }
    //     }, () => this.filterFunction())
    // }

    filterAndSort() {
        console.log("Filter function : filter state: '" + JSON.stringify(this.state.filters) + "'")
        var idFilter = this.state.filters.Id
        var nameFilter = this.state.filters.Name
        var filteredData = this.state.departmentsWithoutFilter.filter(
            function (el) {
                var includesId = el.Id.toString().toLowerCase().includes(
                    idFilter.toString().trim().toLocaleLowerCase()
                )
                var includesName = el.Name.toString().toLowerCase().includes(
                    nameFilter.toString().trim().toLocaleLowerCase()
                )
                console.log("element Id '" + el.Id + "' contains filter '" + idFilter + "': '" + includesId + "'")
                console.log("element Name '" + el.Name + "' contains filter '" + nameFilter + "': '" + includesName + "'")
                console.log("result: '" + (includesId && includesName) + "'")
                return includesId && includesName
            }
        )




        // Note: In order to properly get a multi-column sort working, I think that I'd need to creat a prioritized list or properties to sort on and I'd have to switch them around when the sort buttons were pressed. Not sure how to do that right now.





        // Source: Inspired by:
        // https://stackoverflow.com/questions/6913512/how-to-sort-an-array-of-objects-by-multiple-fields?page=1&tab=scoredesc#tab-top
        var sortIdAsencding = this.state.sortAscending.Id
        var sortNameAscending = this.state.sortAscending.Name
        var sortedData = filteredData.sort(function (left, right) {
            var idOrder = 0
            if (sortIdAsencding) {
                idOrder = left.Id - right.Id
            } else {
                idOrder = right.Id - left.Id
            }

            var nameOrder = 0
            if (sortNameAscending) {
                nameOrder = left.Name.localeCompare(right.Name)
            } else {
                nameOrder = right.Name.localeCompare(left.Name)
            }

            return idOrder || nameOrder
        })


        // function sortByProperty(data, property, ascending) {
        //     return data.sort(function (a, b) {
        //         if (ascending) {
        //             if (a[property] > b[property]) return 1
        //             else if (a[property] < b[property]) return -1
        //             else return 0
        //         }
        //         else {
        //             if (b[property] > a[property]) return 1
        //             else if (b[property] < a[property]) return -1
        //             else return 0
        //         }
        //     })
        // }
        // var sortedData
        // this.state.sortAscending.forEach((value) => {
        //     console.log(JSON.stringify(value))
        // })

        // var sortedData = []

        this.setState({
            ...this.state,
            departments: sortedData
        })
    }

    refreshList() {
        fetch(variables.API_URL + "Department/GetAll")
            .then(response => response.json())
            .then(data => {
                this.setState({
                    departments: data,
                    departmentsWithoutFilter: data
                })
            })
    }

    componentDidMount() {
        this.refreshList()
    }

    onChangeDepartmentNameInputText(changeEvent) {
        // Note: Must use this "..." syntax in order to keep the state of the existing (and immutable) state object so that the reference doesn't change out from under us.
        // https://redux.js.org/usage/structuring-reducers/immutable-update-patterns
        this.setState({
            ...this.state,

            selected: {
                ...this.state.selected,
                Name: changeEvent.target.value
            }
        })
    }

    addClick() {
        this.setState({
            ...this.state,

            modalTitle: "Add department",
            selected: {
                ...this.state,

                Id: 0,
                Name: ""
            }
        })

        console.log(this.state)
    }

    editClick(selectedDbEntry) {
        this.setState({
            ...this.state,

            modalTitle: "Edit employee",
            selected: {
                ...this.state,

                Id: selectedDbEntry.Id,
                Name: selectedDbEntry.Name
            }
        })
    }

    createClick() {
        fetch(variables.API_URL + "Department/Create", {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                Name: this.state.selected.Name
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
        fetch(variables.API_URL + "Department/Update", {
            method: "PUT",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                Id: this.state.selected.Id,
                Name: this.state.selected.Name
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
            fetch(variables.API_URL + "Department/Delete/" + id, {
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
        return (
            <div>
                <button type="button" className="btn btn-primary m-2 float-end" data-bs-toggle="modal" data-bs-target="#exampleModal"
                    onClick={() => this.addClick()}>
                    Add Department
                </button>

                <table className="table table-striped">
                    <thead>
                        <tr>
                            <th>
                                <div className="d-flex flex-row">
                                    {/* Deparment Id */}
                                    {/* Filter text box */}
                                    <input className="form-control m-2" placeholder="Filter" onChange={
                                        (event) => {
                                            this.setState({
                                                ...this.state,
                                                filters: {
                                                    ...this.state.filters,
                                                    Id: event.target.value
                                                }
                                            }, () => this.filterAndSort())
                                        }
                                    } />

                                    {/* Sort up/down buttons */}
                                    <button type="button" className="btn btn-light" onClick={
                                        () => {
                                            this.setState({
                                                ...this.state,
                                                sortAscending: {
                                                    ...this.state.sortAscending,
                                                    Id: true
                                                }
                                            }, () => this.filterAndSort())
                                        }
                                    }>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-down-square-fill" viewBox="0 0 16 16">
                                            <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm6.5 4.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5a.5.5 0 0 1 1 0z" />
                                        </svg>
                                    </button>
                                    <button type="button" className="btn btn-light" onClick={
                                        () => {
                                            this.setState({
                                                ...this.state,
                                                sortAscending: {
                                                    ...this.state.sortAscending,
                                                    Id: false
                                                }
                                            }, () => this.filterAndSort())
                                        }
                                    }>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-up-square-fill" viewBox="0 0 16 16">
                                            <path d="M2 16a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2zm6.5-4.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 1 0z" />
                                        </svg>
                                    </button>
                                </div>
                                DepartmentId
                            </th>
                            <th>
                                <div className="d-flex flex-row">
                                    {/* Department Name */}
                                    {/* Filter text box */}
                                    <input className="form-control m-2" placeholder="Filter" onChange={
                                        (event) => {
                                            this.setState({
                                                ...this.state,
                                                filters: {
                                                    ...this.state.filters,
                                                    Name: event.target.value
                                                }
                                            }, () => this.filterAndSort())
                                        }
                                    } />

                                    {/* Sort up/down buttons */}
                                    <button type="button" className="btn btn-light" onClick={
                                        () => {
                                            this.setState({
                                                ...this.state,
                                                sortAscending: {
                                                    ...this.state.sortAscending,
                                                    Name: true
                                                }
                                            }, () => this.filterAndSort())
                                        }
                                    }>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-down-square-fill" viewBox="0 0 16 16">
                                            <path d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2zm6.5 4.5v5.793l2.146-2.147a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 1 1 .708-.708L7.5 10.293V4.5a.5.5 0 0 1 1 0z" />
                                        </svg>
                                    </button>
                                    <button type="button" className="btn btn-light" onClick={
                                        () => {
                                            this.setState({
                                                ...this.state,
                                                sortAscending: {
                                                    ...this.state.sortAscending,
                                                    Name: false
                                                }
                                            }, () => this.filterAndSort())
                                        }
                                    }>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-up-square-fill" viewBox="0 0 16 16">
                                            <path d="M2 16a2 2 0 0 1-2-2V2a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H2zm6.5-4.5V5.707l2.146 2.147a.5.5 0 0 0 .708-.708l-3-3a.5.5 0 0 0-.708 0l-3 3a.5.5 0 1 0 .708.708L7.5 5.707V11.5a.5.5 0 0 0 1 0z" />
                                        </svg>
                                    </button>
                                </div>
                                DepartmentName
                            </th>
                            <th>Options</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.state.departments.map(selectedDbEntry =>
                            <tr key={selectedDbEntry.Id}>
                                <td>{selectedDbEntry.Id}</td>
                                <td>{selectedDbEntry.Name}</td>
                                <td>
                                    <button type="button" className="btn btn-light mr-1" data-bs-toggle="modal" data-bs-target="#exampleModal" onClick={() => this.editClick(selectedDbEntry)}>
                                        {/* Source: https://icons.getbootstrap.com/icons/pencil-square/ */}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-square" viewBox="0 0 16 16">
                                            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
                                            <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z" />
                                        </svg>
                                    </button>

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
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">{this.state.modalTitle}</h5>
                                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>

                            <div className="modal-body">
                                {/* Department name */}
                                <div className="input-group mb-3">
                                    <span className="input-group-text">DepartmentName</span>
                                    <input type="text" className="form-control" value={this.state.selected.Name} onChange={(changeEvent) => this.onChangeDepartmentNameInputText(changeEvent)}></input>
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
            </div >
        )
    }
}
