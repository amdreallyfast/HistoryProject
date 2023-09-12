import { useEffect, useState } from 'react'
import './App.css'

const fetchData = async (callbackFunc) => {
  const response = await fetch("https://restcountries.com/v3.1/all")
  console.log({ response: response })
  const json = await response.json()
  callbackFunc({
    error: null,
    json: json
  })
}

function App() {
  const [countryData, setCountryData] = useState()
  useEffect(() => {
    console.log("App:useEffect()")

    let resultData = null
    let callback = (result) => {
      if (result.error == null) {
        setCountryData(result.json)
        console.log({ msg: "setting country data", data: result.json })
      }
      else {
        //??what to do about the bad??
        console.log("oh no the bad fetch!")
      }
    }
    // Initial data fetch
    fetchData(callback)
  }, [])

  return (
    <div className='grid grid-rows-5 grid-cols-12 w-screen h-screen bg-black border-4 border-yellow-500'>
      <div className='row-span-4 col-span-2 border-2 border-red-500 text-white'>
        Search
      </div>
      <div className='row-span-4 col-span-8 border-2 border-amber-500 text-white'>
        Globe
      </div>
      <div className='row-span-4 col-span-2 border-2 border-emerald-500 text-white'>
        Details
      </div>
      <div className='row-span-1 col-span-12 border-2 border-fuchsia-500 text-white'>
        Timeline
      </div>
    </div>
  )
}

export default App
