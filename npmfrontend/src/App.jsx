import { SearchSectionMain } from './SearchSection/SearchSectionMain'
import { GlobeSectionMain } from "./GlobeSection/GlobeSectionMain"
import { DetailsMain } from './DetailsSection/DetailsMain'
import './App.css'

// TODO: consider using Flowbit instead of plain Tailwind
//  https://flowbite.com/docs/getting-started/introduction/

function App() {
  return (
    <>
      <div className='grid grid-rows-5 grid-cols-10 w-screen h-screen bg-black border-4 border-yellow-500'>
        <div className='row-span-4 col-span-2 border-2 border-red-500 text-white'>
          <SearchSectionMain />
        </div>
        <div className='row-span-4 col-span-6 border-2 border-amber-500 text-white'>
          {/* Globe */}
          <GlobeSectionMain />
        </div>
        <div className='row-span-4 col-span-2 border-2 border-emerald-500 text-white overflow-hidden'>
          <DetailsMain />
        </div>
        <div className='row-span-1 col-span-12 border-2 border-fuchsia-500 text-white'>
          Timeline
        </div>
      </div>
    </>
  )
}

export default App
