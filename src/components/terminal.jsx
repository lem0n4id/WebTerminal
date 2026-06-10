import React, { useEffect, useRef } from 'react'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'
import commands from '../commands'
import FileSystem from '../lib/fs'
import Shell from '../lib/shell'
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
    }
  }, [])

  return <div className="terminal-container" ref={containerRef} />
}
