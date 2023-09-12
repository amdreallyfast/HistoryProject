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
    npm install save three @react-three/fiber @react-three/drei

    Install tailwindcss
      Guidance: 
        https://tailwindcss.com/docs/installation
      
      npm:
        npm install -D tailwindcss
        npx tailwindcss init
        Note: run "npx tailwindcss init --full" to create a file with all the defaults.
        Also Note: Delete/rename the old file first. The "init" command will do nothing if there already exists a file by that name.
    
      Update tailwind.config.js:
        From:
          content: []
        To:
          content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}']
      
      Add tailwind directives to src/index.css
        @tailwind base;
        @tailwind components;
        @tailwind utilities;
      
      Build css:
        npx tailwindcss --input .\src\index.css --output .\src\tailwindbuild.css
      
      Update to use tailwind:
        Replace:
          main.jsx -> import './index.css'
        
        With:
          main.jsx -> import './tailwindbuild.css'

# CSS
  Source:
    https://v2.tailwindcss.com/docs/height
