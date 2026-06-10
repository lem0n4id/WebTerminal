import React, { useCallback, useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import commands from '../commands'
import FileSystem from '../lib/fs'
import Shell from '../lib/shell'
import { useVisualViewport } from '../lib/useVisualViewport'
import { green, red, white } from '../lib/ansi'

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
    const shell = new Shell({ write: (s) => term.write(s), fs, prompt: PROMPT })
    const context = {
      echo: (text) => shell.print(text),
      clear: () => term.clear(),
      history: () => ({ data: () => shell.history() }),
    }
    shell.setCommands(commands(context, fs))
    shell.onPrint = (plain) => window.__terminalText.push(plain)
    shell.onCommand = (line) => window.__terminalText.push(line)

    shell.print(GREETING)
    shell.start()

    const dataListener = term.onData((data) => shell.handleData(data))
    const onResize = () => fitAddon.fit()
    window.addEventListener('resize', onResize)
    term.focus()

    return () => {
      window.removeEventListener('resize', onResize)
      dataListener.dispose()
      term.dispose()
      termRef.current = null
      fitAddonRef.current = null
    }
  }, [])

  // Refit xterm and keep the prompt in view whenever the visual viewport
  // changes (soft keyboard opening/closing, URL bar collapse, pinch-zoom pan)
  const onViewportChange = useCallback(() => {
    if (fitAddonRef.current) fitAddonRef.current.fit()
    if (termRef.current) termRef.current.scrollToBottom()
  }, [])
  useVisualViewport(appShellRef, onViewportChange)

  // iOS only opens the soft keyboard from a genuine user gesture; focusing
  // from any tap on the shell widens the target beyond xterm's own screen
  const focusTerminal = () => {
    if (termRef.current) termRef.current.focus()
  }

  return (
    <div
      className="app-shell"
      data-testid="app-shell"
      ref={appShellRef}
      onClick={focusTerminal}
    >
      <div className="terminal-container" ref={containerRef} />
    </div>
  )
}
