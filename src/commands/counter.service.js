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

  // Returns colored jquery.terminal markup
  getStatus(name) {
    const done = this._commands[name]
    if (done === undefined) return ''
    return done
      ? '[[b;#44D544;]✓ Completed]'
      : '[[b;#ff3300;]○ Not completed]'
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
