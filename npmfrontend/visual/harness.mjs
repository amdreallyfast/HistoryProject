// Visual-check harness: see and drive the 3D UI the way a person does, cursor included.
//
// Why: Playwright screenshots never include the mouse cursor (the OS draws it), and Playwright's
// mouse is synthetic. Here a normal headed Chromium runs on an invisible virtual X screen (Xvfb),
// the REAL X mouse is moved and pressed through XTest (xinput.py), and ffmpeg captures the screen
// WITH the OS-drawn cursor. So a check can press and hold, move mid-drag, and look.
//
// Local and manual (not in CI): run against the Vite dev server, which includes the test-only
// window.__globeTest helper used for aiming (GlobeSection/GlobeTestHook.jsx).
// Requires: Xvfb and ffmpeg (sudo apt install xvfb ffmpeg); cursor theme Yaru (Ubuntu default).
// See DESIGN.md "Visual checks".
import { createRequire } from 'node:module'
import { execFileSync, spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
export const FRONTEND_DIR = join(HERE, '..')
export const OUTPUT_DIR = join(FRONTEND_DIR, 'visual-output')
const { chromium } = createRequire(join(FRONTEND_DIR, 'package.json'))('@playwright/test')

const SCREEN = { width: 1920, height: 1080 }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function requireTool(name) {
  try {
    execFileSync('sh', ['-c', `command -v ${name}`], { stdio: 'ignore' })
  } catch {
    throw new Error(`${name} not found. Install with: sudo apt install xvfb ffmpeg`)
  }
}

// --- Virtual screen ---------------------------------------------------------------------------

async function startVirtualScreen() {
  requireTool('Xvfb')
  requireTool('ffmpeg')
  let n = 99
  while (existsSync(`/tmp/.X11-unix/X${n}`)) n++
  const display = `:${n}`
  // -noreset: otherwise the server resets (pointer back to center) whenever its last client
  // disconnects, e.g. between two xinput.py calls.
  const proc = spawn('Xvfb', [display, '-screen', '0', `${SCREEN.width}x${SCREEN.height}x24`, '-nolisten', 'tcp', '-noreset'], { stdio: 'ignore' })
  for (let i = 0; i < 50 && !existsSync(`/tmp/.X11-unix/X${n}`); i++) await sleep(100)
  if (!existsSync(`/tmp/.X11-unix/X${n}`)) throw new Error(`Xvfb did not start on ${display}`)
  return { display, stop: () => proc.kill() }
}

// --- Dev server -------------------------------------------------------------------------------

async function startDevServer(port) {
  const proc = spawn('npx', ['vite', '--port', String(port), '--strictPort'], { cwd: FRONTEND_DIR, stdio: 'ignore', detached: true })
  const url = `http://localhost:${port}/`
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch(url)).ok) return { url, stop: () => process.kill(-proc.pid) }
    } catch { /* not up yet */ }
    await sleep(200)
  }
  process.kill(-proc.pid)
  throw new Error(`Vite dev server did not start on ${url}`)
}

// --- Session ----------------------------------------------------------------------------------

// Starts the virtual screen, a dev server, and a headed Chromium showing the app; returns helpers.
// Always call session.close() (use try/finally).
export async function openSession({ name, port = 5199, mockApi } = {}) {
  const outDir = join(OUTPUT_DIR, name ?? 'session')
  mkdirSync(outDir, { recursive: true })
  const screen = await startVirtualScreen()
  let server, browser
  try {
    server = await startDevServer(port)
    browser = await chromium.launch({
      headless: false,
      // Must not open on the user's real desktop: drop Wayland variables and force X11, or
      // Chromium prefers the Wayland session it finds in the environment.
      env: Object.fromEntries(Object.entries({ ...process.env, DISPLAY: screen.display, XCURSOR_THEME: 'Yaru', XCURSOR_SIZE: '32' })
        .filter(([key]) => !['WAYLAND_DISPLAY', 'XDG_SESSION_TYPE'].includes(key))),
      args: ['--ozone-platform=x11', '--window-position=0,0', `--window-size=${SCREEN.width},${SCREEN.height}`],
    })
    const page = await browser.newPage({ viewport: null })
    if (mockApi) await mockApi(page)
    await page.goto(server.url)
    await page.waitForFunction(() => window.__globeTest !== undefined)
    return makeSession({ page, screen, outDir, close: async () => { await browser.close(); server.stop(); screen.stop() } })
  } catch (err) {
    await browser?.close()
    server?.stop()
    screen.stop()
    throw err
  }
}

function makeSession({ page, screen, outDir, close }) {
  const xinput = (...args) => execFileSync('python3', ['-I', join(HERE, 'xinput.py'), screen.display, ...args.map(String)])
  let toScreen = null

  async function calibrate() {
    // No window manager on Xvfb: no window frame, page content starts below the browser toolbar.
    const w = await page.evaluate(() => ({ sx: screenX, sy: screenY, top: outerHeight - innerHeight, left: outerWidth - innerWidth }))
    toScreen = (p) => ({ x: Math.round(w.sx + w.left + p.x), y: Math.round(w.sy + w.top + p.y) })
    await page.evaluate(() => {
      window.__visualLastMouse = null
      addEventListener('mousemove', (e) => { window.__visualLastMouse = { x: e.clientX, y: e.clientY } })
    })
  }

  const mouse = {
    // Move the real pointer to a page (client) position; verifies the page saw it there.
    async moveTo(client, { settleMs = 250 } = {}) {
      if (!toScreen) await calibrate()
      const s = toScreen(client)
      xinput('move', s.x, s.y)
      await sleep(settleMs) // let per-frame hover raycasts catch up
      const seen = await page.evaluate(() => window.__visualLastMouse)
      if (!seen || Math.abs(seen.x - client.x) > 2 || Math.abs(seen.y - client.y) > 2) {
        throw new Error(`pointer aim off: wanted ${JSON.stringify(client)}, page saw ${JSON.stringify(seen)}`)
      }
      return s
    },
    // Real button press/release. button: 1 left, 2 middle, 3 right.
    async down(button = 1, settleMs = 250) { xinput('down', button); await sleep(settleMs) },
    async up(button = 1, settleMs = 250) { xinput('up', button); await sleep(settleMs) },
  }

  const ffmpegGrab = (file, filter) => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y',
    '-f', 'x11grab', '-draw_mouse', '1', '-video_size', `${SCREEN.width}x${SCREEN.height}`, '-i', screen.display,
    '-frames:v', '1', '-vf', filter, file])

  const capture = {
    // Whole screen (half size).
    screen(name) {
      const file = join(outDir, `${name}.png`)
      ffmpegGrab(file, `scale=${SCREEN.width / 2}:${SCREEN.height / 2}`)
      return file
    },
    // Enlarged box around the current pointer, cursor included.
    async aroundPointer(name, { box = 60, zoom = 6 } = {}) {
      const [x, y] = xinput('where').toString().trim().split(' ').map(Number)
      const left = Math.max(0, Math.min(SCREEN.width - box, x - box / 2))
      const top = Math.max(0, Math.min(SCREEN.height - box, y - box / 2))
      const file = join(outDir, `${name}.png`)
      ffmpegGrab(file, `crop=${box}:${box}:${left}:${top},scale=${box * zoom}:${box * zoom}:flags=neighbor`)
      return file
    },
    // Side-by-side strip of earlier captures, for one-glance review.
    strip(name, files) {
      const file = join(outDir, `${name}.png`)
      execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...files.flatMap((f) => ['-i', f]),
        '-filter_complex', `hstack=inputs=${files.length}`, file])
      return file
    },
  }

  return { page, mouse, capture, outDir, close }
}
