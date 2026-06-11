import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import commands from '../commands'
import CounterService from '../commands/counter.service'
import FileSystem from '../lib/fs'
import Shell from '../lib/shell'
import { useVisualViewport } from '../lib/useVisualViewport'
import { green, red, white } from '../lib/ansi'
import KeyBar from './KeyBar'
import CommandChips from './CommandChips'

// Touch UI gate: coarse pointer (real touch devices and Playwright device
// emulation) or the ?touch=1 escape hatch for manual desktop testing
function isTouchUi() {
  const coarse =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(pointer: coarse)').matches
  return coarse || window.location.search.includes('touch=1')
}

const PROMPT = green('user@localhost:~$') + ' '

const GREETING =
  `Welcome to ${white('WebTerminal')} \n We ${red('❤')}  Open Source \n` +
  `If you want to contribute, you can at github @lem0n4id/WebTerminal. \n Type  ${white('help')} to get started \n` +
  '> The shell is basically a program that takes your commands from the keyboard and sends them to the operating system to perform.\n' +
  `> The ${green('Terminal')} is a program that launches a shell for you.\n` +
  `> Type ${red('help')} to see the list of ${green('commands/tasks')}.\n\n` +
  `> Start with ${red('echo "any string"')}.\n`

export default function Terminal() {
  const containerRef = useRef(null)
  const appShellRef = useRef(null)
  const termRef = useRef(null)
  const fitAddonRef = useRef(null)
  // forwards key-bar/chip presses into the shell once the effect creates it
  const sendRef = useRef(null)
  // delayed second fit after keyboard show/hide animations settle
  const settleTimerRef = useRef(null)
  const [counter] = useState(() => new CounterService())
  const [touchUi] = useState(isTouchUi)
  // bumped after every executed command so the chips re-read progress
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const term = new XTerm({
      cursorBlink: true,
      convertEol: false,
      fontFamily: 'Menlo, Monaco, "Courier New", monospace',
      fontSize: 16,
      theme: { background: '#000000' },
    })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()
    termRef.current = term
    fitAddonRef.current = fitAddon

    // window.__terminalText exists solely as a plain-text output hook for the
    // Playwright e2e tests (xterm renders to canvas/DOM that is hard to read)
    window.__terminalText = []

    const fs = new FileSystem()
    const shell = new Shell({
      write: (s) => term.write(s),
      fs,
      prompt: PROMPT,
      cols: () => term.cols,
    })
    const context = {
      echo: (text) => shell.print(text),
      clear: () => term.clear(),
      history: () => ({ data: () => shell.history() }),
    }
    shell.setCommands(commands(context, fs, counter))
    shell.onPrint = (plain) => window.__terminalText.push(plain)
    shell.onCommand = (line) => {
      window.__terminalText.push(line)
      setVersion((v) => v + 1)
    }
    sendRef.current = (data) => shell.handleData(data)

    shell.print(GREETING)
    shell.start()

    const dataListener = term.onData((data) => shell.handleData(data))
    const onResize = () => fitAddon.fit()
    window.addEventListener('resize', onResize)
    term.focus()

    return () => {
      sendRef.current = null
      clearTimeout(settleTimerRef.current)
      window.removeEventListener('resize', onResize)
      dataListener.dispose()
      term.dispose()
      termRef.current = null
      fitAddonRef.current = null
    }
  }, [counter])

  // Refit xterm and keep the prompt in view whenever the visual viewport
  // changes (soft keyboard opening/closing, URL bar collapse, pinch-zoom pan).
  // The second, delayed fit runs after the keyboard animation settles —
  // fitting mid-animation leaves the canvas sized for a transient viewport,
  // which shows up as a stale strip along the terminal's right edge.
  const onViewportChange = useCallback(() => {
    const fit = () => {
      if (fitAddonRef.current) fitAddonRef.current.fit()
      if (termRef.current) termRef.current.scrollToBottom()
    }
    fit()
    clearTimeout(settleTimerRef.current)
    settleTimerRef.current = setTimeout(fit, 300)
  }, [])
  useVisualViewport(appShellRef, onViewportChange)

  // iOS only opens the soft keyboard from a genuine user gesture; focusing
  // from any tap on the shell widens the target beyond xterm's own screen
  const focusTerminal = () => {
    if (termRef.current) termRef.current.focus()
  }

  const send = (data) => sendRef.current && sendRef.current(data)

  return (
    <div
      className="app-shell"
      data-testid="app-shell"
      ref={appShellRef}
      onClick={focusTerminal}
    >
      <div className="terminal-container" ref={containerRef} />
      {touchUi && (
        <CommandChips
          send={send}
          getPending={() => counter.pendingCommands()}
          version={version}
        />
      )}
      {touchUi && <KeyBar send={send} />}
    </div>
  )
}
