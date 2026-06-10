import { getCompletions } from './completion'
import { stripAnsi } from './ansi'

// Splits a command line into tokens. Double- or single-quoted strings become a
// single token with the quotes stripped (matches jquery.terminal's behavior
// for the `echo "any string"` tutorial step).
export function tokenize(line) {
  const tokens = []
  const re = /"([^"]*)"|'([^']*)'|(\S+)/g
  let match
  while ((match = re.exec(line)) !== null) {
    tokens.push(match[1] ?? match[2] ?? match[3])
  }
  return tokens
}

// Terminal-agnostic line discipline: owns the prompt, input buffer, history
// navigation, Tab completion and command dispatch. Feed it raw input via
// handleData(data) (e.g. from xterm's onData) and it writes everything it
// wants displayed through the injected `write` sink.
export default class Shell {
  constructor({ write, commands = {}, fs = null, prompt = '$ ' } = {}) {
    this._sink = write
    this.commands = commands
    this.fs = fs
    this.prompt = prompt
    this.buffer = ''
    this._history = []
    this._historyIndex = null
    this._savedBuffer = ''
    // Optional observers (used by the terminal component's e2e text hook)
    this.onPrint = null
    this.onCommand = null
  }

  setCommands(commands) {
    this.commands = commands
  }

  history() {
    return [...this._history]
  }

  // Everything written to the terminal goes through here so bare '\n'
  // becomes '\r\n' (xterm does not translate newlines by itself)
  write(text) {
    this._sink(String(text).replace(/\r?\n/g, '\r\n'))
  }

  // echo-style output: writes text plus a trailing newline
  print(text = '') {
    const s = String(text)
    this.write(s + '\n')
    if (this.onPrint) this.onPrint(stripAnsi(s))
  }

  showPrompt() {
    this._sink(this.prompt)
  }

  start() {
    this.showPrompt()
  }

  handleData(data) {
    if (data === '\x1b[A') return this._historyUp()
    if (data === '\x1b[B') return this._historyDown()
    if (data.startsWith('\x1b')) return // ignore other escape sequences
    for (const ch of data) {
      if (ch === '\r') this._enter()
      else if (ch === '\n') continue // part of pasted \r\n
      else if (ch === '\x7f' || ch === '\b') this._backspace()
      else if (ch === '\t') this._tab()
      else if (ch === '\x03') this._interrupt()
      else if (ch >= ' ') this._insert(ch)
    }
  }

  _insert(ch) {
    this.buffer += ch
    this._sink(ch)
  }

  _backspace() {
    if (!this.buffer) return
    this.buffer = this.buffer.slice(0, -1)
    this._sink('\b \b')
  }

  _interrupt() {
    this.write('^C\n')
    this.buffer = ''
    this._historyIndex = null
    this.showPrompt()
  }

  _enter() {
    this.write('\n')
    const line = this.buffer.trim()
    this.buffer = ''
    this._historyIndex = null
    if (line) {
      this._history.push(line)
      if (this.onCommand) this.onCommand(line)
      this._dispatch(line)
    }
    this.showPrompt()
  }

  _dispatch(line) {
    const [cmd, ...args] = tokenize(line)
    const fn = Object.prototype.hasOwnProperty.call(this.commands, cmd)
      ? this.commands[cmd]
      : null
    if (typeof fn !== 'function') {
      this.print(`bash: ${cmd}: command not found`)
      return
    }
    try {
      fn(...args)
    } catch (err) {
      this.print(`${cmd}: ${err && err.message ? err.message : err}`)
    }
  }

  _tab() {
    const candidates = getCompletions(this.buffer, {
      commands: Object.keys(this.commands),
      fs: this.fs,
    })
    if (candidates.length === 0) return
    if (candidates.length === 1) {
      const endsWithSpace = /\s$/.test(this.buffer)
      const tokens = this.buffer.split(/\s+/).filter(Boolean)
      const current = endsWithSpace ? '' : tokens[tokens.length - 1] || ''
      const suffix = candidates[0].slice(current.length)
      if (suffix) this._insert(suffix)
      return
    }
    this.write('\n' + candidates.join('  ') + '\n')
    this._redrawLine()
  }

  _historyUp() {
    if (this._history.length === 0) return
    if (this._historyIndex === null) {
      this._savedBuffer = this.buffer
      this._historyIndex = this._history.length
    }
    if (this._historyIndex > 0) this._historyIndex -= 1
    this._setBuffer(this._history[this._historyIndex])
  }

  _historyDown() {
    if (this._historyIndex === null) return
    this._historyIndex += 1
    if (this._historyIndex >= this._history.length) {
      this._historyIndex = null
      this._setBuffer(this._savedBuffer)
    } else {
      this._setBuffer(this._history[this._historyIndex])
    }
  }

  _setBuffer(text) {
    this.buffer = text
    this._redrawLine()
  }

  _redrawLine() {
    // carriage return + erase line, then re-render prompt and buffer
    this._sink('\r\x1b[K')
    this._sink(this.prompt)
    this._sink(this.buffer)
  }
}
