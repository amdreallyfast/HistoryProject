# Run
  cd npmfrontend
  npm install (if not run already)
  npm run dev

# First time:
	npm create vite@latest
		Project name: npmfrontend
		Package name: <only requested if project name has invalid characters for package name (it's a thing)>
		Select a framework: React
		Select a variant: JavaScript
  cd npmfrontend
    npm install --save @anthropic-ai/claude-code          # For claude assistance
    npm install --save three                              # For rendering the globe
    npm install --save @react-three/fiber                 # For react-based variants of ThreeJs classes
    npm install --save @react-three/drei                  # For OrbitControls, PerspectiveCamera
    npm install --save gsap                               # for nice looking changes between visual states
    npm install --save uuid                               # For making unique keys for loop-generated elements
    npm install --save @tanstack/react-query              # For abstracting away the complications of fetching data.
    npm install --save-dev @tanstack/eslint-plugin-query  # Dev tool: catch common errors in @tanstack/react-query
    npm install --save lodash                             # For comparing re-fetched json with current json
    npm install --save delaunator                         # For creating a triangular mesh of unordered vertices
                                                          #   Note: https://github.com/mapbox/delaunator
    npm install --save d3                                 # ??https://d3js.org/getting-started
    npm install --save axios                              # For easier handling of REST requests
    
    Redux Toolkit
      Start management.
      npm install --save react-redux @reduxjs/toolkit

      ??
      redux toolkit
      redux dev tools



    TailwindCSS
      Guidance: 
        Official:
          https://tailwindcss.com/docs/guides/vite
        
        How to use Tailwind CSS in React with Vite | Install TailwindCSS in React with ViteJS for Beginners
          https://www.youtube.com/watch?v=fUXQXafPF1A
      
        Source:
          https://v2.tailwindcss.com/docs/height

      npm:
        npm install --save-dev tailwindcss postcss autoprefixer
        npx tailwindcss init --postcss
        Note: run "npx tailwindcss init --full" to create a file with all the defaults.
        Also Note: Delete/rename the old file first. The "init" command will do nothing if there already exists a file by that name.
    
      Update tailwind.config.js:
        From:
          content: [],
        To:
          content: [
            "./index.html",
            "./src/**/*.{js,ts,jsx,tsx}",
          ],
      
      Add tailwind directives to src/index.css
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
    
    Recommended VSCode extension: 
      Tailwind CSS IntelliSense

Update:
	nvm --version     
	nvm install latest
	nvm --version     
		1.1.11
	nvm list
		25.3.0
	  * 20.8.0 (Currently using 64-bit executable)
		18.16.0
	nvm use 25.3.0
	npm -v
		10.9.0
	npm install -g npm@latest
	npm -v
		11.7.0
	npm update --save

	If it complains about vulnerabilities:
		npm audit				// check
		npm audit				// check
		npm audit fix --force	// force package update, even if it was labeled as a break change
	https://stackoverflow.com/questions/71734483/npm-update-is-not-updating-the-version-in-package-json-file
	(among other links)

Claude:
	Powershell (ex: in vscode terminal):
		claude
		/termina-setup		# first time

Sat, 2/14/2026
	Next:
		Remove stateSliceEditSources.importSource. It has been replaced by loadSources.

		The ShowDetails component should called ShowEvent to better align with the other Show components. 

		It looks like the region mesh is not displaying properly for the display only region. There are a couple reasons. 1.) the editState.editModeOn variable is currently defaulting to True, and 2.) the DisplayOnlyRegion component is not finished. In GlobeSection/Scene.jsx,  there is a condition on line 91 that says if edit mode is on, then use the EditableRegion component, otherwise use the DisplayOnlyRegion. The EditableRegion is used to render the event's region mesh (assuming that region boundaries exist), primary location pin (the geometry), and its region boundary pins (all their pin geometries). The DisplayOnlyRegion should also render the event's region mesh, but it should not react when clicked on (unlike the EditableRegion does), and it should display smaller and non-interactable versions of the primary location pin and the region boundary pins.

w/claude: 
	Planning for more updates to search, display, and edit.

Beginning plan mode for next major changes to the search and display and edit. We already have a baseline search functionality with the default events, and we will stick with that for now. Between each major step, there should be a pause to check that things are still working.
1. Cleanup and renames:
	1.1 The "ShowDetails" component should be ShowEvent for consistency. 
2. The "Show" components should be named "Display" because display is a more common term to indicate readonly values.
	Pause to check if things are working.
3. Rename DetailsSection/Details component to DetailsMain.
	Pause to check if things are working.
4. The "Show" components should not restricted to the selected event. When search results are returned and listed in the search section, then before the user has clicked on anything, every event's primary location, region boundaries, and region mesh shall be displayed. This will need multiple updates.
    4.1 Need to figure out whether to make a Display variant of EditRegionMesh or convert the existing EditRegionMesh to make a single RegionMesh component that that could be altered for display and edit variants. A dedicated DisplayRegionMesh component would be easy enough, but I don't want to have both EditRegionMesh and DisplayRegionMesh in the same file, and I don't want to copy-paste all the common code because that would make duplicates. Most of the calculations in EditRegionMesh are not restricted to Edit mode. The component EditRegionMesh pulls data from the editState and responding to changes in the editState's regionBoundaries, but in order to display every search result, I need a more flexible RegionMesh component (or maybe a function?) that will take a latitude longitude pair for primary location, and an array of latitude longitude pairs for region boundaries, and display them using the same functions and components as EditRegionMesh, except that it uses the values passed into it (which will be constant and therefore no need to update after the component's initialization), and it will not use the "// wireframe" lines. Put a TODO note in the plan to work out ideas for this, and provide brief thoughts on possible variants.
	4.2 Need a variant on the GlobeRegion/PinMesh. And maybe rename the existing PinMesh to something about editing and make a new pin mesh for display only. And maybe move the files into their own folder, either as part of Region folder or something else. Currently, the PinMesh component has a built-in connection to the editState and mouseState so that it can be moved and will update the editState in response to clicking and dragging. That is good for edit mode, but for display-only, it only needs to makePin, does not need a bounding box, should not interact with any state machine, and does not need mouse interaction (click and drag, hover, etc.). 
	4.3 Need a DisplayRegion that is similar in concept to Region/EditableRegion, except without the need for updating pins. Currently, the Region/EditableRegon uses the existing PinMesh (which is bound to edit mode) and the EditRegionMesh. It's calculations are useful for locating and rotating pins into position, but in order to display region boundaries for all search results, we need also variants on PinMesh and EditRegionMesh that are not bound to a state machine like edit mode and that can display read-onyl values.
	4.4 The display only pin mesh for primary pin and region boundary pins will be the same shape and color as their Edit counterparts, but scaled to about 0.25 times the current mesh scale. The current values for pin scaling can be found in constValues.jsx, pinMeshInfo. Just like PinMesh, I originally thought that there would be a single mesh object that would satisfy both display only and edit mode, but as PinMesh got more integrated with editing functionality, I'm thinking that a dedicated EditPinMesh and DisplayPinMesh would be useful, and that means different const values too, and probably different const meshInfo objects for EditPinMesh and DisplayPinMesh.
	4.4 Pause to check if things are working.
5. When a search result is clicked, it will become the selected event. This should trigger a few things:
	5.1 The search result is outlined and highlighted in the search section.
	5.2 The DisplayRegionMesh reacts to the selectedEvent state machine's change of selected eventId by changing color. The "highlighted" color could be set in constValues.
	5.3 The DisplayPinMesh also reacts to the change by changing color. If it is a primary pin, then it will change its normal primaryPinColor to something similar, but with a little variation so that it can be differentiated from the other search results' primary pins. Similarly, if it is a region boundary pin, its regionPinColor will also change slightly.
	5.4 The selected event's info will be used to feed the DetailsSection/Display components. That is, they will not pull from the edit state, but from the selected event state.
	Note: Currently, the DetailsSection/Details component is a simple class. It checks if edit mode is on, and if it is, the DetailsSection will show EditEvent, else display only. Currently, because of all the previous attention spent on editng, the edit mode is hard-coded to true. Turn that off by default in order for display components to be tested.
	Pause to check if things are working.
6. In the DetailsSection/Display/DisplayDetails component that coordinates all the other Display components, there will be an Edit button at the bottom. When clicked, all the values of the selected event will be loaded into the edit state machine, and edit mode will be switched on. This will trigger DetailsSection/Details to show the EditEvent component. There is already an editStateAction.startEditMode() functin.
Pause to check if things are working.
7. In the DetailsSection/Edit/EditEvent component that coordinates all the other edit components, there is a Submit button. When clicked. it should submit the event details to the backend (currently approximated by npmfrontend/public/events.json), load all those values into the selected event, and turn edit mode off. This includes the parts of stateSliceEditEvent, stateSliceEditSources, and stateSliceEditSourceAuthors. We might need to reconsider this design. These three pieces of the edit state were separated because the edit state machine and its supporting reducer functions were getting extensive, and since I thought that it was necessary to replicate the state machine before changing anything, I made copy functions that got larger and larger as the number of things needing editing expanded. If we need to make a whole new design for this editing methodology, then lets do that. I have been using these "state slice" values because (1) I didn't know hwo to use cookies and (2) I was thinking of keeping everything in memory, but if the state machine becomes difficult to use because javascript and reducjs needs extensive deep copies, then I would be open to redesigns for this state machine, including cookies (as long as there is a way to display to the user where the cookies are being stored. Provide ideas.

Consider anything that might be unclear, and put those notes in the design or plan documents, tell me what files you have created, and I will begin reviewing them.
