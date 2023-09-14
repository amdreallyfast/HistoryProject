export function DetailsSection({ currSelectedItemJson }) {
  let title = currSelectedItemJson?.name.official
  // TODO: fetch flag image from json.flags.svg
  let image = "image placeholder"
  let description = currSelectedItemJson?.flags.alt

  return (
    <div className='flex flex-col h-full border-2 border-green-500 overflow-auto items-start'>
      <h1 className='m-1'>
        {title}
      </h1>
      <div className='m-1'>
        {image ? image : "<no flag image>"}
      </div>
      <p className='m-1 break-all text-left'>
        {description ? description : "<no description>"}
      </p>
    </div>
  )
}