import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import KeyBar from './KeyBar'
import CommandChips from './CommandChips'
import CounterService from '../commands/counter.service'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

let container
let root

beforeEach(() => {
  window.localStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
})

afterEach(() => {
  act(() => root.unmount())
  container.remove()
  window.localStorage.clear()
})

function render(element) {
  act(() => root.render(element))
}

// React listens for the native 'pointerdown' event; jsdom has no
// PointerEvent constructor so a plain Event with the right type suffices
function press(el) {
  act(() => {
    el.dispatchEvent(new window.Event('pointerdown', { bubbles: true, cancelable: true }))
  })
}

describe('KeyBar', () => {
  it('renders the 7 helper keys with their test ids', () => {
    render(<KeyBar send={() => {}} />)
    expect(container.querySelector('[data-testid="key-bar"]')).not.toBeNull()
    const ids = ['key-tab', 'key-up', 'key-down', 'key-tilde', 'key-slash', 'key-dash', 'key-dot']
    for (const id of ids) {
      const button = container.querySelector(`[data-testid="${id}"]`)
      expect(button).not.toBeNull()
      expect(button.tagName).toBe('BUTTON')
      expect(button.getAttribute('aria-label')).toBeTruthy()
    }
    expect(container.querySelectorAll('[data-testid="key-bar"] button')).toHaveLength(7)
  })

  it('sends the right data for each key press', () => {
    const send = vi.fn()
    render(<KeyBar send={send} />)
    press(container.querySelector('[data-testid="key-tab"]'))
    expect(send).toHaveBeenLastCalledWith('\t')
    press(container.querySelector('[data-testid="key-up"]'))
    expect(send).toHaveBeenLastCalledWith('\x1b[A')
    press(container.querySelector('[data-testid="key-down"]'))
    expect(send).toHaveBeenLastCalledWith('\x1b[B')
    press(container.querySelector('[data-testid="key-tilde"]'))
    expect(send).toHaveBeenLastCalledWith('~')
    press(container.querySelector('[data-testid="key-slash"]'))
    expect(send).toHaveBeenLastCalledWith('/')
    press(container.querySelector('[data-testid="key-dash"]'))
    expect(send).toHaveBeenLastCalledWith('-')
    press(container.querySelector('[data-testid="key-dot"]'))
    expect(send).toHaveBeenLastCalledWith('.')
    expect(send).toHaveBeenCalledTimes(7)
  })
})

describe('CommandChips', () => {
  it('renders up to 4 pending commands as chips', () => {
    const getPending = () => ['echo', 'pwd', 'ls', 'cat', 'rm']
    render(<CommandChips send={() => {}} getPending={getPending} version={0} />)
    const chips = container.querySelectorAll('[data-testid="command-chips"] button')
    expect(chips).toHaveLength(4)
    expect(container.querySelector('[data-testid="chip-echo"]').textContent).toBe('echo')
    expect(container.querySelector('[data-testid="chip-pwd"]').textContent).toBe('pwd')
    expect(container.querySelector('[data-testid="chip-rm"]')).toBeNull()
  })

  it('inserts the command with a trailing space (never runs it)', () => {
    const send = vi.fn()
    render(<CommandChips send={send} getPending={() => ['echo']} version={0} />)
    press(container.querySelector('[data-testid="chip-echo"]'))
    expect(send).toHaveBeenCalledTimes(1)
    expect(send).toHaveBeenCalledWith('echo ')
  })

  it('re-reads getPending when the version prop changes', () => {
    let pending = ['echo', 'pwd']
    const getPending = () => pending
    render(<CommandChips send={() => {}} getPending={getPending} version={0} />)
    expect(container.querySelector('[data-testid="chip-echo"]')).not.toBeNull()

    pending = ['pwd']
    render(<CommandChips send={() => {}} getPending={getPending} version={1} />)
    expect(container.querySelector('[data-testid="chip-echo"]')).toBeNull()
    expect(container.querySelector('[data-testid="chip-pwd"]')).not.toBeNull()
  })
})

describe('CounterService.pendingCommands', () => {
  it('excludes completed and multi-word entries', () => {
    const counter = new CounterService()
    const pending = counter.pendingCommands()
    expect(pending).toContain('echo')
    expect(pending).toContain('cd')
    expect(pending.some((name) => name.includes(' '))).toBe(false)
    expect(pending).not.toContain('cd ..')
    expect(pending).not.toContain('cd ~')

    counter.setDone('echo')
    expect(counter.pendingCommands()).not.toContain('echo')
    expect(counter.pendingCommands()).toContain('pwd')
  })
})
