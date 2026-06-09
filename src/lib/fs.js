class FileSystem {
  constructor() {
    // Build the initial tree
    this._root = this._makeDir('/')
    const home = this._makeDir('home')
    const user = this._makeDir('user')
    const docs = this._makeDir('Documents')
    const downloads = this._makeDir('Downloads')
    const readme = this._makeFile('readme.txt', 'Welcome to WebTerminal!\nType "help" to see available commands.')

    this._root.children['home'] = home
    home.children['user'] = user
    user.children['Documents'] = docs
    user.children['Downloads'] = downloads
    user.children['readme.txt'] = readme

    // cwd path as array of {name, node} pairs
    this._cwd = [
      { name: '/', node: this._root },
      { name: 'home', node: home },
      { name: 'user', node: user },
    ]
  }

  _makeDir(name) {
    return { name, type: 'dir', content: null, children: {} }
  }

  _makeFile(name, content = '') {
    return { name, type: 'file', content, children: {} }
  }

  _currentNode() {
    return this._cwd[this._cwd.length - 1].node
  }

  pwd() {
    if (this._cwd.length === 1) return '/'
    return this._cwd
      .slice(1)
      .map(e => e.name)
      .join('/')
      .replace(/^/, '/')
  }

  ls() {
    return Object.keys(this._currentNode().children)
  }

  cd(arg) {
    const target = arg === '' || arg === '~' ? '~' : arg
    if (target === '~') {
      // Go to /home/user
      const home = this._root.children['home']
      const user = home ? home.children['user'] : null
      if (!user) return { ok: false, message: 'Home directory not found' }
      this._cwd = [
        { name: '/', node: this._root },
        { name: 'home', node: home },
        { name: 'user', node: user },
      ]
      return { ok: true, message: 'Changed to /home/user' }
    }
    if (target === '..') {
      if (this._cwd.length <= 1) return { ok: false, message: 'Already at root' }
      this._cwd.pop()
      return { ok: true, message: `Changed to ${this.pwd()}` }
    }
    const node = this._currentNode().children[target]
    if (!node) return { ok: false, message: `cd: ${target}: No such file or directory` }
    if (node.type !== 'dir') return { ok: false, message: `cd: ${target}: Not a directory` }
    this._cwd.push({ name: target, node })
    return { ok: true, message: `Changed to ${this.pwd()}` }
  }

  mkdir(name) {
    if (!name) return { ok: false, message: 'mkdir: missing operand' }
    const cur = this._currentNode()
    if (cur.children[name]) return { ok: false, message: `mkdir: cannot create directory '${name}': File exists` }
    cur.children[name] = this._makeDir(name)
    return { ok: true, message: `Directory '${name}' created` }
  }

  touch(name, content = '') {
    if (!name) return { ok: false, message: 'touch: missing operand' }
    const cur = this._currentNode()
    if (!cur.children[name]) {
      cur.children[name] = this._makeFile(name, content)
    }
    return { ok: true, message: `'${name}' created` }
  }

  cat(name) {
    if (!name) return { ok: false, message: 'cat: missing operand' }
    const node = this._currentNode().children[name]
    if (!node) return { ok: false, message: `cat: ${name}: No such file or directory` }
    if (node.type !== 'file') return { ok: false, message: `cat: ${name}: Is a directory` }
    return { ok: true, message: node.content }
  }

  cp(src, dst) {
    if (!src || !dst) return { ok: false, message: 'cp: missing operand' }
    const cur = this._currentNode()
    const srcNode = cur.children[src]
    if (!srcNode) return { ok: false, message: `cp: '${src}': No such file or directory` }
    if (srcNode.type === 'dir') return { ok: false, message: `cp: -r not supported — can only copy files` }
    cur.children[dst] = this._makeFile(dst, srcNode.content)
    return { ok: true, message: `'${src}' copied to '${dst}'` }
  }

  rm(name) {
    if (!name) return { ok: false, message: 'rm: missing operand' }
    const cur = this._currentNode()
    if (!cur.children[name]) return { ok: false, message: `rm: cannot remove '${name}': No such file or directory` }
    delete cur.children[name]
    return { ok: true, message: `'${name}' removed` }
  }
}

export default FileSystem
