import { describe, it, expect } from 'vitest'

// xterm.js needs a few browser APIs that jsdom does not implement; stub the
// bare minimum so the real boot path (React mount -> Terminal.open -> shell
// wiring) runs and boot-time crashes are still caught.
function stubBrowserApis() {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  })
  window.devicePixelRatio = 1
  if (!window.ResizeObserver) {
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  }
  HTMLCanvasElement.prototype.getContext = () => ({
    measureText: () => ({ width: 1 }),
    fillText: () => {},
    fillRect: () => {},
    clearRect: () => {},
    getImageData: () => ({ data: new Uint8ClampedArray(4) }),
    save: () => {},
    restore: () => {},
    scale: () => {},
    translate: () => {},
    canvas: { width: 1, height: 1 },
  })
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 0)
    window.cancelAnimationFrame = (id) => clearTimeout(id)
  }
}

describe('app boot smoke test', () => {
  it('renders the terminal into #root', async () => {
    stubBrowserApis()

    const errors = []
    window.addEventListener('error', (e) => errors.push(e.error || e.message))

    document.body.innerHTML = '<div id="root"></div>'
    await import('./index.jsx')
    await new Promise((r) => setTimeout(r, 300))

    if (errors.length) {
      throw new Error('Runtime errors during boot:\n' + errors.map(String).join('\n'))
    }
    const root = document.querySelector('#root')
    expect(root.innerHTML).not.toBe('')
    // the wrapper div and xterm's own DOM should both exist
    expect(document.querySelector('.xterm')).not.toBeNull()
    expect(document.querySelector('.xterm')).not.toBeNull()
    // the e2e text hook is installed and captured the greeting
    expect(window.__terminalText.some((l) => l.includes('WebTerminal'))).toBe(true)
  })
})
