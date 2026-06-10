import { basic } from './basic'
import { fs_commands } from './files'
import CounterService from './counter.service'
import FileSystem from '../lib/fs'

const commands = context => {
  const counter = new CounterService()
  const fs = new FileSystem()
  const b = basic(context, counter, fs)
  const f = fs_commands(context, counter, fs)
  const result = { ...b, ...f }
  // Expose the shared FileSystem for tab completion. Non-enumerable so it
  // never shows up as a command, and configurable so the consumer can delete
  // it after reading (jquery.terminal resolves typed commands via plain
  // property access, so a lingering object property would be reachable).
  Object.defineProperty(result, '__fs', {
    value: fs,
    enumerable: false,
    configurable: true,
  })
  return result
}

export default commands
