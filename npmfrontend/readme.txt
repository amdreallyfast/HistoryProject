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



