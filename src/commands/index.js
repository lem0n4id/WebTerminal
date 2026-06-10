import { basic } from './basic'
import { fs_commands } from './files'
import CounterService from './counter.service'
import FileSystem from '../lib/fs'

// `fs` can be injected so the caller (e.g. the terminal's tab completion)
// shares the same filesystem instance as the commands
const commands = (context, fs = new FileSystem()) => {
  const counter = new CounterService()
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
