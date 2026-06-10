import { green, red } from '../lib/ansi'
import { loadProgress, saveProgress, clearProgress } from '../lib/storage'

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
    const saved = loadProgress()
    for (const name of Object.keys(saved)) {
      if (Object.prototype.hasOwnProperty.call(this._commands, name)) {
        this._commands[name] = Boolean(saved[name])
      }
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
      saveProgress(this._commands)
    }
  }

  resetProgress() {
    for (const name of Object.keys(this._commands)) {
      this._commands[name] = false
    }
    clearProgress()
  }

  allCommands() {
    return Object.keys(this._commands)
  }

  // Not-yet-completed commands that are directly typeable as a single word
  // (excludes multi-word pseudo-entries like 'cd ..')
  pendingCommands() {
    return Object.keys(this._commands).filter((name) => !this._commands[name] && !name.includes(' '))
  }

  completedCount() {
    return Object.values(this._commands).filter(Boolean).length
  }

  totalCount() {
    return Object.keys(this._commands).length
  }
}

export default CounterService
