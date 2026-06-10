import { basic } from './basic'
import { fs_commands } from './files'
import CounterService from './counter.service'
import FileSystem from '../lib/fs'

const commands = context => {
  const counter = new CounterService()
  const fs = new FileSystem()
  const b = basic(context, counter, fs)
  const f = fs_commands(context, counter, fs)
  return { ...b, ...f }
}

export default commands
