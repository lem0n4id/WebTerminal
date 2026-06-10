import { basic } from './basic'
import { fs_commands } from './files'
import CounterService from './counter.service'
import FileSystem from '../lib/fs'

// `fs` can be injected so the caller (e.g. the terminal's tab completion)
// shares the same filesystem instance as the commands; `counter` can be
// injected so the caller (e.g. the mobile command chips) shares progress
const commands = (context, fs = new FileSystem(), counter = new CounterService()) => {
  const b = basic(context, counter, fs)
  const f = fs_commands(context, counter, fs)
  return { ...b, ...f }
}

export default commands
