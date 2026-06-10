import { green, red } from '../lib/ansi'

class CounterService {
  constructor() {
    this._commands = {
      echo: false,
      pwd: false,
      ls: false,
      cd: false,
      'cd ..': false,
      'cd ~': false,
      cat: false,
      touch: false,
      cp: false,
      rm: false,
      mkdir: false,
      clear: false,
      uname: false,
      date: false,
      ifconfig: false,
      tty: false,
      history: false,
    }
  }

  // Returns ANSI-colored status text
  getStatus(name) {
    const done = this._commands[name]
    if (done === undefined) return ''
    return done
      ? green('✓ Completed')
      : red('○ Not completed')
  }

  setDone(name) {
    if (name in this._commands) {
      this._commands[name] = true
    }
  }

  allCommands() {
    return Object.keys(this._commands)
  }

  completedCount() {
    return Object.values(this._commands).filter(Boolean).length
  }

  totalCount() {
    return Object.keys(this._commands).length
  }
}

export default CounterService
