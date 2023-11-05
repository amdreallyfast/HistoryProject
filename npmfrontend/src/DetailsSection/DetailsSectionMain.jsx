import { useSelector } from "react-redux"
import { DetailsEdit } from "./DetailsEdit"
import { DetailsDisplay } from "./DetailsDisplay"

export function DetailsSectionMain({ }) {
  const editModeOn = useSelector((state) => state.editPoiReducer.editModeOn)

  return (
    <>
      {editModeOn ? (<DetailsEdit />) : (<DetailsDisplay />)}
    </>
  )
}