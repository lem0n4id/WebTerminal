import { describe, it, expect } from 'vitest'

describe('app boot smoke test', () => {
  it('renders the terminal into #root', async () => {
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
    // jquery.terminal should have initialized inside the mounted div
    expect(document.querySelector('.terminal')).not.toBeNull()
  })
})
