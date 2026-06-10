import { describe, it, expect, beforeEach, vi } from 'vitest'
import Shell, { tokenize } from './shell'
import { stripAnsi } from './ansi'

const type = (shell, text) => shell.handleData(text)
const run = (shell, line) => shell.handleData(line + '\r')

describe('tokenize', () => {
  it('splits on whitespace', () => {
    expect(tokenize('cp a.txt b.txt')).toEqual(['cp', 'a.txt', 'b.txt'])
  })

  it('treats a double-quoted string as one token without quotes', () => {
    expect(tokenize('echo "hello world"')).toEqual(['echo', 'hello world'])
  })

  it('treats a single-quoted string as one token without quotes', () => {
    expect(tokenize("echo 'hi there'")).toEqual(['echo', 'hi there'])
  })
})

describe('Shell', () => {
  let output
  let shell

  const written = () => stripAnsi(output.join(''))

  beforeEach(() => {
    output = []
    shell = new Shell({
      write: (s) => output.push(s),
      prompt: '$ ',
      commands: {},
    })
  })

  it('dispatches a command with positional args', () => {
    const cp = vi.fn()
    shell.setCommands({ cp })
    run(shell, 'cp src.txt dst.txt')
    expect(cp).toHaveBeenCalledWith('src.txt', 'dst.txt')
  })

  it('passes a quoted string as a single argument', () => {
    const echo = vi.fn()
    shell.setCommands({ echo })
    run(shell, 'echo "hello world"')
    expect(echo).toHaveBeenCalledWith('hello world')
  })

  it('reports unknown commands without throwing', () => {
    run(shell, 'definitely-not-a-command')
    expect(written()).toContain('bash: definitely-not-a-command: command not found')
  })

  it('does not treat object prototype members as commands', () => {
    run(shell, 'toString')
    expect(written()).toContain('bash: toString: command not found')
  })

  it('records executed commands in history (most recent last)', () => {
    shell.setCommands({ echo: () => {}, pwd: () => {} })
    run(shell, 'echo one')
    run(shell, 'pwd')
    expect(shell.history()).toEqual(['echo one', 'pwd'])
  })

  it('does not record empty lines in history', () => {
    run(shell, '')
    run(shell, '   ')
    expect(shell.history()).toEqual([])
  })

  it('survives a command that throws and prints the error', () => {
    shell.setCommands({ boom: () => { throw new Error('kaboom') } })
    run(shell, 'boom')
    expect(written()).toContain('boom: kaboom')
    // still responsive afterwards
    const echo = vi.fn()
    shell.setCommands({ echo })
    run(shell, 'echo ok')
    expect(echo).toHaveBeenCalledWith('ok')
  })

  it('converts \\n to \\r\\n in printed output', () => {
    shell.print('line1\nline2')
    expect(output.join('')).toContain('line1\r\nline2\r\n')
  })

  it('handles backspace editing of the buffer', () => {
    shell.setCommands({ pwd: vi.fn() })
    type(shell, 'pwdd')
    type(shell, '\x7f')
    expect(shell.buffer).toBe('pwd')
    run(shell, '')
    expect(shell.commands.pwd).toHaveBeenCalled()
  })

  it('navigates history with arrow up/down', () => {
    shell.setCommands({ echo: () => {}, pwd: () => {} })
    run(shell, 'echo one')
    run(shell, 'pwd')
    type(shell, '\x1b[A')
    expect(shell.buffer).toBe('pwd')
    type(shell, '\x1b[A')
    expect(shell.buffer).toBe('echo one')
    type(shell, '\x1b[B')
    expect(shell.buffer).toBe('pwd')
    type(shell, '\x1b[B')
    expect(shell.buffer).toBe('')
  })

  describe('tab completion', () => {
    beforeEach(() => {
      shell.setCommands({ echo: vi.fn(), cat: vi.fn(), cd: vi.fn(), clear: vi.fn() })
      shell.fs = { ls: () => ['Documents', 'Downloads', 'readme.txt'] }
    })

    it('completes a single command candidate in place', () => {
      type(shell, 'ec')
      type(shell, '\t')
      expect(shell.buffer).toBe('echo')
      expect(written()).toContain('echo')
    })

    it('lists multiple candidates and redraws the prompt with the buffer', () => {
      type(shell, 'c')
      type(shell, '\t')
      expect(shell.buffer).toBe('c')
      expect(written()).toContain('cat  cd  clear')
      // line redrawn: prompt followed by the untouched buffer
      expect(written()).toMatch(/\$ c$/)
    })

    it('completes later tokens from fs.ls()', () => {
      type(shell, 'cat read')
      type(shell, '\t')
      expect(shell.buffer).toBe('cat readme.txt')
    })

    it('does nothing when there are no candidates', () => {
      type(shell, 'zzz')
      const before = shell.buffer
      type(shell, '\t')
      expect(shell.buffer).toBe(before)
    })
  })

  describe('multi-char chunks (paste / Android IME)', () => {
    it('lands a printable chunk in the buffer without executing', () => {
      type(shell, 'echo hi')
      expect(shell.buffer).toBe('echo hi')
      expect(shell.history()).toEqual([])
    })

    it('executes on an embedded \\r and keeps the remainder in the buffer', () => {
      const echo = vi.fn()
      shell.setCommands({ echo })
      type(shell, 'echo one\recho t')
      expect(echo).toHaveBeenCalledWith('one')
      expect(shell.buffer).toBe('echo t')
    })

    it('normalizes a CRLF chunk to a single execution', () => {
      const echo = vi.fn()
      shell.setCommands({ echo })
      type(shell, 'echo one\r\n')
      expect(echo).toHaveBeenCalledTimes(1)
      expect(shell.history()).toEqual(['echo one'])
      expect(shell.buffer).toBe('')
    })

    it('executes an LF-only paste once', () => {
      const pwd = vi.fn()
      shell.setCommands({ pwd })
      type(shell, 'pwd\n')
      expect(pwd).toHaveBeenCalledTimes(1)
      expect(shell.history()).toEqual(['pwd'])
    })

    it('applies a trailing \\x7f in a chunk as a delete', () => {
      type(shell, 'pwdd\x7f')
      expect(shell.buffer).toBe('pwd')
    })

    it('handles code points outside the BMP without splitting surrogates', () => {
      type(shell, 'echo 🚀')
      expect(shell.buffer).toBe('echo 🚀')
    })

    it('still recognizes escape sequences after a chunk', () => {
      shell.setCommands({ echo: () => {} })
      type(shell, 'echo one\r')
      type(shell, '\x1b[A')
      expect(shell.buffer).toBe('echo one')
      type(shell, '\x1b[B')
      expect(shell.buffer).toBe('')
    })
  })

  describe('observer hooks', () => {
    it('onPrint receives ANSI-stripped text', () => {
      const seen = []
      shell.onPrint = (s) => seen.push(s)
      shell.print('\x1b[1;32mgreen\x1b[0m text')
      expect(seen).toEqual(['green text'])
    })

    it('onCommand receives each executed line', () => {
      const seen = []
      shell.onCommand = (s) => seen.push(s)
      shell.setCommands({ echo: () => {} })
      run(shell, 'echo hi')
      run(shell, 'nope')
      expect(seen).toEqual(['echo hi', 'nope'])
    })
  })
})
