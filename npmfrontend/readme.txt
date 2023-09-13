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
    npm install save three 
    npm install save @react-three/fiber
    npm install save @react-three/drei
    npm install save uuid

    Install tailwindcss
      Guidance: 
        Official:
          https://tailwindcss.com/docs/guides/vite
        
        How to use Tailwind CSS in React with Vite | Install TailwindCSS in React with ViteJS for Beginners
          https://www.youtube.com/watch?v=fUXQXafPF1A
      
      npm:
        npm install -D tailwindcss postcss autoprefixer
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
      
# Tailwind CSS
  Source:
    https://v2.tailwindcss.com/docs/height
