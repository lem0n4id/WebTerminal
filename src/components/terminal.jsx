import React, { useEffect, useRef, useState } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import commands from '../commands'
import CounterService from '../commands/counter.service'
import FileSystem from '../lib/fs'
import Shell from '../lib/shell'
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
  // forwards key-bar/chip presses into the shell once the effect creates it
  const sendRef = useRef(null)
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

    // window.__terminalText exists solely as a plain-text output hook for the
    // Playwright e2e tests (xterm renders to canvas/DOM that is hard to read)
    window.__terminalText = []

    const fs = new FileSystem()
    const shell = new Shell({ write: (s) => term.write(s), fs, prompt: PROMPT })
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
      window.removeEventListener('resize', onResize)
      dataListener.dispose()
      term.dispose()
    }
  }, [counter])

  const send = (data) => sendRef.current && sendRef.current(data)

  return (
    <div className="app-shell" data-testid="app-shell">
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
